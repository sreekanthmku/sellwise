import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Link2,
  MessageCircleMore,
  Phone,
  PhoneCall,
  RefreshCw,
  Smile,
  UserRoundCheck,
  Users,
  Wallet,
} from "lucide-react";
import { AppScreen } from "@/components/AppScreen";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

function MonthlySummaryMetricTile({ icon: Icon, iconWrapClassName, label, value }) {
  return (
    <div className="flex min-h-0 gap-2.5 rounded-2xl border border-[#e8eaef] bg-white p-3 shadow-sm sm:gap-3 sm:p-3.5">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11",
          iconWrapClassName,
        )}
      >
        <Icon className="h-[1.125rem] w-[1.125rem] text-white sm:h-5 sm:w-5" strokeWidth={2.1} />
      </span>
      <div className="min-w-0 flex-1 text-end">
        <p className="text-xs font-medium leading-snug text-[color:var(--gray-200)] sm:text-sm">{label}</p>
        <p className="mt-1 text-end text-lg font-bold tabular-nums leading-none text-[color:var(--suzuki-blue)] sm:text-xl md:text-2xl">
          {value}
        </p>
      </div>
    </div>
  );
}

function PipelineRow({ label, value, total, color }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      <span className="h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5" style={{ backgroundColor: color }} />
      <span className="min-w-0 max-w-[40%] shrink text-xs leading-tight text-[#61656b] sm:max-w-[44%] sm:text-sm">
        {label}
      </span>
      <span className="min-w-[0.75rem] flex-1 border-b border-dashed border-[#8f939a]/85" />
      <span className="shrink-0 text-left text-xs font-semibold tabular-nums leading-none text-[#1f2227] sm:text-sm">
        {value}
      </span>
      <span
        className="w-8 shrink-0 text-left text-xs font-semibold tabular-nums leading-none sm:w-9 sm:text-sm"
        style={{ color }}
      >
        {percentage}%
      </span>
    </div>
  );
}

function ProgressRow({ label, value, total, color }) {
  const percentage = Math.round((value / total) * 100);
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="w-[118px] text-[13px] leading-none text-[#61656b]">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#d7dbe2]">
        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
      <span className="w-[18px] text-left text-[13px] font-semibold leading-none text-[#1f2227]">
        {value}
      </span>
      <span className="w-[28px] text-left text-[12px] font-semibold leading-none" style={{ color }}>
        {percentage}%
      </span>
    </div>
  );
}

function OutcomeRow({ label, value, total, color }) {
  const percentage = Math.round((value / total) * 100);
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="w-[144px] text-[13px] leading-none text-[#61656b]">{label}</span>
      <span className="flex-1 border-b border-dashed border-[#8f939a]" />
      <span className="w-[18px] text-left text-[13px] font-semibold leading-none text-[#1f2227]">{value}</span>
      <span className="w-[28px] text-left text-[12px] font-semibold leading-none" style={{ color }}>
        {percentage}%
      </span>
    </div>
  );
}

