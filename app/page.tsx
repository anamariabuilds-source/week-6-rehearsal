import Link from "next/link";

const surfaces = [
  {
    step: "01",
    actor: "Consultant/Admin",
    title: "Route Setup & Human Confirmation",
    description: "Review vision-assisted candidates and explicitly confirm the simulated route model.",
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
    description: "Inspect the bounded event trace and add a human-authored review note.",
    href: "/review",
  },
];

export default function Home() {
  return (
    <div className="stack stackLarge">
      <section className="hero">
        <p className="eyebrow">SIMULATED SCHOOL · CONTROLLED REHEARSAL</p>
        <h1>Three surfaces, three distinct responsibilities.</h1>
        <p className="heroCopy">
          Move through route setup and human confirmation, the controlled blocked-exit rehearsal, and bounded human review.
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
              <span className="cardAction">Open surface →</span>
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
