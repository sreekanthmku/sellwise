import { useEffect, useState } from "react";
import {
  DollarSign,
  Info,
  MapPin,
  Mic,
  MicOff,
  PhoneOff,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { useLeadsData } from "@/context/LeadsDataContext";
import { initialsFromName, mergeLeadDetail } from "@/data/leadDetails";

const formatLastContact = (lastContact, t) => {
  const { value, unit } = lastContact;
  if (unit === "hours") return `${value}${t.timeAgo.hours}`;
  if (unit === "day") return `${value}${t.timeAgo.day}`;
  return `${value} ${t.timeAgo.days}`;
};

function formatCallDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function budgetFromDetail(detail, lead, t) {
  const row = detail.preferences.find((p) => p.key === "budget");
  if (!row) return t.activeCall.budgetUnknown;
  if (row.valueKey === "_model") return lead.interestedIn;
  const v = t.leadDetail.prefValues[row.valueKey];
  return v ?? t.activeCall.budgetUnknown;
}

function leadHeatLabel(priority, t) {
  if (priority === "high") return t.activeCall.hotLead;
  return t.priority[priority] ?? priority;
}

export default function ActiveCall() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getLeadById } = useLeadsData();
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  const lead = getLeadById(leadId);

  useEffect(() => {
    if (!lead) return undefined;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [lead]);

  if (!lead) {
    navigate("/leads", { replace: true });
    return null;
  }

  const detail = mergeLeadDetail(lead);
  const initials = initialsFromName(lead.name);
  const budgetText = budgetFromDetail(detail, lead, t);
  const heatLabel = leadHeatLabel(lead.priority, t);

  return (
    <AppScreen
      screenTestId="active-call-screen"
      mainTestId="active-call-main"
      showHeader={false}
      showBottomNav={false}
      mainBgClass="bg-[#003388]"
      mainClassName="flex min-h-0 flex-1 flex-col text-white"
    >
      {/* Top bar — flush to screen edges (AppScreen px applies) */}
      <header className="flex shrink-0 items-center justify-between gap-3 pt-[max(0.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <PhoneOff className="h-5 w-5 shrink-0 text-white" strokeWidth={2.25} />
          <span className="font-body text-[17px] font-semibold tracking-tight">
            {t.activeCall.title}
          </span>
        </div>
        <div
          className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5"
          data-testid="active-call-timer"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" aria-hidden />
          <span className="font-mono text-[15px] font-medium tabular-nums">
            {formatCallDuration(seconds)}
          </span>
        </div>
      </header>

      {/* Vertically center profile + card between header and controls */}
      <div className="min-h-0 flex-1" aria-hidden />
      <div className="flex w-full shrink-0 flex-col items-center gap-7">
        <div className="flex w-full flex-col items-center text-center">
          <div
            className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white font-body text-[36px] font-bold leading-none text-[#003388]"
            aria-hidden
          >
            {initials}
          </div>
          <h1 className="mt-5 max-w-[20ch] font-body text-[26px] font-bold leading-tight">
            {lead.name}
          </h1>
          <p className="mt-2 max-w-[24ch] text-[15px] font-normal leading-snug text-white/88">
            {t.lastContact}: {formatLastContact(lead.lastContact, t)}
          </p>
        </div>

        {/* Quick info — full width, content center-aligned like reference */}
        <div className="w-full rounded-2xl bg-black/20 px-4 py-5 text-[#c4d8f0] backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 text-[14px] font-medium text-[#9ebfe8]">
            <Info className="h-4 w-4 shrink-0 text-[#9ebfe8]" strokeWidth={2.25} />
            {t.activeCall.quickInfo}
          </div>
          <p className="mt-3 text-center text-[12px] font-medium leading-snug sm:text-[13px]">
            {t.interestedIn}{" "}
            <span className="font-semibold text-[#dce9fb]">{lead.interestedIn}</span>
          </p>
          <div className="mt-5 flex w-full items-center justify-between gap-1.5 text-[12px] leading-snug sm:gap-2 sm:text-[13px]">
            <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-center">
              <DollarSign
                className="h-3.5 w-3.5 shrink-0 text-[#aacce9] sm:h-4 sm:w-4"
                strokeWidth={2.25}
              />
              <span className="min-w-0 break-words">
                {t.activeCall.budgetLabel}: {budgetText}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-center">
              <MapPin
                className="h-3.5 w-3.5 shrink-0 text-[#aacce9] sm:h-4 sm:w-4"
                strokeWidth={2.25}
              />
              <span className="min-w-0 break-words">
                {detail.location !== "—" ? detail.location : t.activeCall.locationUnknown}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-center">
              <Star
                className="h-3.5 w-3.5 shrink-0 fill-[#aacce9] text-[#aacce9] sm:h-4 sm:w-4"
                strokeWidth={0}
              />
              <span className="min-w-0 break-words">{heatLabel}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1" aria-hidden />

      {/* Call controls — equal gaps, side buttons same size, center ~18% larger; comfy inset from bottom */}
      <div className="flex shrink-0 items-center justify-center gap-12 pb-14 pt-6 sm:gap-14 sm:pb-16">
        <button
          type="button"
          data-testid="active-call-mute"
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[#2d3748] transition-transform active:scale-95"
        >
          {muted ? (
            <MicOff className="h-6 w-6" strokeWidth={2.25} />
          ) : (
            <Mic className="h-6 w-6" strokeWidth={2.25} />
          )}
        </button>
        <button
          type="button"
          data-testid="active-call-end"
          onClick={() =>
            navigate(`/leads/${leadId}/call-details`, {
              state: {
                durationSeconds: seconds,
                endedAt: new Date().toISOString(),
              },
            })
          }
          className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full bg-[#e11d48] text-white transition-transform active:scale-95"
          aria-label={t.activeCall.endCall}
        >
          <PhoneOff className="h-[30px] w-[30px]" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          data-testid="active-call-speaker"
          onClick={() => setSpeaker((s) => !s)}
          aria-pressed={speaker}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[#2d3748] transition-transform active:scale-95"
        >
          {speaker ? (
            <VolumeX className="h-6 w-6" strokeWidth={2.25} />
          ) : (
            <Volume2 className="h-6 w-6" strokeWidth={2.25} />
          )}
        </button>
      </div>
    </AppScreen>
  );
}
