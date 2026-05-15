import { useEffect, useRef, useState } from "react";
import { Clipboard, Pause, Play, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { defaultApiBase } from "@/vobiz/constants";

function isAgentSpeaker(speaker) {
  const s = String(speaker || "").trim().toLowerCase();
  return s === "agent" || s === "you";
}

function speakerLabel(speaker) {
  const s = String(speaker || "").trim().toLowerCase();
  if (s === "agent" || s === "you") return "YOU";
  return String(speaker || "").trim().toUpperCase() || "SPEAKER";
}

function transcriptRowsFromSegments(segments) {
  if (!Array.isArray(segments)) return [];
  return segments
    .map((segment, index) => {
      if (!segment || typeof segment !== "object") return null;
      const text = String(segment.text || "").trim();
      if (!text) return null;
      return {
        id: `segment-${index}-${text.slice(0, 24)}`,
        time: String(segment.time || "").trim(),
        text,
        speaker: speakerLabel(segment.speaker),
        isAgent: isAgentSpeaker(segment.speaker),
      };
    })
    .filter(Boolean);
}

function splitTranscriptLines(transcript) {
  if (typeof transcript !== "string" || !transcript.trim()) return [];
  return transcript
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^(?:(\d{1,2}:\d{2})\s*)?(?:(Agent|Customer|You|Speaker)\s*:\s*)?(.*)$/i);
      const rawSpeaker = match?.[2] || "";
      return {
        id: `${index}-${line.slice(0, 24)}`,
        time: match?.[1] ?? "",
        text: (match?.[3] || line).trim(),
        speaker: speakerLabel(rawSpeaker),
        isAgent: isAgentSpeaker(rawSpeaker),
      };
    });
}

