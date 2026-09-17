export default function SetupPage() {
  return (
    <div className="stack">
      <header className="surfaceHeading">
        <div>
          <p className="eyebrow">Consultant/Admin surface</p>
          <h1>Route Setup &amp; Human Confirmation</h1>
          <p className="lede">Foundation shell for reviewing a simulated-school route.</p>
        </div>
        <span className="status statusWarning">Unconfirmed</span>
      </header>

      <aside className="notice noticeWarning">
        <strong>Human authority is required.</strong>
        <span>No candidate extraction or confirmation behavior is available in Commit 1.</span>
      </aside>

      <div className="twoColumn">
        <section className="panel" aria-labelledby="environment-title">
          <div className="panelHeader">
            <div>
              <p className="panelKicker">SIMULATED</p>
              <h2 id="environment-title">School environment</h2>
            </div>
            <span className="placeholderTag">Static shell</span>
          </div>
          <div className="emptyState">
            <span className="emptyIcon" aria-hidden="true">◇</span>
            <strong>Route preview reserved</strong>
            <p>No map upload or route data is active in this increment.</p>
          </div>
        </section>

        <section className="panel" aria-labelledby="elements-title">
          <div className="panelHeader">
            <div>
              <p className="panelKicker">REVIEW AREA</p>
              <h2 id="elements-title">Candidate route elements</h2>
            </div>
          </div>
          <div className="placeholderRows" aria-label="Inactive route element placeholders">
            <div><span>Nodes</span><span>Not available</span></div>
            <div><span>Exits</span><span>Not available</span></div>
            <div><span>Connections</span><span>Not available</span></div>
            <div><span>Labels</span><span>Not available</span></div>
          </div>
        </section>
      </div>

      <div className="actionBar">
        <p>All required elements will need human review before confirmation.</p>
        <button disabled type="button">Confirm route model</button>
      </div>
    </div>
  );
}
