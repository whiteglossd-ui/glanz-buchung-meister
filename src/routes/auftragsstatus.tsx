import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { site } from "@/data/site";
import { BookingStatus } from "@/components/booking-status";
export const Route = createFileRoute("/auftragsstatus")({
  validateSearch: (search: Record<string, unknown>) => ({
    vorgang:
      typeof search.vorgang === "string" && /^WG-\d{1,10}$/.test(search.vorgang)
        ? search.vorgang
        : "",
    token: typeof search.token === "string" ? search.token.slice(0, 100) : "",
  }),
  head: () => {
    const head = pageHead({
      title: `Dein Auftragsstatus | ${site.name}`,
      description:
        "Den Bearbeitungsstand deiner Anfrage bei White-Gloss Detailing über deinen persönlichen Statuslink ansehen.",
      path: "/auftragsstatus",
      robots: "noindex,nofollow",
    });
    return { ...head, meta: [...head.meta, { name: "referrer", content: "no-referrer" }] };
  },
  component: StatusPage,
});
function StatusPage() {
  const { vorgang, token } = Route.useSearch();
  return (
    <main
      id="main-content"
      className="page-doc mx-auto min-h-[65vh] max-w-3xl px-5 pb-20 sm:px-8"
      tabIndex={-1}
    >
      <div className="border-y border-line py-8 sm:py-12">
        <p className="kicker">Kundenbereich</p>
        <h1 className="chrome mt-3 font-display text-4xl sm:text-6xl">
          {vorgang ? `Dein Auftrag ${vorgang}` : "Dein Auftragsstatus"}
        </h1>
        {vorgang && token ? (
          <BookingStatus key={`${vorgang}-${token}`} id={Number(vorgang.slice(3))} token={token} />
        ) : (
          <p className="mt-6 max-w-prose text-muted">
            Bitte öffne den persönlichen Link aus deiner Eingangsbestätigung.
          </p>
        )}
      </div>
    </main>
  );
}
