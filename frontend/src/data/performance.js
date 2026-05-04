/** Mock data for the Performance dashboard (today’s metrics + recent calls). */
export const performanceToday = {
  scoreDeltaLabel: "+12%",
  score: "8.7",
  callsCount: 5,
  interestedCount: 3,
};

export const performanceRecentCalls = [
  {
    id: "pc-1",
    name: "Sreekanth",
    callType: "human",
    outcome: "interested",
    timeKey: "t915",
    avatarVariant: "purple",
  },
  {
    id: "pc-2",
    name: "Dian Permatasari",
    callType: "human",
    outcome: "followUp",
    timeKey: "t915",
    avatarVariant: "purple",
  },
  {
    id: "pc-3",
    name: "Eko Wijaya",
    callType: "ai",
    outcome: "interested",
    timeKey: "yesterday",
    avatarVariant: "green",
  },
  {
    id: "pc-4",
    name: "Lina Susanti",
    callType: "human",
    outcome: "notInterested",
    timeKey: "yesterday",
    avatarVariant: "red",
  },
];
