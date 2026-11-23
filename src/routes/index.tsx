import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home-page";
import { cities, site } from "@/data/site";
import { pageHead } from "@/lib/seo";
import { parseBookingSelection } from "@/lib/booking-selection";
import { scrollFilmPreloads } from "@/data/scroll-film";
import { loadPublicStudioDocument } from "@/lib/studio-public.functions";
import { studioHero, studioMetadata } from "@/lib/studio-public";

export const Route = createFileRoute("/")({
  validateSearch: parseBookingSelection,
  component: Home,
  loader: async () => {
    const [document, about] = await Promise.all([
      loadPublicStudioDocument("home"),
      loadPublicStudioDocument("about"),
    ]);
    return { document, aboutPublished: Boolean(about) };
  },
  head: ({ loaderData }) => {
    const hero = studioHero(loaderData?.document);
    const head = pageHead({
      ...studioMetadata(loaderData?.document, {
        title: `Fahrzeugaufbereitung in ${site.city} | ${site.legalName}`,
        description: `Fahrzeugaufbereitung in Horb am Neckar: Innenraumreinigung, Lackkorrektur und Keramikversiegelung. Hol- und Bringservice für ${cities.length} Abholorte.`,
      }),
      path: "/",
      ...(hero ? { preloadImage: hero.src, image: hero.src } : {}),
    });
    return { ...head, links: [...head.links, ...(hero ? [] : scrollFilmPreloads)] };
  },
});

function Home() {
  const { paket, ort } = Route.useSearch();
  const { document, aboutPublished } = Route.useLoaderData();
  return (
    <HomePage
      document={document}
      aboutPublished={aboutPublished}
      initialPackage={paket}
      initialCity={ort}
    />
  );
}
