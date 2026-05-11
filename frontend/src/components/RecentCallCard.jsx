import { User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const AVATAR_PASTEL = {
  purple: "bg-[color:var(--purple-200)] text-[color:var(--purple-600)]",
  green: "bg-[color:var(--green-200)] text-[color:var(--green-600)]",
  red: "bg-[color:var(--red-200)] text-[color:var(--red-600)]",
};

const OUTCOME_TEXT = {
  interested: "text-[color:var(--success)]",
  followUp: "text-[color:var(--warning)]",
  notInterested: "text-[color:var(--error)]",
};

/**
 * Recent call row: avatar | name + (call type + status inline) | time + View Feedback.
 */
export function RecentCallCard({
  name,
  callUuid,
  callType,
  outcome,
  timeLabel,
  avatarVariant = "purple",
  onViewFeedback,
  testId,
}) {
  const { t } = useLanguage();
  const typeLabel =
    callType === "ai" ? t.performance.aiCall : t.performance.humanCall;
  const outcomeLabel = t.performance.outcomes[outcome];

  return (
    <article
      data-testid={testId}
      className="rounded-2xl border border-[#e4e4e4] bg-white px-4 py-3.5"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 shrink-0 self-center">
          <AvatarFallback
            className={cn("rounded-full", AVATAR_PASTEL[avatarVariant])}
          >
            <User className="h-5 w-5" strokeWidth={2} />
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-[16px] font-bold leading-tight text-[color:var(--gray-300)]">
              {name}
            </p>
            {callUuid ? (
              <p className="mt-0.5 truncate text-[12px] font-medium leading-snug text-[color:var(--gray-200)]">
                UUID: {callUuid}
              </p>
            ) : null}
            <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[13px] font-normal leading-snug text-[color:var(--gray-200)]">
                {typeLabel}
              </span>
              <span
                className={cn(
                  "text-[13px] font-semibold leading-snug",
                  OUTCOME_TEXT[outcome],
                )}
              >
                {outcomeLabel}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end justify-center gap-2 text-right">
            <span className="text-[12px] font-medium leading-none text-[color:var(--gray-200)]">
              {timeLabel}
            </span>
            <button
              type="button"
              onClick={onViewFeedback}
              className="text-[13px] font-semibold leading-none text-[color:var(--blue-600)]"
            >
              {t.performance.viewFeedback}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default RecentCallCard;
