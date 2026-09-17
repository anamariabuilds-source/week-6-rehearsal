import { routeModelSchema, type RouteModel } from "./route-model";

const simulatedRouteModelCandidate = {
  scenario: "SIMULATED SCHOOL",
  status: "Unconfirmed",
  nodes: [
    { id: "classroom-a", label: "Classroom A", reviewStatus: "Confirmed" },
    { id: "hallway-a", label: "Hallway A", reviewStatus: "Suggested" },
    { id: "hallway-b", label: "Hallway B", reviewStatus: "Needs review" },
  ],
  exits: [
    { id: "primary-exit", label: "Primary Exit", reviewStatus: "Suggested" },
    { id: "alternate-exit", label: "Alternate Exit", reviewStatus: "Confirmed" },
  ],
  connections: [
    {
      id: "classroom-a-hallway-a",
      from: "classroom-a",
      to: "hallway-a",
      label: "Classroom A → Hallway A",
      reviewStatus: "Confirmed",
    },
    {
      id: "hallway-a-primary-exit",
      from: "hallway-a",
      to: "primary-exit",
      label: "Hallway A → Primary Exit",
      reviewStatus: "Needs review",
    },
    {
      id: "hallway-a-hallway-b",
      from: "hallway-a",
      to: "hallway-b",
      label: "Hallway A → Hallway B",
      reviewStatus: "Suggested",
    },
    {
      id: "hallway-b-alternate-exit",
      from: "hallway-b",
      to: "alternate-exit",
      label: "Hallway B → Alternate Exit",
      reviewStatus: "Suggested",
    },
  ],
  labels: [
    {
      id: "simulation-boundary",
      text: "SIMULATED SCHOOL — not a validated evacuation plan for a real school.",
      reviewStatus: "Confirmed",
    },
  ],
} as const;

export const simulatedRouteModel: RouteModel = routeModelSchema.parse(
  simulatedRouteModelCandidate,
);
