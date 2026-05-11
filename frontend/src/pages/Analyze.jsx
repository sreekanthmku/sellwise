import { useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  Link2,
  MessageCircleMore,
  PhoneCall,
  Smile,
  UserRoundCheck,
} from "lucide-react";
import { AppScreen } from "@/components/AppScreen";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[12px] border border-[#dbe2ef] bg-[#e9eef8] px-3 py-2.5">
      <p className="text-[12px] leading-none text-[color:var(--gray-200)]">{label}</p>
      <p className="mt-2 text-[32px] font-bold leading-none text-[color:var(--suzuki-blue)]">
        {value}
      </p>
    </div>
  );
}

function StatusRow({ label, value, color }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="w-[132px] text-[14px] leading-none text-[color:var(--gray-200)]">{label}</span>
      <span className="flex-1 border-b border-dotted border-[#9ca3af]/70" />
      <span className="w-8 text-left text-[14px] font-medium leading-none text-[color:var(--gray-300)]">
        {value}
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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("daily");

  const monthlyStatusRows = [
    { key: "new", value: 120, color: "#1d4ed8" },
    { key: "contacted", value: 85, color: "#38bdf8" },
    { key: "interested", value: 60, color: "#22c55e" },
    { key: "followUpRequired", value: 45, color: "#f59e0b" },
    { key: "testRideScheduled", value: 30, color: "#a855f7" },
    { key: "visitedShowroom", value: 20, color: "#6366f1" },
    { key: "bookingLikely", value: 15, color: "#14b8a6" },
    { key: "booked", value: 10, color: "#16a34a" },
    { key: "lost", value: 12, color: "#ef4444" },
  ];

  const bookingRows = [
    { customer: "Amit Shah", vehicle: "e-Vitara", saleDate: "14 May", value: "₹17.9 L" },
    { customer: "Priya Nair", vehicle: "Fronx", saleDate: "12 May", value: "₹13.7 L" },
    { customer: "Rohit Mehta", vehicle: "XL 7 Hybrid", saleDate: "09 May", value: "₹15.50 L" },
  ];

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

  return (
    <AppScreen
      screenTestId="analyze-screen"
      mainTestId="analyze-main"
      mainBgClass="bg-[#F7F8FB]"
      showBottomNav
    >
      <div className="pt-[16px] pb-0">
        <h1 className="font-suzuki text-[18px] font-bold leading-none text-[color:var(--gray-300)]">
          {t.analyze.title}
        </h1>
        <p className="mt-2 text-[14px] leading-snug text-[color:var(--gray-200)]">{t.analyze.subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-8 pt-4">
        <div className="rounded-[16px] bg-[#edf0f5] p-1">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("daily")}
              className={`rounded-[12px] px-3 py-2 text-[13px] font-semibold ${
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
              className={`rounded-[12px] px-3 py-2 text-[13px] font-semibold ${
                activeTab === "monthly"
                  ? "bg-[color:var(--blue-600)] text-white"
                  : "bg-[#f7f8fb] text-[color:var(--blue-500)]"
              }`}
            >
              {t.analyze.monthlySummary}
            </button>
            <button
              type="button"
              className="flex items-center justify-center rounded-[12px] bg-[#f7f8fb] text-[color:var(--gray-200)]"
              aria-label="Open date selector"
            >
              <CalendarRange className="h-4 w-4" />
            </button>
          </div>
        </div>

        {activeTab === "monthly" ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <MetricCard label={t.analyze.metrics.leadsUnderProgress} value="397" />
              <MetricCard label={t.analyze.metrics.contactsMade} value="277" />
              <MetricCard label={t.analyze.metrics.bookingsDone} value="10" />
              <MetricCard label={t.analyze.metrics.revenue} value="₹2498K" />
            </div>

            <Card className="mt-3 rounded-2xl border-[#e8eaef] bg-white px-3.5 py-3.5 shadow-[var(--card-shadow)]">
              <h2 className="text-[20px] font-bold leading-none text-[color:var(--gray-300)]">
                {t.analyze.leadStatus}
              </h2>
              <div className="mt-3.5 space-y-2.5">
                {monthlyStatusRows.map((item) => (
                  <StatusRow
                    key={item.key}
                    label={t.analyze.statuses[item.key]}
                    value={item.value}
                    color={item.color}
                  />
                ))}
              </div>
            </Card>

            <Card className="mt-3 rounded-2xl border-[#e8eaef] bg-white shadow-[var(--card-shadow)]">
              <div className="flex items-center justify-between px-3.5 pb-2 pt-3.5">
                <h2 className="text-[18px] font-bold leading-none text-[color:var(--gray-300)]">
                  {t.analyze.bookingsDone}
                </h2>
                <button
                  type="button"
                  className="text-[12px] font-semibold leading-none text-[color:var(--blue-600)]"
                >
                  {t.analyze.viewAll}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-[#dbe8f8] text-[12px] font-semibold text-[color:var(--gray-200)]">
                      <th className="px-3.5 py-2">{t.analyze.table.customer}</th>
                      <th className="px-2 py-2">{t.analyze.table.vehicle}</th>
                      <th className="px-2 py-2">{t.analyze.table.saleDate}</th>
                      <th className="px-3.5 py-2 text-left">{t.analyze.table.value}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingRows.map((row) => (
                      <tr
                        key={`${row.customer}-${row.vehicle}`}
                        className="text-[13px] text-[color:var(--gray-300)]"
                      >
                        <td className="border-b border-[#eef1f5] px-3.5 py-2.5">{row.customer}</td>
                        <td className="border-b border-[#eef1f5] px-2 py-2.5">{row.vehicle}</td>
                        <td className="border-b border-[#eef1f5] px-2 py-2.5">{row.saleDate}</td>
                        <td className="border-b border-[#eef1f5] px-3.5 py-2.5 text-left">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="mt-3 rounded-2xl border-[#e8eaef] bg-white px-3.5 py-3.5 shadow-[var(--card-shadow)]">
              <h2 className="text-[18px] font-bold leading-none text-[color:var(--gray-300)]">
                {t.analyze.keyInsights}
              </h2>
              <div className="mt-3 space-y-2.5">
                {t.analyze.insights.map((item) => (
                  <div key={item.title} className="border-b border-[#eef1f5] pb-2.5 last:border-none last:pb-0">
                    <p className="text-[14px] font-semibold leading-snug text-[color:var(--gray-300)]">
                      <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                      {item.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-snug text-[color:var(--gray-200)]">{item.body}</p>
                  </div>
                ))}
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
