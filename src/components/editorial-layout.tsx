import type { ReactNode } from "react";
import "@/styles/editorial-pages.css";

export function EditorialLayout({
  links,
  children,
}: {
  links: { id: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="editorial-layout">
      <nav className="editorial-contents" aria-label="Auf dieser Seite">
        <p className="kicker">Auf dieser Seite</p>
        <ul>
          {links.map(({ id, label }) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="editorial-reading">{children}</div>
    </div>
  );
}
