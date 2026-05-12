import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { useCallStatusChip } from "@/hooks/useCallStatusChip";
import { formatDialDisplay } from "@/lib/phone";
import { sanitizeDialString, useVobiz } from "@/vobiz/VobizProvider";

/**
 * Outbound call UI for keypad numbers that do not match a stored lead.
 * Destination is passed as `navigate("/dialer/call", { state: { destination } })` (sanitized string).
 */
export default function DialerOutboundCall() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const {
    placeOutboundCall,
    hangup,
    toggleMute,
    isMuted,
    timerLabel,
    registered,
    connecting,
    loginFromEnvIfConfigured,
    connectionText,
    outboundPending,
    isInCall,
    connectedLabelUntil,
    isCallDurationRunning,
    lastCallSession,
    clearLastCallSession,
  } = useVobiz();
  const [speaker, setSpeaker] = useState(false);
  const [preNavigateKind, setPreNavigateKind] = useState(null);
  const dialStartedRef = useRef(false);
  const activeOutboundDialSeqRef = useRef(null);

  const dialRaw =
    typeof location.state?.dialRaw === "string" ? location.state.dialRaw.trim() : "";

  const destination =
    typeof location.state?.destination === "string"
      ? sanitizeDialString(location.state.destination)
      : "";

  useEffect(() => {
    if (destination) return;
    navigate("/dialer", { replace: true });
  }, [destination, navigate]);

  useEffect(() => {
    const r = loginFromEnvIfConfigured("/dialer/call");
    if (r?.ok === false && r?.error === "no-env") {
      toast.error("Add REACT_APP_VOBIZ_USERNAME and REACT_APP_VOBIZ_PASSWORD to .env for calling.");
      navigate("/dialer", { replace: true });
    }
  }, [loginFromEnvIfConfigured, navigate]);

  useEffect(() => {
    if (!destination || !registered) return;
    if (dialStartedRef.current) return;
    dialStartedRef.current = true;
    const subtitle = dialRaw ? formatDialDisplay(dialRaw) : formatDialDisplay(destination);
    const result = placeOutboundCall({
      destination,
      name: destination,
      subtitle,
      avatar: null,
      leadId: null,
    });
    if (result.dialSeq != null) {
      activeOutboundDialSeqRef.current = result.dialSeq;
    }
    if (!result.ok && result.error !== "Busy") {
      dialStartedRef.current = false;
    }
  }, [destination, registered, placeOutboundCall, dialRaw]);

  useEffect(() => {
    if (!lastCallSession) {
      setPreNavigateKind(null);
      return;
    }
    if (lastCallSession.leadId != null) {
      setPreNavigateKind(null);
      return;
    }
    if (
      lastCallSession.endedDialSeq == null ||
      lastCallSession.endedDialSeq !== activeOutboundDialSeqRef.current
    ) {
      return;
    }
    const kind = lastCallSession.endReason === "busy" ? "busy" : "ended";
    setPreNavigateKind(kind);
    let cancelled = false;
    const navTimer = window.setTimeout(() => {
      if (cancelled) return;
      navigate("/dialer", { replace: true });
      clearLastCallSession();
      setPreNavigateKind(null);
    }, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(navTimer);
    };
  }, [lastCallSession, navigate, clearLastCallSession]);

  const statusChip = useCallStatusChip({
    t,
    preNavigateKind,
    connecting,
    registered,
    connectionText,
    outboundPending,
    isInCall,
    connectedLabelUntil,
    isCallDurationRunning,
    timerLabel,
  });

  const rawLabel = dialRaw || destination;
  const displayLine = formatDialDisplay(rawLabel);

  if (!destination) {
    return null;
  }

  return (
    <AppScreen
      screenTestId="dialer-outbound-call-screen"
      mainTestId="dialer-outbound-call-main"
      showHeader={false}
      showBottomNav={false}
      lockViewportHeight
      screenClassName="max-w-none bg-[#003388]"
      mainBgClass="bg-[#003388]"
      mainClassName="flex min-h-0 flex-1 flex-col text-white"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 pt-[max(0.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <PhoneOff className="h-5 w-5 shrink-0 text-white" strokeWidth={2.25} />
          <span className="font-body text-[17px] font-semibold tracking-tight">
            {t.activeCall.title}
          </span>
        </div>
        <div
          className="flex max-w-[min(100%,220px)] items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5"
          data-testid="dialer-outbound-call-timer"
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${statusChip.dotClass}`}
            aria-hidden
          />
          <span
            className={`min-w-0 truncate text-[15px] font-medium ${statusChip.mono ? "font-mono tabular-nums" : "font-body"}`}
          >
            {statusChip.text}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1" aria-hidden />
      <div className="flex w-full shrink-0 flex-col items-center gap-7">
        <div className="flex w-full flex-col items-center text-center">
          <div
            className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white font-body text-[36px] font-bold leading-none text-[#003388]"
            aria-hidden
          >
            <Phone className="h-14 w-14" strokeWidth={2} aria-hidden />
          </div>
          <h1 className="mt-5 max-w-[min(100%,22ch)] break-words font-body text-[22px] font-bold leading-tight sm:text-[26px]">
            {displayLine || destination}
          </h1>
          <p className="mt-2 max-w-[24ch] text-[15px] font-normal leading-snug text-white/88">
            {t.activeCall.quickInfo}
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1" aria-hidden />

      <div className="flex shrink-0 items-center justify-center gap-12 pt-6 pb-[max(3.5rem,env(safe-area-inset-bottom,0px))] sm:gap-14 sm:pb-[max(4rem,env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          data-testid="dialer-outbound-mute"
          onClick={() => toggleMute()}
          aria-pressed={isMuted}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[#2d3748] transition-transform active:scale-95"
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" strokeWidth={2.25} />
          ) : (
            <Mic className="h-6 w-6" strokeWidth={2.25} />
          )}
        </button>
        <button
          type="button"
          data-testid="dialer-outbound-end"
          onClick={() => hangup()}
          className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full bg-[#e11d48] text-white transition-transform active:scale-95"
          aria-label={t.activeCall.endCall}
        >
          <PhoneOff className="h-[30px] w-[30px]" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          data-testid="dialer-outbound-speaker"
          onClick={() => setSpeaker((s) => !s)}
          aria-pressed={speaker}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[#2d3748] transition-transform active:scale-95"
        >
          {speaker ? (
            <VolumeX className="h-6 w-6" strokeWidth={2.25} />
          ) : (
            <Volume2 className="h-6 w-6" strokeWidth={2.25} />
          )}
        </button>
      </div>
    </AppScreen>
  );
}
