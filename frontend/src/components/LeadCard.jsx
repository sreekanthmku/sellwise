import { Phone, ArrowLeft, Star } from "lucide-react";
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

/** Up to 2 unique tag keys; pad from pool so every card shows two pills when possible. */
const FALLBACK_TAG_POOL = ["priceEnquiry", "needCallback", "financeInterested", "testDriveDone"];

function buildDisplayTags(tags) {
  const raw = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const seen = new Set();
  const out = [];
  for (const k of raw) {
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= 2) break;
  }
  for (const k of FALLBACK_TAG_POOL) {
    if (out.length >= 2) break;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
}

export const ActionCircle = ({ children, color, testid, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testid}
    className={`flex h-12 w-12 items-center justify-center rounded-full border transition-transform hover:scale-105 ${color}`}
  >
    {children}
  </button>
);

export const RecommendedPill = () => {
  const { t } = useLanguage();
  return (
    <span
      data-testid="recommended-pill"
      className="pointer-events-none inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[color:var(--success)] bg-white px-2.5 py-0.5 text-center text-[10.5px] font-semibold text-[color:var(--success)]"
    >
      {t.recommended}
    </span>
  );
};

export const LeadCard = ({ lead, variant = "human", onMoveToHuman }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const callIsRecommended = lead.recommendedAction === "call";
  const whatsappIsRecommended = lead.recommendedAction === "whatsapp";
  const actionOrder = ["call", "whatsapp"];
  const displayTags = buildDisplayTags(lead.tags);

  return (
    <article
      data-testid={`lead-card-${lead.id}`}
      className="overflow-hidden rounded-[20px] border border-[#ebebeb] bg-white"
    >
      <div className="min-w-0 px-4 pt-4 pb-3">
        {/* Top row: name + priority */}
        <div className="flex items-center justify-between gap-3">
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
        <p className="mt-1 text-[14px] text-[color:var(--gray-200)]">
          {t.interestedIn}: <span className="font-medium">{lead.interestedIn}</span>
        </p>

        {/* Tags: max 2, single row; width follows content */}
        <div className="mt-3 flex min-w-0 flex-nowrap items-center justify-start gap-2 overflow-x-auto overscroll-x-contain">
          {displayTags.map((tagKey, index) => (
            <div key={`${lead.id}-tag-${index}-${tagKey}`} className="inline-flex shrink-0">
              <StatusTag tagKey={tagKey} />
            </div>
          ))}
        </div>

        {/* Footer: last contact + action circles (human tab only) */}
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[13px] text-[color:var(--gray-200)]">
            {t.lastContact}:{" "}
            <span className="font-medium text-[color:var(--gray-300)]">
              {formatLastContact(lead.lastContact, t)}
            </span>
          </p>
          {variant !== "ai" && (
            <div className="flex items-center gap-5">
              {actionOrder.map((action, index) => (
                <div
                  key={action}
                  className={`relative flex flex-col items-center ${index === 1 ? "ml-[10px]" : ""}`}
                >
                  {((action === "call" && callIsRecommended) ||
                    (action === "whatsapp" && whatsappIsRecommended)) && (
                    <span
                      className="absolute -right-1 -top-1 z-[1] inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#fef3c7] text-[#f59e0b]"
                      data-testid={`${action}-recommended-star-${lead.id}`}
                      aria-hidden="true"
                    >
                      <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                    </span>
                  )}
                  {action === "call" ? (
                    <ActionCircle
                      color={
                        callIsRecommended
                          ? "border-[color:var(--blue-600)] bg-[color:var(--blue-600)] text-white"
                          : "border-[color:var(--blue-600)] bg-white text-[color:var(--blue-600)]"
                      }
                      testid={`call-btn-${lead.id}`}
                      onClick={() => navigate(`/leads/${lead.id}/call`)}
                    >
                      <Phone
                        className="h-5 w-5"
                        strokeWidth={2.25}
                        fill={callIsRecommended ? "currentColor" : "none"}
                      />
                    </ActionCircle>
                  ) : (
                    <ActionCircle
                      color={
                        whatsappIsRecommended
                          ? "border-[color:var(--success)] bg-[color:var(--success)] text-white"
                          : "border-[#c6ebd4] bg-white text-[color:var(--success)]"
                      }
                      testid={`whatsapp-btn-${lead.id}`}
                      onClick={() => openWhatsAppChat(mergeLeadDetail(lead).phoneDisplay)}
                    >
                      <WhatsAppIcon size={22} />
                    </ActionCircle>
                  )}
                </div>
              ))}
            </div>
          )}
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
