import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { RecentCallCard } from "@/components/RecentCallCard";
import {
  performanceRecentCalls,
  performanceToday,
} from "@/data/performance";
import { useVobiz } from "@/vobiz/VobizProvider";
import { defaultApiBase } from "@/vobiz/constants";

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
  const navigate = useNavigate();
  const { callHistory } = useVobiz();

  const openCallFeedback = (row) => {
    const uuid = row.callUuid;
    if (!uuid || typeof uuid !== "string") {
      toast.message(t.callDetails.feedbackToast);
      return;
    }
    const state = {
      callUuid: uuid,
      displayName: typeof row.name === "string" ? row.name : "Unknown",
      skipFeedback: row.skipFeedback === true,
      durationSeconds:
        typeof row.durationSeconds === "number" && Number.isFinite(row.durationSeconds)
          ? Math.max(0, Math.floor(row.durationSeconds))
          : undefined,
      endedAt:
        typeof row.endedAtIso === "string" && row.endedAtIso.length > 0
          ? row.endedAtIso
          : undefined,
    };
    if (row.leadId && String(row.leadId).length > 0) {
      navigate(`/leads/${encodeURIComponent(String(row.leadId))}/call-feedback`, { state });
      return;
    }
    navigate("/call-feedback", { state });
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
        leadId: row.leadId != null && String(row.leadId).length > 0 ? String(row.leadId) : null,
        durationSeconds:
          typeof row.durationSeconds === "number" && Number.isFinite(row.durationSeconds)
            ? Math.max(0, Math.floor(row.durationSeconds))
            : 0,
        endedAtIso:
          typeof row.endedAtIso === "string" && row.endedAtIso.length > 0
            ? row.endedAtIso
            : new Date().toISOString(),
        skipFeedback: false,
      };
    });
  }, [callHistory, t.performance.today]);

  const [aiRecentCalls, setAiRecentCalls] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = defaultApiBase();
        const res = await fetch(`${base}/api/recent-calls`);
        const data = await res.json().catch(() => null);
        if (cancelled || !data?.ok || !Array.isArray(data.calls)) {
          if (!cancelled) setAiRecentCalls([]);
          return;
        }
        if (!cancelled) setAiRecentCalls(data.calls);
      } catch {
        if (!cancelled) setAiRecentCalls([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mergedRecentCalls = useMemo(() => {
    const mapAiRow = (row) => {
      const endedDate = row.endedAtIso ? new Date(row.endedAtIso) : null;
      const hasValidDate = endedDate && !Number.isNaN(endedDate.getTime());
      const timeLabel = hasValidDate
        ? endedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : t.performance.today;
      return {
        id: row.id,
        name: typeof row.name === "string" && row.name.trim() ? row.name : "AI call",
        callType: "ai",
        outcome: ["interested", "followUp", "notInterested"].includes(row.outcome)
          ? row.outcome
          : "followUp",
        avatarVariant: "green",
        timeLabel,
        callUuid: row.callUuid || null,
        leadId: row.leadId != null && String(row.leadId).length > 0 ? String(row.leadId) : null,
        durationSeconds:
          typeof row.durationSeconds === "number" && Number.isFinite(row.durationSeconds)
            ? Math.max(0, Math.floor(row.durationSeconds))
            : 0,
        endedAtIso:
          typeof row.endedAtIso === "string" && row.endedAtIso.length > 0
            ? row.endedAtIso
            : new Date().toISOString(),
        skipFeedback: row.skipFeedback === true,
      };
    };

    const aiRows = aiRecentCalls.map(mapAiRow);
    const combined = [...liveRecentCalls, ...aiRows];
    combined.sort((a, b) => {
      const da = new Date(a.endedAtIso || 0).getTime();
      const db = new Date(b.endedAtIso || 0).getTime();
      return db - da;
    });
    return combined;
  }, [liveRecentCalls, aiRecentCalls, t.performance.today]);

  const baseRecentRows = useMemo(
    () => (mergedRecentCalls.length > 0 ? mergedRecentCalls : performanceRecentCalls),
    [mergedRecentCalls]
  );

  const [recentCallsFilter, setRecentCallsFilter] = useState("all");

  const displayedRecentRows = useMemo(() => {
    if (recentCallsFilter === "all") return baseRecentRows;
    return baseRecentRows.filter((row) => row.callType === recentCallsFilter);
  }, [baseRecentRows, recentCallsFilter]);

  const recentCallsFilterOptions = useMemo(
    () => [
      { value: "all", label: t.performance.recentCallsFilterAll, testId: "recent-calls-filter-all" },
      { value: "human", label: t.performance.recentCallsFilterHuman, testId: "recent-calls-filter-human" },
      { value: "ai", label: t.performance.recentCallsFilterAi, testId: "recent-calls-filter-ai" },
    ],
    [t.performance.recentCallsFilterAi, t.performance.recentCallsFilterAll, t.performance.recentCallsFilterHuman]
  );

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="recent-calls-heading"
                className="font-body text-[17px] font-bold leading-tight text-[color:var(--gray-300)]"
              >
                {t.performance.recentCalls}
              </h2>
              <p className="mt-0.5 text-[13px] font-medium leading-none text-[color:var(--gray-200)]">
                {t.performance.today}
              </p>
            </div>
            <div
              className="inline-flex shrink-0 rounded-full border border-[#e8eaef] bg-white p-0.5 shadow-sm"
              role="tablist"
              aria-label={t.performance.recentCallsFilterAria}
            >
              {recentCallsFilterOptions.map((opt) => {
                const selected = recentCallsFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    data-testid={opt.testId}
                    onClick={() => setRecentCallsFilter(opt.value)}
                    className={[
                      "rounded-full px-3 py-1.5 text-[13px] font-semibold leading-none transition-colors",
                      selected
                        ? "bg-[color:var(--blue-600)] text-white"
                        : "text-[color:var(--gray-300)] hover:text-[color:var(--gray-200)]",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3.5 flex flex-col gap-3" data-testid="recent-calls-list">
            {displayedRecentRows.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#e8eaef] bg-white/80 px-4 py-6 text-center text-[14px] leading-snug text-[color:var(--gray-200)]">
                {baseRecentRows.length === 0
                  ? t.performance.recentCallsEmpty
                  : t.performance.recentCallsFilterEmpty}
              </p>
            ) : (
              displayedRecentRows.map((row) => (
                <RecentCallCard
                  key={row.id}
                  testId={`recent-call-${row.id}`}
                  name={row.name}
                  callType={row.callType}
                  outcome={row.outcome}
                  avatarVariant={row.avatarVariant}
                  timeLabel={row.timeLabel || t.performance.sampleTimes[row.timeKey]}
                  callUuid={row.callUuid}
                  onViewFeedback={() => openCallFeedback(row)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </AppScreen>
  );
}
