import { useLanguage } from "@/context/LanguageContext";

const styles = {
  high: {
    bg: "bg-[color:var(--priority-high)]",
    text: "text-white",
  },
  medium: {
    bg: "bg-[color:var(--priority-medium)]",
    text: "text-white",
  },
  low: {
    bg: "bg-[color:var(--priority-low)]",
    text: "text-white",
  },
};

export const PriorityBadge = ({ priority }) => {
  const { t } = useLanguage();
  const s = styles[priority] || styles.low;
  return (
    <span
      data-testid={`priority-${priority}`}
      className={`inline-flex min-w-[72px] items-center justify-center rounded-full px-4 py-1 text-[13px] font-semibold ${s.bg} ${s.text}`}
    >
      {t.priority[priority]}
    </span>
  );
};

export default PriorityBadge;
