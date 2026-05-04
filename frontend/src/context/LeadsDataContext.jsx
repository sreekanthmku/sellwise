import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { aiLeads as initialAi, humanLeads as initialHuman } from "@/data/mockLeads";

const LeadsDataContext = createContext(null);

function cloneInitial() {
  return {
    human: structuredClone(initialHuman),
    ai: structuredClone(initialAi),
  };
}

export function LeadsDataProvider({ children }) {
  const [{ human, ai }, setLists] = useState(cloneInitial);

  const moveAiLeadToHuman = useCallback((leadId) => {
    setLists((prev) => {
      const idx = prev.ai.findIndex((l) => l.id === leadId);
      if (idx === -1) return prev;
      const [moved] = prev.ai.slice(idx, idx + 1);
      return {
        human: [...prev.human, moved],
        ai: [...prev.ai.slice(0, idx), ...prev.ai.slice(idx + 1)],
      };
    });
  }, []);

  const getLeadById = useCallback(
    (leadId) => human.find((l) => l.id === leadId) ?? ai.find((l) => l.id === leadId),
    [human, ai],
  );

  const value = useMemo(
    () => ({
      humanLeads: human,
      aiLeads: ai,
      moveAiLeadToHuman,
      getLeadById,
    }),
    [human, ai, moveAiLeadToHuman, getLeadById],
  );

  return (
    <LeadsDataContext.Provider value={value}>{children}</LeadsDataContext.Provider>
  );
}

export function useLeadsData() {
  const ctx = useContext(LeadsDataContext);
  if (!ctx) {
    throw new Error("useLeadsData must be used within LeadsDataProvider");
  }
  return ctx;
}
