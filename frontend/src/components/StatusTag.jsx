import { Car, CreditCard, Phone, Tag, MessageCircle, UserRound, Bell } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Status tag pill used inside lead cards. Each tag has its own icon + colour palette.
 */
const TAG_CONFIG = {
  testDriveDone: {
    icon: Car,
    bg: "bg-[color:var(--blue-300)]",
    text: "text-[color:var(--gray-300)]",
    iconColor: "text-[color:var(--gray-300)]",
  },
  financeInterested: {
    icon: CreditCard,
    bg: "bg-[color:var(--yellow-100)]",
    text: "text-[color:var(--gray-300)]",
    iconColor: "text-[color:var(--gray-300)]",
  },
  needCallback: {
    icon: Phone,
    bg: "bg-[color:var(--red-100)]",
    text: "text-[color:var(--gray-300)]",
    iconColor: "text-[color:var(--gray-300)]",
  },
  priceEnquiry: {
    icon: Tag,
    bg: "bg-[color:#F1F1F1]",
    text: "text-[color:var(--gray-300)]",
    iconColor: "text-[color:var(--gray-300)]",
  },
  whatsappReplied: {
    icon: MessageCircle,
    bg: "bg-[color:var(--green-100)]",
    text: "text-[color:var(--gray-300)]",
    iconColor: "text-[color:var(--gray-300)]",
  },
  firstTimeBuyer: {
    icon: UserRound,
    bg: "bg-[color:#F1F1F1]",
    text: "text-[color:var(--gray-300)]",
    iconColor: "text-[color:var(--gray-300)]",
  },
  needFollowUp: {
    icon: Bell,
    bg: "bg-[color:var(--green-100)]",
    text: "text-[color:var(--gray-300)]",
    iconColor: "text-[color:var(--gray-300)]",
  },
};

export const StatusTag = ({ tagKey }) => {
  const { t } = useLanguage();
  const cfg = TAG_CONFIG[tagKey];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      data-testid={`tag-${tagKey}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium leading-tight ${cfg.bg} ${cfg.text}`}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${cfg.iconColor}`} strokeWidth={2} />
      <span className="whitespace-pre-line text-center">{t.tags[tagKey]}</span>
    </span>
  );
};

export default StatusTag;
