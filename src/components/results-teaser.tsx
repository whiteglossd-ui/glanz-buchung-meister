import { Link } from "@tanstack/react-router";
import { LazyBeforeAfterSlider } from "./lazy-before-after-slider";
import { IconArrowRight } from "./icons";
import { CustomerVideoGallery, type CustomerVideo } from "./customer-video-gallery";

export const customerVideos: readonly CustomerVideo[] = [
  {
    title: "Glasversiegelung im Wasserlauf",
    category: "Glasversiegelung",
    duration: "0:08 Min.",
    description:
      "Der gleichmäßige Wasserlauf zeigt die hydrophobe Wirkung auf der versiegelten Scheibe.",
    src: "/media/customer-glass",
    poster: "/media/customer-glass-poster.jpg",
    featured: true,
  },
  {
    title: "Hydrophober Lackschutz",
    category: "White-Gloss Ceramic",
    duration: "0:11 Min.",
    description:
      "Der Abperleffekt auf der Motorhaube macht den aufbereiteten und geschützten Lack sichtbar.",
    src: "/media/customer-beading",
    poster: "/media/customer-beading-poster.jpg",
  },
  {
    title: "Innenraum im Detail",
    category: "Innenraum",
    duration: "0:16 Min.",
    description: "Mittelkonsole, Leder und Einstiegsbereich nach der Innenraumaufbereitung.",
    src: "/media/customer-interior",
    poster: "/media/customer-interior-poster.jpg",
  },
  {
    title: "Lackfinish & Seitenlinie",
    category: "Lackkorrektur",
    duration: "0:09 Min.",
    description: "Felgen, Karosserielinien und Lackglanz am freigegebenen Kundenfahrzeug.",
    src: "/media/customer-exterior",
    poster: "/media/customer-exterior-poster.jpg",
  },
];

export function ResultsTeaser({ service }: { service?: string }) {
  const videos = service
    ? customerVideos.filter((video) => video.category === service).slice(0, 1)
    : customerVideos.filter((video) => !video.featured);
  if (!videos.length) return null;
  const heading =
    service === "White-Gloss Ceramic"
      ? "Ein Ergebnis aus dem Paket White-Gloss Ceramic."
      : service === "Innenraum"
        ? "Ein Ergebnis zur Innenraumaufbereitung."
        : service === "Lackkorrektur"
          ? "Ein Ergebnis zur Lackkorrektur."
          : "So sieht unsere Arbeit aus.";
  return (
    <section
      id={service ? undefined : "kundenergebnisse"}
      className={service ? "wg-results-teaser" : "wg-home-results"}
      aria-labelledby={service ? "service-results-heading" : "results-teaser-heading"}
    >
      <div className={service ? "wg-results-teaser-head" : "wg-collection-head"}>
        <div>
          <p className="kicker">Kundenfahrzeuge</p>
          <h2
            id={service ? "service-results-heading" : "results-teaser-heading"}
            className="heading-2 mt-3"
            data-scroll-title={service ? undefined : true}
          >
            {heading}
          </h2>
        </div>
        {!service ? (
          <Link to="/galerie" className="wg-results-link">
            Alle Ergebnisse <IconArrowRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      {service ? (
        <CustomerVideoGallery videos={videos} compact />
      ) : (
        <>
          <div id="vorher-nachher" className="wg-home-compare scroll-mt-24">
            <LazyBeforeAfterSlider />
          </div>
          <CustomerVideoGallery videos={videos} mobileSwipe />
        </>
      )}
      <p className="wg-results-note">
        Die Aufnahmen stammen aus freigegebenen Kundenaufträgen. Du startest die Videos per Klick.
      </p>
    </section>
  );
}
