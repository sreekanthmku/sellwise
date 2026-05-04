import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, ChevronDown, ChevronUp, Clock, RefreshCw, Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const tpl = (str, vars) =>
  str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));

/** Business hours: 7:00 AM – 9:00 PM in 30-minute steps */
function buildTimeOptions() {
  const out = [];
  for (let hour = 7; hour <= 21; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 21 && minute > 0) break;
      const h12 = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const mm = minute.toString().padStart(2, "0");
      out.push(`${h12}:${mm} ${ampm}`);
    }
  }
  return out;
}

const TIME_OPTIONS = buildTimeOptions();
/** Start times: every slot except the last so a later end time always exists */
const START_TIME_OPTIONS = TIME_OPTIONS.slice(0, -1);

const RETRY_COUNTS = [1, 2, 3, 4, 5];

function ScheduleSelectField({ icon: Icon, label, value, onValueChange, testid, children }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        data-testid={testid}
        className={cn(
          "h-auto w-full rounded-[12px] border border-[#DCE8FA] bg-white px-3 py-2 text-left shadow-none",
          "hover:bg-[color:var(--blue-100)] focus:ring-2 focus:ring-[#2563EA]/25 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-[#2563EA]",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Icon className="h-5 w-5 shrink-0 text-[#2563EA]" strokeWidth={2} />
          <div className="min-w-0 flex-1 text-left">
            <span className="block text-[11px] font-medium text-[color:var(--gray-200)]">{label}</span>
            <SelectValue className="block text-[14px] font-semibold leading-tight text-[color:var(--gray-300)]" />
          </div>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[min(280px,var(--radix-select-content-available-height))]">
        {children}
      </SelectContent>
    </Select>
  );
}

export function ScheduleAiAccordion({ queuedLeadCount = 0 }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("06:00 PM");
  const [retryCount, setRetryCount] = useState("3");

  const endTimeChoices = useMemo(() => {
    const startIdx = TIME_OPTIONS.indexOf(startTime);
    if (startIdx === -1) return TIME_OPTIONS;
    return TIME_OPTIONS.filter((_, i) => i > startIdx);
  }, [startTime]);

  useEffect(() => {
    if (!endTimeChoices.includes(endTime)) {
      setEndTime(endTimeChoices[0] ?? startTime);
    }
  }, [endTimeChoices, endTime, startTime]);

  const summaryText = tpl(t.scheduleLeadsQueuedInWindow, { count: queuedLeadCount });

  const handleQueueFollowUps = () => {
    toast.success(t.scheduleAiToastScheduled, { duration: 2800 });
    setOpen(false);
  };

  const retryOptions = useMemo(
    () =>
      RETRY_COUNTS.map((n) => ({
        value: String(n),
        label: tpl(t.scheduleRetriesAttempts, { count: n }),
      })),
    [t],
  );

  return (
    <div data-testid="schedule-ai-accordion" className="mb-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="schedule-ai-toggle"
          className="flex w-full items-start gap-3 rounded-[12px] border border-[#F1F2F5] bg-[#EBF1FF] px-4 py-3.5 text-[13px] font-semibold text-[#2563EA] transition-colors hover:bg-[color:var(--blue-200)]"
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EA]" strokeWidth={2.25} />
          <span className="min-w-0 flex-1 break-words text-center leading-snug">
            {t.scheduleAi}
          </span>
          <ChevronDown
            className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EA] transition-transform"
            strokeWidth={2.25}
          />
        </button>
      ) : (
        <div
          data-testid="schedule-ai-content"
          className="rounded-[12px] border border-[#e4e4e4] bg-[#EBF1FF] p-4"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            data-testid="schedule-ai-collapse"
            className="flex w-full items-start gap-3 text-left"
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EA]" strokeWidth={2.25} />
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-[#2563EA]">{t.scheduleAi}</span>
              <p className="mt-1.5 text-[12px] leading-snug text-[color:var(--gray-200)]">
                {t.scheduleAiDescription}
              </p>
            </div>
            <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EA]" strokeWidth={2.25} />
          </button>

          <div className="mt-4 flex flex-col gap-2.5">
            <ScheduleSelectField
              icon={Clock}
              label={t.scheduleStartTime}
              value={startTime}
              onValueChange={setStartTime}
              testid="schedule-ai-start-time"
            >
              {START_TIME_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-[13px]">
                  {opt}
                </SelectItem>
              ))}
            </ScheduleSelectField>

            <ScheduleSelectField
              icon={Clock}
              label={t.scheduleEndTime}
              value={endTime}
              onValueChange={setEndTime}
              testid="schedule-ai-end-time"
            >
              {endTimeChoices.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-[13px]">
                  {opt}
                </SelectItem>
              ))}
            </ScheduleSelectField>

            <ScheduleSelectField
              icon={RefreshCw}
              label={t.scheduleRetries}
              value={retryCount}
              onValueChange={setRetryCount}
              testid="schedule-ai-retries"
            >
              {retryOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value} className="text-[13px]">
                  {label}
                </SelectItem>
              ))}
            </ScheduleSelectField>
          </div>

          <div
            className="mt-4 flex items-center gap-2 text-[12px] text-[color:var(--gray-200)]"
            data-testid="schedule-ai-summary"
          >
            <Users className="h-4 w-4 shrink-0 text-[color:var(--gray-200)]" strokeWidth={2} />
            <span>{summaryText}</span>
          </div>

          <button
            type="button"
            data-testid="schedule-ai-queue-btn"
            onClick={handleQueueFollowUps}
            className="font-body mt-4 w-full rounded-full bg-[#2563EA] py-1.5 text-[14px] font-semibold text-white transition-colors hover:bg-[color:var(--blue-700)]"
          >
            {t.scheduleQueueFollowUps}
          </button>
        </div>
      )}
    </div>
  );
}