export default function Analyze() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("daily");

  const monthlyStatusRows = [
    { key: "new", value: 120, color: "#1d4ed8" },
    { key: "contacted", value: 85, color: "#22c55e" },
    { key: "interested", value: 60, color: "#f97316" },
    { key: "followUpRequired", value: 45, color: "#f59e0b" },
    { key: "testRideScheduled", value: 30, color: "#a855f7" },
    { key: "visitedShowroom", value: 20, color: "#6366f1" },
    { key: "bookingLikely", value: 15, color: "#14b8a6" },
    { key: "booked", value: 10, color: "#16a34a" },
    { key: "lost", value: 12, color: "#ef4444" },
  ];

  const monthlyLeadTotal = monthlyStatusRows.reduce((sum, row) => sum + row.value, 0);

  const monthPeriodLabel = useMemo(() => {
    const now = new Date();
    const locale = lang === "ja" ? "ja-JP" : lang === "id" ? "id-ID" : "en-US";
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(now);
  }, [lang]);

  const dailyStatusRows = [
    { label: "Connected", value: 52, color: "#29b85a" },
    { label: "No answer", value: 34, color: "#f04343" },
    { label: "Callback requested", value: 18, color: "#f09a0c" },
    { label: "Busy", value: 12, color: "#eed33c" },
    { label: "Wrong number", value: 5, color: "#aeb0b2" },
  ];

  const dailyDispositionRows = [
    { label: "Interested", value: 36, color: "#29b85a" },
    { label: "Follow-up required", value: 28, color: "#f18f00" },
    { label: "Callback later", value: 20, color: "#f28d36" },
    { label: "Test ride scheduled", value: 14, color: "#9752e1" },
    { label: "Visited showroom", value: 9, color: "#5f61dd" },
    { label: "Booking Likely", value: 6, color: "#1fb2a3" },
    { label: "Booked", value: 3, color: "#29b85a" },
    { label: "Not interested", value: 7, color: "#f04343" },
    { label: "Lost", value: 5, color: "#df2b2b" },
  ];

  const dailyTotalFollowUps = 128;
  const donutSegments = [
    { key: "human", label: t.analyze.daily.metrics.humanCalling, value: 52, color: "#7758ff" },
    { key: "ai", label: t.analyze.daily.metrics.aiCalling, value: 46, color: "#34c7f3" },
    { key: "messaging", label: t.analyze.daily.metrics.messaging, value: 30, color: "#3bd977" },
  ];
  const donutBackground = `conic-gradient(${donutSegments
    .map((segment, index) => {
      const start = donutSegments
        .slice(0, index)
        .reduce((sum, current) => sum + Math.round((current.value / dailyTotalFollowUps) * 100), 0);
      const end = start + Math.round((segment.value / dailyTotalFollowUps) * 100);
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(", ")})`;

  const nextStepIconByKey = {
    callBackWarmLeads: PhoneCall,
    scheduleTestRides: CalendarDays,
    followUpOnShowroomVisits: UserRoundCheck,
    pushBrochureWhatsappInfo: MessageCircleMore,
  };

  const monthlyNextActionIconByKey = {
    followUpPending: RefreshCw,
    scheduleTestRidesWarm: CalendarDays,
    reengageShowroom: Building2,
  };

  return (
    <AppScreen
      screenTestId="analyze-screen"
      mainTestId="analyze-main"
      mainBgClass="bg-[#F7F8FB]"
      showBottomNav
    >
      <div className="pt-4 pb-0">
        <h1 className="font-suzuki text-lg font-bold leading-tight text-[color:var(--gray-300)] sm:text-xl">
          {t.analyze.title}
        </h1>
        <p className="mt-2 text-sm leading-snug text-[color:var(--gray-200)] sm:text-base">{t.analyze.subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-8 pt-4">
        <div className="rounded-2xl bg-[#edf0f5] p-1">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("daily")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold sm:rounded-[12px] ${
                activeTab === "daily"
                  ? "bg-[color:var(--blue-600)] text-white"
                  : "bg-[#f7f8fb] text-[color:var(--blue-500)]"
              }`}
            >
              {t.analyze.dailySummary}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("monthly")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold sm:rounded-[12px] ${
                activeTab === "monthly"
                  ? "bg-[color:var(--blue-600)] text-white"
                  : "bg-[#f7f8fb] text-[color:var(--blue-500)]"
              }`}
            >
              {t.analyze.monthlySummary}
            </button>
            <button
              type="button"
              className="flex aspect-square min-h-[2.5rem] w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f8fb] text-[color:var(--gray-200)] sm:rounded-[12px]"
              aria-label="Open date selector"
            >
              <CalendarDays className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {activeTab === "monthly" ? (
          <>
            <p className="mt-3 text-sm font-semibold text-[color:var(--gray-300)] sm:text-base">
              {monthPeriodLabel}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
              <MonthlySummaryMetricTile
                icon={Users}
                iconWrapClassName="bg-[#7c3aed]"
                label={t.analyze.metrics.activeLeads}
                value="397"
              />
              <MonthlySummaryMetricTile
                icon={Phone}
                iconWrapClassName="bg-[#ea580c]"
                label={t.analyze.metrics.contactsMade}
                value="277"
              />
              <MonthlySummaryMetricTile
                icon={CalendarCheck}
                iconWrapClassName="bg-[#16a34a]"
                label={t.analyze.metrics.bookingsDone}
                value="10"
              />
              <MonthlySummaryMetricTile
                icon={Wallet}
                iconWrapClassName="bg-[#1e40af]"
                label={t.analyze.metrics.revenue}
                value="249.8K"
              />
            </div>

            <Card className="mt-3 rounded-2xl border border-[#e8eaef] bg-white px-3 py-3.5 shadow-sm sm:px-4 sm:py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-bold leading-tight text-[color:var(--gray-300)] sm:text-lg">
                  {t.analyze.leadPipeline}
                </h2>
                <p className="text-sm font-semibold text-[color:var(--gray-200)] sm:text-base">
                  {t.analyze.totalLeadsLabel}{" "}
                  <span className="font-bold text-[color:var(--gray-300)]">{monthlyLeadTotal}</span>
                </p>
              </div>
              <div className="mt-3 space-y-2.5 sm:space-y-3">
                {monthlyStatusRows.map((item) => (
                  <PipelineRow
                    key={item.key}
                    label={t.analyze.statuses[item.key]}
                    value={item.value}
                    total={monthlyLeadTotal}
                    color={item.color}
                  />
                ))}
              </div>
            </Card>

            <Card className="mt-3 rounded-2xl border border-[#e8eaef] bg-white px-3 py-3.5 shadow-sm sm:px-4 sm:py-4">
              <h2 className="text-base font-bold leading-tight text-[color:var(--gray-300)] sm:text-lg">
                {t.analyze.nextBestActions}
              </h2>
              <div className="mt-1 divide-y divide-[#eef1f5]">
                {t.analyze.nextBestActionsItems.map((item) => {
                  const Icon = monthlyNextActionIconByKey[item.iconKey];
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 py-3.5 first:pt-3 sm:gap-4 sm:py-4"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[color:var(--blue-600)] sm:h-11 sm:w-11">
                        {Icon ? (
                          <Icon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={2.1} />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug text-[color:var(--gray-300)] sm:text-[15px]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-snug text-[color:var(--gray-200)] sm:text-sm">
                          <span className="font-bold text-[color:var(--gray-300)]">{item.highlight}</span>
                          {item.bodyAfter}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate("/leads")}
                        className="shrink-0 rounded-full border border-[color:var(--blue-600)] bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--blue-600)] transition-colors hover:bg-[#f8fafc] sm:px-3.5 sm:py-2 sm:text-sm"
                      >
                        {t.analyze.viewLeads}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        ) : (
          <>
            <p className="mt-3 text-[13px] font-semibold text-[color:var(--gray-300)]">Today, May 10, 2026</p>

            <Card className="mt-2.5 rounded-[24px] border border-[#d3d6dc] bg-white px-4 py-3.5 shadow-none">
              <div className="grid grid-cols-[0.9fr_0.9fr_1fr] items-center gap-3.5">
                <div className="pr-2">
                  <p className="text-[14px] leading-none text-[#5b5d62]">Total Follow-ups</p>
                  <p className="mt-2.5 text-[30px] font-bold leading-none text-[#0a3c90]">
                    {dailyTotalFollowUps}
                  </p>
                  <p className="mt-3 flex items-center gap-1 text-[10px] font-semibold leading-none">
                    <span className="text-[#2ebf63]">↗+12</span>
                    <span className="text-[#343a45]">vs Yesterday</span>
                  </p>
                </div>
                <div className="flex justify-center border-l border-[#d0d3d8] pl-3">
                  <div
                    className="relative h-[104px] w-[104px] rounded-full"
                    style={{ background: donutBackground }}
                    aria-label="Follow-up split"
                  >
                    <div className="absolute inset-[30px] rounded-full bg-white" />
                    <span className="absolute right-[13px] top-[40px] text-[8.5px] font-bold leading-none text-white">
                      41%
                    </span>
                    <span className="absolute bottom-[17px] left-[31px] text-[8.5px] font-bold leading-none text-white">
                      36%
                    </span>
                    <span className="absolute left-[17px] top-[18px] text-[8.5px] font-bold leading-none text-white">
                      23%
                    </span>
                  </div>
                </div>
                <div className="min-w-0 space-y-2.5 pl-0.5">
                  {donutSegments.map((segment) => (
                    <div key={segment.key} className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="w-[46px] text-[10px] font-medium leading-none text-[#283244]">
                        {segment.label}
                      </span>
                      <span className="flex-1 border-b border-dashed border-[#8f939a]" />
                      <span className="w-[14px] text-left text-[10px] font-bold leading-none text-[#1f2636]">
                        {segment.value}
                      </span>
                      <span className="w-[22px] text-left text-[10px] font-medium leading-none text-[#303a4b]">
                        {Math.round((segment.value / dailyTotalFollowUps) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="mt-3 rounded-[24px] border border-[#d8dbe1] bg-white px-4 py-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#cbc7ef] text-[#565862]">
                    <Link2 className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-[12px] leading-none text-[#5b5d62]">Connect Rate</p>
                    <p className="mt-1.5 text-[19px] font-bold leading-none text-[#0a3c90]">41%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#efcc9f] text-[#565862]">
                    <Smile className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-[12px] leading-none text-[#5b5d62]">Interest Rate</p>
                    <p className="mt-1.5 text-[19px] font-bold leading-none text-[#0a3c90]">69%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#95dfbc] text-[#565862]">
                    <CalendarDays className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-[12px] leading-none text-[#5b5d62]">Bookings</p>
                    <p className="mt-1.5 text-[19px] font-bold leading-none text-[#0a3c90]">3</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="mt-3 rounded-[20px] border-none bg-white px-3.5 py-3.5 shadow-none">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[18px] font-bold leading-none text-[#1f2227]">
                  Call Attempt Status
                </h2>
                <p className="text-[13px] font-semibold text-[#565a60]">
                  Total Attempts: {dailyTotalFollowUps}
                </p>
              </div>
              <div className="space-y-3">
                {dailyStatusRows.map((item) => (
                  <ProgressRow
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    total={dailyTotalFollowUps}
                    color={item.color}
                  />
                ))}
              </div>
            </Card>

            <Card className="mt-3 rounded-[20px] border-none bg-white px-3.5 py-3.5 shadow-none">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[18px] font-bold leading-none text-[#1f2227]">
                  Lead Outcomes
                </h2>
                <p className="text-[13px] font-semibold text-[#565a60]">
                  Total Leads: {dailyTotalFollowUps}
                </p>
              </div>
              <div className="space-y-3">
                {dailyDispositionRows.map((item) => (
                  <OutcomeRow
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    total={dailyTotalFollowUps}
                    color={item.color}
                  />
                ))}
              </div>
            </Card>

            <Card className="mt-3 rounded-[20px] border-none bg-white px-3.5 py-3.5 shadow-[var(--card-shadow)]">
              <h2 className="text-[20px] font-bold leading-none text-[color:var(--gray-300)]">
                {t.analyze.daily.nextSteps}
              </h2>
              <div className="mt-2.5 space-y-0">
                {t.analyze.daily.nextStepsItems.map((item) => {
                  const Icon = nextStepIconByKey[item.iconKey];
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 border-b border-[#eef1f5] py-3.5 first:pt-1 last:border-none last:pb-0"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0f4fd] text-[color:var(--suzuki-blue)]">
                        <Icon className="h-[17px] w-[17px]" strokeWidth={2.1} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold leading-snug text-[color:var(--gray-300)]">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-snug text-[color:var(--gray-200)]">{item.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppScreen>
  );
}
