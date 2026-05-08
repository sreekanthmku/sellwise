import { useState } from "react";
import { CalendarDays, MessageCircleMore, PhoneCall, UserRoundCheck } from "lucide-react";
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
      <span className="w-8 text-right text-[14px] font-medium leading-none text-[color:var(--gray-300)]">
        {value}
      </span>
    </div>
  );
}

export default function Analyze() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("monthly");

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
    { key: "connected", value: 52, color: "#22c55e" },
    { key: "noAnswer", value: 34, color: "#ef4444" },
    { key: "callbackRequested", value: 18, color: "#f59e0b" },
    { key: "busy", value: 12, color: "#fb7185" },
    { key: "interested", value: 8, color: "#22c55e" },
    { key: "notInterested", value: 4, color: "#ef4444" },
  ];

  const dailyDispositionRows = [
    { key: "interested", value: 36, color: "#22c55e" },
    { key: "followUpRequired", value: 28, color: "#f59e0b" },
    { key: "callbackLater", value: 20, color: "#fb923c" },
    { key: "testRideScheduled", value: 14, color: "#a855f7" },
    { key: "visitedShowroom", value: 9, color: "#6366f1" },
    { key: "bookingLikely", value: 6, color: "#14b8a6" },
    { key: "booked", value: 3, color: "#22c55e" },
    { key: "notInterested", value: 7, color: "#ef4444" },
    { key: "wrongNumber", value: 5, color: "#dc2626" },
  ];

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

      <div className="flex-1 overflow-y-auto overscroll-none pb-10 pt-4">
        <div className="rounded-[14px] border border-[#e4e7ee] bg-[#f4f5f8] p-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("monthly")}
              className={`rounded-[12px] px-3 py-2 text-[14px] font-semibold ${
                activeTab === "monthly"
                  ? "bg-[color:var(--blue-600)] text-white"
                  : "bg-white text-[color:var(--blue-500)]"
              }`}
            >
              {t.analyze.monthlySummary}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("daily")}
              className={`rounded-[12px] px-3 py-2 text-[14px] font-semibold ${
                activeTab === "daily"
                  ? "bg-[color:var(--blue-600)] text-white"
                  : "bg-white text-[color:var(--blue-500)]"
              }`}
            >
              {t.analyze.dailySummary}
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
                      <th className="px-3.5 py-2 text-right">{t.analyze.table.value}</th>
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
                        <td className="border-b border-[#eef1f5] px-3.5 py-2.5 text-right">{row.value}</td>
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
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <MetricCard label={t.analyze.daily.metrics.totalLeadsFollowedUp} value="128" />
              <MetricCard label={t.analyze.daily.metrics.humanCalling} value="52" />
              <MetricCard label={t.analyze.daily.metrics.aiCalling} value="46" />
              <MetricCard label={t.analyze.daily.metrics.messaging} value="30" />
            </div>

            <Card className="mt-3 rounded-2xl border-[#e8eaef] bg-white px-3.5 py-3.5 shadow-[var(--card-shadow)]">
              <h2 className="text-[20px] font-bold leading-none text-[color:var(--gray-300)]">
                {t.analyze.daily.callStatus}
              </h2>
              <div className="mt-3.5 space-y-2.5">
                {dailyStatusRows.map((item) => (
                  <StatusRow
                    key={item.key}
                    label={t.analyze.daily.callStatuses[item.key]}
                    value={item.value}
                    color={item.color}
                  />
                ))}
              </div>
            </Card>

            <Card className="mt-3 rounded-2xl border-[#e8eaef] bg-white px-3.5 py-3.5 shadow-[var(--card-shadow)]">
              <h2 className="text-[20px] font-bold leading-none text-[color:var(--gray-300)]">
                {t.analyze.daily.callDisposition}
              </h2>
              <div className="mt-3.5 space-y-2.5">
                {dailyDispositionRows.map((item) => (
                  <StatusRow
                    key={item.key}
                    label={t.analyze.daily.callDispositions[item.key]}
                    value={item.value}
                    color={item.color}
                  />
                ))}
              </div>
            </Card>

            <Card className="mt-3 rounded-2xl border-[#e8eaef] bg-white px-3.5 py-3.5 shadow-[var(--card-shadow)]">
              <h2 className="text-[22px] text-[20px] font-bold leading-none text-[color:var(--gray-300)]">
                {t.analyze.daily.nextSteps}
              </h2>
              <div className="mt-3.5 space-y-0">
                {t.analyze.daily.nextStepsItems.map((item) => {
                  const Icon = nextStepIconByKey[item.iconKey];
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 border-b border-[#eef1f5] py-3 first:pt-0 last:border-none last:pb-0"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[color:var(--suzuki-blue)]">
                        <Icon className="h-[17px] w-[17px]" strokeWidth={2.1} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[17px] text-[15px] font-semibold leading-snug text-[color:var(--gray-300)]">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[13px] leading-snug text-[color:var(--gray-200)]">{item.body}</p>
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
