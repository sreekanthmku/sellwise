import {
  Binoculars,
  Calendar,
  Car,
  Cog,
  Fuel,
  Funnel,
  Mail,
  MapPin,
  Palette,
  Phone,
  Star,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { CallRecordingDrawer } from "@/components/CallRecordingDrawer";
import { RecentCallCard } from "@/components/RecentCallCard";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { useLeadsData } from "@/context/LeadsDataContext";
import { initialsFromName, mergeLeadDetail } from "@/data/leadDetails";
import { maskPhoneLastFour } from "@/lib/maskPhone";
import { cn } from "@/lib/utils";
import { openWhatsAppChat } from "@/lib/whatsapp";
import { defaultApiBase } from "@/vobiz/constants";
import { useVobiz } from "@/vobiz/VobizProvider";

const formatAdded = (added, t) => {
  const { value, unit } = added;
  if (unit === "hours") return `${value}${t.timeAgo.hours}`;
  if (unit === "day") return `${value}${t.timeAgo.day}`;
  return `${value} ${t.timeAgo.days}`;
};

const PREF_ICONS = {
  type: Car,
  budget: Wallet,
  usage: Binoculars,
  features: Cog,
  fuelType: Fuel,
  color: Palette,
};

const STEP_ICONS = [Calendar, Mail, Phone];
const MAX_RECENT_CALL_ROWS = 25;

const DetailCard = ({ children, className = "" }) => (
  <section className={cn("rounded-2xl border border-[#e4e4e4] bg-white px-4 py-4", className)}>
    {children}
  </section>
);

const DetailIconChip = ({ children }) => (
  <div
    className="mt-0.5 flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-[8px] border border-[#dbe7ff] bg-[#eef4ff] [&_svg]:h-[13px] [&_svg]:w-[13px]"
    aria-hidden
  >
    {children}
  </div>
);

function formatCallDuration(totalSeconds) {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function phoneMatches(rawA, rawB) {
  const a = digitsOnly(rawA);
  const b = digitsOnly(rawB);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 7 && b.length >= 7) {
    return a.slice(-10) === b.slice(-10) || a.slice(-9) === b.slice(-9);
  }
  return false;
}

export default function LeadDetails() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getLeadById, humanLeads, moveAiLeadToHuman } = useLeadsData();
  const { callHistory } = useVobiz();
  const [aiRecentCalls, setAiRecentCalls] = useState([]);
  const [recordingCall, setRecordingCall] = useState(null);
  const lead = getLeadById(leadId);
  const leadPhoneDisplay = lead?.detail?.phoneDisplay ?? "";
  const leadNameForCalls = lead?.name ?? "";

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

  const realRecentCalls = useMemo(() => {
    const humanRows = Array.isArray(callHistory)
      ? callHistory
          .filter((row) => {
            if (!row || typeof row !== "object") return false;
            if (row.leadId != null && String(row.leadId) === String(leadId)) return true;
            return typeof row.name === "string" && row.name.trim() === leadNameForCalls;
          })
          .map((row, index) => ({
            id: row.id || `human-call-${index}`,
            name: leadNameForCalls || "Unknown",
            callType: "human",
            outcome:
              row.endReason === "failed" || row.endReason === "busy"
                ? "notInterested"
                : "followUp",
            avatarVariant: "purple",
            timeLabel:
              typeof row.endedAtIso === "string" && row.endedAtIso.length > 0
                ? new Date(row.endedAtIso).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : t.performance.today,
            callUuid: row.callUuid || null,
            leadId: row.leadId != null ? String(row.leadId) : null,
            durationSeconds:
              typeof row.durationSeconds === "number" && Number.isFinite(row.durationSeconds)
                ? Math.max(0, Math.floor(row.durationSeconds))
                : 0,
            endedAtIso:
              typeof row.endedAtIso === "string" && row.endedAtIso.length > 0
                ? row.endedAtIso
                : new Date().toISOString(),
            skipFeedback: false,
          }))
      : [];

    const aiRows = Array.isArray(aiRecentCalls)
      ? aiRecentCalls
          .filter((row) => row && typeof row === "object")
          .filter((row) => phoneMatches(row.name, leadPhoneDisplay))
          .map((row, index) => ({
            id: row.id || `ai-call-${index}`,
            name: leadNameForCalls || "AI call",
            callType: "ai",
            outcome: ["interested", "followUp", "notInterested"].includes(row.outcome)
              ? row.outcome
              : "followUp",
            avatarVariant: "green",
            timeLabel:
              typeof row.endedAtIso === "string" && row.endedAtIso.length > 0
                ? new Date(row.endedAtIso).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : t.performance.today,
            callUuid: row.callUuid || null,
            leadId: row.leadId != null ? String(row.leadId) : null,
            durationSeconds:
              typeof row.durationSeconds === "number" && Number.isFinite(row.durationSeconds)
                ? Math.max(0, Math.floor(row.durationSeconds))
                : 0,
            endedAtIso:
              typeof row.endedAtIso === "string" && row.endedAtIso.length > 0
                ? row.endedAtIso
                : new Date().toISOString(),
            skipFeedback: row.skipFeedback === true,
          }))
      : [];

    const combined = [...humanRows, ...aiRows];
    combined.sort((a, b) => new Date(b.endedAtIso).getTime() - new Date(a.endedAtIso).getTime());
    return combined.slice(0, MAX_RECENT_CALL_ROWS);
  }, [aiRecentCalls, callHistory, leadId, leadNameForCalls, leadPhoneDisplay, t.performance.today]);

  if (!lead) return <Navigate to="/leads" replace />;

  const isHumanLead = humanLeads.some((l) => l.id === lead.id);
  const detail = mergeLeadDetail(lead);
  const initials = initialsFromName(lead.name);
  const callIsRecommended = lead.recommendedAction === "call";
  const whatsappIsRecommended = lead.recommendedAction === "whatsapp";
  const briefPersona =
    t.leadDetail.briefPersonas[detail.briefPersonaKey] ?? t.leadDetail.briefPersonas.generic;
  const vehicleInterestLabel = t.interestedIn === "Vehicle interest" ? "Vehicle Interest" : t.interestedIn;
  const leadStatusLabel = t.leadDetail.leadStatus ?? t.callDetails.leadStatusLabel;
  const leadStatusValue =
    t.leadDetail.statuses?.[lead.status] ??
    t.callDetails.leadStatuses?.[lead.status] ??
    lead.status ??
    "—";

  const prefValue = (row) => {
    if (row.valueKey === "_model") return row.model;
    return t.leadDetail.prefValues[row.valueKey] ?? row.valueKey;
  };

  return (
    <AppScreen
      screenTestId="lead-detail-screen"
      mainTestId="lead-detail-main"
      mainBgClass="bg-[#F7F8FB]"
      showBottomNav
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-none pb-8">
      {/* Profile */}
      <DetailCard
        className={cn(
          "mt-1 px-4 py-4 sm:px-5 sm:py-5",
          isHumanLead && "rounded-[20px] border-[#f1f5f9] shadow-[var(--card-shadow)]",
        )}
      >
        {isHumanLead ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="font-body text-[18px] font-bold leading-tight text-[color:var(--blue-600)]">
                  {lead.name}
                </h1>
                <p className="mt-1 text-[14px] leading-tight text-[color:var(--gray-300)]">
                  {vehicleInterestLabel}: <span className="font-semibold">{lead.interestedIn}</span>
                </p>
                <p className="mt-1 text-[14px] leading-tight text-[color:var(--gray-300)]">
                  {leadStatusLabel}: <span className="font-semibold">{leadStatusValue}</span>
                </p>
              </div>
              <span className="inline-flex max-w-[min(100%,12rem)] shrink-0 items-center gap-1.5 rounded-full border border-black/[0.04] bg-[color:var(--blue-300)] px-2.5 py-1.5 font-body text-[12px] font-medium leading-snug text-[color:var(--gray-300)]">
                <User className="h-3.5 w-3.5 shrink-0 text-[color:var(--blue-600)]" strokeWidth={2} aria-hidden />
                <span className="min-w-0 truncate">{t.humanFollowUp}</span>
              </span>
            </div>

            <ul className="mt-4 flex flex-col gap-2.5">
              <li className="flex items-start gap-2.5 text-[14px] text-[color:var(--gray-300)]">
                <DetailIconChip>
                  <Phone className="text-[color:var(--blue-600)]" strokeWidth={2.25} />
                </DetailIconChip>
                <span className="min-w-0 pt-0.5 font-semibold">{maskPhoneLastFour(detail.phoneDisplay)}</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px] text-[color:var(--gray-300)]">
                <DetailIconChip>
                  <MapPin className="text-[color:var(--blue-600)]" strokeWidth={2.25} />
                </DetailIconChip>
                <span className="min-w-0 pt-0.5 font-semibold">{detail.location}</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px]">
                <DetailIconChip>
                  <Funnel className="text-[color:var(--blue-600)]" strokeWidth={2.25} />
                </DetailIconChip>
                <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1 gap-y-0.5 pt-0.5">
                  <span className="shrink-0 text-[color:var(--gray-200)]">
                    {t.leadDetail.leadSource} :
                  </span>
                  <span className="min-w-0 font-semibold text-[color:var(--gray-300)]">
                    {t.leadDetail.leadSources[detail.leadSourceKey] ?? detail.leadSourceKey}
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5 text-[14px]">
                <DetailIconChip>
                  <Calendar className="text-[color:var(--blue-600)]" strokeWidth={2.25} />
                </DetailIconChip>
                <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1 gap-y-0.5 pt-0.5">
                  <span className="shrink-0 text-[color:var(--gray-200)]">
                    {t.leadDetail.added} :
                  </span>
                  <span className="min-w-0 font-semibold text-[color:var(--gray-300)]">
                    {formatAdded(detail.added, t)}
                  </span>
                </div>
              </li>
            </ul>

            <div className="mt-4 flex gap-2">
              <div className="relative min-w-0 flex-1">
                {callIsRecommended ? (
                  <span
                    className="pointer-events-none absolute -right-0.5 -top-0.5 z-[1] inline-flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--yellow-200)] text-[color:var(--yellow-600)] ring-2 ring-white"
                    aria-hidden
                  >
                    <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                  </span>
                ) : null}
                <button
                  type="button"
                  data-testid="lead-detail-call"
                  onClick={() => navigate(`/leads/${lead.id}/call`)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--blue-600)] font-body text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-[color:var(--blue-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)] focus-visible:ring-offset-2"
                >
                  <Phone className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
                  {t.dialer.call}
                </button>
              </div>
              <div className="relative min-w-0 flex-1">
                {whatsappIsRecommended ? (
                  <span
                    className="pointer-events-none absolute -right-0.5 -top-0.5 z-[1] inline-flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--yellow-200)] text-[color:var(--yellow-600)] ring-2 ring-white"
                    aria-hidden
                  >
                    <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                  </span>
                ) : null}
                <button
                  type="button"
                  data-testid="lead-detail-whatsapp"
                  onClick={() => openWhatsAppChat(detail.phoneDisplay)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--success)] font-body text-[14px] font-semibold text-white shadow-none transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)] focus-visible:ring-offset-2 active:opacity-90"
                >
                  <WhatsAppIcon size={20} className="shrink-0" />
                  WhatsApp
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="font-body text-[18px] font-bold leading-tight text-[color:var(--blue-600)]">
                  {lead.name}
                </h1>
                <p className="mt-1 text-[14px] leading-tight text-[color:var(--gray-300)]">
                  {vehicleInterestLabel}: <span className="font-semibold">{lead.interestedIn}</span>
                </p>
                <p className="mt-1 text-[14px] leading-tight text-[color:var(--gray-300)]">
                  {leadStatusLabel}: <span className="font-semibold">{leadStatusValue}</span>
                </p>
              </div>
              <span className="inline-flex max-w-[min(100%,12rem)] shrink-0 items-center gap-1.5 rounded-full border border-black/[0.04] bg-[color:var(--blue-300)] px-2.5 py-1.5 font-body text-[12px] font-medium leading-snug text-[color:var(--gray-300)]">
                <Star
                  className="h-3.5 w-3.5 shrink-0 text-[color:var(--blue-600)]"
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden
                />
                <span className="min-w-0 truncate">{t.aiFollowUp}</span>
              </span>
            </div>

            <ul className="mt-4 flex flex-col gap-2.5">
              <li className="flex items-start gap-2.5 text-[14px] text-[color:var(--gray-300)]">
                <DetailIconChip>
                  <Phone className="text-[color:var(--blue-600)]" strokeWidth={2.25} />
                </DetailIconChip>
                <span className="pt-0.5 font-semibold">{maskPhoneLastFour(detail.phoneDisplay)}</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px] text-[color:var(--gray-300)]">
                <DetailIconChip>
                  <MapPin className="text-[color:var(--blue-600)]" strokeWidth={2.25} />
                </DetailIconChip>
                <span className="pt-0.5 font-semibold">{detail.location}</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px]">
                <DetailIconChip>
                  <Funnel className="text-[color:var(--blue-600)]" strokeWidth={2.25} />
                </DetailIconChip>
                <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1 gap-y-0.5 pt-0.5">
                  <span className="shrink-0 text-[color:var(--gray-200)]">
                    {t.leadDetail.leadSource} :
                  </span>
                  <span className="min-w-0 font-semibold text-[color:var(--gray-300)]">
                    {t.leadDetail.leadSources[detail.leadSourceKey] ?? detail.leadSourceKey}
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5 text-[14px]">
                <DetailIconChip>
                  <Calendar className="text-[color:var(--blue-600)]" strokeWidth={2.25} />
                </DetailIconChip>
                <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1 gap-y-0.5 pt-0.5">
                  <span className="shrink-0 text-[color:var(--gray-200)]">
                    {t.leadDetail.added} :
                  </span>
                  <span className="min-w-0 font-semibold text-[color:var(--gray-300)]">
                    {formatAdded(detail.added, t)}
                  </span>
                </div>
              </li>
            </ul>

            <button
              type="button"
              data-testid="lead-detail-move-to-human"
              onClick={() => moveAiLeadToHuman(lead.id)}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--blue-600)] font-body text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-[color:var(--blue-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)] focus-visible:ring-offset-2"
            >
              <User className="h-[18px] w-[18px] shrink-0" strokeWidth={2.1} />
              Move to human
            </button>
          </>
        )}
      </DetailCard>

      <DetailCard className="mt-4">
        <h2 className="font-body text-[16px] font-bold text-[#111827]">
          {t.leadDetail.briefPersona}
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[color:var(--gray-200)]">
          {briefPersona}
        </p>
      </DetailCard>

      {/* Preferences */}
      <DetailCard className="mt-4">
        <h2 className="font-body text-[16px] font-bold text-[color:var(--gray-300)]">
          {t.leadDetail.preferences}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
          {detail.preferences.map((row) => {
            const Icon = PREF_ICONS[row.key];
            return (
              <div key={row.key} className="flex gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--blue-300)]">
                  {Icon ? (
                    <Icon className="h-4 w-4 text-[color:var(--blue-600)]" strokeWidth={2} />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] leading-tight text-[color:var(--gray-200)]">
                    {t.leadDetail.prefs[row.key]}:
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-snug text-[color:var(--gray-300)]">
                    {prefValue(row)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </DetailCard>

      {/* Next steps */}
      <DetailCard className="mt-4">
        <h2 className="font-body text-[16px] font-bold text-[color:var(--gray-300)]">
          {t.leadDetail.nextSteps}
        </h2>
        <ul className="mt-3 divide-y divide-[#ececec]">
          {detail.nextSteps.map((step, i) => {
            const StepIcon = STEP_ICONS[i] ?? Calendar;
            return (
              <li key={step.titleKey} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--blue-300)]">
                  <StepIcon className="h-4 w-4 text-[color:var(--blue-600)]" strokeWidth={2} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[14px] font-semibold text-[color:var(--gray-300)]">
                    {t.leadDetail.steps[step.titleKey]}
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-[color:var(--gray-200)]">
                    {t.leadDetail.steps[step.subtitleKey]}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </DetailCard>

      {/* Call history */}
      <DetailCard className="mt-4">
        <h2 className="font-body text-[16px] font-bold text-[#111827]">
          {realRecentCalls.length > 0 ? t.performance.recentCalls : t.leadDetail.callHistory}
        </h2>
        {realRecentCalls.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
            {realRecentCalls.map((row) => (
              <RecentCallCard
                key={row.id}
                testId={`lead-recent-call-${row.id}`}
                name={t.callDetails.outgoingCall}
                callUuid={row.callUuid}
                callType={row.callType}
                outcome={row.outcome}
                timeLabel={formatCallDuration(row.durationSeconds)}
                avatarVariant={row.avatarVariant}
                actionLabel="View details"
                onAction={() => setRecordingCall(row)}
              />
            ))}
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[#F3F4F6]">
            {detail.callHistory.map((call) => (
              <li
                key={`${call.titleKey}-${call.ago.value}-${call.ago.unit}`}
                className="flex gap-4 py-4 first:pt-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF]">
                  <Phone className="h-4 w-4 text-[#2563EB]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[14px] font-bold leading-snug text-[#111827]">
                      {t.leadDetail.calls[call.titleKey]}
                    </p>
                    <span className="shrink-0 text-right text-[12px] text-[#9CA3AF]">
                      {formatAdded(call.ago, t)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <p className="text-[13px] font-normal leading-snug text-[#4B5563]">
                      {t.leadDetail.duration}: {call.durationMin} min {call.durationSec} sec
                    </p>
                    <span
                      className={`shrink-0 text-right text-[13px] font-bold ${
                        call.status === "new" ? "text-[#D97706]" : "text-[#15803D]"
                      }`}
                    >
                      {t.leadDetail.callStatus[call.status]}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-[#4B5563]">
                    {t.leadDetail.calls[call.notesKey]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DetailCard>

      <CallRecordingDrawer
        open={Boolean(recordingCall)}
        onOpenChange={(open) => {
          if (!open) setRecordingCall(null);
        }}
        callUuid={recordingCall?.callUuid || ""}
        durationSeconds={recordingCall?.durationSeconds || 0}
        onAudioError={() => {}}
      />

      {/* Recommended models */}
      <div className="mt-4 pb-5">
        <h2 className="font-body text-[16px] font-bold text-[color:var(--gray-300)]">
          {t.leadDetail.recommendedModels}
        </h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {detail.recommendedModels.map((model) => (
            <article
              key={model.name}
              className="w-[min(200px,calc(100vw-8rem))] shrink-0 overflow-hidden rounded-2xl border border-[#e4e4e4] bg-white shadow-sm"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#f0f2f6]">
                <img
                  src={model.image}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="px-3 py-3">
                <h3 className="font-body text-[15px] font-bold text-[color:var(--gray-300)]">
                  {model.name}
                </h3>
                <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[color:var(--gray-200)]">
                  <Fuel className="h-3.5 w-3.5 shrink-0 text-[color:var(--blue-600)]" />
                  <span>{t.leadDetail.modelMeta[model.rangeKey]}</span>
                </div>
                <p className="mt-2 font-body text-[14px] font-semibold text-[color:var(--blue-600)]">
                  {t.leadDetail.modelPrices[model.priceKey]}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
      </div>
    </AppScreen>
  );
}
