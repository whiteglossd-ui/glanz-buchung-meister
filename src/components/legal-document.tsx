import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const documents = [
  ["/impressum", "Impressum"],
  ["/datenschutz", "Datenschutz"],
  ["/agb", "AGB"],
  ["/widerruf", "Widerruf"],
  ["/datenloeschung", "Datenlöschung"],
  ["/barrierefreiheit", "Barrierefreiheit"],
] as const;

export function LegalDocument({ children }: { children: ReactNode }) {
  return (
    <div className="wrap prose-legal">
      <div className="grid items-start gap-10 py-12 md:grid-cols-[minmax(10rem,1fr)_minmax(0,3fr)] md:gap-14 md:py-20">
        <article className="md:col-start-2 min-w-0 max-w-[68ch] border-t border-line pt-5 [overflow-wrap:anywhere] [&_section:first-child_h2]:mt-0 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1.5">
          {children}
        </article>
        <nav className="md:col-start-1 md:row-start-1" aria-label="Rechtliche Informationen">
          <p className="kicker border-b border-line pb-3">Rechtliche Informationen</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 md:flex-col">
            {documents.map(([to, label]) => (
              <li key={to}>
                <Link
                  to={to}
                  preload={false}
                  className="inline-flex min-h-11 items-center text-sm text-muted underline-offset-4 hover:underline"
                  activeProps={{ className: "font-semibold text-fg underline" }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
