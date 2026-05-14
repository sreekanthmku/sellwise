import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  Bot,
  Phone,
  Search,
  Filter,
  ChevronDown,
  Check,
  CalendarDays,
  UserRound,
  Pause,
  ArrowRight,
  X,
  Clock,
  Minus,
  Plus,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { LeadCard } from "@/components/LeadCard";
import { TabButton } from "@/components/leads/TabButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useLeadsData } from "@/context/LeadsDataContext";
import { useLeadsTab } from "@/hooks/useLeadsTab";
import { mergeLeadDetail } from "@/data/leadDetails";
import { phoneDisplayToE164 } from "@/lib/phoneE164";
import { postUlaiOutboundCall } from "@/lib/ulaiApi";

const tpl = (str, vars) =>
  str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));

function leadMatchesSearch(lead, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const detail = mergeLeadDetail(lead);
  const searchable = [
    lead.name,
    lead.interestedIn,
    detail.phoneDisplay,
    detail.location,
    ...(detail.recommendedModels || []).map((model) => model.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(q);
}

function leadMatchesFilters(lead, priorityFilters, statusFilters) {
  if (priorityFilters.size > 0 && !priorityFilters.has(lead.priority)) return false;
  if (statusFilters.size > 0) {
    const tags = Array.isArray(lead.tags) ? lead.tags : [];
    if (!tags.some((tag) => statusFilters.has(tag))) return false;
  }
  return true;
}

function toggleSetValue(setter, value) {
  setter((prev) => {
    const next = new Set(prev);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  });
}

function FilterChip({ selected, children, onClick, testid }) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 font-body text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)] ${
        selected
          ? "border-[color:var(--blue-600)] bg-[color:var(--blue-200)] text-[color:var(--blue-600)]"
          : "border-[#e9ebef] bg-white text-[color:var(--gray-300)] hover:bg-[#fafafa]"
      }`}
    >
      {children}
    </button>
  );
}

function FilterLeadsDrawer({
  open,
  onOpenChange,
  priorityOptions,
  statusOptions,
  draftPriorities,
  setDraftPriorities,
  draftStatuses,
  setDraftStatuses,
  onClear,
  onApply,
  t,
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        data-testid="filter-leads-drawer"
        className="mx-auto max-h-[90dvh] w-full max-w-[440px] overflow-hidden rounded-t-[24px] border border-[#e9ebef] bg-white px-5 pb-5 pt-0 shadow-xl"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-4">
          <div className="mt-1 flex items-center justify-between gap-4">
            <DrawerTitle className="font-body text-[18px] font-bold leading-tight text-[color:var(--gray-300)]">
              Filter leads
            </DrawerTitle>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="Close filters"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F8FB] text-[color:var(--gray-300)] transition-colors hover:bg-[#eef0f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </DrawerClose>
          </div>

          <div className="mt-5">
            <p className="font-body text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--gray-200)]">
              Priority
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {priorityOptions.map((priority) => (
                <FilterChip
                  key={priority}
                  selected={draftPriorities.has(priority)}
                  onClick={() => toggleSetValue(setDraftPriorities, priority)}
                  testid={`filter-priority-${priority}`}
                >
                  {t.priority[priority] ?? priority}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="font-body text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--gray-200)]">
              Lead Status
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <FilterChip
                  key={status}
                  selected={draftStatuses.has(status)}
                  onClick={() => toggleSetValue(setDraftStatuses, status)}
                  testid={`filter-status-${status}`}
                >
                  {t.tags[status] ?? status}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[0.95fr_2.2fr] gap-3">
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border border-[#e9ebef] bg-white px-4 py-3 font-body text-[14px] font-semibold text-[color:var(--gray-300)] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={onApply}
              className="rounded-full bg-[color:var(--blue-600)] px-4 py-3 font-body text-[14px] font-semibold text-white transition-colors hover:bg-[color:var(--blue-700)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
            >
              Apply
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ScheduleAiCallsDrawer({
  open,
  onOpenChange,
  selectedLeadCount,
  selectedLeads,
  onScheduled,
}) {
  const { t } = useLanguage();
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryAfter, setRetryAfter] = useState(2);
  const [retryUnit, setRetryUnit] = useState("hr");

  const updateCount = (setter, delta, min, max) => {
    setter((value) => Math.min(max, Math.max(min, value + delta)));
  };

  const handleConfirmSchedule = () => {
    if (!selectedLeads.length) return;
    const leadsSnapshot = [...selectedLeads];
    onScheduled?.();
    onOpenChange(false);

    void (async () => {
      let ok = 0;
      let fail = 0;
      let firstError = "";
      for (const lead of leadsSnapshot) {
        const phone = phoneDisplayToE164(mergeLeadDetail(lead).phoneDisplay);
        if (!phone) {
          fail += 1;
          continue;
        }
        try {
          await postUlaiOutboundCall(phone);
          ok += 1;
        } catch (e) {
          fail += 1;
          if (!firstError && e instanceof Error && e.message) firstError = e.message;
        }
      }
      if (ok > 0 && fail === 0) {
        toast.success(tpl(t.scheduleAiCallsApiSuccess, { count: ok }), { duration: 3200 });
      } else if (ok > 0 && fail > 0) {
        toast.warning(tpl(t.scheduleAiCallsApiPartial, { ok, fail }), { duration: 4000 });
      } else {
        toast.error(
          tpl(t.scheduleAiCallsApiFail, {
            message: firstError || "—",
          }),
          { duration: 4500 },
        );
      }
    })();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        data-testid="schedule-ai-calls-drawer"
        className="mx-auto max-h-[90dvh] w-full max-w-[440px] overflow-hidden rounded-t-[24px] border border-[#e9ebef] bg-white px-5 pb-5 pt-0 shadow-xl"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-4">
          <div className="mt-1 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DrawerTitle className="font-body text-[18px] font-bold leading-tight text-[color:var(--gray-300)]">
                Schedule AI calls
              </DrawerTitle>
              <DrawerDescription className="mt-3 font-body text-[14px] leading-relaxed text-[color:var(--gray-200)]">
                AI will attempt a call, then a WhatsApp message if unanswered. You can override
                anytime.
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="Close schedule AI calls"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F8FB] text-[color:var(--gray-300)] transition-colors hover:bg-[#eef0f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </DrawerClose>
          </div>

          <div className="mt-5">
            <p className="font-body text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--gray-200)]">
              Start Day
            </p>
            <p className="mt-2 font-body text-[15px] font-bold text-[color:var(--gray-300)]">Today</p>
          </div>

          <div className="mt-5">
            <p className="font-body text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--gray-200)]">
              Calling Window
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              {[
                { label: "Start", value: "10:00 AM" },
                { label: "End", value: "07:00 PM" },
              ].map((field, index) => (
                <div key={field.label} className="contents">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[12px] border border-[#e9ebef] bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
                  >
                    <span>
                      <span className="block font-body text-[11px] font-bold uppercase tracking-[0.04em] text-[color:var(--gray-200)]">
                        {field.label}
                      </span>
                      <span className="mt-1.5 block whitespace-nowrap font-body text-[17px] font-bold leading-none text-[color:var(--gray-300)]">
                        {field.value}
                      </span>
                    </span>
                    <Clock className="h-5 w-5 shrink-0 text-[color:var(--gray-300)]" strokeWidth={2.25} />
                  </button>
                  {index === 0 && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--gray-200)]" strokeWidth={2.25} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_1fr_1.05fr] gap-x-3 gap-y-2.5">
            <p className="font-body text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--gray-200)]">
              Max Retries
            </p>
            <p className="font-body text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--gray-200)]">
              Retry After
            </p>
            <span aria-hidden="true" />
            <div className="flex h-12 items-center justify-between overflow-hidden rounded-[12px] border border-[#e9ebef] bg-white">
              <button
                type="button"
                onClick={() => updateCount(setMaxRetries, -1, 1, 9)}
                className="flex h-full w-11 items-center justify-center text-[color:var(--gray-300)] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--blue-400)]"
              >
                <Minus className="h-4 w-4" strokeWidth={3} />
              </button>
              <span className="font-body text-[17px] font-bold text-[color:var(--gray-300)]">{maxRetries}</span>
              <button
                type="button"
                onClick={() => updateCount(setMaxRetries, 1, 1, 9)}
                className="flex h-full w-11 items-center justify-center text-[color:var(--gray-300)] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--blue-400)]"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
            <div className="flex h-12 items-center justify-between overflow-hidden rounded-[12px] border border-[#e9ebef] bg-white">
              <button
                type="button"
                onClick={() => updateCount(setRetryAfter, -1, 1, 24)}
                className="flex h-full w-11 items-center justify-center text-[color:var(--gray-300)] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--blue-400)]"
              >
                <Minus className="h-4 w-4" strokeWidth={3} />
              </button>
              <span className="font-body text-[17px] font-bold text-[color:var(--gray-300)]">{retryAfter}</span>
              <button
                type="button"
                onClick={() => updateCount(setRetryAfter, 1, 1, 24)}
                className="flex h-full w-11 items-center justify-center text-[color:var(--gray-300)] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--blue-400)]"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
            <div className="grid h-12 grid-cols-3 gap-1 rounded-[12px] border border-[#e9ebef] bg-white p-1">
              {["min", "hr", "day"].map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setRetryUnit(unit)}
                  className={`rounded-[9px] font-body text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--blue-400)] ${
                    retryUnit === unit
                      ? "bg-[color:var(--blue-600)] text-white"
                      : "bg-transparent text-[color:var(--gray-200)] hover:bg-[#fafafa]"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-[12px] bg-[color:var(--blue-200)] px-3 py-3 font-body text-[14px] font-semibold text-[color:var(--blue-600)]">
            <Bot className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            <span>
              {selectedLeadCount} leads · {maxRetries} retries · every {retryAfter}
              {retryUnit}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-[0.95fr_2.2fr] gap-3">
            <DrawerClose asChild>
              <button
                type="button"
                className="rounded-full border border-[#e9ebef] bg-white px-4 py-3 font-body text-[14px] font-semibold text-[color:var(--gray-300)] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
              >
                Cancel
              </button>
            </DrawerClose>
            <button
              type="button"
              disabled={selectedLeadCount === 0}
              onClick={handleConfirmSchedule}
              className="rounded-full bg-[color:var(--blue-600)] px-4 py-3 font-body text-[14px] font-semibold text-white transition-colors hover:bg-[color:var(--blue-700)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)] disabled:pointer-events-none disabled:opacity-50"
            >
              Confirm schedule
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { moveAiLeadToHuman, aiLeads } = useLeadsData();
  const { tab, switchTab, leads, humanLeadCount, aiLeadCount } = useLeadsTab();
  const [selectedAiLeadIds, setSelectedAiLeadIds] = useState(() => new Set());
  const [scheduleAiCallsOpen, setScheduleAiCallsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [priorityFilters, setPriorityFilters] = useState(() => new Set());
  const [statusFilters, setStatusFilters] = useState(() => new Set());
  const [draftPriorityFilters, setDraftPriorityFilters] = useState(() => new Set());
  const [draftStatusFilters, setDraftStatusFilters] = useState(() => new Set());

  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (lead) =>
          leadMatchesSearch(lead, searchQuery) &&
          leadMatchesFilters(lead, priorityFilters, statusFilters),
      ),
    [leads, priorityFilters, searchQuery, statusFilters],
  );
  const priorityOptions = ["high", "medium", "low"];
  const statusOptions = useMemo(() => {
    const seen = new Set();
    leads.forEach((lead) => {
      (lead.tags || []).forEach((tag) => seen.add(tag));
    });
    return Array.from(seen);
  }, [leads]);
  const visibleAiLeadIds = tab === "ai" ? filteredLeads.map((lead) => lead.id) : [];
  const selectedAiLeadCount = selectedAiLeadIds.size;
  const selectedAiLeads = useMemo(
    () => aiLeads.filter((lead) => selectedAiLeadIds.has(lead.id)),
    [aiLeads, selectedAiLeadIds],
  );
  const hasSelectedAiLeads = selectedAiLeadCount > 0;
  const hasActiveFilters = priorityFilters.size > 0 || statusFilters.size > 0;
  const allVisibleAiLeadsSelected =
    visibleAiLeadIds.length > 0 && visibleAiLeadIds.every((id) => selectedAiLeadIds.has(id));

  const handleSelectAllAiLeads = (checked) => {
    setSelectedAiLeadIds((prev) => {
      const next = new Set(prev);
      visibleAiLeadIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const handleSelectAiLead = (leadId, checked) => {
    setSelectedAiLeadIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(leadId);
      else next.delete(leadId);
      return next;
    });
  };

  const handleMoveSelectedAiLeadsToHuman = () => {
    const leadIdsToMove = Array.from(selectedAiLeadIds);
    if (leadIdsToMove.length === 0) return;

    leadIdsToMove.forEach((leadId) => moveAiLeadToHuman(leadId));
    setSelectedAiLeadIds(new Set());
  };

  const toggleSearch = () => {
    setSearchOpen((open) => {
      const nextOpen = !open;
      if (!nextOpen) setSearchQuery("");
      return nextOpen;
    });
  };

  const openFilterDrawer = () => {
    setDraftPriorityFilters(new Set(priorityFilters));
    setDraftStatusFilters(new Set(statusFilters));
    setFilterOpen(true);
  };

  const clearDraftFilters = () => {
    setDraftPriorityFilters(new Set());
    setDraftStatusFilters(new Set());
  };

  const applyDraftFilters = () => {
    setPriorityFilters(new Set(draftPriorityFilters));
    setStatusFilters(new Set(draftStatusFilters));
    setFilterOpen(false);
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
            onClick={() => navigate("/dialer")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e9ebef] bg-white text-[#6b7380] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
          >
            <Phone className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            data-testid="leads-header-search-btn"
            aria-label="Search"
            onClick={toggleSearch}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)] ${
              searchOpen
                ? "border-[#AFC6FF] bg-[color:var(--blue-200)] text-[color:var(--blue-600)]"
                : "border-[#e9ebef] bg-white text-[#6b7380] hover:bg-[#fafafa]"
            }`}
          >
            <Search className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth={2.75} />
          </button>
          <button
            type="button"
            data-testid="leads-header-filter-btn"
            aria-label="Filter"
            onClick={openFilterDrawer}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)] ${
              filterOpen || hasActiveFilters
                ? "border-[#AFC6FF] bg-[color:var(--blue-200)] text-[color:var(--blue-600)]"
                : "border-[#e9ebef] bg-white text-[#6b7380] hover:bg-[#fafafa]"
            }`}
          >
            <Filter className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div
          className="mt-4 flex h-12 items-center gap-2.5 rounded-[14px] border border-[color:var(--blue-400)] bg-white px-3 shadow-[0_0_0_1.5px_rgba(37,99,234,0.10)]"
          data-testid="leads-search-bar"
        >
          <Search className="h-[18px] w-[18px] shrink-0 text-[color:var(--gray-200)]" strokeWidth={2.5} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads, model, phone"
            autoFocus
            data-testid="leads-search-input"
            className="min-w-0 flex-1 bg-transparent font-body text-[15px] font-medium text-[color:var(--gray-300)] outline-none placeholder:text-[color:var(--gray-200)]"
          />
          <button
            type="button"
            aria-label="Close search"
            data-testid="leads-search-close"
            onClick={() => {
              setSearchQuery("");
              setSearchOpen(false);
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef0f3] text-[color:var(--gray-200)] transition-colors hover:bg-[#e5e7eb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}

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
        {tab === "ai" && filteredLeads.length > 0 && (
          <div
            className="mb-4 flex min-h-[56px] items-center justify-between gap-3 rounded-[20px] border border-[#E5E7EB] bg-white px-4 py-3"
            data-testid="ai-bulk-actions"
          >
            <label className="flex min-w-0 items-center gap-3">
              <span className="relative inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={allVisibleAiLeadsSelected}
                  onChange={(e) => handleSelectAllAiLeads(e.target.checked)}
                  aria-label="Select all AI follow-up leads"
                  data-testid="ai-select-all"
                  className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className="pointer-events-none flex h-[22px] w-[22px] items-center justify-center rounded-[2px] border-2 border-[#9CA3AF] bg-white transition-colors peer-checked:border-[color:var(--blue-600)] peer-checked:bg-[color:var(--blue-600)] peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--blue-400)] peer-focus-visible:ring-offset-2"
                  aria-hidden="true"
                >
                  <Check className="h-4 w-4 text-white" strokeWidth={3} />
                </span>
              </span>
              <span className="truncate font-body text-[16px] font-medium text-[color:var(--gray-200)]">
                Select All
              </span>
            </label>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={!hasSelectedAiLeads}
                  data-testid="ai-bulk-action-button"
                  className="flex shrink-0 items-center gap-2 font-body text-[16px] font-bold text-[color:var(--blue-600)] transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:text-[color:var(--gray-200)] disabled:opacity-50 data-[state=open]:opacity-80"
                >
                  Bulk action
                  <ChevronDown className="h-6 w-6" strokeWidth={2.75} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                data-testid="ai-bulk-action-menu"
                className="w-[300px] max-w-[calc(100vw-32px)] rounded-[12px] border border-[#e9ebef] bg-white p-0 shadow-[0_10px_32px_rgba(15,23,42,0.12)]"
              >
                <DropdownMenuLabel className="px-4 pb-2.5 pt-4 font-body text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--gray-200)]">
                  {selectedAiLeadCount} leads selected
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-3 my-0 bg-[#eef0f3]" />
                <DropdownMenuItem
                  onSelect={() => setScheduleAiCallsOpen(true)}
                  className="flex cursor-pointer items-center gap-3 rounded-none px-4 py-3 font-body text-[14px] font-semibold text-[color:var(--blue-600)] focus:bg-[color:var(--blue-100)] focus:text-[color:var(--blue-600)]"
                >
                  <CalendarDays className="h-4 w-4 text-[color:var(--blue-600)]" strokeWidth={2.25} />
                  <span>Schedule AI calls ({selectedAiLeadCount})</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleMoveSelectedAiLeadsToHuman}
                  className="flex cursor-pointer items-center gap-3 rounded-none px-4 py-3 font-body text-[14px] font-medium text-[color:var(--gray-300)] focus:bg-[#fafafa] focus:text-[color:var(--gray-300)]"
                >
                  <UserRound className="h-4 w-4 text-[color:var(--gray-300)]" strokeWidth={2.25} />
                  <span>Move to human follow-up</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-none px-4 py-3 font-body text-[14px] font-medium text-[color:var(--gray-300)] focus:bg-[#fafafa] focus:text-[color:var(--gray-300)]">
                  <Pause className="h-4 w-4 text-[color:var(--gray-300)]" fill="currentColor" strokeWidth={0} />
                  <span>Pause AI follow-up</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-none px-4 pb-4 pt-3 font-body text-[14px] font-medium text-[color:var(--gray-300)] focus:bg-[#fafafa] focus:text-[color:var(--gray-300)]">
                  <ArrowRight className="h-4 w-4 text-[color:var(--gray-300)]" strokeWidth={2.25} />
                  <span>Export selected</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="flex flex-col gap-4" data-testid="leads-list">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              variant={tab === "ai" ? "ai" : "human"}
              isSelected={tab === "ai" ? selectedAiLeadIds.has(lead.id) : false}
              onSelectedChange={
                tab === "ai" ? (checked) => handleSelectAiLead(lead.id, checked) : undefined
              }
            />
          ))}
        </div>
        {filteredLeads.length === 0 && (
          <p
            className="mt-10 text-center font-body text-[14px] font-medium text-[color:var(--gray-200)]"
            data-testid="leads-empty-search"
          >
            No leads found
          </p>
        )}
      </div>

      <ScheduleAiCallsDrawer
        open={scheduleAiCallsOpen}
        onOpenChange={setScheduleAiCallsOpen}
        selectedLeadCount={selectedAiLeadCount}
        selectedLeads={selectedAiLeads}
        onScheduled={() => setSelectedAiLeadIds(new Set())}
      />
      <FilterLeadsDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        priorityOptions={priorityOptions}
        statusOptions={statusOptions}
        draftPriorities={draftPriorityFilters}
        setDraftPriorities={setDraftPriorityFilters}
        draftStatuses={draftStatusFilters}
        setDraftStatuses={setDraftStatusFilters}
        onClear={clearDraftFilters}
        onApply={applyDraftFilters}
        t={t}
      />
    </AppScreen>
  );
}
