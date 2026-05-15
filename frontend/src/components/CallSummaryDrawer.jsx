import { useEffect, useRef, useState } from "react";
import { MessageSquare, Pause, Phone, Play, Sparkles, TrendingUp, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { defaultApiBase } from "@/vobiz/constants";

const ALL_TABS = [
  { id: "summary", label: "Summary", Icon: Sparkles },
  { id: "recording", label: "Recording", Icon: Phone },
  { id: "feedback", label: "Feedback", Icon: TrendingUp },
];

function speakerLabel(speaker) {
  const s = String(speaker || "").trim().toLowerCase();
  if (s === "agent" || s === "you") return "YOU";
  return String(speaker || "").trim().toUpperCase() || "SPEAKER";
}

function isAgentSpeaker(speaker) {
  const s = String(speaker || "").trim().toLowerCase();
  return s === "agent" || s === "you";
}

function transcriptRowsFromSegments(segments) {
  if (!Array.isArray(segments)) return [];
  return segments
    .map((seg, i) => {
      const text = String(seg?.text || "").trim();
      if (!text) return null;
      return {
        id: `seg-${i}`,
        time: String(seg?.time || "").trim(),
        text,
        speaker: speakerLabel(seg?.speaker),
        isAgent: isAgentSpeaker(seg?.speaker),
      };
    })
    .filter(Boolean);
}

function splitTranscriptLines(transcript) {
  if (typeof transcript !== "string" || !transcript.trim()) return [];
  return transcript
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const m = line.match(/^(?:(\d{1,2}:\d{2})\s*)?(?:(Agent|Customer|You|Speaker)\s*:\s*)?(.*)$/i);
      const rawSpeaker = m?.[2] || "";
      return {
        id: `line-${i}`,
        time: m?.[1] ?? "",
        text: (m?.[3] || line).trim(),
        speaker: speakerLabel(rawSpeaker),
        isAgent: isAgentSpeaker(rawSpeaker),
      };
    });
}

