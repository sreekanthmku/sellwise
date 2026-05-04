import { Phone } from "lucide-react";
import { useVobiz } from "@/vobiz/VobizProvider";

/**
 * Global Vobiz audio + inbound / call-waiting bars. No session log UI.
 */
export function CallShell() {
  const {
    remoteAudioRef,
    incomingVisible,
    incomingCallerName,
    waitingVisible,
    waitingCallerName,
    answer,
    reject,
    switchToWaitingCall,
  } = useVobiz();

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" aria-hidden />

      {waitingVisible ? (
        <div className="fixed inset-x-0 top-0 z-[200] flex justify-center bg-gradient-to-br from-amber-600 to-amber-500 px-4 py-3.5 text-white shadow-lg">
          <div className="flex w-full max-w-[600px] items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
              <Phone className="h-7 w-7" strokeWidth={2.25} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                Call waiting
              </div>
              <div className="truncate text-lg font-bold">{waitingCallerName}</div>
            </div>
            <div className="flex shrink-0 gap-2.5">
              <button
                type="button"
                className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-amber-700 shadow-md hover:bg-amber-50"
                onClick={() => switchToWaitingCall()}
              >
                Switch
              </button>
              <button
                type="button"
                className="rounded-full border border-white/30 bg-white/15 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/25"
                onClick={() => reject()}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      ) : incomingVisible ? (
        <div className="fixed inset-x-0 top-0 z-[200] flex justify-center bg-gradient-to-br from-emerald-600 to-emerald-500 px-4 py-3.5 text-white shadow-lg">
          <div className="flex w-full max-w-[600px] items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-white ring-4 ring-white/20">
              <Phone className="h-7 w-7" strokeWidth={2.25} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                Incoming call
              </div>
              <div className="truncate text-lg font-bold">{incomingCallerName}</div>
            </div>
            <div className="flex shrink-0 gap-2.5">
              <button
                type="button"
                className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-emerald-600 shadow-md hover:bg-emerald-50"
                onClick={() => answer()}
              >
                Answer
              </button>
              <button
                type="button"
                className="rounded-full border border-white/30 bg-white/15 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/25"
                onClick={() => reject()}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
