import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, ChevronRight, Volume2 } from "lucide-react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { useLeadsData } from "@/context/LeadsDataContext";
import { defaultApiBase } from "@/vobiz/constants";

const DetailCard = ({ children, className = "" }) => (
  <section
    className={`rounded-2xl border border-[#e4e4e4] bg-white px-4 py-4 ${className}`}
  >
    {children}
  </section>
);

const CALL_OUTCOME_LABELS = {
  interested: "Interested",
  callback_requested: "Callback Requested",
  dealership_visit_planned: "Dealership Visit Planned",
  not_interested: "Not Interested",
  wrong_number: "Wrong Number",
  busy: "Busy",
  test_drive_requested: "Test Drive Requested",
};

function toHumanReadableOutcome(value) {
  if (typeof value !== "string") return "";
  if (CALL_OUTCOME_LABELS[value]) return CALL_OUTCOME_LABELS[value];
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

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

/** @param {unknown} n */
function formatSkillOutOf10(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const rounded = Math.round(n * 10) / 10;
  const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${s}/10`;
}

/** @param {unknown} n */
function formatOverallOutOf10(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const rounded = Math.round(n * 10) / 10;
  const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${s}/10`;
}

export default function CallFeedback() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { getLeadById } = useLeadsData();

  const lead = getLeadById(leadId);

  const passedAnalysisFromNav =
    location.state?.analysisResult != null && typeof location.state.analysisResult === "object"
      ? location.state.analysisResult
      : null;

  const [analysisLoading, setAnalysisLoading] = useState(
    !passedAnalysisFromNav && Boolean(location.state?.callUuid),
  );
  const [analysisError, setAnalysisError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(passedAnalysisFromNav);

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

  const sf = analysisResult?.suzuki_feedback;
  const hasSuzukiFeedback = sf != null && typeof sf === "object";

  useEffect(() => {
    const passed = location.state?.analysisResult;
    const callUuid = location.state?.callUuid;
    if (!callUuid || typeof callUuid !== "string") {
      setAnalysisLoading(false);
      setAnalysisError("");
      setAnalysisResult(null);
      return;
    }

    let cancelled = false;
    setAnalysisLoading(true);
    setAnalysisError("");

    const run = async () => {
      try {
        // If we already have some analysis (typically details from navigation),
        // keep it while we fetch the latest details + feedback payloads.
        if (passed && typeof passed === "object") {
          setAnalysisResult(passed);
        }

        // 1) Get details first (for summary + non-feedback fields)
        const detailsUrl = `${defaultApiBase()}/api/call-analysis/${encodeURIComponent(callUuid)}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json().catch(() => null);
        if (cancelled) return;
        if (!detailsRes.ok || !detailsData?.ok || !detailsData?.analysis) {
          const msg =
            detailsData?.error ||
            detailsData?.hint ||
            `Failed to create summary (HTTP ${detailsRes.status})`;
          setAnalysisError(msg);
          toast.error(msg);
          return;
        }
        const detailsResult = detailsData.analysis.result || null;

        // 2) Then fetch feedback-only payload and merge
        const feedbackUrl = `${defaultApiBase()}/api/call-analysis/${encodeURIComponent(callUuid)}/feedback`;
        const feedbackRes = await fetch(feedbackUrl);
        const feedbackData = await feedbackRes.json().catch(() => null);
        if (cancelled) return;
        if (!feedbackRes.ok || !feedbackData?.ok || !feedbackData?.analysis) {
          const msg =
            feedbackData?.error ||
            feedbackData?.hint ||
            `Failed to load feedback (HTTP ${feedbackRes.status})`;
          setAnalysisError(msg);
          toast.error(msg);
          setAnalysisResult(detailsResult);
          return;
        }
        const feedbackResult = feedbackData.analysis.result || null;
        setAnalysisResult({
          ...(detailsResult && typeof detailsResult === "object" ? detailsResult : {}),
          ...(feedbackResult && typeof feedbackResult === "object" ? feedbackResult : {}),
        });
      } catch (err) {
        if (cancelled) return;
        const msg = err?.message || "Failed to fetch call feedback summary";
        setAnalysisError(msg);
        toast.error(msg);
      } finally {
        if (!cancelled) setAnalysisLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [location.state?.callUuid, location.state?.analysisResult]);

  if (!lead) return <Navigate to="/leads" replace />;

  const backState = {
    durationSeconds,
    endedAt: endedAt.toISOString(),
    callUuid: location.state?.callUuid ?? null,
    analysisResult: analysisResult ?? undefined,
  };

  const na = f.notAvailable ?? "NA";

  const overallFormatted = hasSuzukiFeedback ? formatOverallOutOf10(sf.overall_score) : null;
  const overallDisplay = overallFormatted != null ? overallFormatted : na;

  const dispositionRaw =
    typeof analysisResult?.call_outcome === "string" ? analysisResult.call_outcome.trim() : "";
  const dispositionSlug = dispositionRaw.length > 0 ? dispositionRaw.toLowerCase().replace(/\s+/g, "_") : "";
  const dispositionLabel =
    dispositionSlug.length > 0 ? toHumanReadableOutcome(dispositionSlug).trim() : "";
  const dispositionDisplay = dispositionLabel.length > 0 ? dispositionLabel : na;

  const didWellItems =
    hasSuzukiFeedback && Array.isArray(sf.what_you_did_well) && sf.what_you_did_well.length > 0
      ? sf.what_you_did_well
      : [na];

  const improveItems =
    hasSuzukiFeedback && Array.isArray(sf.improve_next) && sf.improve_next.length > 0
      ? sf.improve_next
      : [na];

  const sayInsteadItems =
    hasSuzukiFeedback && Array.isArray(sf.what_to_say_instead) && sf.what_to_say_instead.length > 0
      ? sf.what_to_say_instead.map((row, i) => {
          if (row && typeof row === "object" && ("situation" in row || "better_phrase" in row)) {
            const situation = typeof row.situation === "string" ? row.situation.trim() : "";
            const better = typeof row.better_phrase === "string" ? row.better_phrase.trim() : "";
            if (situation && better) return { key: `wts-${i}`, text: `${situation} — ${better}` };
            if (better) return { key: `wts-${i}`, text: better };
            if (situation) return { key: `wts-${i}`, text: situation };
          }
          return { key: `wts-${i}`, text: String(row) };
        })
      : [{ key: "say-instead-na", text: na }];

  const productScore =
    hasSuzukiFeedback && sf.skill_breakdown
      ? formatSkillOutOf10(sf.skill_breakdown.product_knowledge)
      : null;
  const negotiationScore =
    hasSuzukiFeedback && sf.skill_breakdown
      ? formatSkillOutOf10(sf.skill_breakdown.negotiation)
      : null;
  const closingScore =
    hasSuzukiFeedback && sf.skill_breakdown
      ? formatSkillOutOf10(sf.skill_breakdown.closing)
      : null;

  const coachingBody =
    hasSuzukiFeedback && typeof sf.coaching_insight === "string" && sf.coaching_insight.trim()
      ? sf.coaching_insight.trim()
      : na;

  const summaryParagraph =
    typeof analysisResult?.summary === "string" && analysisResult.summary.trim()
      ? analysisResult.summary.trim()
      : analysisError || na;

  if (analysisLoading) {
    return (
      <AppScreen
        screenTestId="call-feedback-screen"
        mainTestId="call-feedback-main"
        mainBgClass="bg-[#F7F8FB]"
        showBottomNav
      >
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-16 px-4">
          <p className="text-center font-body text-[15px] font-semibold text-[#374151]">
            Loading feedback…
          </p>
        </div>
      </AppScreen>
    );
  }

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
      {/* Call feedback — summary tile */}
      <DetailCard className="mt-1 px-4 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <h2 className="font-body text-[13px] font-bold text-[#111827]">{f.pageHeading}</h2>
        <p className="mt-3 font-body text-[22px] font-bold leading-tight tracking-tight text-[#111827]">
          {lead.name}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-[#6b7280]">
          <span className="font-medium text-[#4b5563]">{f.humanCall}</span>
          <span className="hidden text-[#d1d5db] sm:inline" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#9ca3af]" strokeWidth={2} />
            <span>{formatEndedAtLabel(endedAt, t)}</span>
          </span>
        </div>
        <div className="my-4 h-px bg-[#e5e7eb]" />
        <div className="grid grid-cols-3 gap-2">
          <div className="min-w-0 text-center">
            <p className="font-body text-[13px] font-normal leading-tight text-[#111827]">{f.disposition}</p>
            <p className="mt-2 truncate font-body text-[15px] font-bold leading-tight text-[#1d4ed8]">
              {dispositionDisplay}
            </p>
          </div>
          <div className="min-w-0 text-center">
            <p className="font-body text-[13px] font-normal leading-tight text-[#111827]">{f.duration}</p>
            <p className="mt-2 font-body text-[15px] font-bold tabular-nums leading-tight text-[#1d4ed8]">
              {formatDurationShort(durationSeconds)}
            </p>
          </div>
          <div className="min-w-0 text-center">
            <p className="font-body text-[13px] font-normal leading-tight text-[#111827]">{f.overallScore}</p>
            <p className="mt-2 font-body text-[15px] font-bold tabular-nums leading-tight text-[#1d4ed8]">
              {overallDisplay}
            </p>
          </div>
        </div>
        <button
          type="button"
          data-testid="call-feedback-recording"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#2563eb] py-3.5 font-body text-[15px] font-semibold text-white shadow-sm transition-opacity hover:opacity-95 active:opacity-90"
          onClick={() => toast.info(f.recordingUnavailable)}
        >
          <span>{f.callRecording}</span>
          <Volume2 className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
        </button>
      </DetailCard>

      {/* Detailed feedback */}
      <DetailCard className="mt-4">
        <div className="divide-y divide-[#ececec]">
          <div className="pb-4">
            <h3 className="font-body text-[16px] font-bold text-[#111827]">{f.summaryTitle}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">
              {summaryParagraph}
            </p>
          </div>
          <div className="py-4">
            <h3 className="font-body text-[14px] font-bold text-[#111827]">{f.didWellTitle}</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] leading-snug text-[#374151]">
              {didWellItems.map((item, i) => (
                <li key={`did-well-${i}-${item.slice(0, 48)}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="py-4">
            <h3 className="font-body text-[14px] font-bold text-[#111827]">{f.improveTitle}</h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13px] leading-snug text-[#374151]">
              {improveItems.map((item, i) => (
                <li key={`improve-${i}-${item.slice(0, 48)}`}>{item}</li>
              ))}
            </ol>
          </div>
          <div className="py-4">
            <h3 className="font-body text-[14px] font-bold text-[#111827]">{f.sayInsteadTitle}</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-[13px] leading-snug text-[#374151]">
              {sayInsteadItems.map((item) => (
                <li key={item.key}>{item.text}</li>
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
                  {productScore ?? na}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium leading-tight text-[#6B7280]">
                  {f.skillNegotiation}
                </p>
                <p className="mt-1 font-body text-[15px] font-bold text-[#111827]">
                  {negotiationScore ?? na}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium leading-tight text-[#6B7280]">
                  {f.skillClosing}
                </p>
                <p className="mt-1 font-body text-[15px] font-bold text-[#111827]">
                  {closingScore ?? na}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DetailCard>

      {/* Coaching */}
      <DetailCard className="mt-4 mb-1">
        <h3 className="font-body text-[14px] font-bold text-[#111827]">{f.coachingTitle}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">{coachingBody}</p>
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
