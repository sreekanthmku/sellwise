import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Vobiz from "vobiz-webrtc-sdk";
import { renderAnalysisBodyFromPayload } from "./callAnalysis";
import { defaultApiBase } from "./constants";

const VobizContext = createContext(null);
const CALL_HISTORY_STORAGE_KEY = "sellwise_call_history_v1";

/** Set before `login()` so `onLogin` navigates here instead of default `/leads`. */
export const SELLWISE_VOBIZ_POST_LOGIN_PATH_KEY = "sellwise_vobiz_post_login";

const MAX_EVENT_LOG = 500;
const MAX_CALL_HISTORY = 25;

/** Avoid duplicate boot lines under React StrictMode double mount. */
let sdkBootLogSent = false;

function extractCallUuidFromEventArgs(...args) {
  for (const a of args) {
    if (a && typeof a === "object" && "callUUID" in a) {
      const id = a.callUUID;
      if (typeof id === "string" && id.length > 0) return id;
    }
  }
  return null;
}

/** Terminate/fail for an older outbound UUID after a new dial started — ignore (same leadId would wrongly navigate away). */
function isStaleOutboundTerminate(eventUuid, currentDialSeq, uuidToDialSeq) {
  if (!eventUuid || typeof eventUuid !== "string") return false;
  const mapped = uuidToDialSeq.get(eventUuid);
  if (mapped == null) return false;
  return mapped < currentDialSeq;
}

/** Map call UUID → outbound dial seq; fallback when the SDK omits map entry but UUID still matches last tracked. */
function resolveOutboundEndedDialSeq(uuidExplicit, uuidToDialSeq, lastTrackedUuid, currentDialSeq) {
  if (!uuidExplicit || typeof uuidExplicit !== "string") return null;
  const fromMap = uuidToDialSeq.get(uuidExplicit);
  if (fromMap != null) return fromMap;
  if (uuidExplicit === lastTrackedUuid) return currentDialSeq;
  return null;
}

