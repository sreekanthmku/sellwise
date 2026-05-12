import { useState } from "react";
import { User, Bot, Phone, Search, Filter } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { LeadCard } from "@/components/LeadCard";
import { TabButton } from "@/components/leads/TabButton";
import { ScheduleAiAccordion } from "@/components/leads/ScheduleAiAccordion";
import { CallNumberModal } from "@/components/leads/CallNumberModal";
import { useLeadsData } from "@/context/LeadsDataContext";
import { useLeadsTab } from "@/hooks/useLeadsTab";

export default function Leads() {
  const { t } = useLanguage();
  const { moveAiLeadToHuman, humanLeads } = useLeadsData();
  const { tab, switchTab, leads, humanLeadCount, aiLeadCount } = useLeadsTab();
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callModalLead, setCallModalLead] = useState(null);

  const openCallModal = (lead) => {
    setCallModalLead(lead ?? null);
    setCallModalOpen(true);
  };

  const handleCallModalOpenChange = (nextOpen) => {
    setCallModalOpen(nextOpen);
    if (!nextOpen) setCallModalLead(null);
  };

  return (
    <AppScreen
      screenTestId="leads-screen"
      mainTestId="leads-main"
      mainBgClass="bg-[#F7F8FB]"
      showBottomNav
    >
      <div className="flex items-center justify-between gap-3 pt-[16px] pb-0">
        <h1
          data-testid="page-title"
          className="font-suzuki text-[18px] font-bold leading-none text-[color:var(--gray-300)]"
        >
          {t.myLeads}
        </h1>
        <div className="flex shrink-0 items-center gap-[10px]">
          <button
            type="button"
            data-testid="leads-header-phone-btn"
            aria-label="Phone"
            onClick={() => openCallModal(null)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e9ebef] bg-white text-[#6b7380] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
          >
            <Phone className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            data-testid="leads-header-search-btn"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e9ebef] bg-white text-[#6b7380] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
          >
            <Search className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth={2.75} />
          </button>
          <button
            type="button"
            data-testid="leads-header-filter-btn"
            aria-label="Filter"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e9ebef] bg-white text-[#6b7380] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
          >
            <Filter className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={2.25} />
          </button>
        </div>
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

      <CallNumberModal
        open={callModalOpen}
        onOpenChange={handleCallModalOpenChange}
        initialLead={callModalLead}
        humanLeads={humanLeads}
      />
    </AppScreen>
  );
}
