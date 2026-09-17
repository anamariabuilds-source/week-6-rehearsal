import { z } from "zod";
import { expectedNextPhase } from "./rehearsal.ts";
import { routeActionSchema, type RouteAction } from "./route-model.ts";

export const scenarioVersion = "SIM-SCHOOL-01" as const;

const timestampSchema = z.string().datetime({ offset: true });
const eventBase = {
  scenarioVersion: z.literal(scenarioVersion),
  timestamp: timestampSchema,
};

export const rehearsalStartedEventSchema = z.object({
  ...eventBase,
  type: z.literal("rehearsal_started"),
}).strict();

export const blockagePresentedEventSchema = z.object({
  ...eventBase,
  type: z.literal("blockage_presented"),
  blockedExit: z.literal("Primary Exit"),
}).strict();

export const routeActionSelectedEventSchema = z.object({
  ...eventBase,
  type: z.literal("route_action_selected"),
  action: routeActionSchema,
}).strict();

export const nextStatePresentedEventSchema = z.object({
  ...eventBase,
  type: z.literal("next_state_presented"),
  nextState: z.enum([
    "attempted-blocked-primary",
    "reassessing",
    "moving-to-alternate-exit",
  ]),
}).strict();

export const traceEventSchema = z.discriminatedUnion("type", [
  rehearsalStartedEventSchema,
  blockagePresentedEventSchema,
  routeActionSelectedEventSchema,
  nextStatePresentedEventSchema,
]);

const traceSchema = z.array(traceEventSchema);

export const sessionEvidenceSchema = z.discriminatedUnion("validity", [
  z.object({
    scenarioVersion: z.literal(scenarioVersion),
    validity: z.literal("valid"),
    events: traceSchema,
  }).strict(),
  z.object({
    scenarioVersion: z.literal(scenarioVersion),
    validity: z.literal("confounded"),
    confoundReason: z.string().trim().min(1).max(160),
    events: traceSchema,
  }).strict(),
]);

export const patternResults = [
  "Pattern detected",
  "Pattern not detected",
  "Indeterminate",
] as const;

export const patternResultSchema = z.enum(patternResults);

export type TraceEvent = z.infer<typeof traceEventSchema>;
export type SessionEvidence = z.infer<typeof sessionEvidenceSchema>;
export type PatternResult = z.infer<typeof patternResultSchema>;

export function createSessionEvidence(timestamp: string): SessionEvidence {
  return sessionEvidenceSchema.parse({
    scenarioVersion,
    validity: "valid",
    events: [{ scenarioVersion, type: "rehearsal_started", timestamp }],
  });
}

export function recordBlockage(
  evidence: SessionEvidence,
  timestamp: string,
): SessionEvidence {
  return sessionEvidenceSchema.parse({
    ...evidence,
    events: [
      ...evidence.events,
      { scenarioVersion, type: "blockage_presented", blockedExit: "Primary Exit", timestamp },
    ],
  });
}

export function recordActionResult(
  evidence: SessionEvidence,
  action: RouteAction,
  nextState: string,
  actionTimestamp: string,
  stateTimestamp: string,
): SessionEvidence {
  const parsedAction = routeActionSchema.parse(action);
  const expectedState = expectedNextPhase(parsedAction);

  if (nextState !== expectedState) {
    throw new Error("The resulting state does not match the selected route action.");
  }

  return sessionEvidenceSchema.parse({
    ...evidence,
    events: [
      ...evidence.events,
      { scenarioVersion, type: "route_action_selected", action: parsedAction, timestamp: actionTimestamp },
      { scenarioVersion, type: "next_state_presented", nextState, timestamp: stateTimestamp },
    ],
  });
}

export function markSessionConfounded(
  evidence: SessionEvidence,
  confoundReason: string,
): SessionEvidence {
  return sessionEvidenceSchema.parse({
    scenarioVersion,
    validity: "confounded",
    confoundReason,
    events: evidence.events,
  });
}

export function evaluateFailedRoutePersistence(input: unknown): PatternResult {
  const parsed = sessionEvidenceSchema.safeParse(input);
  if (!parsed.success || parsed.data.validity === "confounded") return "Indeterminate";

  const events = parsed.data.events;
  const requiredTypes = [
    "rehearsal_started",
    "blockage_presented",
    "route_action_selected",
    "next_state_presented",
  ];

  if (
    events.length !== requiredTypes.length
    || requiredTypes.some((type) => events.filter((event) => event.type === type).length !== 1)
    || events.some((event, index) => (
      index > 0
      && Date.parse(event.timestamp) < Date.parse(events[index - 1]?.timestamp ?? "")
    ))
  ) {
    return "Indeterminate";
  }

  const startedIndex = events.findIndex((event) => event.type === "rehearsal_started");
  const blockageIndex = events.findIndex((event) => event.type === "blockage_presented");
  const actionIndex = events.findIndex((event) => event.type === "route_action_selected");
  const nextStateIndex = events.findIndex((event) => event.type === "next_state_presented");

  if (
    startedIndex !== 0
    || blockageIndex <= startedIndex
    || actionIndex <= blockageIndex
    || nextStateIndex <= actionIndex
  ) {
    return "Indeterminate";
  }

  const actionEvent = events[actionIndex];
  const nextStateEvent = events[nextStateIndex];

  if (actionEvent?.type !== "route_action_selected" || nextStateEvent?.type !== "next_state_presented") {
    return "Indeterminate";
  }

  if (expectedNextPhase(actionEvent.action) !== nextStateEvent.nextState) {
    return "Indeterminate";
  }

  return actionEvent.action === "Continue toward Primary Exit"
    ? "Pattern detected"
    : "Pattern not detected";
}
