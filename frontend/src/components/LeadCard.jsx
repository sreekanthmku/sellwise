import { Phone, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusTag } from "@/components/StatusTag";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { mergeLeadDetail } from "@/data/leadDetails";
import { openWhatsAppChat } from "@/lib/whatsapp";

const formatLastContact = (lastContact, t) => {
  const { value, unit } = lastContact;
  if (unit === "hours") return `${value}${t.timeAgo.hours}`;
  if (unit === "day") return `${value}${t.timeAgo.day}`;
  return `${value} ${t.timeAgo.days}`;
};

export const ActionCircle = ({ children, color, testid, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testid}
    className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform hover:scale-105 ${color}`}
  >
    {children}
  </button>
);

export const RecommendedPill = () => {
  const { t } = useLanguage();
  return (
    <span
      data-testid="recommended-pill"
      className="inline-flex items-center justify-center rounded-full border border-[color:var(--success)] bg-white px-2.5 py-0.5 text-[10.5px] font-semibold text-[color:var(--success)]"
    >
      {t.recommended}
    </span>
  );
};

export const LeadCard = ({ lead, variant = "human", onMoveToHuman }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <article
      data-testid={`lead-card-${lead.id}`}
      className="overflow-hidden rounded-2xl border border-[#e4e4e4] bg-white"
    >
      <div className="px-4 pt-4 pb-4">
        {/* Top row: name + priority */}
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(`/leads/${lead.id}`)}
            className="font-body text-left text-[18px] font-bold leading-tight text-[color:var(--blue-600)] underline decoration-[color:var(--blue-600)] decoration-1 underline-offset-2"
            data-testid={`lead-name-${lead.id}`}
          >
            {lead.name}
          </button>
          <PriorityBadge priority={lead.priority} />
        </div>

        {/* Interested in */}
        <p className="mt-2 text-[14px] text-[color:var(--gray-300)]">
          {t.interestedIn}: <span className="font-medium">{lead.interestedIn}</span>
        </p>

        {/* Tags: fixed 3 columns per row; 1–2 tags stay narrow (no flex-grow into empty space) */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {lead.tags.map((tagKey) => (
            <div key={tagKey} className="min-w-0">
              <StatusTag tagKey={tagKey} />
            </div>
          ))}
        </div>

        {/* Footer: last contact + action circles */}
        <div className="mt-4 flex items-start justify-between gap-3">
          <p className="mt-3 text-[13px] text-[color:var(--gray-200)]">
            {t.lastContact}:{" "}
            <span className="font-medium text-[color:var(--gray-300)]">
              {formatLastContact(lead.lastContact, t)}
            </span>
          </p>
          <div className="flex items-start gap-3">
            <div className="relative flex flex-col items-center">
              <ActionCircle
                color="bg-[color:var(--blue-600)]"
                testid={`call-btn-${lead.id}`}
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
            <div className="relative flex flex-col items-center">
              <ActionCircle
                color="bg-[color:var(--success)]"
                testid={`whatsapp-btn-${lead.id}`}
                onClick={() => openWhatsAppChat(mergeLeadDetail(lead).phoneDisplay)}
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
      </div>

      {variant === "ai" && (
        <button
          type="button"
          data-testid={`move-to-human-${lead.id}`}
          onClick={() => onMoveToHuman?.(lead.id)}
          className="flex w-full items-center justify-center gap-2 bg-[color:var(--blue-200)] py-3 text-[14px] font-semibold text-[color:var(--blue-600)] transition-colors hover:bg-[color:var(--blue-300)]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          {t.moveToHuman}
        </button>
      )}
    </article>
  );
};

export default LeadCard;
