import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Delete, Phone, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { CallNumberModal } from "@/components/leads/CallNumberModal";
import { useLeadsData } from "@/context/LeadsDataContext";
import { useVobiz, sanitizeDialString } from "@/vobiz/VobizProvider";
import { cn } from "@/lib/utils";

/** 3×4 keypad — digits/symbols only */
const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

const ZERO_LONG_PRESS_MS = 450;

/** Groups digits for display; preserves leading + and trailing * / # */
function formatDialDisplay(raw) {
  if (!raw) return "";
  const extras = raw.replace(/[\d+\s]/g, "");
  const leadPlus = raw.startsWith("+");
  const digitStr = (leadPlus ? raw.slice(1) : raw).replace(/\D/g, "");
  const grouped = digitStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const prefix = leadPlus ? "+" : "";
  const tail = extras ? ` ${extras}` : "";
  return `${prefix}${grouped}${tail}`.trim();
}

function hasVobizEnv() {
  const u = process.env.REACT_APP_VOBIZ_USERNAME;
  const p = process.env.REACT_APP_VOBIZ_PASSWORD;
  return typeof u === "string" && u.trim() && typeof p === "string" && p.trim();
}

/** Circular keypad key — theme neutrals */
const iosKeyBase =
  "font-body flex items-center justify-center rounded-full bg-[#eef2f7] text-[color:var(--gray-300)] shadow-none outline-none transition-colors active:bg-[#e4e9f2] focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]";

const headerCircleBtn =
  "flex h-11 w-11 items-center justify-center rounded-full bg-[#f2f4fc] text-[#6b7380] transition-colors hover:bg-[#e9ecf7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]";