function formatAudioTime(totalSeconds) {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CallRecordingDrawer({
  open,
  onOpenChange,
  callUuid,
  durationSeconds,
  onAudioError,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(durationSeconds);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  const recordingUrl =
    callUuid && typeof callUuid === "string"
      ? `${defaultApiBase()}/api/call-analysis/${encodeURIComponent(callUuid)}/recording`
      : "";
  const transcriptRows = transcriptRowsFromSegments(transcriptSegments);
  const fallbackTranscriptRows =
    transcriptRows.length > 0 ? transcriptRows : splitTranscriptLines(transcriptText);
  const displayDuration = audioDuration || durationSeconds;
  const progress = displayDuration > 0 ? Math.min(1, currentTime / displayDuration) : 0;
  const waveformBars = [5, 14, 22, 16, 26, 18, 13, 21, 15, 10, 23, 17, 21, 13, 18, 24, 15, 11, 21, 14, 20, 16, 10, 22, 15, 20, 13, 21, 16, 11, 23, 15, 19, 13];

  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioDuration(durationSeconds);
      setTranscriptText("");
      setTranscriptSegments([]);
      setTranscriptLoading(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    if (!callUuid || typeof callUuid !== "string") return;

    let cancelled = false;
    setTranscriptLoading(true);

    const run = async () => {
      const url = `${defaultApiBase()}/api/call-analysis/${encodeURIComponent(callUuid)}/transcript`;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
          const res = await fetch(url);
          const data = await res.json().catch(() => null);
          if (cancelled) return;
          const transcript = typeof data?.transcript === "string" ? data.transcript : "";
          const segments = Array.isArray(data?.segments) ? data.segments : [];
          if (res.ok && data?.ok && (transcript.trim() || segments.length > 0)) {
            setTranscriptText(transcript);
            setTranscriptSegments(segments);
            setTranscriptLoading(false);
            return;
          }
        } catch {
          if (cancelled) return;
        }
        if (attempt < 11) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }
      }
      if (!cancelled) {
        setTranscriptText("");
        setTranscriptSegments([]);
        setTranscriptLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [callUuid, durationSeconds, open]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        onAudioError?.();
      }
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
        data-testid="call-recording-drawer"
        className="mx-auto h-[83dvh] w-full max-w-[440px] overflow-hidden rounded-t-[28px] border border-[#e9ebef] bg-white px-5 pb-4 pt-0 shadow-xl"
      >
        <div className="flex h-full min-h-0 flex-col pt-3">
          <div className="mt-0.5 flex shrink-0 items-center justify-between gap-4">
            <DrawerTitle className="font-body text-[18px] font-bold leading-tight text-[#111827]">
              Call Recording
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Play the saved recording and review the transcript for this call.
            </DrawerDescription>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="Close call recording"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#5f6368] transition-colors hover:bg-[#f5f5f5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
              >
                <X className="h-7 w-7 rounded-full border-[3px] border-current p-0.5" strokeWidth={3} />
              </button>
            </DrawerClose>
          </div>

          <div className="mt-8 flex h-[52px] shrink-0 items-center rounded-[10px] bg-[#f3f5ff] px-3">
            {recordingUrl ? (
              <div className="flex w-full items-center gap-3">
                <audio
                  ref={audioRef}
                  preload="metadata"
                  src={recordingUrl}
                  onError={onAudioError}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onLoadedMetadata={(e) => {
                    const duration = e.currentTarget.duration;
                    if (Number.isFinite(duration)) setAudioDuration(duration);
                  }}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  className="hidden"
                  data-testid="call-recording-audio"
                />
                <button
                  type="button"
                  onClick={togglePlayback}
                  aria-label={isPlaying ? "Pause recording" : "Play recording"}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--blue-600)] text-white shadow-sm transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
                >
                  {isPlaying ? (
                    <Pause className="h-3.5 w-3.5" fill="currentColor" strokeWidth={2.25} />
                  ) : (
                    <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={seekFromWaveform}
                  aria-label="Seek recording"
                  className="flex min-w-0 flex-1 items-center justify-start gap-[3px] overflow-hidden py-1 focus:outline-none"
                >
                  {waveformBars.map((height, index) => {
                    const filled = index / Math.max(1, waveformBars.length - 1) <= progress;
                    return (
                      <span
                        key={`${height}-${index}`}
                        className={`w-[3px] shrink-0 rounded-full transition-colors ${
                          filled ? "bg-[color:var(--blue-600)]" : "bg-[#d8e2ff]"
                        }`}
                        style={{ height }}
                        aria-hidden="true"
                      />
                    );
                  })}
                </button>
                <span className="shrink-0 whitespace-nowrap font-body text-[12px] font-bold tabular-nums text-[#4b5563]">
                  {formatAudioTime(currentTime)} / {formatAudioTime(displayDuration)}
                </span>
              </div>
            ) : (
              <p className="font-body text-[13px] font-medium text-[color:var(--gray-200)]">
                Recording is not available for this call.
              </p>
            )}
          </div>

          <div className="mt-8 flex shrink-0 items-center justify-between gap-3">
            <h3 className="font-body text-[15px] font-bold text-[#111827]">Transcript</h3>
            <button
              type="button"
              onClick={() => {
                if (!transcriptText || !transcriptText.trim()) {
                  toast.info("Transcript is not available yet.");
                  return;
                }
                void navigator.clipboard
                  ?.writeText(transcriptText)
                  .then(() => toast.success("Transcript copied to notes."))
                  .catch(() => toast.error("Could not copy transcript."));
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--blue-600)] bg-white px-3 py-1.5 font-body text-[12px] font-bold text-[color:var(--blue-600)] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
            >
              <Clipboard className="h-3.5 w-3.5 text-[#6b7280]" strokeWidth={2.25} />
              Save notes
            </button>
          </div>

          <div className="scrollbar-hide mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {transcriptLoading ? (
              <p className="rounded-xl bg-[#f3f4f6] px-4 py-3 font-body text-[13px] text-[color:var(--gray-200)]">
                Loading transcript…
              </p>
            ) : fallbackTranscriptRows.length > 0 ? (
              fallbackTranscriptRows.map((row) => (
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
                Transcript is not available yet.
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default CallRecordingDrawer;
