import { isRehearsalAvailable } from "./route-confirmation.ts";
import {
  routeActionSchema,
  type RouteAction,
  type RouteModel,
} from "./route-model.ts";

export type RehearsalPhase =
  | "idle"
  | "route-presented"
  | "primary-exit-blocked"
  | "attempted-blocked-primary"
  | "reassessing"
  | "moving-to-alternate-exit";

export type RehearsalState = {
  phase: RehearsalPhase;
  selectedAction: RouteAction | null;
  heading: string;
  message: string;
};

export const idleRehearsalState: RehearsalState = {
  phase: "idle",
  selectedAction: null,
  heading: "Rehearsal not started",
  message: "A confirmed route model is required to start.",
};

export function startBlockedExitRehearsal(confirmedModel: RouteModel | null): RehearsalState | null {
  if (!isRehearsalAvailable(confirmedModel)) return null;

  return {
    phase: "route-presented",
    selectedAction: null,
    heading: "Expected route",
    message: "Classroom A → Hallway A → Primary Exit",
  };
}

export function presentPrimaryExitBlockage(state: RehearsalState): RehearsalState | null {
  if (state.phase !== "route-presented") return null;

  return {
    phase: "primary-exit-blocked",
    selectedAction: null,
    heading: "Primary Exit is blocked",
    message: "The expected route cannot continue through the Primary Exit. Choose one available action.",
  };
}

const nextStateByAction: Record<RouteAction, Omit<RehearsalState, "selectedAction">> = {
  "Continue toward Primary Exit": {
    phase: "attempted-blocked-primary",
    heading: "Primary Exit remains blocked",
    message: "You attempted to continue toward the already-blocked Primary Exit.",
  },
  "Backtrack and reassess": {
    phase: "reassessing",
    heading: "Reassessment state",
    message: "You moved back to the previous decision point to reassess the available route.",
  },
  "Use Alternate Exit via Hallway B": {
    phase: "moving-to-alternate-exit",
    heading: "Moving toward Alternate Exit",
    message: "You are moving through Hallway B toward the Alternate Exit.",
  },
};

export function applyRouteAction(
  state: RehearsalState,
  action: unknown,
): RehearsalState | null {
  if (state.phase !== "primary-exit-blocked") return null;

  const parsedAction = routeActionSchema.safeParse(action);
  if (!parsedAction.success) return null;

  return {
    ...nextStateByAction[parsedAction.data],
    selectedAction: parsedAction.data,
  };
}
