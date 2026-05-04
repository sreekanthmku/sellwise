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
    name: "Marcus Thompson",
    callType: "human",
    outcome: "interested",
    timeKey: "t915",
    avatarVariant: "purple",
  },
  {
    id: "pc-2",
    name: "Sarah Mitchell",
    callType: "human",
    outcome: "followUp",
    timeKey: "t915",
    avatarVariant: "purple",
  },
  {
    id: "pc-3",
    name: "David Park",
    callType: "ai",
    outcome: "interested",
    timeKey: "yesterday",
    avatarVariant: "green",
  },
  {
    id: "pc-4",
    name: "Jennifer Adams",
    callType: "human",
    outcome: "notInterested",
    timeKey: "yesterday",
    avatarVariant: "red",
  },
];