function formatAudioTime(s) {
  const safe = Number.isFinite(s) && s > 0 ? Math.floor(s) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function scoreColor(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "text-[color:var(--gray-200)]";
  if (n >= 8) return "text-[color:var(--success)]";
  if (n >= 6) return "text-[color:var(--warning)]";
  return "text-[color:var(--error)]";
}

function toReadable(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const WAVEFORM = [5, 14, 22, 16, 26, 18, 13, 21, 15, 10, 23, 17, 21, 13, 18, 24, 15, 11, 21, 14, 20, 16, 10, 22, 15, 20, 13, 21, 16, 11, 23, 15, 19, 13];

export function CallSummaryDrawer({
  open,
  onOpenChange,
  name,
  callType = "Human Call",
  dateLabel,
  duration,
  durationSeconds = 0,
  callUuid,
  onCallBack,
  onSaveNote,
}) {
  const isAiCall = callType === "AI Call";
  const tabs = isAiCall ? ALL_TABS.filter((t) => t.id !== "feedback") : ALL_TABS;
  const [activeTab, setActiveTab] = useState("summary");

  // Analysis data
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Audio
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(durationSeconds);

  // Transcript
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  const recordingUrl =
    callUuid && typeof callUuid === "string"
      ? `${defaultApiBase()}/api/call-analysis/${encodeURIComponent(callUuid)}/recording`
      : "";

  const displayDuration = audioDuration || durationSeconds;
  const progress = displayDuration > 0 ? Math.min(1, currentTime / displayDuration) : 0;

  const transcriptRows = transcriptRowsFromSegments(transcriptSegments);
  const displayRows = transcriptRows.length > 0 ? transcriptRows : splitTranscriptLines(transcriptText);

  // Derived from analysis
  const sf = analysisData?.suzuki_feedback;
  const summary = typeof analysisData?.summary === "string" ? analysisData.summary.trim() : null;
  const disposition = toReadable(analysisData?.call_outcome);
  const score = sf?.overall_score != null ? sf.overall_score : null;
  const whatWorked = Array.isArray(sf?.what_you_did_well) && sf.what_you_did_well.length > 0
    ? sf.what_you_did_well
    : [];
  const toImprove = Array.isArray(sf?.improve_next) && sf.improve_next.length > 0
    ? sf.improve_next
    : [];
  const nextStep = (() => {
    const actions = analysisData?.next_actions;
    if (Array.isArray(actions) && actions.length > 0) {
      return actions
        .map((a) => {
          const detail = typeof a?.detail === "string" ? a.detail.trim() : "";
          const type = toReadable(typeof a?.type === "string" ? a.type : "");
          if (detail && type) return `${type}: ${detail}`;
          return detail || type || "";
        })
        .filter(Boolean)
        .join("; ");
    }
    const legacy = analysisData?.next_action;
    return typeof legacy === "string" ? toReadable(legacy) : null;
  })();

  // Reset + fetch on open
  useEffect(() => {
    if (!open) {
      setActiveTab("summary");
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioDuration(durationSeconds);
      setAnalysisData(null);
      setTranscriptText("");
      setTranscriptSegments([]);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    if (!callUuid || typeof callUuid !== "string") return;

    let cancelled = false;

    const fetchAll = async () => {
      setAnalysisLoading(true);
      setTranscriptLoading(true);

      // Fetch details + feedback + transcript in parallel
      const base = defaultApiBase();
      const [detailsRes, feedbackRes, transcriptRes] = await Promise.allSettled([
        fetch(`${base}/api/call-analysis/${encodeURIComponent(callUuid)}`),
        fetch(`${base}/api/call-analysis/${encodeURIComponent(callUuid)}/feedback`),
        fetch(`${base}/api/call-analysis/${encodeURIComponent(callUuid)}/transcript`),
      ]);

      if (cancelled) return;

      // Merge details + feedback
      let merged = {};
      if (detailsRes.status === "fulfilled") {
        const d = await detailsRes.value.json().catch(() => null);
        if (d?.ok && d?.analysis?.result) {
          merged = { ...merged, ...d.analysis.result };
        }
      }
      if (feedbackRes.status === "fulfilled") {
        const d = await feedbackRes.value.json().catch(() => null);
        if (d?.ok && d?.analysis?.result) {
          merged = { ...merged, ...d.analysis.result };
        }
      }
      if (!cancelled) {
        setAnalysisData(Object.keys(merged).length > 0 ? merged : null);
        setAnalysisLoading(false);
      }

      // Transcript
      if (transcriptRes.status === "fulfilled") {
        const d = await transcriptRes.value.json().catch(() => null);
        if (!cancelled && d?.ok) {
          if (typeof d.transcript === "string") setTranscriptText(d.transcript);
          if (Array.isArray(d.segments)) setTranscriptSegments(d.segments);
        }
      }
      if (!cancelled) setTranscriptLoading(false);
    };

    void fetchAll();
    return () => { cancelled = true; };
  }, [callUuid, durationSeconds, open]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); } catch { /* no-op */ }
    } else {
      audio.pause();
    }
  };

  const seekFromWaveform = (e) => {
    const audio = audioRef.current;
    if (!audio || !displayDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const next = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = next * displayDuration;
    setCurrentTime(audio.currentTime);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="mx-auto h-[90dvh] w-full max-w-[440px] overflow-hidden rounded-t-[24px] border border-[#e9ebef] bg-white px-0 pb-0 pt-0 shadow-xl"
      >
        <DrawerTitle className="sr-only">Call Summary</DrawerTitle>
        <DrawerDescription className="sr-only">
          Review call summary, recording, and feedback.
        </DrawerDescription>

        <div className="flex h-full min-h-0 flex-col">
          {/* Header */}
          <div className="shrink-0 px-5 pt-5 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--blue-300)]">
                  <Phone className="h-5 w-5 text-[color:var(--blue-600)]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-body text-[17px] font-bold leading-tight text-[color:var(--gray-300)]">
                    {name}
                  </p>
                  <p className="mt-0.5 truncate font-body text-[12px] text-[color:var(--gray-200)]">
                    {callType}
                    {dateLabel ? ` · ${dateLabel}` : ""}
                    {duration ? ` · ${duration}` : ""}
                  </p>
                </div>
              </div>
              <DrawerClose asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[color:var(--gray-200)] transition-colors hover:bg-[#e5e7eb] focus:outline-none"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </DrawerClose>
            </div>

            {/* Stats row */}
            <div className="mt-4 flex items-start gap-0 border-t border-b border-[#f0f0f0] py-3">
              {durationSeconds > 0 && (
                <div className="flex-[2] min-w-0">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-[color:var(--gray-200)]">
                    Disposition
                  </p>
                  <p className="mt-1 font-body text-[15px] font-bold text-[color:var(--gray-300)]">
                    {disposition || "—"}
                  </p>
                </div>
              )}
              <div className="flex-1 min-w-0 border-l border-[#f0f0f0] pl-4">
                <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-[color:var(--gray-200)]">
                  Duration
                </p>
                <p className="mt-1 font-body text-[15px] font-bold text-[color:var(--gray-300)]">
                  {duration || "—"}
                </p>
              </div>
              <div className="flex-1 min-w-0 border-l border-[#f0f0f0] pl-4">
                <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-[color:var(--gray-200)]">
                  Score
                </p>
                <p className={`mt-1 font-body text-[15px] font-bold ${scoreColor(score)}`}>
                  {score != null ? score : "—"}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-3 flex gap-1 rounded-xl bg-[#f3f4f6] p-1">
              {tabs.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-body text-[13px] font-semibold transition-all ${
                    activeTab === id
                      ? "bg-white text-[color:var(--blue-600)] shadow-sm"
                      : "text-[color:var(--gray-200)] hover:text-[color:var(--gray-300)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            {/* Summary tab */}
            {activeTab === "summary" && (
              <div className="flex flex-col gap-5">
                {analysisLoading ? (
                  <p className="rounded-xl bg-[#f3f4f6] px-4 py-3 font-body text-[13px] text-[color:var(--gray-200)]">
                    Loading summary…
                  </p>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[color:var(--blue-600)]" strokeWidth={2} />
                        <p className="font-body text-[11px] font-bold uppercase tracking-widest text-[color:var(--gray-300)]">
                          AI Summary
                        </p>
                      </div>
                      <div className="mt-2 rounded-xl bg-[color:var(--blue-200)] px-4 py-3">
                        <p className="font-body text-[14px] leading-relaxed text-[color:var(--gray-300)]">
                          {summary || "No summary available."}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-body text-[13px] font-bold text-[color:var(--gray-300)]">→</span>
                        <p className="font-body text-[11px] font-bold uppercase tracking-widest text-[color:var(--gray-300)]">
                          Next Step
                        </p>
                      </div>
                      <div className="mt-2 rounded-xl bg-[color:var(--green-100)] px-4 py-3">
                        <p className="font-body text-[14px] leading-relaxed text-[color:var(--gray-300)]">
                          {nextStep || "No next step defined."}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Recording tab */}
            {activeTab === "recording" && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3 rounded-xl bg-[color:var(--blue-200)] px-3 py-3">
                  {recordingUrl ? (
                    <>
                      <audio
                        ref={audioRef}
                        preload="metadata"
                        src={recordingUrl}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        onLoadedMetadata={(e) => {
                          const d = e.currentTarget.duration;
                          if (Number.isFinite(d)) setAudioDuration(d);
                        }}
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={togglePlayback}
                        aria-label={isPlaying ? "Pause" : "Play"}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--blue-600)] text-white shadow-sm"
                      >
                        {isPlaying ? (
                          <Pause className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                        ) : (
                          <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={seekFromWaveform}
                        aria-label="Seek"
                        className="flex min-w-0 flex-1 items-center gap-[3px] py-1 focus:outline-none"
                      >
                        {WAVEFORM.map((h, i) => (
                          <span
                            key={i}
                            className={`w-[3px] shrink-0 rounded-full transition-colors ${
                              i / Math.max(1, WAVEFORM.length - 1) <= progress
                                ? "bg-[color:var(--blue-600)]"
                                : "bg-[#c7dbff]"
                            }`}
                            style={{ height: h }}
                            aria-hidden
                          />
                        ))}
                      </button>
                      <span className="shrink-0 font-body text-[12px] font-bold tabular-nums text-[color:var(--gray-200)]">
                        {formatAudioTime(currentTime)} / {formatAudioTime(displayDuration)}
                      </span>
                    </>
                  ) : (
                    <p className="font-body text-[13px] text-[color:var(--gray-200)]">
                      Recording not available.
                    </p>
                  )}
                </div>

                <div>
                  <p className="font-body text-[11px] font-bold uppercase tracking-widest text-[color:var(--gray-300)]">
                    Transcript
                  </p>
                  <div className="mt-3 flex flex-col gap-4">
                    {transcriptLoading ? (
                      <p className="rounded-xl bg-[#f3f4f6] px-4 py-3 font-body text-[13px] text-[color:var(--gray-200)]">
                        Loading transcript…
                      </p>
                    ) : displayRows.length > 0 ? (
                      displayRows.map((row) => (
                        <div key={row.id} className="flex gap-3">
                          <span className="mt-0.5 w-8 shrink-0 font-body text-[11px] tabular-nums text-[color:var(--gray-200)]">
                            {row.time}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`font-body text-[11px] font-bold ${row.isAgent ? "text-[color:var(--blue-600)]" : "text-[#9233e9]"}`}>
                              {row.speaker}
                            </p>
                            <p className="mt-0.5 font-body text-[13px] leading-snug text-[color:var(--gray-300)]">
                              {row.text}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl bg-[#f3f4f6] px-4 py-3 font-body text-[13px] text-[color:var(--gray-200)]">
                        Transcript not available yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Feedback tab */}
            {activeTab === "feedback" && (
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[color:var(--blue-600)]" strokeWidth={2} />
                  <p className="font-body text-[11px] font-bold uppercase tracking-widest text-[color:var(--gray-300)]">
                    Call Feedback
                  </p>
                </div>
                {analysisLoading ? (
                  <p className="mt-3 rounded-xl bg-[#f3f4f6] px-4 py-3 font-body text-[13px] text-[color:var(--gray-200)]">
                    Loading feedback…
                  </p>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-[#f7f8fb] p-4">
                    <div>
                      <p className="font-body text-[11px] font-bold uppercase tracking-wider text-[color:var(--success)]">
                        What Worked
                      </p>
                      <ul className="mt-2 flex flex-col gap-2">
                        {whatWorked.length > 0 ? (
                          whatWorked.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--success)]" />
                              <span className="font-body text-[12px] leading-snug text-[color:var(--gray-300)]">
                                {item}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="font-body text-[12px] text-[color:var(--gray-200)]">—</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="font-body text-[11px] font-bold uppercase tracking-wider text-[color:var(--warning)]">
                        To Improve
                      </p>
                      <ul className="mt-2 flex flex-col gap-2">
                        {toImprove.length > 0 ? (
                          toImprove.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--warning)]" />
                              <span className="font-body text-[12px] leading-snug text-[color:var(--gray-300)]">
                                {item}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="font-body text-[12px] text-[color:var(--gray-200)]">—</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="shrink-0 border-t border-[#f0f0f0] px-5 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCallBack}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--blue-600)] font-body text-[14px] font-semibold text-white shadow-sm transition-opacity hover:opacity-95 active:opacity-90"
              >
                <Phone className="h-4 w-4 shrink-0" strokeWidth={2} />
                Call back
              </button>
              <button
                type="button"
                onClick={onSaveNote}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#e4e4e4] bg-white font-body text-[14px] font-semibold text-[color:var(--gray-300)] transition-colors hover:bg-[#f9f9f9] active:bg-[#f0f0f0]"
              >
                <MessageSquare className="h-4 w-4 shrink-0" strokeWidth={2} />
                Save note
              </button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default CallSummaryDrawer;
