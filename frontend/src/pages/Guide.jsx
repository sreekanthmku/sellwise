import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Send, Square } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { speechLocaleForLang } from "@/i18n/translations";
import { AppScreen } from "@/components/AppScreen";
import { cn } from "@/lib/utils";
import {
  ensureGuideSession,
  guideResponseToHtml,
  loadGuideChatMessages,
  postGenerateRouter,
  saveGuideChatMessages,
} from "@/lib/guideSession";
import { mediaBlobTo16kMonoWav, pickRecorderMimeType } from "@/lib/guideSpeechWav";
import { defaultApiBase } from "@/vobiz/constants";
import { useVirtualKeyboardOpen } from "@/hooks/useVirtualKeyboardOpen";

const nextId = () =>
  `guide-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`;

function WelcomeHtmlBlock({ htmlParts }) {
  return (
    <div
      className="space-y-3 font-body text-[14px] leading-relaxed text-[color:var(--gray-300)] [&_a]:font-medium [&_a]:text-[color:var(--blue-600)]"
      data-testid="guide-welcome-html"
    >
      {htmlParts.map((html, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
      ))}
    </div>
  );
}

function sourceLabel(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^\*?Title:\*?\s*/i, "")
    .trim();
}

function AssistantReplyBlock({ html, sources }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-3 font-body text-[14px] leading-relaxed text-[color:var(--gray-300)]">
      <div
        className="[&_strong]:font-bold [&_a]:font-medium [&_a]:text-[color:var(--blue-600)]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {sources && sources.length > 0 ? (
        <div className="border-t border-[#e8eaef] pt-3">
          <p className="text-[12px] font-semibold text-[color:var(--gray-200)]">{t.guide.sources}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[12px] text-[color:var(--gray-200)]">
            {sources.map((s, i) => (
              <li key={`${s.link}-${i}`}>
                {s.link ? (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[color:var(--blue-600)]"
                  >
                    {sourceLabel(s.title) || s.link}
                  </a>
                ) : (
                  sourceLabel(s.title)
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function AssistantBubble({ children }) {
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[min(100%,20rem)] rounded-[12px] border border-[#e4e4e4] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        data-testid="guide-bubble-assistant"
      >
        {children}
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[min(100%,20rem)] rounded-[12px] bg-[color:var(--suzuki-blue)] px-3.5 py-3 font-body text-[14px] leading-relaxed text-white"
        data-testid="guide-bubble-user"
      >
        {text}
      </div>
    </div>
  );
}

export default function Guide() {
  const { t, lang } = useLanguage();

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [guideSessionId, setGuideSessionId] = useState(null);
  const [sessionMeta, setSessionMeta] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [pending, setPending] = useState(false);
  /** idle | recording | transcribing */
  const [voicePhase, setVoicePhase] = useState("idle");
  const scrollRef = useRef(null);
  /** Load stored transcript once per `sessionId` (avoid clobbering in-flight chat on re-renders). */
  const lastHydratedSessionIdRef = useRef(undefined);
  const mediaRecorderRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const virtualKeyboardOpen = useVirtualKeyboardOpen();

  useEffect(() => {
    let cancelled = false;
    setSessionLoading(true);
    ensureGuideSession(lang)
      .then((meta) => {
        if (!cancelled) {
          setSessionMeta(meta);
          setGuideSessionId(meta.sessionId);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error(t.guide.sessionCreateError);
      })
      .finally(() => {
        if (!cancelled) setSessionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang, t]);

  useEffect(() => {
    if (!sessionMeta?.sessionId) return;
    const sid = sessionMeta.sessionId;
    if (lastHydratedSessionIdRef.current === sid) return;
    lastHydratedSessionIdRef.current = sid;

    const stored = loadGuideChatMessages(sid);
    if (stored) {
      setMessages(stored);
      return;
    }

    const first =
      sessionMeta.botWelcomeMessage.length > 0
        ? {
            id: nextId(),
            role: "assistant",
            kind: "welcomeHtml",
            htmlParts: sessionMeta.botWelcomeMessage,
          }
        : {
            id: nextId(),
            role: "assistant",
            kind: "text",
            text: t.guide.greeting,
          };
    setMessages([first]);
  }, [sessionMeta, t]);

  useEffect(() => {
    if (!sessionMeta?.sessionId) return;
    const persistable = messages.filter((m) => m.kind !== "loading");
    if (persistable.length === 0) return;
    saveGuideChatMessages(sessionMeta.sessionId, persistable);
  }, [messages, sessionMeta?.sessionId]);

  useEffect(() => {
    return () => {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== "inactive") {
        try {
          mr.stop();
        } catch {
          /* ignore */
        }
      }
      const s = mediaStreamRef.current;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendText = async (raw) => {
    const text = raw.trim();
    if (!text || pending) return;
    if (!sessionMeta?.sessionId) {
      toast.error(t.guide.needSession);
      return;
    }

    setPending(true);
    setDraft("");
    const userMsg = { id: nextId(), role: "user", kind: "text", text };
    const loadingId = nextId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: loadingId, role: "assistant", kind: "loading" },
    ]);

    try {
      const data = await postGenerateRouter({
        sessionId: sessionMeta.sessionId,
        query: text,
        languageCode: lang,
      });
      const html = guideResponseToHtml(data.response);
      setMessages((prev) => {
        const rest = prev.filter((m) => m.id !== loadingId);
        return [
          ...rest,
          {
            id: nextId(),
            role: "assistant",
            kind: "replyHtml",
            html,
            sources: data.sources,
          },
        ];
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== loadingId));
      toast.error(t.guide.generateError);
    } finally {
      setPending(false);
    }
  };

  const releaseMediaStream = () => {
    const s = mediaStreamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    mediaChunksRef.current = [];
  };

  const stopRecordingAndTranscribe = async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      setVoicePhase("idle");
      releaseMediaStream();
      return;
    }

    await new Promise((resolve) => {
      mr.addEventListener("stop", () => resolve(), { once: true });
      try {
        mr.stop();
      } catch {
        resolve();
      }
    });

    const chunks = mediaChunksRef.current;
    mediaChunksRef.current = [];
    releaseMediaStream();

    const blob = new Blob(chunks, { type: chunks[0]?.type || "audio/webm" });
    if (blob.size < 400) {
      toast.error(t.guide.voiceTooShort);
      setVoicePhase("idle");
      return;
    }

    setVoicePhase("transcribing");
    try {
      const wav = await mediaBlobTo16kMonoWav(blob);
      if (wav.byteLength < 200) {
        toast.error(t.guide.voiceTooShort);
        return;
      }
      const locale = speechLocaleForLang(lang);
      const base = defaultApiBase();
      const res = await fetch(
        `${base}/api/speech/transcribe?language=${encodeURIComponent(locale)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: wav,
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : t.guide.voiceTranscribeError;
        toast.error(msg);
        return;
      }
      const spoken = typeof data.text === "string" ? data.text.trim() : "";
      if (spoken) {
        setDraft((d) => (d.trim() ? `${d.trim()} ${spoken}` : spoken));
      } else {
        toast.message(t.guide.voiceNoSpeech);
      }
    } catch {
      toast.error(t.guide.voiceTranscribeError);
    } finally {
      setVoicePhase("idle");
    }
  };

  const startVoiceRecording = async () => {
    if (voicePhase === "transcribing") return;
    if (sessionLoading || pending || !sessionMeta?.sessionId) return;

    if (voicePhase === "recording") {
      await stopRecordingAndTranscribe();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mime = pickRecorderMimeType();
      const mr = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mediaChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) mediaChunksRef.current.push(e.data);
      };
      mr.start(200);
      setVoicePhase("recording");
    } catch {
      toast.error(t.guide.voiceMicDenied);
      setVoicePhase("idle");
    }
  };

  const suggestions = [
    { testId: "guide-suggest-mileage", label: t.guide.suggestMileage },
    { testId: "guide-suggest-financing", label: t.guide.suggestFinancing },
    { testId: "guide-suggest-objections", label: t.guide.suggestObjections },
  ];

  const composerDisabled = sessionLoading || pending || !sessionMeta?.sessionId;
  const micButtonDisabled =
    voicePhase === "transcribing" ||
    (voicePhase === "idle" && (sessionLoading || pending || !sessionMeta?.sessionId));

  return (
    <AppScreen
      screenTestId="guide-screen"
      mainTestId="guide-main"
      mainBgClass="bg-[#F7F8FB]"
      showBottomNav={!virtualKeyboardOpen}
      lockViewportHeight
    >
      {guideSessionId ? (
        <span data-testid="guide-session-id" className="sr-only">
          {guideSessionId}
        </span>
      ) : null}
      <div className="shrink-0 pt-[16px] pb-0">
        <h1
          data-testid="guide-page-title"
          className="font-suzuki text-[18px] font-bold leading-none text-[color:var(--gray-300)]"
        >
          {t.guide.title}
        </h1>
      </div>

      {sessionLoading ? (
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 py-16"
          data-testid="guide-session-loading"
        >
          <Loader2
            className="h-10 w-10 animate-spin text-[color:var(--suzuki-blue)]"
            aria-hidden
          />
          <p className="max-w-[16rem] text-center font-body text-[15px] font-medium leading-snug text-[color:var(--gray-200)]">
            {t.guide.initializingChat}
          </p>
        </div>
      ) : (
        <>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-none pb-8 pt-4"
        data-testid="guide-chat-scroll"
      >
        <div className="flex flex-col gap-3.5 pb-4">
          {messages.map((m) => {
            if (m.role === "user") {
              return <UserBubble key={m.id} text={m.text} />;
            }
            if (m.kind === "loading") {
              return (
                <AssistantBubble key={m.id}>
                  <p
                    className="font-body text-[14px] text-[color:var(--gray-200)]"
                    data-testid="guide-reply-loading"
                  >
                    …
                  </p>
                </AssistantBubble>
              );
            }
            if (m.kind === "welcomeHtml") {
              return (
                <AssistantBubble key={m.id}>
                  <WelcomeHtmlBlock htmlParts={m.htmlParts} />
                </AssistantBubble>
              );
            }
            if (m.kind === "replyHtml") {
              return (
                <AssistantBubble key={m.id}>
                  <AssistantReplyBlock html={m.html} sources={m.sources} />
                </AssistantBubble>
              );
            }
            if (m.kind === "text") {
              return (
                <AssistantBubble key={m.id}>
                  <p className="font-body text-[14px] leading-relaxed text-[color:var(--gray-300)]">
                    {m.text}
                  </p>
                </AssistantBubble>
              );
            }
            return null;
          })}
        </div>
      </div>

      <div
        className="-mx-[16px] shrink-0 border-t border-[#e5e7eb] bg-[#F7F8FB] px-[16px] pb-[14px] pt-[10px]"
        data-testid="guide-composer"
      >
        {/* Suggested questions: hidden for now; keep markup + `suggestions` for easy restore */}
        <div className="hidden" aria-hidden="true">
          <p className="mb-2 text-[12px] font-medium text-[color:var(--gray-200)]">
            {t.guide.suggestedLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(({ testId, label }) => (
              <button
                key={testId}
                type="button"
                data-testid={testId}
                disabled={composerDisabled}
                onClick={() => sendText(label)}
                className="rounded-full bg-[#E8F4FD] px-3.5 py-2 text-[13px] font-semibold text-[color:var(--suzuki-blue)] transition-colors hover:bg-[#d9ecfc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            data-testid="guide-voice-mic"
            disabled={micButtonDisabled}
            onClick={() => startVoiceRecording()}
            aria-label={voicePhase === "recording" ? t.guide.voiceStopAria : t.guide.voiceMicAria}
            title={voicePhase === "recording" ? t.guide.voiceStopAria : t.guide.voiceMicAria}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              voicePhase === "recording"
                ? "border-red-300 bg-red-50 text-red-600 focus-visible:ring-red-400"
                : "border-[#d1d5db] bg-white text-[color:var(--gray-300)] focus-visible:ring-[color:var(--blue-600)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              voicePhase === "recording" && "animate-pulse",
            )}
          >
            {voicePhase === "transcribing" ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin text-[color:var(--suzuki-blue)]" aria-hidden />
            ) : voicePhase === "recording" ? (
              <Square className="h-[16px] w-[16px] fill-current" aria-hidden />
            ) : (
              <Mic className="h-[19px] w-[19px]" strokeWidth={2.25} aria-hidden />
            )}
          </button>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !composerDisabled) sendText(draft);
            }}
            placeholder={t.guide.inputPlaceholder}
            data-testid="guide-input"
            disabled={composerDisabled}
            className={cn(
              "min-h-[44px] flex-1 rounded-[12px] border border-[#d1d5db] bg-white py-2.5 pl-5 pr-5 font-body text-[14px] text-[color:var(--gray-300)]",
              "placeholder:text-[#6b7280] focus:border-[color:var(--blue-600)] focus:outline-none focus:ring-1 focus:ring-[color:var(--blue-600)]/30",
              "disabled:cursor-not-allowed disabled:bg-[#f9fafb]",
            )}
          />
          <button
            type="button"
            data-testid="guide-send"
            disabled={composerDisabled}
            onClick={() => sendText(draft)}
            aria-label="Send"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--blue-600)] text-white shadow-sm transition-colors",
              "hover:bg-[color:var(--blue-700)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-600)] focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <Send className="h-[18px] w-[18px] -translate-y-px translate-x-px" strokeWidth={2.25} />
          </button>
        </div>
      </div>
        </>
      )}
    </AppScreen>
  );
}
