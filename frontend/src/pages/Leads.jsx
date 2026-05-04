import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { User, Bot, Sparkles, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { LeadCard } from "@/components/LeadCard";
import { humanLeads, aiLeads } from "@/data/mockLeads";

const TabButton = ({ active, onClick, icon: Icon, label, count, testid }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testid}
    aria-pressed={active}
    className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-2.5 text-[13px] font-semibold transition-colors ${
      active
        ? "bg-[color:var(--blue-600)] text-white shadow-[0_4px_12px_rgba(37,99,234,0.28)]"
        : "bg-white text-[color:var(--blue-600)] border border-[color:var(--blue-300)]"
    }`}
  >
    <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
    <span className="min-w-0 truncate">{label}</span>
    <span
      className={`flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
        active ? "bg-[color:var(--suzuki-blue)] text-white" : "bg-[color:var(--blue-300)] text-[color:var(--blue-600)]"
      }`}
    >
      {count}
    </span>
  </button>
);

const ScheduleAiAccordion = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <div data-testid="schedule-ai-accordion" className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid="schedule-ai-toggle"
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[color:var(--purple-100)] px-4 py-3.5 text-[15px] font-semibold text-[color:var(--suzuki-blue)]"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[color:var(--purple-600)]" strokeWidth={2.25} />
          {t.scheduleAi}
        </span>
        <ChevronDown
          className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.25}
        />
      </button>
      {open && (
        <div
          data-testid="schedule-ai-content"
          className="mt-2 rounded-2xl border border-[color:var(--purple-200)] bg-white p-4 text-[13px] text-[color:var(--gray-200)]"
        >
          AI follow-up scheduling will appear here once configured.
        </div>
      )}
    </div>
  );
};

export default function Leads() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "ai" ? "ai" : "human";
  const [tab, setTab] = useState(initialTab);
  const switchTab = (next) => {
    setTab(next);
    setSearchParams(next === "ai" ? { tab: "ai" } : {}, { replace: true });
  };
  const leads = tab === "human" ? humanLeads : aiLeads;

  return (
    <div
      data-testid="leads-screen"
      className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-white"
    >
      <AppHeader />

      {/* Page title */}
      <div className="px-6 pt-2">
        <h1
          data-testid="page-title"
          className="font-suzuki text-[28px] font-bold leading-none text-[color:var(--gray-300)]"
        >
          {t.myLeads}
        </h1>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-2 px-5" data-testid="leads-tabs">
        <TabButton
          active={tab === "human"}
          onClick={() => switchTab("human")}
          icon={User}
          label={t.humanFollowUp}
          count={humanLeads.length}
          testid="tab-human"
        />
        <TabButton
          active={tab === "ai"}
          onClick={() => switchTab("ai")}
          icon={Bot}
          label={t.aiFollowUp}
          count={aiLeads.length}
          testid="tab-ai"
        />
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-6 pt-5 pb-6"
        data-testid="leads-content"
      >
        {tab === "ai" && <ScheduleAiAccordion />}

        <div className="flex flex-col gap-4" data-testid="leads-list">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              variant={tab === "ai" ? "ai" : "human"}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
