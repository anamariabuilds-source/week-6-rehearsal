import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { RehearsalSessionProvider } from "./rehearsal-session-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Week 6 Rehearsal",
  description: "Static shell for the Week 6 controlled rehearsal prototype.",
};

const surfaces = [
  {
    actor: "Consultant/Admin",
    label: "Route Setup & Human Confirmation",
    href: "/setup",
  },
  {
    actor: "Brigadista",
    label: "Blocked-Exit Rehearsal",
    href: "/rehearsal",
  },
  {
    actor: "Human Reviewer",
    label: "Trace & Human Review",
    href: "/review",
  },
];

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="siteHeader">
          <div className="headerInner">
            <Link className="wordmark" href="/">
              Week 6 Rehearsal
            </Link>
            <nav aria-label="Product surfaces">
              <ul className="navList">
                {surfaces.map((surface) => (
                  <li key={surface.href}>
                    <Link className="navLink" href={surface.href}>
                      <span className="navActor">{surface.actor}</span>
                      <span>{surface.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <RehearsalSessionProvider>
          <main className="pageFrame">{children}</main>
        </RehearsalSessionProvider>
        <footer className="siteFooter">
          Controlled digital prototype · No claim of preparedness, competence, safety, or physical transfer.
        </footer>
      </body>
    </html>
  );
}
