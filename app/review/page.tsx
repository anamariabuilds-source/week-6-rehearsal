export default function ReviewPage() {
  return (
    <div className="stack">
      <header className="surfaceHeading">
        <div>
          <p className="eyebrow">Human Reviewer surface</p>
          <h1>Trace &amp; Human Review</h1>
          <p className="lede">A separate reviewer-facing shell, outside the brigadista experience.</p>
        </div>
        <span className="status statusNeutral">No session</span>
      </header>

      <aside className="notice noticeInfo">
        <strong>Reviewer-only surface</strong>
        <span>No session evidence or review functionality is available in Commit 1.</span>
      </aside>

      <div className="reviewGrid">
        <section className="panel" aria-labelledby="evidence-title">
          <div className="panelHeader">
            <div>
              <p className="panelKicker">SESSION EVIDENCE</p>
              <h2 id="evidence-title">Reserved review area</h2>
            </div>
            <span className="placeholderTag">Static shell</span>
          </div>
          <div className="emptyState">
            <span className="emptyIcon" aria-hidden="true">◇</span>
            <strong>No review material</strong>
            <p>This foundation does not generate or display session evidence.</p>
          </div>
        </section>

        <section className="panel" aria-labelledby="human-review-title">
          <div className="panelHeader">
            <div>
              <p className="panelKicker">HUMAN AUTHORITY</p>
              <h2 id="human-review-title">Human review</h2>
            </div>
          </div>
          <div className="emptyState compactEmptyState">
            <strong>Review controls reserved</strong>
            <p>No notes, decisions, or data are collected in this increment.</p>
          </div>
        </section>
      </div>

      <aside className="boundaryNote">
        <strong>Interpretation boundary</strong>
        <span>This surface must not produce a preparedness score or a claim about physical performance.</span>
      </aside>
    </div>
  );
}
