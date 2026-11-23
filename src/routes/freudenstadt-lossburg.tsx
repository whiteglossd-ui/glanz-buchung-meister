import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home-page";
import { lossburgHome } from "@/data/home-location";
import { scrollFilmPreloads } from "@/data/scroll-film";
import { parseBookingSelection } from "@/lib/booking-selection";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/freudenstadt-lossburg")({
  validateSearch: parseBookingSelection,
  head: () => {
    const head = pageHead(lossburgHome);
    return {
      ...head,
      // No Horb coordinates or invented address for the planned workshop.
      meta: [
        ...head.meta.filter(
          (tag) =>
            !["geo.placename", "geo.position", "ICBM"].includes(
              "name" in tag ? (tag.name ?? "") : "",
            ),
        ),
        { name: "geo.placename", content: "Loßburg, Freudenstadt, Nordschwarzwald" },
      ],
      links: [...head.links, ...scrollFilmPreloads],
    };
  },
  component: RegionalHome,
});

function RegionalHome() {
  const { paket, ort } = Route.useSearch();
  return <HomePage location="lossburg" initialPackage={paket} initialCity={ort} />;
}
