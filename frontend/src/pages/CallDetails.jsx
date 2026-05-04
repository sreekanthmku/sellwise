import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
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

  const [callOutcome, setCallOutcome] = useState("interestedFollowUp");
  const [leadStatus, setLeadStatus] = useState("new");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!lead) return;
    setNotes(
      t.callDetails.defaultNotes
        .replace(/\{\{name\}\}/g, lead.name)
        .replace(/\{\{model\}\}/g, lead.interestedIn),
    );
    setNextFollowUp(t.callDetails.nextFollowUpValue);
  }, [leadId, lead, t]);

  if (!lead) return <Navigate to="/leads" replace />;

  const outcomes = t.callDetails.aiOutcomes;
  const objections = t.callDetails.aiObjections;
  const actions = t.callDetails.aiActions;

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
          <div className="pt-1">
            <button
              type="button"
              data-testid="call-details-back"
              onClick={() => navigate(`/leads/${leadId}`)}
              className="flex items-center gap-1.5 py-2 font-body text-[15px] font-semibold text-[color:var(--blue-600)] transition-opacity hover:opacity-80"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
              {t.leadDetail.back}
            </button>
          </div>

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
                <Select value={callOutcome} onValueChange={setCallOutcome}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#e4e4e4] bg-white font-body text-[14px] text-[#111827] focus:ring-[color:var(--blue-400)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interestedFollowUp">
                      {t.callDetails.outcomes.interestedFollowUp}
                    </SelectItem>
                    <SelectItem value="notInterested">{t.callDetails.outcomes.notInterested}</SelectItem>
                    <SelectItem value="callback">{t.callDetails.outcomes.callback}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block font-body text-[13px] font-medium text-[#6B7280]">
                  {t.callDetails.leadStatusLabel}
                </Label>
                <Select value={leadStatus} onValueChange={setLeadStatus}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#e4e4e4] bg-white font-body text-[14px] text-[#111827] focus:ring-[color:var(--blue-400)]">
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
                  className="h-11 w-full rounded-xl border-[#e4e4e4] bg-white px-3 font-body text-[14px] text-[#111827] shadow-none focus-visible:ring-[color:var(--blue-400)]"
                />
              </div>
              <div>
                <Label className="mb-1.5 block font-body text-[13px] font-medium text-[#6B7280]">
                  {t.callDetails.notes}
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] rounded-xl border-[#e4e4e4] font-body text-[14px] text-[#374151] focus-visible:ring-[color:var(--blue-400)]"
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

      {/* Fixed above BottomNav — stays on screen when main or page scrolls */}
      <div
        className="fixed left-1/2 z-[35] w-full max-w-[var(--sellwise-app-max-width)] -translate-x-1/2 border-t border-[#e4e4e4] bg-[#F7F8FB]/95 px-4 pt-3 pb-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm supports-[backdrop-filter]:bg-[#F7F8FB]/85"
        style={{ bottom: "var(--sellwise-bottom-nav-height)" }}
        data-testid="call-details-actions"
      >
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
      </div>
    </AppScreen>
  );
}
