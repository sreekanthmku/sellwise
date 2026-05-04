import { useMemo } from "react";
import { ArrowLeft, ChevronRight, Clock } from "lucide-react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { useLeadsData } from "@/context/LeadsDataContext";

const DetailCard = ({ children, className = "" }) => (
  <section
    className={`rounded-2xl border border-[#e4e4e4] bg-white px-4 py-4 ${className}`}
  >
    {children}
  </section>
);

function formatDurationShort(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

function formatEndedAtLabel(d, t) {
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (isToday) return `${t.callDetails.today}, ${timeStr}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}, ${timeStr}`;
}

export default function CallFeedback() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { getLeadById } = useLeadsData();

  const lead = getLeadById(leadId);

  const durationSeconds =
    typeof location.state?.durationSeconds === "number"
      ? location.state.durationSeconds
      : 272;

  const endedAt = useMemo(() => {
    if (location.state?.endedAt) {
      const d = new Date(location.state.endedAt);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [location.state?.endedAt]);

  const f = t.callFeedbackPage;

  if (!lead) return <Navigate to="/leads" replace />;

  const backState = {
    durationSeconds,
    endedAt: endedAt.toISOString(),
  };

  return (
    <AppScreen
      screenTestId="call-feedback-screen"
      mainTestId="call-feedback-main"
      mainBgClass="bg-[#F7F8FB]"
      showBottomNav
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 pt-1">
          <button
            type="button"
            data-testid="call-feedback-back"
            onClick={() =>
              navigate(`/leads/${leadId}/call-details`, { state: backState })
            }
            className="flex items-center gap-1.5 py-2 font-body text-[15px] font-semibold text-[color:var(--blue-600)] transition-opacity hover:opacity-80"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
            {t.leadDetail.back}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-none pb-10">
      {/* Call info */}
      <DetailCard className="mt-1">
        <h2 className="font-body text-[13px] font-bold text-[#111827]">{f.pageHeading}</h2>
        <div className="mt-3 flex items-start justify-between gap-2">
          <p className="font-body text-[20px] font-bold leading-tight text-[#111827]">{lead.name}</p>
          <span className="shrink-0 text-[14px] font-semibold text-[#15803D]">
            {t.callDetails.wrapupStatus}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#6B7280]">
          <span>{formatEndedAtLabel(endedAt, t)}</span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <Clock className="h-4 w-4 shrink-0 text-[color:var(--blue-600)]" strokeWidth={2} />
            {formatDurationShort(durationSeconds)}
          </span>
        </div>
      </DetailCard>

      {/* Overall score */}
      <section className="mt-4 rounded-2xl border border-[#dbe4f7] bg-[#eef3fc] px-4 py-4">
        <h3 className="font-body text-[15px] font-bold text-[#111827]">{f.overallScore}</h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="font-body text-[28px] font-bold leading-none text-[#111827]">
            {f.scoreValue}
          </span>
          <span className="font-body text-[13px] text-[#6B7280]">{f.scoreTrend}</span>
        </div>
      </section>

      {/* Detailed feedback */}
      <DetailCard className="mt-4">
        <div className="divide-y divide-[#ececec]">
          <div className="pb-4">
            <h3 className="font-body text-[16px] font-bold text-[#111827]">{f.summaryTitle}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">{f.summaryBody}</p>
          </div>
          <div className="py-4">
            <h3 className="font-body text-[14px] font-bold text-[#111827]">{f.didWellTitle}</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] leading-snug text-[#374151]">
              {f.didWellItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="py-4">
            <h3 className="font-body text-[14px] font-bold text-[#111827]">{f.improveTitle}</h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13px] leading-snug text-[#374151]">
              {f.improveItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
          <div className="py-4">
            <h3 className="font-body text-[14px] font-bold text-[#111827]">{f.sayInsteadTitle}</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-[13px] leading-snug text-[#374151]">
              {f.sayInsteadItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="pt-4">
            <h3 className="font-body text-[14px] font-bold text-[#111827]">{f.skillsTitle}</h3>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[11px] font-medium leading-tight text-[#6B7280]">
                  {f.skillProduct}
                </p>
                <p className="mt-1 font-body text-[15px] font-bold text-[#111827]">
                  {f.skillScores.product}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium leading-tight text-[#6B7280]">
                  {f.skillNegotiation}
                </p>
                <p className="mt-1 font-body text-[15px] font-bold text-[#111827]">
                  {f.skillScores.negotiation}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium leading-tight text-[#6B7280]">
                  {f.skillClosing}
                </p>
                <p className="mt-1 font-body text-[15px] font-bold text-[#111827]">
                  {f.skillScores.closing}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DetailCard>

      {/* Coaching */}
      <DetailCard className="mt-4 mb-1">
        <h3 className="font-body text-[14px] font-bold text-[#111827]">{f.coachingTitle}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">{f.coachingBody}</p>
        <h4 className="mt-4 font-body text-[13px] font-bold text-[#111827]">{f.practiceTitle}</h4>
        <div className="mt-2 flex flex-col gap-1">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 py-2 text-left font-body text-[14px] font-semibold text-[color:var(--blue-600)] transition-opacity hover:opacity-80"
          >
            <span>{f.practiceSim}</span>
            <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 py-2 text-left font-body text-[14px] font-semibold text-[color:var(--blue-600)] transition-opacity hover:opacity-80"
          >
            <span>{f.practiceModule}</span>
            <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          </button>
        </div>
      </DetailCard>
        </div>
      </div>
    </AppScreen>
  );
}
