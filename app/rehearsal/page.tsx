export default function RehearsalPage() {
  return (
    <div className="stack">
      <header className="surfaceHeading">
        <div>
          <p className="eyebrow">Brigadista surface</p>
          <h1>Blocked-Exit Rehearsal</h1>
          <p className="lede">Participant-facing shell for one controlled, simulated rehearsal.</p>
        </div>
        <span className="status statusNeutral">Not active</span>
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
          <p>The blocked-exit scene and participant controls are not implemented in Commit 1.</p>
        </div>
      </section>

      <div className="actionBar">
        <p>Rehearsal controls remain unavailable in this foundation increment.</p>
        <button disabled type="button">Start rehearsal</button>
      </div>
    </div>
  );
}
