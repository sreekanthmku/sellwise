import { toast } from "sonner";
import { useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { RecentCallCard } from "@/components/RecentCallCard";
import {
  performanceRecentCalls,
  performanceToday,
} from "@/data/performance";
import { useVobiz } from "@/vobiz/VobizProvider";

function MetricBlock({ value, label, testId }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
      <p
        data-testid={testId}
        className="font-body text-[28px] font-bold leading-none tracking-tight text-[color:var(--suzuki-blue)]"
      >
        {value}
      </p>
      <p className="mt-2 text-[12px] font-medium leading-none text-[color:var(--gray-200)]">
        {label}
      </p>
    </div>
  );
}

export default function Performance() {
  const { t } = useLanguage();
  const { callHistory } = useVobiz();

  const onViewFeedback = () => {
    toast.message(t.callDetails.feedbackToast);
  };

  const liveRecentCalls = useMemo(() => {
    if (!Array.isArray(callHistory) || callHistory.length === 0) return [];
    return callHistory.map((row, index) => {
      const endedDate = row.endedAtIso ? new Date(row.endedAtIso) : null;
      const hasValidDate = endedDate && !Number.isNaN(endedDate.getTime());
      const timeLabel = hasValidDate
        ? endedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : t.performance.today;
      return {
        id: row.id || `live-call-${index}`,
        name: row.name || "Unknown",
        callType: "human",
        outcome:
          row.endReason === "failed" || row.endReason === "busy"
            ? "notInterested"
            : "followUp",
        avatarVariant: "purple",
        timeLabel,
        callUuid: row.callUuid || null,
      };
    });
  }, [callHistory, t.performance.today]);

  const rowsToRender = liveRecentCalls.length > 0 ? liveRecentCalls : performanceRecentCalls;

  return (
    <AppScreen
      screenTestId="performance-screen"
      mainTestId="performance-main"
      mainBgClass="bg-[#F7F8FB]"
      showBottomNav
    >
      <div className="pt-[16px] pb-0">
        <h1
          data-testid="performance-page-title"
          className="font-suzuki text-[18px] font-bold leading-none text-[color:var(--gray-300)]"
        >
          {t.performance.title}
        </h1>
      </div>

      <div
        className="flex-1 overflow-y-auto overscroll-none pt-4 pb-10"
        data-testid="performance-content"
      >
        <section
          className="rounded-2xl border border-[#e8eaef] bg-white px-4 py-4 shadow-[var(--card-shadow)]"
          aria-labelledby="today-performance-heading"
        >
          <div className="flex items-start justify-between gap-3">
            <h2
              id="today-performance-heading"
              className="font-body text-[16px] font-bold leading-snug text-[color:var(--gray-300)]"
            >
              {t.performance.todayPerformance}
            </h2>
            <span
              className="shrink-0 text-[14px] font-bold text-[color:var(--success)]"
              data-testid="performance-delta"
            >
              {performanceToday.scoreDeltaLabel}
            </span>
          </div>

          <div className="mt-5 flex gap-1">
            <MetricBlock
              value={performanceToday.score}
              label={t.performance.score}
              testId="performance-metric-score"
            />
            <MetricBlock
              value={performanceToday.callsCount}
              label={t.performance.calls}
              testId="performance-metric-calls"
            />
            <MetricBlock
              value={performanceToday.interestedCount}
              label={t.performance.interested}
              testId="performance-metric-interested"
            />
          </div>

          <div className="mt-4 rounded-xl bg-[#f1f3f5] px-3.5 py-3">
            <p className="font-body text-[14px] font-bold leading-snug text-[color:var(--gray-300)]">
              {t.performance.coachingMomentum}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--gray-200)]">
              {t.performance.coachingMomentumBody}
            </p>
          </div>
        </section>

        <section className="mt-5" aria-labelledby="recent-calls-heading">
          <div className="flex items-baseline justify-between gap-2">
            <h2
              id="recent-calls-heading"
              className="font-body text-[17px] font-bold leading-tight text-[color:var(--gray-300)]"
            >
              {t.performance.recentCalls}
            </h2>
            <span className="text-[13px] font-medium leading-none text-[color:var(--gray-200)]">
              {t.performance.today}
            </span>
          </div>

          <div className="mt-3.5 flex flex-col gap-3" data-testid="recent-calls-list">
            {rowsToRender.map((row) => (
              <RecentCallCard
                key={row.id}
                testId={`recent-call-${row.id}`}
                name={row.name}
                callType={row.callType}
                outcome={row.outcome}
                avatarVariant={row.avatarVariant}
                timeLabel={row.timeLabel || t.performance.sampleTimes[row.timeKey]}
                callUuid={row.callUuid}
                onViewFeedback={onViewFeedback}
              />
            ))}
          </div>
        </section>
      </div>
    </AppScreen>
  );
}
