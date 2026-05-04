import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { humanLeads, aiLeads } from "@/data/mockLeads";

export function useLeadsTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "ai" ? "ai" : "human";
  const [tab, setTab] = useState(initialTab);

  const switchTab = (next) => {
    setTab(next);
    setSearchParams(next === "ai" ? { tab: "ai" } : {}, { replace: true });
  };

  const leads = tab === "human" ? humanLeads : aiLeads;

  return {
    tab,
    switchTab,
    leads,
    humanLeadCount: humanLeads.length,
    aiLeadCount: aiLeads.length,
  };
}
