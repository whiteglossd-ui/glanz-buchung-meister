import { Link } from "@tanstack/react-router";
import type { City } from "@/data/site";

/** The four partner services, linked from every pickup town with the town in the anchor text. */
const partnerLinks = [
  { to: "/folierung", label: "Autofolierung" },
  { to: "/lackierarbeiten", label: "Lackierarbeiten" },
  { to: "/dellen-druecken", label: "Dellen drücken" },
  { to: "/smart-repair", label: "Smart Repair" },
] as const;

export function PartnerCityLinks({ city }: { city: City }) {
  return (
    <div className="mt-10">
      <h3 className="font-display text-xl">Mit Partnerbetrieben für {city.name}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Folierung, Lack und kleine Schäden übernehmen erfahrene Partnerbetriebe. Wir koordinieren alles
        und holen dein Auto in {city.name} auf Wunsch ab.
      </p>
      <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
        {partnerLinks.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="flex min-h-11 items-center text-sm text-muted hover:text-fg">
              {item.label} für {city.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
