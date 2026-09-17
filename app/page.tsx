import Link from "next/link";

const surfaces = [
  {
    step: "01",
    actor: "Consultant/Admin",
    title: "Route Setup & Human Confirmation",
    description: "Static setup surface for the simulated route model.",
    href: "/setup",
  },
  {
    step: "02",
    actor: "Brigadista",
    title: "Blocked-Exit Rehearsal",
    description: "Separate participant-facing surface for the controlled rehearsal.",
    href: "/rehearsal",
  },
  {
    step: "03",
    actor: "Human Reviewer",
    title: "Trace & Human Review",
    description: "Separate reviewer-facing surface for later human inspection.",
    href: "/review",
  },
];

export default function Home() {
  return (
    <div className="stack stackLarge">
      <section className="hero">
        <p className="eyebrow">SIMULATED SCHOOL · STATIC FOUNDATION</p>
        <h1>Three surfaces, three distinct responsibilities.</h1>
        <p className="heroCopy">
          This foundation establishes the approved product structure only. Rehearsal behavior and evidence features are not active in this increment.
        </p>
      </section>

      <section aria-labelledby="surfaces-title">
        <div className="sectionHeading">
          <p className="eyebrow">Approved product surfaces</p>
          <h2 id="surfaces-title">Choose by actor</h2>
        </div>
        <div className="cardGrid">
          {surfaces.map((surface) => (
            <Link className="surfaceCard" href={surface.href} key={surface.href}>
              <span className="stepNumber">{surface.step}</span>
              <span className="actorBadge">{surface.actor}</span>
              <h3>{surface.title}</h3>
              <p>{surface.description}</p>
              <span className="cardAction">Open static surface →</span>
            </Link>
          ))}
        </div>
      </section>

      <aside className="boundaryNote">
        <strong>Prototype boundary</strong>
        <span>This digital slice does not test real-world performance or physical transfer.</span>
      </aside>
    </div>
  );
}
