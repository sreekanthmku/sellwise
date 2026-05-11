import { useLanguage } from "@/context/LanguageContext";

const dotColor = {
  high: "bg-[color:var(--priority-high)]",
  medium: "bg-[color:var(--priority-medium)]",
  low: "bg-[color:var(--priority-low)]",
};

/** Label text: dark grey in reference; colour is in the dot only. */
const labelClass = "text-[#4b5563]";

export const PriorityBadge = ({ priority }) => {
  const { t } = useLanguage();
  const key = priority === "high" || priority === "medium" || priority === "low" ? priority : "low";
  return (
    <span
      data-testid={`priority-${priority}`}
      className="inline-flex shrink-0 items-center gap-1.5"
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor[key]}`} aria-hidden />
      <span className={`text-[13px] font-medium leading-none ${labelClass}`}>{t.priority[key]}</span>
    </span>
  );
};

export default PriorityBadge;
