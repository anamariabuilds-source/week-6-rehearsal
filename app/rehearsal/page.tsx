"use client";

import { isRehearsalAvailable } from "../../lib/route-confirmation";
import { useRehearsalSession } from "../rehearsal-session-context";

export default function RehearsalPage() {
  const { confirmedRouteModel } = useRehearsalSession();
  const isAvailable = isRehearsalAvailable(confirmedRouteModel);

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
        <strong>Controlled simulated rehearsal</strong>
        <span>Actions in this browser scenario do not prove real-world preparedness or physical transfer.</span>
      </aside>

      <section className="panel scenePanel" aria-labelledby="scene-title">
        <div className="panelHeader">
          <div>
            <p className="panelKicker">SIMULATED</p>
            <h2 id="scene-title">Rehearsal scene</h2>
          </div>
          <span className="placeholderTag">Static shell</span>
        </div>
        <div className="emptyState emptyStateWide">
          <span className="emptyIcon" aria-hidden="true">◇</span>
          <strong>Scenario area reserved</strong>
          <p>
            {isAvailable
              ? "The confirmed simulated route model is available for this rehearsal. Scenario behavior is added in the next increment."
              : "A Consultant/Admin must explicitly confirm the route model before this rehearsal is available."}
          </p>
        </div>
      </section>

      <div className="actionBar">
        <p>{isAvailable ? "Confirmed route model received." : "Route model confirmation required."}</p>
        <button disabled={!isAvailable} type="button">Start rehearsal</button>
      </div>
    </div>
  );
}
