import { serializeJsonLd } from "@/lib/json-ld";
import { localBusinessJsonLd } from "@/lib/seo";
import { homeCopy, homeText } from "@/data/home-copy";
import { DarkHome } from "@/components/dark/dark-home";
import { WebsiteStudioContent } from "@/components/website-studio-content";
import type { PublishedStudioDocument } from "@/lib/studio-public";
import type { PackageId } from "@/data/site";
import { lossburgHome } from "@/data/home-location";
import { RegionalHomeDetails } from "@/components/regional-home-details";

/**
 * Startseite (Horb und Loßburg) im Look der Dark-Edition-Vorlage.
 * Inhaberauftrag vom 25.11.2026, siehe docs/homepage-dark-edition-2026-11-25.md.
 * Studio-Texte, JSON-LD und das echte Buchungsformular bleiben erhalten.
 */
export function HomePage({
  location = "horb",
  document,
  aboutPublished = false,
  initialPackage,
  initialCity,
}: {
  location?: "horb" | "lossburg";
  document?: PublishedStudioDocument | null;
  aboutPublished?: boolean;
  initialPackage?: PackageId;
  initialCity?: string;
}) {
  const regional = location === "lossburg";
  const jsonLd = localBusinessJsonLd();
  const studio =
    document &&
    (Boolean(
      document.content.body.trim() && homeText("body", document.content.body) !== homeCopy.body,
    ) ||
      document.content.sections.length > 0 ||
      document.content.faqs.length > 0 ||
      document.content.images.some((image) => image.assetId !== document.content.heroAssetId));

  return (
    <DarkHome
      location={location}
      aboutPublished={aboutPublished}
      title={regional ? lossburgHome.heading : homeText("title", document?.content.title.trim() || undefined)}
      lead={regional ? lossburgHome.lead : homeText("lead", document?.content.lead.trim() || undefined)}
      initialPackage={initialPackage}
      initialCity={initialCity ?? (regional ? "lossburg" : undefined)}
      jsonLd={<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />}
      studio={
        regional ? (
          <RegionalHomeDetails />
        ) : studio ? (
          <section className="sec wgt-studio" aria-label="Aus unserer Werkstatt">
            <div className="wrap">
              <WebsiteStudioContent
                content={document.content}
                assets={document.assets}
                headingLevel={1}
                showIntro={false}
                showHero={false}
                showBody={
                  document.content.body.trim() !== homeCopy.body &&
                  homeText("body", document.content.body) !== homeCopy.body
                }
              />
            </div>
          </section>
        ) : null
      }
    />
  );
}
