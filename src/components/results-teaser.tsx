import { Link } from "@tanstack/react-router";
import { LazyBeforeAfterSlider } from "./lazy-before-after-slider";
import { IconArrowRight } from "./icons";
import { CustomerVideoGallery } from "./customer-video-gallery";
import { customerVideos } from "@/data/customer-videos";

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
        <CustomerVideoGallery
          videos={videos}
          mobileSwipe
          leadingItems={[
            {
              id: "vorher-nachher",
              label: "Lackaufbereitung im Vergleich",
              content: (
                <>
                  <div className="wg-rail-frame wg-rail-comparison">
                    <LazyBeforeAfterSlider />
                  </div>
                  <div className="wg-rail-copy">
                    <h3>Lackaufbereitung im Vergleich</h3>
                    <p>
                      Zieh den Griff nach links oder rechts: So verändert die Politur den Lack unter
                      demselben Prüflicht.
                    </p>
                  </div>
                </>
              ),
            },
          ]}
        />
      )}
      <p className="wg-results-note">
        Die Aufnahmen stammen aus freigegebenen Kundenaufträgen. Du startest die Videos per Klick.
      </p>
    </section>
  );
}
