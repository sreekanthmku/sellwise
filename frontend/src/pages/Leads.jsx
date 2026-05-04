import { User, Bot } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { LeadCard } from "@/components/LeadCard";
import { TabButton } from "@/components/leads/TabButton";
import { ScheduleAiAccordion } from "@/components/leads/ScheduleAiAccordion";
import { useLeadsData } from "@/context/LeadsDataContext";
import { useLeadsTab } from "@/hooks/useLeadsTab";

export default function Leads() {
  const { t } = useLanguage();
  const { moveAiLeadToHuman } = useLeadsData();
  const { tab, switchTab, leads, humanLeadCount, aiLeadCount } = useLeadsTab();

  return (
    <AppScreen
      screenTestId="leads-screen"
      mainTestId="leads-main"
      mainBgClass="bg-[#F7F8FB]"
      showBottomNav
    >
      <div className="pt-2">
        <h1
          data-testid="page-title"
          className="font-suzuki text-[22px] font-bold leading-none text-[color:var(--gray-300)]"
        >
          {t.myLeads}
        </h1>
      </div>

      <div className="mt-4 flex gap-2 pb-2" data-testid="leads-tabs">
        <TabButton
          active={tab === "human"}
          onClick={() => switchTab("human")}
          icon={User}
          label={t.humanFollowUp}
          count={humanLeadCount}
          testid="tab-human"
        />
        <TabButton
          active={tab === "ai"}
          onClick={() => switchTab("ai")}
          icon={Bot}
          label={t.aiFollowUp}
          count={aiLeadCount}
          testid="tab-ai"
        />
      </div>

      <div
        className="flex-1 overflow-y-auto overscroll-none pt-4 pb-10"
        data-testid="leads-content"
      >
        {tab === "ai" && <ScheduleAiAccordion queuedLeadCount={aiLeadCount} />}

        <div className="flex flex-col gap-4" data-testid="leads-list">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              variant={tab === "ai" ? "ai" : "human"}
              onMoveToHuman={tab === "ai" ? moveAiLeadToHuman : undefined}
            />
          ))}
        </div>
      </div>
    </AppScreen>
  );
}
