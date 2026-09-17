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
};

const RehearsalSessionContext = createContext<RehearsalSessionContextValue | null>(null);

export function RehearsalSessionProvider({ children }: { children: ReactNode }) {
  const [candidateModel, setCandidateState] = useState<RouteModel>(() =>
    routeModelSchema.parse(simulatedRouteModel),
  );
  const [confirmedRouteModel, setConfirmedRouteModel] = useState<RouteModel | null>(null);
  const [rehearsalState, setRehearsalState] = useState<RehearsalState>(idleRehearsalState);

  function setCandidateModel(updater: CandidateUpdater) {
    setCandidateState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return routeModelSchema.parse({ ...next, status: "Unconfirmed" });
    });
    setConfirmedRouteModel(null);
    setRehearsalState(idleRehearsalState);
  }

  function confirmCandidateModel() {
    setConfirmedRouteModel(confirmRouteModel(candidateModel));
  }

  function startRehearsal() {
    const nextState = startBlockedExitRehearsal(confirmedRouteModel);
    if (nextState) setRehearsalState(nextState);
  }

  function presentBlockage() {
    const nextState = presentPrimaryExitBlockage(rehearsalState);
    if (nextState) setRehearsalState(nextState);
  }

  function chooseRouteAction(action: unknown) {
    const nextState = applyRouteAction(rehearsalState, action);
    if (nextState) setRehearsalState(nextState);
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