export default function Dialer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const d = t.dialer;
  const { placeOutboundCall, loginFromEnvIfConfigured, outboundPending, isInCall } = useVobiz();
  const { humanLeads } = useLeadsData();

  const [callModalOpen, setCallModalOpen] = useState(false);
  const [entry, setEntry] = useState("");
  const zeroTimerRef = useRef(null);
  const zeroLongFiredRef = useRef(false);

  useEffect(() => {
    loginFromEnvIfConfigured("/dialer");
  }, [loginFromEnvIfConfigured]);

  useEffect(() => {
    const raw = location.state?.initialDialEntry;
    if (typeof raw !== "string" || !raw.trim()) return;
    setEntry(raw.trim());
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    return () => {
      if (zeroTimerRef.current) window.clearTimeout(zeroTimerRef.current);
    };
  }, []);

  const destinationOk = sanitizeDialString(entry).length > 0;
  const callBusy = outboundPending || isInCall;

  const append = (ch) => {
    if (entry.length >= 22) return;
    setEntry((prev) => prev + ch);
  };

  const backspace = () => {
    setEntry((prev) => prev.slice(0, -1));
  };

  const clearZeroLongTimer = () => {
    if (zeroTimerRef.current) {
      window.clearTimeout(zeroTimerRef.current);
      zeroTimerRef.current = null;
    }
  };

  const onZeroPointerDown = () => {
    zeroLongFiredRef.current = false;
    clearZeroLongTimer();
    zeroTimerRef.current = window.setTimeout(() => {
      zeroTimerRef.current = null;
      zeroLongFiredRef.current = true;
      append("+");
    }, ZERO_LONG_PRESS_MS);
  };

  const onZeroPointerEnd = () => {
    clearZeroLongTimer();
    if (!zeroLongFiredRef.current) append("0");
    zeroLongFiredRef.current = false;
  };

  const onCall = () => {
    if (!hasVobizEnv()) {
      toast.error(d.noSipToast);
      return;
    }
    if (!destinationOk) {
      toast.message(d.callNeedsDigits);
      return;
    }
    const dest = sanitizeDialString(entry);
    placeOutboundCall({
      destination: dest,
      name: dest,
      subtitle: "",
      avatar: null,
      leadId: null,
    });
  };

  const displayText = entry.length > 0 ? formatDialDisplay(entry) : "";
  const hasDigits = entry.length > 0;

  return (
    <AppScreen
      screenTestId="dialer-screen"
      mainTestId="dialer-main"
      showHeader={false}
      showBottomNav={false}
      lockViewportHeight
      screenClassName="bg-[var(--app-canvas)]"
      mainClassName="min-h-0 flex-1 px-0 pb-0 pt-[max(8px,env(safe-area-inset-top,0px))]"
    >
      <div className="flex min-h-0 flex-1 flex-col justify-between bg-[var(--app-canvas)] font-body">
        {/* Top — bar + number */}
        <div className="flex shrink-0 flex-col">
          <div className="flex shrink-0 items-center justify-between px-3 pb-2 pt-1">
            <button
              type="button"
              data-testid="dialer-back"
              aria-label={d.backAria}
              onClick={() => navigate("/leads")}
              className={headerCircleBtn}
            >
              <ArrowLeft className="h-6 w-6" strokeWidth={2.25} aria-hidden />
            </button>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                data-testid="dialer-add-contact"
                aria-label={d.addContactAria}
                onClick={() => setCallModalOpen(true)}
                className={headerCircleBtn}
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />
              </button>
              {hasDigits ? (
                <button
                  type="button"
                  data-testid="dialer-backspace"
                  onClick={backspace}
                  aria-label={d.backspaceAria}
                  className={headerCircleBtn}
                >
                  <Delete className="h-6 w-6" strokeWidth={2} aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-[50px] flex shrink-0 flex-col items-center px-5 pb-2">
            <p
              data-testid="dialer-display"
              className={cn(
                "w-full max-w-[min(100%,360px)] text-balance break-words text-center font-['Maison_Neue_Mono',monospace] text-[34px] font-normal leading-snug tracking-[0.02em] text-[color:var(--gray-300)]",
                entry.length === 0 && "min-h-[48px]",
              )}
            >
              {displayText}
            </p>
          </div>
        </div>

        {/* Keypad + call — bottom-aligned, shifted up (transform works reliably vs negative margin in flex) */}
        <div
          className="relative z-10 flex w-full shrink-0 -translate-y-[120px] flex-col items-center px-[max(16px,env(safe-area-inset-left,0px))] pb-[max(12px,env(safe-area-inset-bottom,0px))]"
        >
          <div className="w-full max-w-[330px] space-y-[14px]">
            {KEYPAD_ROWS.map((row, ri) => (
              <div
                key={String(ri)}
                className="grid grid-cols-3 justify-items-center gap-x-[18px]"
              >
                {row.map((keyChar) => {
                  const isZero = keyChar === "0";
                  return (
                    <button
                      key={keyChar}
                      type="button"
                      data-testid={`dialer-key-${keyChar}`}
                      className={cn(
                        iosKeyBase,
                        "h-[76px] w-[76px] touch-manipulation select-none",
                        keyChar === "*" || keyChar === "#" ? "text-[32px] font-light" : "",
                      )}
                      {...(isZero
                        ? {
                            onPointerDown: (e) => {
                              if (e.pointerType === "mouse" && e.button !== 0) return;
                              e.preventDefault();
                              onZeroPointerDown();
                            },
                            onPointerUp: onZeroPointerEnd,
                            onPointerCancel: onZeroPointerEnd,
                          }
                        : {
                            onClick: () => append(keyChar),
                          })}
                    >
                      <span
                        className={cn(
                          "font-body leading-none",
                          keyChar === "*" || keyChar === "#"
                            ? "text-[34px] font-light"
                            : "text-[36px] font-light",
                        )}
                      >
                        {keyChar}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-7 flex justify-center pt-1">
            <button
              type="button"
              data-testid="dialer-call"
              disabled={callBusy || !destinationOk}
              onClick={onCall}
              aria-label={d.call}
              className={cn(
                "flex h-[76px] w-[76px] items-center justify-center rounded-full border-0 bg-[color:var(--action-blue)] p-0 text-white shadow-none outline-none ring-0 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-canvas)]",
                callBusy || !destinationOk
                  ? "pointer-events-none opacity-35"
                  : "hover:bg-[color:var(--action-blue-hover)] active:bg-[color:var(--action-blue-hover)]",
              )}
            >
              <Phone
                className="h-8 w-8 shrink-0 text-white"
                fill="currentColor"
                strokeWidth={2.25}
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>

      <CallNumberModal
        open={callModalOpen}
        onOpenChange={setCallModalOpen}
        initialLead={null}
        humanLeads={humanLeads}
        prefillPhoneDisplay={entry}
      />
    </AppScreen>
  );
}
