/**
 * Lead detail screen merge helper. Rich content lives on each row in `mockLeads` (`detail`).
 */

const MODEL_IMG =
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80";

export function initialsFromName(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function defaultPreferences(lead) {
  return [
    { key: "type", valueKey: "_model", model: lead.interestedIn },
    { key: "budget", valueKey: "budgetDiscuss" },
    { key: "usage", valueKey: "commute" },
    { key: "features", valueKey: "toConfirm" },
    { key: "fuelType", valueKey: "flexible" },
    { key: "color", valueKey: "open" },
  ];
}

function defaultNextSteps() {
  return [
    { titleKey: "testRide", subtitleKey: "testRideSubGeneric" },
    { titleKey: "brochure", subtitleKey: "brochureSubGeneric" },
    { titleKey: "followUpCall", subtitleKey: "followUpCallSubGeneric" },
  ];
}

function defaultCallHistory() {
  return [
    {
      titleKey: "initialContact",
      ago: { value: 3, unit: "days" },
      status: "new",
      durationMin: 4,
      durationSec: 12,
      notesKey: "genericNotes",
    },
  ];
}

function defaultModels(lead) {
  return [
    {
      name: lead.interestedIn,
      rangeKey: "genericRange",
      priceKey: "priceOnRequest",
      image: MODEL_IMG,
    },
  ];
}

export function mergeLeadDetail(lead) {
  const fallback = {
    phoneDisplay: "—",
    location: "—",
    leadSourceKey: "website",
    added: lead.lastContact,
    briefPersonaKey: "generic",
    preferences: defaultPreferences(lead),
    nextSteps: defaultNextSteps(),
    callHistory: defaultCallHistory(),
    recommendedModels: defaultModels(lead),
  };
  return { ...fallback, ...(lead.detail || {}) };
}
