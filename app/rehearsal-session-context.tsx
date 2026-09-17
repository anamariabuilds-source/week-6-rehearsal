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

type CandidateUpdater = RouteModel | ((current: RouteModel) => RouteModel);

type RehearsalSessionContextValue = {
  candidateModel: RouteModel;
  confirmedRouteModel: RouteModel | null;
  setCandidateModel: (updater: CandidateUpdater) => void;
  confirmCandidateModel: () => void;
};

const RehearsalSessionContext = createContext<RehearsalSessionContextValue | null>(null);

export function RehearsalSessionProvider({ children }: { children: ReactNode }) {
  const [candidateModel, setCandidateState] = useState<RouteModel>(() =>
    routeModelSchema.parse(simulatedRouteModel),
  );
  const [confirmedRouteModel, setConfirmedRouteModel] = useState<RouteModel | null>(null);

  function setCandidateModel(updater: CandidateUpdater) {
    setCandidateState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return routeModelSchema.parse({ ...next, status: "Unconfirmed" });
    });
    setConfirmedRouteModel(null);
  }

  function confirmCandidateModel() {
    setConfirmedRouteModel(confirmRouteModel(candidateModel));
  }

  return (
    <RehearsalSessionContext.Provider value={{
      candidateModel,
      confirmedRouteModel,
      setCandidateModel,
      confirmCandidateModel,
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
