import * as React from "react";
import { Phone, Bell, Check, ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/context/LanguageContext";
import { mergeLeadDetail } from "@/data/leadDetails";
import { cn } from "@/lib/utils";

function parsePhoneDisplay(phoneDisplay) {
  const compact = String(phoneDisplay || "").replace(/[\s-]/g, "");
  if (compact.startsWith("+62")) {
    return {
      flag: "🇮🇩",
      dial: "+62",
      national: compact.slice(3).replace(/\D/g, ""),
    };
  }
  if (compact.startsWith("+91")) {
    return {
      flag: "🇮🇳",
      dial: "+91",
      national: compact.slice(3).replace(/\D/g, ""),
    };
  }
  if (compact.startsWith("+")) {
    const m = compact.match(/^\+(\d{1,3})(.*)$/);
    if (m) {
      return {
        flag: "🌐",
        dial: `+${m[1]}`,
        national: m[2].replace(/\D/g, ""),
      };
    }
  }
  const digits = compact.replace(/\D/g, "");
  return { flag: "🇮🇳", dial: "+91", national: digits.slice(-10) };
}

/** UI-only labels for “Attach lead to” (not real lead names). Exactly five Indonesian names. */
const ATTACH_DISPLAY_NAMES_ID = [
  "Budi Santoso",
  "Siti Rahayu",
  "Agus Kurniawan",
  "Dewi Lestari",
  "Rizki Pratama",
];

/** Up to five `{ leadId, label }` rows: fake Indonesian labels, real ids for routing / phone. */
function getAttachLeadRows(humanLeads, initialLead) {
  const list = Array.isArray(humanLeads) ? humanLeads : [];
  if (!list.length) return [];
  let ordered;
  if (initialLead) {
    const rest = list.filter((l) => l.id !== initialLead.id);
    ordered = [initialLead, ...rest.slice(0, 4)];
  } else {
    ordered = list.slice(0, 5);
  }
  return ordered.map((lead, i) => ({
    leadId: lead.id,
    label: ATTACH_DISPLAY_NAMES_ID[i] ?? ATTACH_DISPLAY_NAMES_ID[0],
  }));
}

export function CallNumberModal({ open, onOpenChange, initialLead, humanLeads, prefillPhoneDisplay }) {
  const { t } = useLanguage();
  const m = t.callNumberModal;
  const navigate = useNavigate();
  const [attachedLeadId, setAttachedLeadId] = React.useState("");
  const [nationalDigits, setNationalDigits] = React.useState("");
  const [dialMeta, setDialMeta] = React.useState({ flag: "🇮🇳", dial: "+91" });
  const [saveAs, setSaveAs] = React.useState("alternate");
  const [whatsappOn, setWhatsappOn] = React.useState(true);
  const [attachOpen, setAttachOpen] = React.useState(false);
  const attachTriggerRef = React.useRef(null);
  const [attachMenuWidth, setAttachMenuWidth] = React.useState(undefined);

  const attachRows = React.useMemo(
    () => getAttachLeadRows(humanLeads, initialLead),
    [humanLeads, initialLead],
  );

  const applyPhoneFromLead = React.useCallback((lead) => {
    if (!lead) return;
    const phone = mergeLeadDetail(lead).phoneDisplay;
    const parsed = parsePhoneDisplay(phone);
    setDialMeta({ flag: parsed.flag, dial: parsed.dial });
    setNationalDigits(parsed.national);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    if (initialLead) {
      setAttachedLeadId(initialLead.id);
      applyPhoneFromLead(initialLead);
    } else {
      const first = humanLeads?.[0];
      setAttachedLeadId(first?.id ?? "");
      const rawPrefill =
        typeof prefillPhoneDisplay === "string" ? prefillPhoneDisplay.trim() : "";
      if (rawPrefill) {
        const parsed = parsePhoneDisplay(rawPrefill);
        setDialMeta({ flag: parsed.flag, dial: parsed.dial });
        setNationalDigits(parsed.national);
      } else {
        setDialMeta({ flag: "🇮🇳", dial: "+91" });
        setNationalDigits("");
      }
    }
    setSaveAs("alternate");
    setWhatsappOn(true);
    setAttachOpen(false);
  }, [open, initialLead, applyPhoneFromLead, humanLeads, prefillPhoneDisplay]);

  React.useLayoutEffect(() => {
    if (!attachOpen || !attachTriggerRef.current) return;
    const el = attachTriggerRef.current;
    const ro = new ResizeObserver(() => {
      setAttachMenuWidth(el.offsetWidth);
    });
    ro.observe(el);
    setAttachMenuWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, [attachOpen]);

  const selectedAttachRow = React.useMemo(
    () => attachRows.find((r) => r.leadId === attachedLeadId),
    [attachRows, attachedLeadId],
  );

  const selectAttachedLead = React.useCallback(
    (leadId) => {
      setAttachedLeadId(leadId);
      const lead = humanLeads?.find((l) => l.id === leadId);
      if (lead) applyPhoneFromLead(lead);
      setAttachOpen(false);
    },
    [humanLeads, applyPhoneFromLead],
  );

  const handleNationalInput = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    setNationalDigits(v);
  };

  const goCall = () => {
    const id = attachedLeadId;
    if (!id) return;
    onOpenChange(false);
    navigate(`/leads/${id}/call`);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        data-testid="call-number-drawer"
        className={cn(
          "max-h-[min(90vh,100dvh)] w-full max-w-none gap-0 overflow-hidden rounded-t-[24px] border border-[#e9ebef] bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-0 shadow-xl",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-4">
          <div className="flex items-start justify-between gap-4">
            <DrawerTitle className="font-body text-[18px] font-bold leading-tight text-[color:var(--gray-300)]">
              {m.title}
            </DrawerTitle>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F8FB] text-[color:var(--gray-300)] transition-colors hover:bg-[#eef0f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </DrawerClose>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="call-modal-phone"
                className="font-body text-[14px] font-bold leading-tight text-[color:var(--gray-300)]"
              >
                {m.phoneNumber}
              </label>
              <div className="flex items-stretch overflow-hidden rounded-[12px] border border-[#e9ebef] bg-white">
                <span className="flex shrink-0 items-center gap-1.5 border-r border-[#e9ebef] bg-[#fafbfc] px-3 py-2.5 text-[15px] text-[color:var(--gray-200)]">
                  <span className="text-lg leading-none" aria-hidden>
                    {dialMeta.flag}
                  </span>
                  <span className="font-medium tabular-nums">{dialMeta.dial}</span>
                </span>
                <input
                  id="call-modal-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="9876543210"
                  value={nationalDigits}
                  onChange={handleNationalInput}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-body text-[15px] font-medium text-[color:var(--gray-300)] outline-none placeholder:text-[color:var(--gray-200)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                id="call-modal-lead-label"
                htmlFor="call-modal-lead-trigger"
                className="font-body text-[14px] font-bold leading-tight text-[color:var(--gray-300)]"
              >
                {m.attachLeadTo}
              </label>
              <div className="relative">
                <Popover modal={false} open={attachOpen} onOpenChange={setAttachOpen}>
                  <PopoverTrigger asChild>
                    <button
                      ref={attachTriggerRef}
                      type="button"
                      id="call-modal-lead-trigger"
                      aria-labelledby="call-modal-lead-label"
                      aria-haspopup="listbox"
                      aria-expanded={attachOpen}
                      disabled={attachRows.length === 0}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-[12px] border bg-white py-2.5 pl-3 pr-3 text-left font-body text-[15px] font-medium text-[color:var(--gray-300)] outline-none transition-[border-color,box-shadow]",
                        attachOpen
                          ? "border-[color:var(--blue-400)] shadow-[0_0_0_3px_rgba(59,130,246,0.18)]"
                          : "border-[#e9ebef] hover:border-[#d8dce4] focus-visible:border-[color:var(--blue-400)] focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.18)]",
                        attachRows.length === 0 && "pointer-events-none opacity-50",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {selectedAttachRow?.label ?? "—"}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-[color:var(--blue-600)] transition-transform duration-200",
                          attachOpen && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={6}
                    collisionPadding={16}
                    className={cn(
                      "z-[100] rounded-[12px] border border-[#e5e8ee] bg-white p-1 shadow-[0_10px_40px_rgba(15,23,42,0.12)] outline-none",
                      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
                    )}
                    style={
                      attachMenuWidth != null
                        ? { width: attachMenuWidth, minWidth: attachMenuWidth }
                        : undefined
                    }
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <ul role="listbox" aria-labelledby="call-modal-lead-label" className="flex flex-col gap-px">
                      {attachRows.map((row) => {
                        const selected = row.leadId === attachedLeadId;
                        return (
                          <li key={row.leadId} role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => selectAttachedLead(row.leadId)}
                              className={cn(
                                "flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left font-body text-[15px] font-medium transition-colors",
                                selected
                                  ? "bg-[color:var(--blue-600)] text-white"
                                  : "text-[color:var(--gray-300)] hover:bg-[#f4f6f9]",
                              )}
                            >
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center"
                                aria-hidden
                              >
                                {selected ? (
                                  <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1 truncate">{row.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="font-body text-[14px] font-bold leading-tight text-[color:var(--gray-300)]">
                {m.saveContactAs}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["primary", "alternate"]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSaveAs(key)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-full border-2 py-2.5 font-body text-[14px] font-semibold transition-colors",
                      saveAs === key
                        ? "border-[color:var(--blue-600)] bg-white text-[color:var(--blue-600)]"
                        : "border-[#e9ebef] bg-white text-[color:var(--gray-200)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                        saveAs === key
                          ? "border-[color:var(--blue-600)] bg-[color:var(--blue-600)]"
                          : "border-[#cfd4dc] bg-white",
                      )}
                      aria-hidden
                    >
                      {saveAs === key ? (
                        <span className="block h-1.5 w-1.5 rounded-full bg-white" />
                      ) : null}
                    </span>
                    {m[key]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[12px] border border-[#eef0f3] bg-[#fafbfc] px-3 py-3">
              <Bell className="h-5 w-5 shrink-0 text-[color:var(--gray-200)]" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <p className="font-body text-[14px] font-bold leading-tight text-[color:var(--gray-300)]">
                  {m.whatsappAvailable}
                </p>
                <p className="mt-0.5 font-body text-[12px] leading-snug text-[color:var(--gray-200)]">
                  {m.whatsappAvailableSub}
                </p>
              </div>
              <Switch checked={whatsappOn} onCheckedChange={setWhatsappOn} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={goCall}
              disabled={!attachedLeadId}
              className="flex items-center justify-center gap-2 rounded-full border border-[#e9ebef] bg-white py-3 font-body text-[14px] font-semibold text-[color:var(--blue-600)] transition-colors hover:bg-[#fafafa] disabled:pointer-events-none disabled:opacity-40"
            >
              <Phone className="h-[18px] w-[18px]" strokeWidth={2.25} />
              {m.callNow}
            </button>
            <button
              type="button"
              onClick={goCall}
              disabled={!attachedLeadId}
              className="flex items-center justify-center gap-2 rounded-full border-2 border-[color:var(--blue-600)] bg-[color:var(--blue-600)] py-3 font-body text-[14px] font-semibold text-white transition-colors hover:opacity-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <Phone className="h-[18px] w-[18px]" strokeWidth={2.25} fill="currentColor" />
              {m.callAndSave}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
