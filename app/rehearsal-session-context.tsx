"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { confirmRouteModel } from "../lib/route-confirmation";
import { routeModelSchema, type RouteModel } from "../lib/route-model";
import { simulatedRouteModel } from "../lib/simulated-route-model";
import {
  applyRouteAction,
  idleRehearsalState,
  presentPrimaryExitBlockage,
  startBlockedExitRehearsal,
  type RehearsalState,
} from "../lib/rehearsal";
import {
  createSessionEvidence,
  evaluateFailedRoutePersistence,
  recordActionResult,
  recordBlockage,
  type PatternResult,
  type SessionEvidence,
} from "../lib/event-trace";

type CandidateUpdater = RouteModel | ((current: RouteModel) => RouteModel);

type RehearsalSessionContextValue = {
  candidateModel: RouteModel;
  confirmedRouteModel: RouteModel | null;
  setCandidateModel: (updater: CandidateUpdater) => void;
  confirmCandidateModel: () => void;
  rehearsalState: RehearsalState;
  startRehearsal: () => void;
  presentBlockage: () => void;
  chooseRouteAction: (action: unknown) => void;
  sessionEvidence: SessionEvidence | null;
  patternResult: PatternResult | null;
};

const RehearsalSessionContext = createContext<RehearsalSessionContextValue | null>(null);

export function RehearsalSessionProvider({ children }: { children: ReactNode }) {
  const [candidateModel, setCandidateState] = useState<RouteModel>(() =>
    routeModelSchema.parse(simulatedRouteModel),
  );
  const [confirmedRouteModel, setConfirmedRouteModel] = useState<RouteModel | null>(null);
  const [rehearsalState, setRehearsalState] = useState<RehearsalState>(idleRehearsalState);
  const [sessionEvidence, setSessionEvidence] = useState<SessionEvidence | null>(null);
  const [patternResult, setPatternResult] = useState<PatternResult | null>(null);

  function setCandidateModel(updater: CandidateUpdater) {
    setCandidateState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return routeModelSchema.parse({ ...next, status: "Unconfirmed" });
    });
    setConfirmedRouteModel(null);
    setRehearsalState(idleRehearsalState);
    setSessionEvidence(null);
    setPatternResult(null);
  }

  function confirmCandidateModel() {
    setConfirmedRouteModel(confirmRouteModel(candidateModel));
  }

  function startRehearsal() {
    const nextState = startBlockedExitRehearsal(confirmedRouteModel);
    if (nextState) {
      setRehearsalState(nextState);
      setSessionEvidence(createSessionEvidence(new Date().toISOString()));
      setPatternResult(null);
    }
  }

  function presentBlockage() {
    const nextState = presentPrimaryExitBlockage(rehearsalState);
    if (nextState && sessionEvidence) {
      setRehearsalState(nextState);
      setSessionEvidence(recordBlockage(sessionEvidence, new Date().toISOString()));
    }
  }

  function chooseRouteAction(action: unknown) {
    const nextState = applyRouteAction(rehearsalState, action);
    if (nextState && nextState.selectedAction && sessionEvidence) {
      const actionTimestamp = new Date().toISOString();
      const nextEvidence = recordActionResult(
        sessionEvidence,
        nextState.selectedAction,
        nextState.phase,
        actionTimestamp,
        new Date().toISOString(),
      );
      setRehearsalState(nextState);
      setSessionEvidence(nextEvidence);
      setPatternResult(evaluateFailedRoutePersistence(nextEvidence));
    }
  }

  return (
    <RehearsalSessionContext.Provider value={{
      candidateModel,
      confirmedRouteModel,
      setCandidateModel,
      confirmCandidateModel,
      rehearsalState,
      startRehearsal,
      presentBlockage,
      chooseRouteAction,
      sessionEvidence,
      patternResult,
    }}>
      {children}
    </RehearsalSessionContext.Provider>
  );
}

export function useRehearsalSession() {
  const context = useContext(RehearsalSessionContext);

  if (!context) throw new Error("useRehearsalSession must be used inside RehearsalSessionProvider.");
  return context;
}
