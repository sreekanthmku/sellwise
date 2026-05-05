import {
  ArrowLeft,
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
  Wallet,
} from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { ActionCircle, RecommendedPill } from "@/components/LeadCard";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { useLeadsData } from "@/context/LeadsDataContext";
import { initialsFromName, mergeLeadDetail } from "@/data/leadDetails";
import { maskPhoneLastFour } from "@/lib/maskPhone";
import { openWhatsAppChat } from "@/lib/whatsapp";

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

const DetailCard = ({ children, className = "" }) => (
  <section
    className={`rounded-2xl border border-[#e4e4e4] bg-white px-4 py-4 ${className}`}
  >
    {children}
  </section>
);

export default function LeadDetails() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getLeadById } = useLeadsData();

  const lead = getLeadById(leadId);
  if (!lead) return <Navigate to="/leads" replace />;

  const detail = mergeLeadDetail(lead);
  const initials = initialsFromName(lead.name);

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
      <div className="pt-1">
        <button
          type="button"
          data-testid="lead-detail-back"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 py-2 font-body text-[15px] font-semibold text-[color:var(--blue-600)] transition-opacity hover:opacity-80"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          {t.leadDetail.back}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-none pb-8">
      {/* Profile + Brief Persona (single card) */}
      <DetailCard className="mt-1 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex min-h-0 gap-0">
          <div className="min-w-0 flex-[3] pr-3">
            <div className="flex gap-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[color:var(--blue-300)] font-body text-[18px] font-bold text-[color:var(--blue-600)]"
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-body text-[18px] font-bold leading-tight text-[color:var(--blue-600)] underline decoration-[color:var(--blue-600)] decoration-1 underline-offset-2">
                  {lead.name}
                </h1>
                <p className="mt-2 text-[14px] text-[color:var(--gray-300)]">
                  {t.interestedIn}:{" "}
                  <span className="font-medium">{lead.interestedIn}</span>
                </p>
              </div>
            </div>

            <ul className="mt-4 flex flex-col gap-2.5">
              <li className="flex items-start gap-2.5 text-[14px] text-[color:var(--gray-300)]">
                <Phone
                  className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--blue-600)]"
                  strokeWidth={2.25}
                />
                <span className="font-medium">{maskPhoneLastFour(detail.phoneDisplay)}</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px] text-[color:var(--gray-300)]">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--blue-600)]"
                  strokeWidth={2.25}
                />
                <span className="font-medium">{detail.location}</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px]">
                <Funnel
                  className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--blue-600)]"
                  strokeWidth={2.25}
                />
                <div className="flex min-w-0 flex-1">
                  <span className="w-[7.25rem] shrink-0 text-[color:var(--gray-200)]">
                    {t.leadDetail.leadSource} :
                  </span>
                  <span className="min-w-0 font-medium text-[color:var(--gray-300)]">
                    {t.leadDetail.leadSources[detail.leadSourceKey] ?? detail.leadSourceKey}
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5 text-[14px]">
                <Calendar
                  className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--blue-600)]"
                  strokeWidth={2.25}
                />
                <div className="flex min-w-0 flex-1">
                  <span className="w-[7.25rem] shrink-0 text-[color:var(--gray-200)]">
                    {t.leadDetail.added} :
                  </span>
                  <span className="min-w-0 font-medium text-[color:var(--gray-300)]">
                    {formatAdded(detail.added, t)}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex w-[92px] shrink-0 flex-col items-center justify-center border-l border-[#e4e4e4] pl-3">
            <div className="relative flex flex-col items-center">
              <ActionCircle
                color="border-[color:var(--blue-600)] bg-[color:var(--blue-600)] text-white"
                testid="lead-detail-call"
                onClick={() => navigate(`/leads/${lead.id}/call`)}
              >
                <Phone className="h-5 w-5" strokeWidth={2.25} fill="currentColor" />
              </ActionCircle>
              {lead.recommendedAction === "call" ? (
                <div className="absolute left-1/2 top-full z-[1] -translate-x-1/2 -translate-y-1/2">
                  <RecommendedPill />
                </div>
              ) : null}
            </div>
            <div
              className={
                lead.recommendedAction === "call" ? "relative mt-7" : "relative mt-5"
              }
            >
              <ActionCircle
                color="border-[color:var(--success)] bg-[color:var(--success)] text-white"
                testid="lead-detail-whatsapp"
                onClick={() => openWhatsAppChat(detail.phoneDisplay)}
              >
                <WhatsAppIcon size={22} />
              </ActionCircle>
              {lead.recommendedAction === "whatsapp" ? (
                <div className="absolute left-1/2 top-full z-[1] -translate-x-1/2 -translate-y-1/2">
                  <RecommendedPill />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-[#e4e4e4] pt-4">
          <h2 className="font-body text-[16px] font-bold text-[#111827]">
            {t.leadDetail.briefPersona}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[color:var(--gray-200)]">
            {t.leadDetail.briefPersonas[detail.briefPersonaKey] ??
              t.leadDetail.briefPersonas.generic}
          </p>
        </div>
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
          {t.leadDetail.callHistory}
        </h2>
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
      </DetailCard>

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
