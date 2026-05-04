import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { cn } from "@/lib/utils";
import {
  ensureGuideSession,
  guideResponseToHtml,
  loadGuideChatMessages,
  postGenerateRouter,
  saveGuideChatMessages,
} from "@/lib/guideSession";

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
        className="max-w-[min(100%,20rem)] rounded-2xl border border-[#e4e4e4] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
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
        className="max-w-[min(100%,20rem)] rounded-2xl bg-[color:var(--suzuki-blue)] px-3.5 py-3 font-body text-[14px] leading-relaxed text-white"
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
  const scrollRef = useRef(null);
  /** Load stored transcript once per `sessionId` (avoid clobbering in-flight chat on re-renders). */
  const lastHydratedSessionIdRef = useRef(undefined);

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

  const suggestions = [
    { testId: "guide-suggest-mileage", label: t.guide.suggestMileage },
    { testId: "guide-suggest-financing", label: t.guide.suggestFinancing },
    { testId: "guide-suggest-objections", label: t.guide.suggestObjections },
  ];

  const composerDisabled = sessionLoading || pending || !sessionMeta?.sessionId;

  return (
    <AppScreen
      screenTestId="guide-screen"
      mainTestId="guide-main"
      mainBgClass="bg-[#F7F8FB]"
      showBottomNav
    >
      {guideSessionId ? (
        <span data-testid="guide-session-id" className="sr-only">
          {guideSessionId}
        </span>
      ) : null}
      <div className="shrink-0 pt-1">
        <h1
          data-testid="guide-page-title"
          className="font-suzuki text-[24px] font-bold leading-tight text-[color:var(--gray-300)]"
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
        className="min-h-0 flex-1 overflow-y-auto py-4"
        data-testid="guide-chat-scroll"
      >
        <div className="flex flex-col gap-3.5 pb-2">
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
        className="-mx-[16px] shrink-0 border-t border-[#e5e7eb] bg-[#F7F8FB] px-[16px] pt-2 pb-4"
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
              "min-h-[44px] flex-1 rounded-full border border-[#d1d5db] bg-white py-2.5 pl-5 pr-5 font-body text-[14px] text-[color:var(--gray-300)]",
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
