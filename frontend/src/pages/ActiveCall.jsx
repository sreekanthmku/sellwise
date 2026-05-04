import { useEffect, useMemo, useRef, useState } from "react";
import {
  DollarSign,
  Info,
  MapPin,
  Mic,
  MicOff,
  PhoneOff,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { useLeadsData } from "@/context/LeadsDataContext";
import { initialsFromName, mergeLeadDetail } from "@/data/leadDetails";
import { sanitizeDialString, useVobiz } from "@/vobiz/VobizProvider";

const formatLastContact = (lastContact, t) => {
  const { value, unit } = lastContact;
  if (unit === "hours") return `${value}${t.timeAgo.hours}`;
  if (unit === "day") return `${value}${t.timeAgo.day}`;
  return `${value} ${t.timeAgo.days}`;
};

function budgetFromDetail(detail, lead, t) {
  const row = detail.preferences.find((p) => p.key === "budget");
  if (!row) return t.activeCall.budgetUnknown;
  if (row.valueKey === "_model") return lead.interestedIn;
  const v = t.leadDetail.prefValues[row.valueKey];
  return v ?? t.activeCall.budgetUnknown;
}

function leadHeatLabel(priority, t) {
  if (priority === "high") return t.activeCall.hotLead;
  return t.priority[priority] ?? priority;
}

/** Header status chip: replaces timer during setup / ringing / connected pulse; then shows mm:ss. */
function useCallStatusChip({
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
}) {
  return useMemo(() => {
    if (preNavigateKind === "busy") {
      return {
        text: t.activeCall.statusUserBusy,
        dotClass: "bg-amber-400",
        mono: false,
      };
    }
    if (preNavigateKind === "ended") {
      return {
        text: t.activeCall.callEnded,
        dotClass: "bg-white/80",
        mono: false,
      };
    }
    if (connecting && !registered) {
      return {
        text: t.activeCall.statusRegistering,
        dotClass: "bg-amber-400 animate-pulse",
        mono: false,
      };
    }
    if (connectedLabelUntil != null) {
      return {
        text: t.activeCall.statusConnected,
        dotClass: "bg-emerald-400",
        mono: false,
      };
    }
    if (outboundPending && !isInCall && connectionText === "Ringing") {
      return {
        text: t.activeCall.statusRinging,
        dotClass: "bg-amber-400 animate-pulse",
        mono: false,
      };
    }
    if (outboundPending && !isInCall) {
      return {
        text: t.activeCall.statusOutbound,
        dotClass: "bg-amber-400 animate-pulse",
        mono: false,
      };
    }
    if (isCallDurationRunning) {
      return {
        text: timerLabel,
        dotClass: "bg-[#22c55e]",
        mono: true,
      };
    }
    if (isInCall) {
      return {
        text: t.activeCall.statusConnected,
        dotClass: "bg-emerald-400",
        mono: false,
      };
    }
    return {
      text: "—",
      dotClass: "bg-white/40",
      mono: false,
    };
  }, [
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
  ]);
}

export default function ActiveCall() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getLeadById } = useLeadsData();
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
  /** Matches `activeMeta.dialSeq` / `placeOutboundCall` for this visit — avoids navigating on SDK end for a previous dial (sellwise routes away; vobizFE stays on one screen). */
  const activeOutboundDialSeqRef = useRef(null);

  const lead = getLeadById(leadId);

  useEffect(() => {
    if (!lead || !leadId) return;
    const r = loginFromEnvIfConfigured(`/leads/${leadId}/call`);
    if (r?.ok === false && r?.error === "no-env") {
      toast.error("Add REACT_APP_VOBIZ_USERNAME and REACT_APP_VOBIZ_PASSWORD to .env for calling.");
      navigate("/leads", { replace: true });
    }
  }, [lead, leadId, loginFromEnvIfConfigured, navigate]);

  useEffect(() => {
    if (!lead || !leadId || !registered) return;
    if (dialStartedRef.current) return;
    dialStartedRef.current = true;
    const detailRow = mergeLeadDetail(lead);
    const phoneDisplay = detailRow.phoneDisplay;
    const result = placeOutboundCall({
      destination: sanitizeDialString(phoneDisplay),
      name: lead.name,
      subtitle: phoneDisplay || "",
      avatar: null,
      leadId,
    });
    if (result.dialSeq != null) {
      activeOutboundDialSeqRef.current = result.dialSeq;
    }
    if (!result.ok && result.error !== "Busy") {
      dialStartedRef.current = false;
    }
  }, [lead, leadId, registered, placeOutboundCall]);

  useEffect(() => {
    if (!lastCallSession || lastCallSession.leadId !== leadId) {
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
      navigate(`/leads/${leadId}/call-details`, {
        replace: true,
        state: {
          durationSeconds: lastCallSession.durationSeconds,
          endedAt: lastCallSession.endedAtIso,
          callUuid: lastCallSession.callUuid,
        },
      });
      clearLastCallSession();
      setPreNavigateKind(null);
    }, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(navTimer);
    };
  }, [lastCallSession, leadId, navigate, clearLastCallSession]);

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

  if (!lead) {
    navigate("/leads", { replace: true });
    return null;
  }

  const detail = mergeLeadDetail(lead);
  const initials = initialsFromName(lead.name);
  const budgetText = budgetFromDetail(detail, lead, t);
  const heatLabel = leadHeatLabel(lead.priority, t);

  return (
    <AppScreen
      screenTestId="active-call-screen"
      mainTestId="active-call-main"
      showHeader={false}
      showBottomNav={false}
      lockViewportHeight
      screenClassName="max-w-none bg-[#003388]"
      mainBgClass="bg-[#003388]"
      mainClassName="flex min-h-0 flex-1 flex-col text-white"
    >
      {/* Top bar — flush to screen edges (AppScreen px applies) */}
      <header className="flex shrink-0 items-center justify-between gap-3 pt-[max(0.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <PhoneOff className="h-5 w-5 shrink-0 text-white" strokeWidth={2.25} />
          <span className="font-body text-[17px] font-semibold tracking-tight">
            {t.activeCall.title}
          </span>
        </div>
        <div
          className="flex max-w-[min(100%,220px)] items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5"
          data-testid="active-call-timer"
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

      {/* Vertically center profile + card between header and controls */}
      <div className="min-h-0 flex-1" aria-hidden />
      <div className="flex w-full shrink-0 flex-col items-center gap-7">
        <div className="flex w-full flex-col items-center text-center">
          <div
            className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white font-body text-[36px] font-bold leading-none text-[#003388]"
            aria-hidden
          >
            {initials}
          </div>
          <h1 className="mt-5 max-w-[20ch] font-body text-[26px] font-bold leading-tight">
            {lead.name}
          </h1>
          <p className="mt-2 max-w-[24ch] text-[15px] font-normal leading-snug text-white/88">
            {t.lastContact}: {formatLastContact(lead.lastContact, t)}
          </p>
        </div>

        {/* Quick info — full width, content center-aligned like reference */}
        <div className="w-full rounded-2xl bg-black/20 px-4 py-5 text-[#c4d8f0] backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 text-[14px] font-medium text-[#9ebfe8]">
            <Info className="h-4 w-4 shrink-0 text-[#9ebfe8]" strokeWidth={2.25} />
            {t.activeCall.quickInfo}
          </div>
          <p className="mt-3 text-center text-[12px] font-medium leading-snug sm:text-[13px]">
            {t.interestedIn}{" "}
            <span className="font-semibold text-[#dce9fb]">{lead.interestedIn}</span>
          </p>
          <div className="mt-5 flex w-full items-center justify-between gap-1.5 text-[12px] leading-snug sm:gap-2 sm:text-[13px]">
            <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-center">
              <DollarSign
                className="h-3.5 w-3.5 shrink-0 text-[#aacce9] sm:h-4 sm:w-4"
                strokeWidth={2.25}
              />
              <span className="min-w-0 break-words">
                {t.activeCall.budgetLabel}: {budgetText}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-center">
              <MapPin
                className="h-3.5 w-3.5 shrink-0 text-[#aacce9] sm:h-4 sm:w-4"
                strokeWidth={2.25}
              />
              <span className="min-w-0 break-words">
                {detail.location !== "—" ? detail.location : t.activeCall.locationUnknown}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-center">
              <Star
                className="h-3.5 w-3.5 shrink-0 fill-[#aacce9] text-[#aacce9] sm:h-4 sm:w-4"
                strokeWidth={0}
              />
              <span className="min-w-0 break-words">{heatLabel}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1" aria-hidden />

      {/* Call controls — equal gaps, side buttons same size, center ~18% larger; comfy inset from bottom */}
      <div className="flex shrink-0 items-center justify-center gap-12 pt-6 pb-[max(3.5rem,env(safe-area-inset-bottom,0px))] sm:gap-14 sm:pb-[max(4rem,env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          data-testid="active-call-mute"
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
          data-testid="active-call-end"
          onClick={() => hangup()}
          className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full bg-[#e11d48] text-white transition-transform active:scale-95"
          aria-label={t.activeCall.endCall}
        >
          <PhoneOff className="h-[30px] w-[30px]" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          data-testid="active-call-speaker"
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
