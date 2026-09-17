"use client";

import { isRehearsalAvailable } from "../../lib/route-confirmation";
import { routeActions } from "../../lib/route-model";
import { useRehearsalSession } from "../rehearsal-session-context";

export default function RehearsalPage() {
  const {
    confirmedRouteModel,
    rehearsalState,
    startRehearsal,
    presentBlockage,
    chooseRouteAction,
  } = useRehearsalSession();
  const isAvailable = isRehearsalAvailable(confirmedRouteModel);
  const isBlocked = rehearsalState.phase === "primary-exit-blocked";
  const hasResultingState = [
    "attempted-blocked-primary",
    "reassessing",
    "moving-to-alternate-exit",
  ].includes(rehearsalState.phase);

  return (
    <div className="stack">
      <header className="surfaceHeading">
        <div>
          <p className="eyebrow">Brigadista surface</p>
          <h1>Blocked-Exit Rehearsal</h1>
          <p className="lede">Participant-facing shell for one controlled, simulated rehearsal.</p>
        </div>
        <span className={`status ${isAvailable ? "statusConfirmed" : "statusNeutral"}`}>
          {isAvailable ? "Available" : "Unavailable"}
        </span>
      </header>

      <aside className="notice noticeInfo">
        <strong>Controlled simulated rehearsal.</strong>
        <span>Your actions in this scenario do not prove real-world preparedness or physical transfer.</span>
      </aside>

      <section className="panel scenePanel" aria-labelledby="scene-title">
        <div className="panelHeader">
          <div>
            <p className="panelKicker">SIMULATED</p>
            <h2 id="scene-title">Rehearsal scene</h2>
          </div>
          <span className={`placeholderTag ${isBlocked ? "blockedTag" : ""}`}>
            {isBlocked ? "Primary Exit blocked" : "SIMULATED"}
          </span>
        </div>
        <div className="rehearsalScene">
          <div className="rehearsalRoute" aria-label="Starting route from Classroom A through Hallway A to Primary Exit">
            <div className="sceneNode">Classroom A</div>
            <span aria-hidden="true">→</span>
            <div className="sceneNode">Hallway A</div>
            <span aria-hidden="true">→</span>
            <div className={`sceneNode primarySceneExit ${isBlocked || hasResultingState ? "isBlocked" : ""}`}>
              Primary Exit
              {isBlocked || hasResultingState ? <strong>BLOCKED</strong> : null}
            </div>
          </div>
          <div className="sceneMessage" aria-live="polite">
            <h3>{rehearsalState.heading}</h3>
            <p>
              {isAvailable
                ? rehearsalState.message
                : "A Consultant/Admin must explicitly confirm the route model before this rehearsal is available."}
            </p>
            {hasResultingState && rehearsalState.selectedAction ? (
              <p className="causality"><strong>Selected action:</strong> {rehearsalState.selectedAction} → {rehearsalState.heading}</p>
            ) : null}
          </div>
        </div>
      </section>

      {isBlocked ? (
        <section className="panel actionPanel" aria-labelledby="actions-title">
          <div className="panelHeader">
            <div>
              <p className="panelKicker">CHOOSE ONE ACTION</p>
              <h2 id="actions-title">What do you do next?</h2>
            </div>
          </div>
          <div className="routeActions">
            {routeActions.map((action) => (
              <button key={action} onClick={() => chooseRouteAction(action)} type="button">{action}</button>
            ))}
          </div>
        </section>
      ) : (
        <div className="actionBar">
          <p>
            {!isAvailable
              ? "Route model confirmation required."
              : rehearsalState.phase === "idle"
                ? "Confirmed route model received."
                : rehearsalState.phase === "route-presented"
                  ? "The starting route is visible. Continue to the controlled blocked-exit condition."
                  : "The selected action produced the next state shown above."}
          </p>
          {rehearsalState.phase === "route-presented" ? (
            <button onClick={presentBlockage} type="button">Continue scenario</button>
          ) : hasResultingState ? null : (
            <button disabled={!isAvailable} onClick={startRehearsal} type="button">Start rehearsal</button>
          )}
        </div>
      )}
    </div>
  );
}
