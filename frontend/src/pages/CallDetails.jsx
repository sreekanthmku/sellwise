import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CallRecordingDrawer } from "@/components/CallRecordingDrawer";
import { useLeadsData } from "@/context/LeadsDataContext";
import { defaultApiBase } from "@/vobiz/constants";

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

const CALL_OUTCOME_LABELS = {
  interested: "Interested",
  callback_requested: "Callback Requested",
  dealership_visit_planned: "Dealership Visit Planned",
  not_interested: "Not Interested",
  wrong_number: "Wrong Number",
  busy: "Busy",
  test_drive_requested: "Test Drive Requested",
};

function normalizeCallOutcomeValue(value) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  return CALL_OUTCOME_LABELS[normalized] ? normalized : "";
}

function toHumanReadableOutcome(value) {
  if (typeof value !== "string") return "";
  if (CALL_OUTCOME_LABELS[value]) return CALL_OUTCOME_LABELS[value];
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toHumanReadableOrNa(value) {
  if (typeof value !== "string" || value.trim() === "") return "NA";
  return value
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const AiList = ({ icon: Icon, iconClass, items }) => (
  <ul className="mt-2 flex flex-col gap-2">
    {items.map((text) => (
      <li key={text} className="flex gap-2.5 text-[13px] leading-snug text-[#374151]">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} strokeWidth={2.25} />
        <span>{text}</span>
      </li>
    ))}
  </ul>
);

/** @param {Record<string, unknown> | null | undefined} analysisResult */
function recommendedActionLines(analysisResult) {
  const list = analysisResult?.next_actions;
  if (Array.isArray(list) && list.length > 0) {
    return list.map((item) => {
      const typeSlug = typeof item?.type === "string" ? item.type : "";
      const typeLabel = toHumanReadableOrNa(typeSlug);
      const detail = typeof item?.detail === "string" ? item.detail.trim() : "";
      if (detail && typeLabel === "NA") return detail;
      if (detail) return `${typeLabel}: ${detail}`;
      return typeLabel;
    });
  }
  const legacy =
    typeof analysisResult?.next_action === "string" ? analysisResult.next_action : "";
  return [toHumanReadableOrNa(legacy)];
}

export default function CallDetails() {
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

  const seedAnalysisFromNav =
    location.state?.analysisResult != null && typeof location.state.analysisResult === "object"
      ? location.state.analysisResult
      : null;
  const isEditable = location.state?.editable !== false;

  const [callOutcome, setCallOutcome] = useState("interested");
  const [leadStatus, setLeadStatus] = useState("new");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [notes, setNotes] = useState("");
  const [analysisResult, setAnalysisResult] = useState(seedAnalysisFromNav);
  const [analysisLoading, setAnalysisLoading] = useState(
    !seedAnalysisFromNav && Boolean(location.state?.callUuid),
  );
  const [recordingOpen, setRecordingOpen] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setNotes(
      t.callDetails.defaultNotes
        .replace(/\{\{name\}\}/g, lead.name)
        .replace(/\{\{model\}\}/g, lead.interestedIn),
    );
    setNextFollowUp(t.callDetails.nextFollowUpValue);
  }, [leadId, lead, t]);

  useEffect(() => {
    const passed = location.state?.analysisResult;
    if (passed && typeof passed === "object") {
      setAnalysisResult(passed);
      setAnalysisLoading(false);
      const normalizedOutcome = normalizeCallOutcomeValue(passed.call_outcome);
      if (normalizedOutcome) {
        setCallOutcome(normalizedOutcome);
      }
      if (typeof passed.summary === "string" && passed.summary.trim()) {
        setNotes(passed.summary.trim());
      }
      return;
    }

    const callUuid = location.state?.callUuid;
    if (!callUuid || typeof callUuid !== "string") {
      setAnalysisResult(null);
      setAnalysisLoading(false);
      return;
    }

    let cancelled = false;
    setAnalysisLoading(true);

    const run = async () => {
      try {
        const url = `${defaultApiBase()}/api/call-analysis/${encodeURIComponent(callUuid)}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !data?.ok || !data?.analysis?.result) {
          const msg = data?.error || data?.hint || `Failed to fetch call summary (HTTP ${res.status})`;
          toast.error(msg);
          return;
        }
        const result = data.analysis.result;
        setAnalysisResult(result);
        const normalizedOutcome = normalizeCallOutcomeValue(result.call_outcome);
        if (normalizedOutcome) {
          setCallOutcome(normalizedOutcome);
        }
        if (typeof result.summary === "string" && result.summary.trim()) {
          setNotes(result.summary.trim());
        }

        // Fire-and-forget: queue feedback generation once the user reaches details page.
        try {
          const feedbackUrl = `${defaultApiBase()}/api/call-analysis/${encodeURIComponent(callUuid)}/feedback`;
          void fetch(feedbackUrl, { method: "POST" });
        } catch {
          // non-blocking
        }
      } catch (err) {
        if (cancelled) return;
        toast.error(err?.message || "Failed to fetch call summary");
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
  if (analysisLoading) {
    return (
      <AppScreen
        screenTestId="call-details-loading-screen"
        mainTestId="call-details-loading-main"
        mainBgClass="bg-[#F7F8FB]"
        showBottomNav
      >
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-[color:var(--suzuki-blue)]" aria-hidden />
          <p className="text-center font-body text-[16px] font-semibold text-[#374151]">Creating summary...</p>
        </div>
      </AppScreen>
    );
  }

  const outcomes = [
    `Interest Level: ${toHumanReadableOrNa(analysisResult?.interest_level)}`,
    `Customer Use Case: ${toHumanReadableOrNa(analysisResult?.customer_use_case)}`,
    `Goods Type: ${toHumanReadableOrNa(analysisResult?.goods_type)}`,
  ];
  const objections = [toHumanReadableOrNa(analysisResult?.customer_drivers)];
  const actions = recommendedActionLines(analysisResult);

  return (
    <AppScreen
      screenTestId="call-details-screen"
      mainTestId="call-details-main"
      mainBgClass="bg-[#F7F8FB]"
      mainClassName="!pb-0"
      showBottomNav
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-none"
          style={{
            paddingBottom: "var(--sellwise-call-details-scroll-pad-bottom)",
          }}
        >
          {/* Call summary */}
          <DetailCard className="mt-1">
            <h2 className="font-body text-[16px] font-bold text-[#111827]">
              {t.callDetails.callSummary}
            </h2>
            <div className="mt-3 flex items-start justify-between gap-2">
              <p className="font-body text-[18px] font-bold text-[#111827]">{lead.name}</p>
              <span className="shrink-0 text-[14px] font-semibold text-[#15803D]">
                {t.callDetails.wrapupStatus}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-[13px] text-[#6B7280]">
              <span>{formatEndedAtLabel(endedAt, t)}</span>
              <span className="flex items-center gap-1.5 tabular-nums">
                <Clock className="h-4 w-4 shrink-0 text-[color:var(--blue-600)]" strokeWidth={2} />
                {formatDurationShort(durationSeconds)}
              </span>
            </div>
            {!isEditable ? (
              <button
                type="button"
                data-testid="call-details-recording"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#2563eb] py-3.5 font-body text-[15px] font-semibold text-white shadow-sm transition-opacity hover:opacity-95 active:opacity-90"
                onClick={() => {
                  if (!location.state?.callUuid || typeof location.state.callUuid !== "string") {
                    toast.info(t.callFeedbackPage.recordingUnavailable);
                    return;
                  }
                  setRecordingOpen(true);
                }}
              >
                <span>{t.callFeedbackPage.callRecording}</span>
                <Volume2 className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
              </button>
            ) : null}
          </DetailCard>

          {/* Disposition */}
          <DetailCard className="mt-4">
            <h2 className="font-body text-[16px] font-bold text-[#111827]">
              {t.callDetails.callDisposition}
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <Label className="mb-1.5 block font-body text-[13px] font-medium text-[#6B7280]">
                  {t.callDetails.callOutcome}
                </Label>
                <Select
                  value={callOutcome}
                  onValueChange={setCallOutcome}
                  disabled={!isEditable}
                >
                  <SelectTrigger
                    className="h-11 w-full rounded-xl border-[#e4e4e4] bg-white font-body text-[14px] text-[#111827] focus:ring-[color:var(--blue-400)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CALL_OUTCOME_LABELS).map((value) => (
                      <SelectItem key={value} value={value}>
                        {CALL_OUTCOME_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block font-body text-[13px] font-medium text-[#6B7280]">
                  {t.callDetails.leadStatusLabel}
                </Label>
                <Select
                  value={leadStatus}
                  onValueChange={setLeadStatus}
                  disabled={!isEditable}
                >
                  <SelectTrigger
                    className="h-11 w-full rounded-xl border-[#e4e4e4] bg-white font-body text-[14px] text-[#111827] focus:ring-[color:var(--blue-400)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{t.callDetails.leadStatuses.new}</SelectItem>
                    <SelectItem value="interested">{t.callDetails.leadStatuses.interested}</SelectItem>
                    <SelectItem value="qualified">{t.callDetails.leadStatuses.qualified}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block font-body text-[13px] font-medium text-[#6B7280]">
                  {t.callDetails.nextFollowUp}
                </Label>
                <Input
                  type="text"
                  data-testid="call-details-next-followup"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  disabled={!isEditable}
                  className="h-11 w-full rounded-xl border-[#e4e4e4] bg-white px-3 font-body text-[14px] text-[#111827] shadow-none focus-visible:ring-[color:var(--blue-400)] disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>
              <div>
                <Label className="mb-1.5 block font-body text-[13px] font-medium text-[#6B7280]">
                  {t.callDetails.notes}
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!isEditable}
                  className="min-h-[120px] rounded-xl border-[#e4e4e4] font-body text-[14px] text-[#374151] focus-visible:ring-[color:var(--blue-400)] disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>
            </div>
          </DetailCard>

          {/* AI summary */}
          <section className="mt-4 rounded-2xl border border-[#dbe4f7] bg-[#eef3fc] px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-body text-[16px] font-bold text-[#111827]">
                {t.callDetails.aiSummary}
              </h2>
              <Sparkles className="h-5 w-5 shrink-0 text-[color:var(--blue-600)]" strokeWidth={2} />
            </div>
            <div className="mt-4">
              <p className="font-body text-[13px] font-semibold text-[#111827]">
                {t.callDetails.keyOutcomes}
              </p>
              <AiList
                icon={CheckCircle2}
                iconClass="text-[color:var(--blue-600)]"
                items={outcomes}
              />
            </div>
            <div className="mt-4">
              <p className="font-body text-[13px] font-semibold text-[#111827]">
                {t.callDetails.objectionsRaised}
              </p>
              <AiList
                icon={AlertTriangle}
                iconClass="text-[color:var(--warning)]"
                items={objections}
              />
            </div>
            <div className="mt-4">
              <p className="font-body text-[13px] font-semibold text-[#111827]">
                {t.callDetails.recommendedActions}
              </p>
              <AiList
                icon={MapPin}
                iconClass="text-[color:var(--blue-600)]"
                items={actions}
              />
            </div>
          </section>
        </div>
      </div>
      <CallRecordingDrawer
        open={recordingOpen}
        onOpenChange={setRecordingOpen}
        callUuid={typeof location.state?.callUuid === "string" ? location.state.callUuid : ""}
        durationSeconds={durationSeconds}
        onAudioError={() => toast.error(t.callFeedbackPage.recordingUnavailable)}
      />

      {/* Fixed above BottomNav — stays on screen when main or page scrolls */}
      <div
        className="fixed left-1/2 z-[35] w-full max-w-[var(--sellwise-app-max-width)] -translate-x-1/2 border-t border-[#e4e4e4] bg-[#F7F8FB]/95 px-4 pt-3 pb-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm supports-[backdrop-filter]:bg-[#F7F8FB]/85"
        style={{ bottom: "var(--sellwise-bottom-nav-height)" }}
        data-testid="call-details-actions"
      >
        {isEditable ? (
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              data-testid="call-details-feedback"
              className="h-11 flex-1 rounded-xl border-2 border-[color:var(--blue-600)] bg-white font-body text-[14px] font-semibold text-[color:var(--blue-600)] shadow-none hover:bg-[color:var(--blue-200)]/40"
              onClick={() =>
                navigate(`/leads/${leadId}/call-feedback`, {
                  state: {
                    durationSeconds,
                    endedAt: endedAt.toISOString(),
                    callUuid: location.state?.callUuid ?? null,
                    analysisResult: analysisResult ?? undefined,
                  },
                })
              }
            >
              {t.callDetails.callFeedback}
            </Button>
            <Button
              type="button"
              data-testid="call-details-save"
              className="h-11 flex-1 rounded-xl bg-[color:var(--blue-600)] font-body text-[14px] font-semibold text-white shadow-none hover:bg-[color:var(--blue-700)]"
              onClick={() => {
                toast.success(t.callDetails.savedToast);
                navigate(`/leads/${leadId}`);
              }}
              >
                {t.callDetails.saveAndClose}
              </Button>
          </div>
        ) : null}
      </div>
    </AppScreen>
  );
}
