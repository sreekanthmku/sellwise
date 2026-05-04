export const ANALYSIS_SPINNER_HTML = `
<div class="flex flex-col items-center gap-4 py-6 text-on-surface-variant text-sm text-center">
  <div class="h-10 w-10 rounded-full border-2 border-outline border-t-primary animate-spin" />
  <p>Waiting for the analysis file (this can take a few minutes).</p>
</div>`;

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAnalysisList(items) {
  if (!items || !items.length) {
    return '<p class="text-on-surface-variant text-sm">None</p>';
  }
  return `<ul class="list-disc pl-[18px] m-0">${items.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
}

export function renderAnalysisBodyFromPayload(analysis) {
  if (!analysis) {
    return '<p class="text-error text-sm">No analysis payload returned.</p>';
  }
  if (analysis.status === "failed") {
    return `<p class="text-error text-sm">${escapeHtml(analysis.error || "Analysis failed on server")}</p>`;
  }
  const r = analysis.result;
  if (!r) {
    return '<p class="text-on-surface-variant text-sm">Analysis file has no result yet.</p>';
  }

  const sent = r.customer_sentiment || {};
  const evidence = Array.isArray(sent.evidence)
    ? sent.evidence
        .map(
          (ev) =>
            `<div class="rounded-lg bg-surface-container p-2.5 mb-2 text-sm border-l-4 border-[#1a52a0]"><strong>${escapeHtml(ev.quote || "")}</strong>${ev.reason ? `<br><span class="text-on-surface-variant text-xs">${escapeHtml(ev.reason)}</span>` : ""}</div>`
        )
        .join("")
    : "";

  const sales = r.sales_person_feedback || {};
  const actions = Array.isArray(r.next_action_items) ? r.next_action_items : [];
  const actionsHtml = actions.length
    ? `<ul class="list-none m-0 p-0 space-y-2">${actions
        .map(
          (a) =>
            `<li class="rounded-lg border border-outline-variant/40 bg-surface-container-low p-3 text-sm"><div class="font-semibold text-on-surface">${escapeHtml(a.title || "")}</div><div class="text-on-surface-variant text-xs mt-1">${escapeHtml(a.rationale || "")}</div><div class="text-[11px] text-outline mt-1">${escapeHtml([a.type, a.priority, a.due_hint, a.owner].filter(Boolean).join(" · "))}</div></li>`
        )
        .join("")}</ul>`
    : '<p class="text-on-surface-variant text-sm">No action items.</p>';

  return `
      <div class="mb-4">
        <h3 class="text-xs font-extrabold uppercase tracking-widest text-[#1a52a0] mb-2">Customer sentiment</h3>
        <p class="text-sm"><strong>${escapeHtml(sent.label || "")}</strong>${sent.score != null ? ` · score ${escapeHtml(String(sent.score))}` : ""}</p>
        <p class="text-sm text-on-surface-variant mt-1">${escapeHtml(sent.summary || "")}</p>
        ${evidence || ""}
      </div>
      <div class="mb-4">
        <h3 class="text-xs font-extrabold uppercase tracking-widest text-[#1a52a0] mb-2">Sales feedback</h3>
        <p class="text-xs font-bold text-on-surface-variant">Strengths</p>
        ${renderAnalysisList(sales.strengths)}
        <p class="text-xs font-bold text-on-surface-variant mt-2.5">Improvements</p>
        ${renderAnalysisList(sales.improvements)}
        ${sales.overall_assessment ? `<p class="text-sm mt-2">${escapeHtml(sales.overall_assessment)}</p>` : ""}
      </div>
      <div>
        <h3 class="text-xs font-extrabold uppercase tracking-widest text-[#1a52a0] mb-2">Next actions</h3>
        ${actionsHtml}
      </div>`;
}
