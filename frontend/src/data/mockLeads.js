// Mock leads data for the My Leads screen.
// `tags` map to keys in translations.tags (so they localize).
// `priority` maps to translations.priority. `lastContact` is { value, unit } where unit = "hours" | "day" | "days".

export const humanLeads = [
  {
    id: "h1",
    name: "Marcus Thompson",
    interestedIn: "e Vitara",
    priority: "high",
    tags: ["testDriveDone", "financeInterested", "needCallback"],
    lastContact: { value: 2, unit: "hours" },
    recommendedAction: "call",
  },
  {
    id: "h2",
    name: "Jennifer Ramirez",
    interestedIn: "Fronx",
    priority: "medium",
    tags: ["priceEnquiry", "whatsappReplied"],
    lastContact: { value: 1, unit: "day" },
    recommendedAction: "whatsapp",
  },
  {
    id: "h3",
    name: "David Chen",
    interestedIn: "XL7 Hybrid",
    priority: "low",
    tags: ["firstTimeBuyer", "needFollowUp"],
    lastContact: { value: 1, unit: "day" },
    recommendedAction: "whatsapp",
  },
  {
    id: "h4",
    name: "Samantha Williams",
    interestedIn: "Baleno",
    priority: "low",
    tags: ["priceEnquiry"],
    lastContact: { value: 3, unit: "days" },
    recommendedAction: "call",
  },
];

export const aiLeads = [
  {
    id: "a1",
    name: "William Lucas",
    interestedIn: "Ertiga Hybrid",
    priority: "high",
    tags: ["testDriveDone", "financeInterested", "needCallback"],
    lastContact: { value: 2, unit: "hours" },
    recommendedAction: "call",
  },
  {
    id: "a2",
    name: "Carlos Gomez",
    interestedIn: "Jimny",
    priority: "medium",
    tags: ["priceEnquiry", "whatsappReplied"],
    lastContact: { value: 1, unit: "day" },
    recommendedAction: "whatsapp",
  },
  {
    id: "a3",
    name: "Muhammad",
    interestedIn: "XL7 Hybrid",
    priority: "low",
    tags: ["firstTimeBuyer", "needFollowUp"],
    lastContact: { value: 2, unit: "days" },
    recommendedAction: "whatsapp",
  },
  {
    id: "a4",
    name: "Aisha Rahman",
    interestedIn: "Swift",
    priority: "medium",
    tags: ["whatsappReplied", "priceEnquiry"],
    lastContact: { value: 4, unit: "hours" },
    recommendedAction: "call",
  },
];
