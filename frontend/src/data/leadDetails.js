/**
 * Rich lead detail content. Merged per id with defaults from the list row (`mockLeads`).
 */

/** SUV hero — Unsplash photo-1533… returns 404; use a stable id that resolves. */
const MODEL_IMG =
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80";

export const LEAD_DETAIL_OVERRIDES = {
  h1: {
    phoneDisplay: "XXX XXX-3291",
    location: "Austin, TX",
    leadSourceKey: "website",
    added: { value: 2, unit: "days" },
    briefPersonaKey: "marcus",
    preferences: [
      { key: "type", valueKey: "suv" },
      { key: "budget", valueKey: "budgetRange" },
      { key: "usage", valueKey: "commute" },
      { key: "features", valueKey: "automatic" },
      { key: "fuelType", valueKey: "electric" },
      { key: "color", valueKey: "redBlack" },
    ],
    nextSteps: [
      { titleKey: "testRide", subtitleKey: "testRideSub" },
      { titleKey: "brochure", subtitleKey: "brochureSub" },
      { titleKey: "followUpCall", subtitleKey: "followUpCallSub" },
    ],
    callHistory: [
      {
        titleKey: "initialContact",
        ago: { value: 2, unit: "days" },
        status: "new",
        durationMin: 8,
        durationSec: 32,
        notesKey: "initialNotes",
      },
      {
        titleKey: "followUpDiscussion",
        ago: { value: 5, unit: "days" },
        status: "interested",
        durationMin: 5,
        durationSec: 18,
        notesKey: "followUpNotes",
      },
    ],
    recommendedModels: [
      {
        name: "E Vitara",
        rangeKey: "evitarRange",
        priceKey: "lakh1520",
        image: MODEL_IMG,
      },
      {
        name: "Fronx",
        rangeKey: "fronxRange",
        priceKey: "lakh812",
        image:
          "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "XL7 Hybrid",
        rangeKey: "xl7Range",
        priceKey: "lakh1822",
        image:
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
};

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
  const override = LEAD_DETAIL_OVERRIDES[lead.id] || {};
  return {
    phoneDisplay: "—",
    location: "—",
    leadSourceKey: "website",
    added: lead.lastContact,
    briefPersonaKey: "generic",
    preferences: defaultPreferences(lead),
    nextSteps: defaultNextSteps(),
    callHistory: defaultCallHistory(),
    recommendedModels: defaultModels(lead),
    ...override,
  };
}
