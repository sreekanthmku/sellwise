import { useMemo } from "react";

/** Header status chip: replaces timer during setup / ringing / connected pulse; then shows mm:ss. */
export function useCallStatusChip({
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