export function sanitizeDialString(display) {
  const trimmed = (display || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  return trimmed.replace(/\D/g, "");
}

function formatMmSs(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function readInitialCallHistory() {
  try {
    const raw = window.localStorage.getItem(CALL_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row && typeof row === "object")
      .map((row) => ({
        id:
          typeof row.id === "string" && row.id.length > 0
            ? row.id
            : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        callUuid: typeof row.callUuid === "string" ? row.callUuid : null,
        name: typeof row.name === "string" && row.name.trim() ? row.name.trim() : "Unknown",
        leadId: row.leadId != null ? String(row.leadId) : null,
        durationSeconds:
          typeof row.durationSeconds === "number" && Number.isFinite(row.durationSeconds)
            ? Math.max(0, Math.floor(row.durationSeconds))
            : 0,
        endedAtIso:
          typeof row.endedAtIso === "string" && row.endedAtIso.length > 0
            ? row.endedAtIso
            : new Date().toISOString(),
        endReason:
          row.endReason === "busy" || row.endReason === "failed" ? row.endReason : "ended",
      }))
      .slice(0, MAX_CALL_HISTORY);
  } catch {
    return [];
  }
}

export function VobizProvider({ children }) {
  const navigate = useNavigate();
  const remoteAudioRef = useRef(null);
  const vobizRef = useRef(null);
  const postCallSequenceTimerRef = useRef(null);
  const postCallLateUuidTimerRef = useRef(null);
  const activeMetaRef = useRef(null);

  const isInCallRef = useRef(false);
  const outboundPendingRef = useRef(false);
  const audioAttachedRef = useRef(false);
  const hadAnsweredCallRef = useRef(false);
  const lastTrackedCallUuidRef = useRef(null);
  const callStartedAtRef = useRef(null);
  const pendingIncomingNameRef = useRef("");
  /** Incremented on each `placeOutboundCall`; outbound callUUID → seq when ringing/answered. */
  const outboundDialSeqRef = useRef(0);
  const uuidOutboundDialSeqRef = useRef(new Map());
  const hangupFallbackTimerRef = useRef(null);
  /** Prevents duplicate env bootstrap before `connecting` flips true (e.g. StrictMode). */
  const envLoginInFlightRef = useRef(false);

  const [registered, setRegistered] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionText, setConnectionText] = useState("Disconnected");
  const [connectionTone, setConnectionTone] = useState("offline");

  const [isMuted, setIsMuted] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [outboundPending, setOutboundPending] = useState(false);

  const [incomingVisible, setIncomingVisible] = useState(false);
  const [incomingCallerName, setIncomingCallerName] = useState("");
  const [waitingVisible, setWaitingVisible] = useState(false);
  const [waitingCallerName, setWaitingCallerName] = useState("");

  const [activeMeta, setActiveMeta] = useState(null);
  const [callStartedAt, setCallStartedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  /** When set, UI shows "Connected" until this time (ms), then the duration timer starts. */
  const [connectedLabelUntil, setConnectedLabelUntil] = useState(null);

  const [postCallUI, setPostCallUI] = useState(() => ({ phase: "idle" }));
  const [keypadOpen, setKeypadOpen] = useState(false);

  const [eventLog, setEventLog] = useState([]);
  const [callHistory, setCallHistory] = useState(() => readInitialCallHistory());

  /** Set after a connected call ends (terminate/fail); cleared on new dial/login. Optional leadId ties session to outbound lead flow. */
  const [lastCallSession, setLastCallSession] = useState(null);

  const clearLastCallSession = useCallback(() => {
    setLastCallSession(null);
  }, []);

  const clearHangupFallbackTimer = useCallback(() => {
    if (hangupFallbackTimerRef.current != null) {
      clearTimeout(hangupFallbackTimerRef.current);
      hangupFallbackTimerRef.current = null;
    }
  }, []);

  const pushLog = useCallback((msg, type = "info") => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    setEventLog((prev) => {
      const next = [...prev, { id, time, message: msg, type }];
      return next.length > MAX_EVENT_LOG ? next.slice(-MAX_EVENT_LOG) : next;
    });
  }, []);

  const clearLog = useCallback(() => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setEventLog([{ id: "log-clear", time, message: "Log cleared", type: "info" }]);
  }, []);

  const appendCallHistory = useCallback((entry) => {
    setCallHistory((prev) => {
      const next = [entry, ...prev];
      return next.length > MAX_CALL_HISTORY ? next.slice(0, MAX_CALL_HISTORY) : next;
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CALL_HISTORY_STORAGE_KEY, JSON.stringify(callHistory));
    } catch {
      // Ignore quota/private-mode storage errors.
    }
  }, [callHistory]);

  useEffect(() => {
    if (sdkBootLogSent) return;
    sdkBootLogSent = true;
    pushLog("Vobiz Browser SDK loaded", "info");
    pushLog("Calling registers when you tap Get started (credentials from env).", "info");
  }, [pushLog]);

  useEffect(() => {
    activeMetaRef.current = activeMeta;
  }, [activeMeta]);

  useEffect(() => {
    callStartedAtRef.current = callStartedAt;
  }, [callStartedAt]);

  const getApiBase = useCallback(() => defaultApiBase(), []);

  const clearPostCallFlowTimer = useCallback(() => {
    if (postCallSequenceTimerRef.current != null) {
      clearTimeout(postCallSequenceTimerRef.current);
      postCallSequenceTimerRef.current = null;
    }
    if (postCallLateUuidTimerRef.current != null) {
      clearTimeout(postCallLateUuidTimerRef.current);
      postCallLateUuidTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearPostCallFlowTimer();
  }, [clearPostCallFlowTimer]);

  const dismissPostCallUi = useCallback(() => {
    clearPostCallFlowTimer();
    setPostCallUI({ phase: "idle" });
  }, [clearPostCallFlowTimer]);

  const schedulePostCallAnalysis = useCallback(
    (wasActive, uuid, contactSnapshot) => {
      if (!wasActive) {
        lastTrackedCallUuidRef.current = null;
        return;
      }

      const contact =
        contactSnapshot && typeof contactSnapshot === "object"
          ? { ...contactSnapshot }
          : null;

      clearPostCallFlowTimer();
      setPostCallUI({ phase: "ended", contact });

      postCallSequenceTimerRef.current = window.setTimeout(() => {
        postCallSequenceTimerRef.current = null;
        setPostCallUI((prev) => ({ phase: "preparing", contact: prev.contact }));

        const runFetch = async (callId) => {
          lastTrackedCallUuidRef.current = null;
          const base = getApiBase();
          const url = `${base}/api/call-analysis/${encodeURIComponent(callId)}`;
          try {
            const res = await fetch(url);
            let data;
            try {
              data = await res.json();
            } catch {
              setPostCallUI((prev) => ({
                phase: "error",
                contact: prev.contact,
                message: `Invalid JSON from server (${res.status}).`,
              }));
              return;
            }

            if (!res.ok) {
              const msg = data.error || data.hint || `HTTP ${res.status}`;
              setPostCallUI((prev) => ({ phase: "error", contact: prev.contact, message: msg }));
              return;
            }

            if (!data.ok || !data.analysis) {
              setPostCallUI((prev) => ({
                phase: "error",
                contact: prev.contact,
                message: data.error || "Unexpected response",
              }));
              return;
            }

            setPostCallUI((prev) => ({
              phase: "result",
              contact: prev.contact,
              html: renderAnalysisBodyFromPayload(data.analysis),
            }));
          } catch (err) {
            setPostCallUI((prev) => ({
              phase: "error",
              contact: prev.contact,
              message: err?.message || String(err),
            }));
          }
        };

        if (uuid) {
          void runFetch(uuid);
        } else {
          postCallLateUuidTimerRef.current = window.setTimeout(() => {
            postCallLateUuidTimerRef.current = null;
            const late =
              typeof vobizRef.current?.client?.getLastCallUUID === "function"
                ? vobizRef.current.client.getLastCallUUID()
                : null;
            if (late) {
              void runFetch(late);
            } else {
              pushLog("Post-call analysis: no Call UUID after hangup.", "warning");
              setPostCallUI((prev) => ({
                phase: "error",
                contact: prev.contact,
                message: "Could not resolve Call UUID for this session.",
              }));
            }
          }, 0);
        }
      }, 2000);
    },
    [clearPostCallFlowTimer, getApiBase, pushLog]
  );

  const attachRemoteAudio = useCallback(() => {
    setTimeout(() => {
      const remoteAudio = remoteAudioRef.current;
      const vobiz = vobizRef.current;
      let stream = null;

      if (vobiz?.client?.remoteView) {
        stream = vobiz.client.remoteView.srcObject;
      }

      if (!stream && vobiz?.client) {
        try {
          const pc = vobiz.client.getPeerConnection().pc;
          if (pc) {
            const receivers = pc.getReceivers();
            const audioReceiver = receivers.find((r) => r.track && r.track.kind === "audio");
            if (audioReceiver?.track) {
              stream = new MediaStream([audioReceiver.track]);
              pushLog("🔊 Found audio track from PC receivers", "info");
            }
          }
        } catch (e) {
          pushLog(`Could not get peer connection: ${e?.message || String(e)}`, "warning");
        }
      }

      if (stream && remoteAudio) {
        remoteAudio.srcObject = stream;
        remoteAudio.play().catch((e) => pushLog(`Error playing audio: ${e?.message || String(e)}`, "error"));
        pushLog("🔊 Remote audio stream attached", "info");
      } else {
        pushLog("⚠️ Could not find remote stream to attach", "warning");
      }
    }, 1500);
  }, [pushLog]);

  const resetSessionUi = useCallback(() => {
    clearHangupFallbackTimer();
    envLoginInFlightRef.current = false;
    uuidOutboundDialSeqRef.current.clear();
    audioAttachedRef.current = false;
    hadAnsweredCallRef.current = false;
    isInCallRef.current = false;
    outboundPendingRef.current = false;
    setIsInCall(false);
    setOutboundPending(false);
    setIsMuted(false);
    setCallStartedAt(null);
    setElapsedSeconds(0);
    setConnectedLabelUntil(null);
    setActiveMeta(null);
    setLastCallSession(null);
    setIncomingVisible(false);
    setWaitingVisible(false);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, [clearHangupFallbackTimer]);

  const login = useCallback(
    (username, password) => {
      const trimmedUser = username.trim();
      const trimmedPass = password.trim();
      if (!trimmedUser || !trimmedPass) {
        pushLog("Please enter both username and password", "error");
        return { ok: false, error: "Enter username and password" };
      }

      setLastCallSession(null);

      if (vobizRef.current) {
        try {
          vobizRef.current.client.logout();
        } catch {
          /* ignore */
        }
        vobizRef.current = null;
      }

      setConnecting(true);
      setConnectionText("Connecting...");
      setConnectionTone("connecting");
      pushLog(`Connecting as ${trimmedUser}...`, "event");

      try {
        const vobiz = new Vobiz({
          debug: "ALL",
          permOnClick: true,
          enableTracking: true,
          closeProtection: false,
          maxAverageBitrate: 48000,
        });
        vobizRef.current = vobiz;
        const { client } = vobiz;

        client.on("onWebrtcNotSupported", () => {
          envLoginInFlightRef.current = false;
          pushLog("WebRTC is not supported in this browser", "error");
          setConnectionText("Not supported");
          setConnectionTone("offline");
          setConnecting(false);
        });

        client.on("onLogin", () => {
          envLoginInFlightRef.current = false;
          pushLog("✅ Successfully registered with Vobiz!", "success");
          setRegistered(true);
          setConnectionText("Registered");
          setConnectionTone("online");
          setConnecting(false);
          let target = "/leads";
          try {
            const raw = sessionStorage.getItem(SELLWISE_VOBIZ_POST_LOGIN_PATH_KEY);
            if (raw) {
              sessionStorage.removeItem(SELLWISE_VOBIZ_POST_LOGIN_PATH_KEY);
              if (typeof raw === "string" && raw.startsWith("/")) target = raw;
            }
          } catch {
            /* private mode / quota */
          }
          navigate(target);
        });

        client.on("onLoginFailed", (reason) => {
          envLoginInFlightRef.current = false;
          const msg = reason || "Unknown error";
          pushLog(`❌ Login failed: ${msg}`, "error");
          toast.error(`Calling login failed: ${msg}`);
          setRegistered(false);
          setConnectionText("Login failed");
          setConnectionTone("offline");
          setConnecting(false);
          vobizRef.current = null;
        });

        client.on("onLogout", () => {
          pushLog("Logged out from Vobiz", "warning");
          clearPostCallFlowTimer();
          setPostCallUI({ phase: "idle" });
          setRegistered(false);
          setConnectionText("Disconnected");
          setConnectionTone("offline");
          setIncomingVisible(false);
          setWaitingVisible(false);
          resetSessionUi();
          vobizRef.current = null;
        });

        client.on("onCallRemoteRinging", (callInfo) => {
          if (callInfo?.callUUID) {
            lastTrackedCallUuidRef.current = callInfo.callUUID;
            if (outboundPendingRef.current) {
              uuidOutboundDialSeqRef.current.set(
                callInfo.callUUID,
                outboundDialSeqRef.current
              );
            }
          }
          pushLog(`📞 Ringing... (${callInfo?.callUUID || ""})`, "event");
          setConnectionText("Ringing");
          setConnectionTone("in-call");
        });

        client.on("onCallAnswered", (callInfo) => {
          const outboundRinging = outboundPendingRef.current;
          if (callInfo?.callUUID) {
            lastTrackedCallUuidRef.current = callInfo.callUUID;
            if (outboundRinging) {
              uuidOutboundDialSeqRef.current.set(
                callInfo.callUUID,
                outboundDialSeqRef.current
              );
            }
          }
          if (audioAttachedRef.current) return;
          audioAttachedRef.current = true;
          hadAnsweredCallRef.current = true;
          isInCallRef.current = true;
          outboundPendingRef.current = false;
          pushLog(`✅ Call answered! (${callInfo?.callUUID || ""})`, "success");
          setIsInCall(true);
          setOutboundPending(false);
          setConnectionText("In call");
          setConnectionTone("in-call");
          setIncomingVisible(false);
          setWaitingVisible(false);
          setCallStartedAt(null);
          setElapsedSeconds(0);
          setConnectedLabelUntil(Date.now() + 1000);
          attachRemoteAudio();
        });

        client.on("onCallTerminated", (hangupSummary, callInfo) => {
          const uuidFromArgs = extractCallUuidFromEventArgs(callInfo, hangupSummary);
          const uuidFromSdk = typeof client.getCallUUID === "function" ? client.getCallUUID() : null;
          const uuidForStale = uuidFromArgs || uuidFromSdk;
          if (
            isStaleOutboundTerminate(
              uuidForStale,
              outboundDialSeqRef.current,
              uuidOutboundDialSeqRef.current
            )
          ) {
            pushLog("Ignoring stale call terminate (newer dial in progress)", "warning");
            return;
          }

          const wasActive =
            hadAnsweredCallRef.current || isInCallRef.current || audioAttachedRef.current;
          const metaSnapshot = activeMetaRef.current ? { ...activeMetaRef.current } : null;
          const contactSnapshot = wasActive && metaSnapshot ? metaSnapshot : null;

          const endedDialSeq = resolveOutboundEndedDialSeq(
            uuidForStale,
            uuidOutboundDialSeqRef.current,
            lastTrackedCallUuidRef.current,
            outboundDialSeqRef.current
          );
          /** Delayed terminate from call N while UI/meta already reflects call N+1 (vobizFE avoids this — single route, no auto-nav). */
          if (
            endedDialSeq != null &&
            metaSnapshot &&
            metaSnapshot.dialSeq != null &&
            metaSnapshot.dialSeq !== endedDialSeq
          ) {
            pushLog("Ignoring call terminate: ended dial does not match active session", "warning");
            return;
          }

          clearHangupFallbackTimer();
          setConnectedLabelUntil(null);

          const uuid = uuidForStale || lastTrackedCallUuidRef.current;

          const startedAt = callStartedAtRef.current;
          const durationSeconds =
            startedAt != null
              ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
              : 0;
          const leadIdFromMeta =
            metaSnapshot && metaSnapshot.leadId != null && String(metaSnapshot.leadId).length > 0
              ? String(metaSnapshot.leadId)
              : null;

          /** Outbound-only; inbound answered meta has no dialSeq (see `answer`). */
          const outboundDialMetaSession =
            metaSnapshot != null &&
            metaSnapshot.dialSeq != null &&
            typeof metaSnapshot.dialSeq === "number";

          pushLog(
            `📴 Call ended: ${callInfo?.reason || hangupSummary?.reason || "Terminated"}`,
            "warning"
          );

          /** Lead flow + anonymous keypad outbound (dialer): emit session end even if never answered. */
          if (wasActive || leadIdFromMeta || outboundDialMetaSession) {
            const endedDialSeqForSession =
              endedDialSeq != null ? endedDialSeq : metaSnapshot?.dialSeq ?? null;
            setLastCallSession({
              callUuid: uuid && typeof uuid === "string" && uuid.length > 0 ? uuid : null,
              durationSeconds,
              endedAtIso: new Date().toISOString(),
              leadId: leadIdFromMeta,
              endedDialSeq: endedDialSeqForSession,
              endReason: "ended",
            });
            appendCallHistory({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              callUuid: uuid && typeof uuid === "string" && uuid.length > 0 ? uuid : null,
              name:
                metaSnapshot && typeof metaSnapshot.name === "string" && metaSnapshot.name.trim()
                  ? metaSnapshot.name.trim()
                  : "Unknown",
              leadId: leadIdFromMeta,
              durationSeconds,
              endedAtIso: new Date().toISOString(),
              endReason: "ended",
            });
          }

          hadAnsweredCallRef.current = false;
          setConnectionText("Registered");
          setConnectionTone("online");
          audioAttachedRef.current = false;
          isInCallRef.current = false;
          outboundPendingRef.current = false;
          setIsInCall(false);
          setOutboundPending(false);
          setCallStartedAt(null);
          setActiveMeta(null);
          setIncomingVisible(false);
          setWaitingVisible(false);

          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
          }

          schedulePostCallAnalysis(wasActive, uuid, contactSnapshot);
        });

        client.on("onCallFailed", (failureCause, callInfo) => {
          const uuidFromArgs = extractCallUuidFromEventArgs(callInfo, failureCause);
          const uuidFromSdk = typeof client.getCallUUID === "function" ? client.getCallUUID() : null;
          const uuidForStale = uuidFromArgs || uuidFromSdk;
          if (
            isStaleOutboundTerminate(
              uuidForStale,
              outboundDialSeqRef.current,
              uuidOutboundDialSeqRef.current
            )
          ) {
            pushLog("Ignoring stale call failure (newer dial in progress)", "warning");
            return;
          }

          const wasActive =
            hadAnsweredCallRef.current || isInCallRef.current || audioAttachedRef.current;
          const metaSnapshot = activeMetaRef.current ? { ...activeMetaRef.current } : null;
          const contactSnapshot = wasActive && metaSnapshot ? metaSnapshot : null;

          const endedDialSeq = resolveOutboundEndedDialSeq(
            uuidForStale,
            uuidOutboundDialSeqRef.current,
            lastTrackedCallUuidRef.current,
            outboundDialSeqRef.current
          );
          if (
            endedDialSeq != null &&
            metaSnapshot &&
            metaSnapshot.dialSeq != null &&
            metaSnapshot.dialSeq !== endedDialSeq
          ) {
            pushLog("Ignoring call failure: failed dial does not match active session", "warning");
            return;
          }

          clearHangupFallbackTimer();
          setConnectedLabelUntil(null);

          pushLog(`❌ Call failed: ${failureCause || callInfo?.reason || "Unknown"}`, "error");

          const uuid = uuidForStale || lastTrackedCallUuidRef.current;

          const startedAt = callStartedAtRef.current;
          const durationSeconds =
            startedAt != null
              ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
              : 0;
          const leadIdFromMeta =
            metaSnapshot && metaSnapshot.leadId != null && String(metaSnapshot.leadId).length > 0
              ? String(metaSnapshot.leadId)
              : null;

          const failStr = `${failureCause ?? ""} ${callInfo?.reason ?? ""}`.toLowerCase();
          const remoteBusy =
            /\b486\b|\bbusy\b|user[-\s]?busy|line[-\s]?busy|occupied|declin(e|ed|ing)?/.test(
              failStr
            );

          const outboundDialMetaSessionFail =
            metaSnapshot != null &&
            metaSnapshot.dialSeq != null &&
            typeof metaSnapshot.dialSeq === "number";

          if (wasActive || leadIdFromMeta || outboundDialMetaSessionFail) {
            const endedDialSeqForSession =
              endedDialSeq != null ? endedDialSeq : metaSnapshot?.dialSeq ?? null;
            setLastCallSession({
              callUuid: uuid && typeof uuid === "string" && uuid.length > 0 ? uuid : null,
              durationSeconds,
              endedAtIso: new Date().toISOString(),
              leadId: leadIdFromMeta,
              endedDialSeq: endedDialSeqForSession,
              endReason: remoteBusy ? "busy" : "failed",
            });
            appendCallHistory({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              callUuid: uuid && typeof uuid === "string" && uuid.length > 0 ? uuid : null,
              name:
                metaSnapshot && typeof metaSnapshot.name === "string" && metaSnapshot.name.trim()
                  ? metaSnapshot.name.trim()
                  : "Unknown",
              leadId: leadIdFromMeta,
              durationSeconds,
              endedAtIso: new Date().toISOString(),
              endReason: remoteBusy ? "busy" : "failed",
            });
          }

          hadAnsweredCallRef.current = false;
          setConnectionText("Registered");
          setConnectionTone("online");
          audioAttachedRef.current = false;
          isInCallRef.current = false;
          outboundPendingRef.current = false;
          setIsInCall(false);
          setOutboundPending(false);
          setCallStartedAt(null);
          setActiveMeta(null);
          setIncomingVisible(false);
          setWaitingVisible(false);

          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
          }

          schedulePostCallAnalysis(wasActive, uuid, contactSnapshot);
        });

        client.on("onIncomingCall", (callerName) => {
          const label = callerName || "Unknown";
          pushLog(`📲 Incoming call from: ${label}`, "event");
          pendingIncomingNameRef.current = label;
          if (isInCallRef.current || outboundPendingRef.current) {
            setConnectionText("Call waiting");
            setConnectionTone("in-call");
            setWaitingCallerName(label);
            setWaitingVisible(true);
          } else {
            setConnectionText("Incoming call");
            setConnectionTone("in-call");
            setIncomingCallerName(label);
            setIncomingVisible(true);
          }
        });

        client.on("onIncomingCallCanceled", () => {
          pushLog("📴 Incoming call cancelled by caller", "warning");
          if (isInCallRef.current) {
            setConnectionText("In call");
            setConnectionTone("in-call");
            setWaitingVisible(false);
          } else {
            setConnectionText("Registered");
            setConnectionTone("online");
            setIncomingVisible(false);
          }
        });

        client.on("onMediaPermission", (granted) => {
          if (granted) {
            pushLog("🎤 Microphone permission granted", "success");
          } else {
            pushLog("🎤 Microphone permission denied", "error");
          }
        });

        client.on("onConnectionChange", (event) => {
          pushLog(`🔌 Connection change: ${JSON.stringify(event)}`, "event");
        });

        client.login(trimmedUser, trimmedPass);
        return { ok: true };
      } catch (err) {
        envLoginInFlightRef.current = false;
        pushLog(`Error initializing SDK: ${err?.message || String(err)}`, "error");
        setConnectionText("Error");
        setConnectionTone("offline");
        setConnecting(false);
        vobizRef.current = null;
        return { ok: false, error: err?.message || String(err) };
      }
    },
    [
      appendCallHistory,
      attachRemoteAudio,
      clearHangupFallbackTimer,
      clearPostCallFlowTimer,
      navigate,
      pushLog,
      resetSessionUi,
      schedulePostCallAnalysis,
    ]
  );

  const loginFromEnvIfConfigured = useCallback(
    (resumePath) => {
      if (registered) {
        envLoginInFlightRef.current = false;
        return { ok: true };
      }
      if (connecting || envLoginInFlightRef.current) {
        return { ok: true, pending: true };
      }
      const u = process.env.REACT_APP_VOBIZ_USERNAME;
      const p = process.env.REACT_APP_VOBIZ_PASSWORD;
      if (typeof u !== "string" || !u.trim() || typeof p !== "string" || !p.trim()) {
        return { ok: false, error: "no-env" };
      }
      envLoginInFlightRef.current = true;
      try {
        if (typeof resumePath === "string" && resumePath.startsWith("/")) {
          sessionStorage.setItem(SELLWISE_VOBIZ_POST_LOGIN_PATH_KEY, resumePath);
        }
      } catch {
        /* private mode / quota */
      }
      const result = login(u.trim(), p.trim());
      if (!result?.ok) {
        envLoginInFlightRef.current = false;
      }
      return result;
    },
    [registered, connecting, login]
  );

  const logout = useCallback(() => {
    envLoginInFlightRef.current = false;
    pushLog("Logging out...", "info");
    clearPostCallFlowTimer();
    setPostCallUI({ phase: "idle" });
    const vobiz = vobizRef.current;
    if (vobiz) {
      vobiz.client.logout();
    }
    navigate("/");
  }, [clearPostCallFlowTimer, navigate, pushLog]);

  const placeOutboundCall = useCallback(
    ({ destination, name, subtitle, avatar, leadId: sessionLeadId }) => {
      const vobiz = vobizRef.current;
      if (!vobiz) {
        pushLog("You must login first", "error");
        return { ok: false, error: "Not connected" };
      }
      const dest = sanitizeDialString(destination);
      if (!dest) {
        pushLog("Please enter a destination number or SIP URI", "error");
        return { ok: false, error: "Invalid destination" };
      }

      /** StrictMode double-mount (or rapid double invoke) would start two INVITEs; SDK often throws or fails the second. */
      if (outboundPendingRef.current || isInCallRef.current) {
        pushLog("Duplicate dial ignored (already ringing or in call).", "warning");
        return { ok: false, error: "Busy", dialSeq: outboundDialSeqRef.current };
      }

      pushLog(`📞 Calling ${dest}...`, "event");

      clearHangupFallbackTimer();
      outboundDialSeqRef.current += 1;
      const dialSeqForThisCall = outboundDialSeqRef.current;

      clearPostCallFlowTimer();
      setPostCallUI({ phase: "idle" });
      setLastCallSession(null);
      setConnectedLabelUntil(null);

      hadAnsweredCallRef.current = false;
      audioAttachedRef.current = false;
      outboundPendingRef.current = true;
      setOutboundPending(true);
      isInCallRef.current = false;
      setIsInCall(false);
      setConnectionText("Connecting");
      setConnectionTone("in-call");
      setActiveMeta({
        name: name || dest,
        subtitle: subtitle || "",
        avatar: avatar || null,
        phone: dest,
        leadId: sessionLeadId != null && String(sessionLeadId).length > 0 ? String(sessionLeadId) : null,
        dialSeq: dialSeqForThisCall,
      });
      setCallStartedAt(null);
      setElapsedSeconds(0);

      try {
        const started = vobiz.client.call(dest, {});
        if (started === false) {
          outboundPendingRef.current = false;
          setOutboundPending(false);
          setConnectionText("Registered");
          setConnectionTone("online");
          setActiveMeta(null);
          pushLog("client.call returned false", "error");
          toast.error("Could not start call. Check number and SIP registration.");
          return { ok: false, error: "Call not started" };
        }
      } catch (e) {
        const msg = e?.message != null ? String(e.message) : String(e);
        outboundPendingRef.current = false;
        setOutboundPending(false);
        setConnectionText("Registered");
        setConnectionTone("online");
        setActiveMeta(null);
        pushLog(`client.call threw: ${msg}`, "error");
        toast.error(msg || "Call failed to start");
        return { ok: false, error: msg };
      }

      return { ok: true, dialSeq: dialSeqForThisCall };
    },
    [clearHangupFallbackTimer, clearPostCallFlowTimer, pushLog]
  );

  const hangup = useCallback(() => {
    clearHangupFallbackTimer();
    const metaSnapshot = activeMetaRef.current ? { ...activeMetaRef.current } : null;
    const leadIdExit =
      metaSnapshot?.leadId != null && String(metaSnapshot.leadId).length > 0
        ? String(metaSnapshot.leadId)
        : null;
    const seqAtSchedule = outboundDialSeqRef.current;

    const vobiz = vobizRef.current;
    if (vobiz) {
      pushLog("Hanging up...", "info");
      try {
        vobiz.client.hangup();
      } catch {
        /* SDK may warn "No call session" if remote already tore down */
      }
    }

    /** If the session is already gone, SDK may not emit terminate/fail — still leave the lead call screen. */
    if (leadIdExit) {
      hangupFallbackTimerRef.current = window.setTimeout(() => {
        hangupFallbackTimerRef.current = null;
        setLastCallSession((prev) => {
          if (seqAtSchedule !== outboundDialSeqRef.current) return prev;
          if (prev) return prev;
          if (outboundPendingRef.current || isInCallRef.current) return prev;
          if (activeMetaRef.current != null) return prev;
          return {
            callUuid: null,
            durationSeconds: 0,
            endedAtIso: new Date().toISOString(),
            leadId: leadIdExit,
            endedDialSeq: seqAtSchedule,
            endReason: "ended",
          };
        });
      }, 500);
    }
  }, [clearHangupFallbackTimer, pushLog]);

  const answer = useCallback(() => {
    const vobiz = vobizRef.current;
    if (vobiz) {
      pushLog("Answering call...", "success");
      setActiveMeta((prev) => {
        if (prev) return prev;
        return {
          name: pendingIncomingNameRef.current || "Unknown",
          subtitle: "Incoming call",
          phone: "",
          avatar: null,
          leadId: null,
        };
      });
      vobiz.client.answer();
      setIncomingVisible(false);
      setWaitingVisible(false);
    }
  }, [pushLog]);

  const reject = useCallback(() => {
    const vobiz = vobizRef.current;
    if (vobiz) {
      pushLog("Call rejected", "warning");
      vobiz.client.reject();
      setIncomingVisible(false);
      setWaitingVisible(false);
      if (!isInCallRef.current) {
        setConnectionText("Registered");
        setConnectionTone("online");
      }
    }
  }, [pushLog]);

  const switchToWaitingCall = useCallback(() => {
    const vobiz = vobizRef.current;
    if (!vobiz) return;
    pushLog("Switching to waiting call...", "event");
    vobiz.client.hangup();
    window.setTimeout(() => {
      vobiz.client.answer();
      pushLog("Answering waiting call...", "success");
      setWaitingVisible(false);
    }, 500);
  }, [pushLog]);

  const toggleMute = useCallback(() => {
    const vobiz = vobizRef.current;
    if (!vobiz) return;
    if (isMuted) {
      vobiz.client.unmute();
      setIsMuted(false);
      pushLog("🔊 Unmuted", "info");
    } else {
      vobiz.client.mute();
      setIsMuted(true);
      pushLog("🔇 Muted", "warning");
    }
  }, [isMuted, pushLog]);

  const sendDtmf = useCallback((key) => {
    const vobiz = vobizRef.current;
    if (vobiz?.client?.callSession) {
      vobiz.client.sendDtmf(key);
      pushLog(`🔢 DTMF: ${key}`, "info");
    }
  }, [pushLog]);

  useEffect(() => {
    if (!callStartedAt) return;
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - callStartedAt) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [callStartedAt]);

  useEffect(() => {
    if (connectedLabelUntil == null) return;
    const delay = Math.max(0, connectedLabelUntil - Date.now());
    const id = window.setTimeout(() => {
      setCallStartedAt(Date.now());
      setElapsedSeconds(0);
      setConnectedLabelUntil(null);
    }, delay);
    return () => window.clearTimeout(id);
  }, [connectedLabelUntil]);

  const timerLabel = useMemo(() => formatMmSs(elapsedSeconds), [elapsedSeconds]);

  const isCallDurationRunning = Boolean(callStartedAt) && isInCall && connectedLabelUntil == null;

  const callUiActive = outboundPending || isInCall;

  const value = useMemo(
    () => ({
      remoteAudioRef,
      registered,
      connecting,
      connectionText,
      connectionTone,
      login,
      loginFromEnvIfConfigured,
      logout,
      placeOutboundCall,
      hangup,
      answer,
      reject,
      switchToWaitingCall,
      toggleMute,
      sendDtmf,
      isMuted,
      isInCall,
      outboundPending,
      callUiActive,
      incomingVisible,
      incomingCallerName,
      waitingVisible,
      waitingCallerName,
      activeMeta,
      timerLabel,
      connectedLabelUntil,
      isCallDurationRunning,
      postCallUI,
      dismissPostCallUi,
      keypadOpen,
      setKeypadOpen,
      eventLog,
      clearLog,
      callHistory,
      lastCallSession,
      clearLastCallSession,
    }),
    [
      registered,
      connecting,
      connectionText,
      connectionTone,
      login,
      loginFromEnvIfConfigured,
      logout,
      placeOutboundCall,
      hangup,
      answer,
      reject,
      switchToWaitingCall,
      toggleMute,
      sendDtmf,
      isMuted,
      isInCall,
      outboundPending,
      callUiActive,
      incomingVisible,
      incomingCallerName,
      waitingVisible,
      waitingCallerName,
      activeMeta,
      timerLabel,
      connectedLabelUntil,
      isCallDurationRunning,
      postCallUI,
      dismissPostCallUi,
      keypadOpen,
      eventLog,
      clearLog,
      callHistory,
      lastCallSession,
      clearLastCallSession,
    ]
  );

  return <VobizContext.Provider value={value}>{children}</VobizContext.Provider>;
}

export function useVobiz() {
  const ctx = useContext(VobizContext);
  if (!ctx) throw new Error("useVobiz must be used within a VobizProvider");
  return ctx;
}
