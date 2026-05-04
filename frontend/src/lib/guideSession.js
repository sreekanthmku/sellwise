const SESSION_STORAGE_KEY = "sellwise.guide.session";
const LEGACY_SESSION_ID_KEY = "sellwise.guide.session_id";
const SESSIONS_MAP_KEY = "sellwise.guide.sessions";

const CREATE_SESSION_PATH = "/create_session_router";
const GENERATE_ROUTER_PATH = "/generate_router";

/**
 * Same-origin `/guide-api/...` in dev (proxy); production needs the same path behind your host or REACT_APP_GUIDE_API_BASE.
 */
function getGuideApiUrl(pathSuffix) {
  const envBase =
    typeof process !== "undefined" && process.env.REACT_APP_GUIDE_API_BASE != null
      ? String(process.env.REACT_APP_GUIDE_API_BASE).trim()
      : "";
  if (envBase !== "") {
    return `${envBase.replace(/\/$/, "")}${pathSuffix}`;
  }
  return `/guide-api${pathSuffix}`;
}

function buildCreateSessionBody(languageCode) {
  return {
    company_id: "65eed5c6",
    uid: null,
    language_code: languageCode,
    flow_type: "technical",
    user_ip: "",
    user_agent:
      typeof navigator !== "undefined" && navigator.userAgent ? navigator.userAgent : "",
    location: "",
    country: "",
  };
}

/** In-flight create so React Strict Mode / double mount only hits the API once */
let createPromise = null;

function parseSessionsMap(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const id =
      [parsed.en, parsed.id].find((v) => typeof v === "string" && v.length > 0) ||
      Object.values(parsed).find((v) => typeof v === "string" && v.length > 0);
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

/**
 * @returns {{ sessionId: string, botWelcomeMessage: string[] } | null}
 */
function readStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && typeof o.sessionId === "string" && o.sessionId) {
        const botWelcomeMessage = Array.isArray(o.botWelcomeMessage)
          ? o.botWelcomeMessage.filter((x) => typeof x === "string")
          : [];
        return { sessionId: o.sessionId, botWelcomeMessage };
      }
    }

    const legacyId = window.localStorage.getItem(LEGACY_SESSION_ID_KEY);
    if (legacyId) {
      const next = { sessionId: legacyId, botWelcomeMessage: [] };
      writeStoredSession(next);
      window.localStorage.removeItem(LEGACY_SESSION_ID_KEY);
      window.localStorage.removeItem(SESSIONS_MAP_KEY);
      return next;
    }

    const mapRaw = window.localStorage.getItem(SESSIONS_MAP_KEY);
    if (mapRaw) {
      const id = parseSessionsMap(mapRaw);
      window.localStorage.removeItem(SESSIONS_MAP_KEY);
      if (id) {
        const next = { sessionId: id, botWelcomeMessage: [] };
        writeStoredSession(next);
        return next;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredSession({ sessionId, botWelcomeMessage }) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ sessionId, botWelcomeMessage }),
    );
  } catch {
    /* ignore */
  }
}

export function getStoredGuideSessionId() {
  return readStoredSession()?.sessionId ?? null;
}

function parseSessionId(payload) {
  if (payload == null || typeof payload !== "object") return null;
  const d = payload;
  if (typeof d.session_id === "string" && d.session_id) return d.session_id;
  if (typeof d.sessionId === "string" && d.sessionId) return d.sessionId;
  if (d.data && typeof d.data === "object") {
    if (typeof d.data.session_id === "string" && d.data.session_id) return d.data.session_id;
    if (typeof d.data.sessionId === "string" && d.data.sessionId) return d.data.sessionId;
  }
  return null;
}

function parseCreateSessionPayload(json) {
  const sessionId = parseSessionId(json);
  if (!sessionId) return null;
  let botWelcomeMessage = [];
  if (json && Array.isArray(json.bot_welcome_message)) {
    botWelcomeMessage = json.bot_welcome_message.filter((x) => typeof x === "string");
  }
  return { sessionId, botWelcomeMessage };
}

async function postCreateSession(languageCode) {
  const res = await fetch(getGuideApiUrl(CREATE_SESSION_PATH), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildCreateSessionBody(languageCode)),
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err = new Error(`create_session failed: ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  const parsed = parseCreateSessionPayload(json);
  if (!parsed) {
    const err = new Error("create_session: missing session id in response");
    err.raw = json ?? text;
    throw err;
  }
  return parsed;
}

/**
 * Returns stored session or creates one. Resolves to `{ sessionId, botWelcomeMessage }`.
 * `botWelcomeMessage` is HTML fragments from `bot_welcome_message` (empty if legacy cache only).
 */
export function ensureGuideSession(languageCode) {
  const existing = readStoredSession();
  if (existing) return Promise.resolve(existing);

  if (!createPromise) {
    createPromise = postCreateSession(languageCode)
      .then((data) => {
        writeStoredSession(data);
        return data;
      })
      .finally(() => {
        createPromise = null;
      });
  }

  return createPromise;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Turn API `response` (markdown-lite: **bold**, newlines) into safe HTML paragraphs. */
export function guideResponseToHtml(responseText) {
  if (typeof responseText !== "string") return "";
  const esc = escapeHtml(responseText);
  const withBold = esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const blocks = withBold.split(/\n\n+/).filter(Boolean);
  return blocks
    .map((block) => `<p class="whitespace-pre-wrap">${block.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

/**
 * @param {{ sessionId: string, query: string, languageCode: string }} args
 * @returns {Promise<{ response: string, sources?: Array<{ title?: string, link?: string }> }>}
 */
export async function postGenerateRouter({ sessionId, query, languageCode }) {
  const res = await fetch(getGuideApiUrl(GENERATE_ROUTER_PATH), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_id: "65eed5c6",
      action: "",
      session_id: sessionId,
      query,
      detail: true,
      regenerate: false,
      stream: false,
      additional_info: {},
      flow_type: "technical",
      language_code: languageCode,
    }),
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err = new Error(`generate_router failed: ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  if (!json || typeof json.response !== "string") {
    const err = new Error("generate_router: missing response");
    err.raw = json ?? text;
    throw err;
  }

  const sources = Array.isArray(json.sources)
    ? json.sources
        .map((s) =>
          s && typeof s === "object"
            ? {
                title: typeof s.title === "string" ? s.title : "",
                link: typeof s.link === "string" ? s.link : "",
              }
            : null,
        )
        .filter((s) => s && (s.link || s.title))
    : [];

  return { response: json.response, sources };
}

const CHAT_STORAGE_PREFIX = "sellwise.guide.chat.v1.";

function guideChatStorageKey(sessionId) {
  return `${CHAT_STORAGE_PREFIX}${sessionId}`;
}

function isPersistableGuideMessage(m) {
  if (!m || typeof m !== "object") return false;
  if (m.kind === "loading") return false;
  if (m.role === "user") {
    return m.kind === "text" && typeof m.text === "string";
  }
  if (m.role !== "assistant") return false;
  if (m.kind === "text" && typeof m.text === "string") return true;
  if (m.kind === "welcomeHtml" && Array.isArray(m.htmlParts)) return true;
  if (m.kind === "replyHtml" && typeof m.html === "string") return true;
  return false;
}

/**
 * @returns {Array<unknown> | null}
 */
export function loadGuideChatMessages(sessionId) {
  if (typeof window === "undefined" || !sessionId) return null;
  try {
    const raw = window.localStorage.getItem(guideChatStorageKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const cleaned = parsed.filter(isPersistableGuideMessage);
    return cleaned.length > 0 ? cleaned : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} sessionId
 * @param {Array<{ kind?: string }>} messages
 */
export function saveGuideChatMessages(sessionId, messages) {
  if (typeof window === "undefined" || !sessionId) return;
  try {
    const persistable = messages.filter(isPersistableGuideMessage);
    if (persistable.length === 0) return;
    const snapshot = JSON.parse(JSON.stringify(persistable));
    window.localStorage.setItem(
      guideChatStorageKey(sessionId),
      JSON.stringify(snapshot),
    );
  } catch {
    /* quota or stringify failure */
  }
}
