import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import type { ShotName } from "./media";
import { cn } from "@/lib/utils";
import { heroAvifSrcSet, heroWebpSrcSet } from "@/data/media-src";
import { pageHeroSizes } from "@/lib/seo";

export function PageCrumbs({ items }: { items: { label: string; to?: string }[] }) {
  // Dark Edition: Brotkrumen wie in der Vorlage (.crumbs).
  return (
    <nav aria-label="Brotkrumen" className="crumbs">
      {items.map((item, i) => (
        <span key={item.label} className="contents">
          {i > 0 ? <i aria-hidden="true">/</i> : null}
          {item.to ? (
            <Link to={item.to as never} preload={false}>
              {item.label}
            </Link>
          ) : (
            <span aria-current={i === items.length - 1 ? "page" : undefined}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// Describe what is visible in the current files. Several routes use the same
// photograph to introduce different services.
const pageShots: Record<ShotName, { width: number; height: number; alt: string }> = {
  hero: {
    width: 1600,
    height: 907,
    alt: "Schwarzer Klassiker zwischen zwei senkrechten Lichtleisten",
  },
  atelier: { width: 1200, height: 675, alt: "Schwarzer BMW in Seitenansicht vor einem Holztor" },
  lack: {
    width: 1200,
    height: 900,
    alt: "Glänzende Frontpartie eines schwarzen BMW mit Scheinwerfer und Vorderrad",
  },
  keramik: {
    width: 1200,
    height: 900,
    alt: "Spiegelung einer Holzfassade auf dem dunklen Fahrzeuglack",
  },
  leder: {
    width: 1200,
    height: 900,
    alt: "Gepflegte Mittelkonsole mit Ledermittelarmlehne und Schalthebel",
  },
  dellen: { width: 1200, height: 800, alt: "Delle in einem hellen Karosserieblech am Radlauf" },
  finish: {
    width: 1200,
    height: 900,
    alt: "Heckleuchte und glänzende Heckpartie eines schwarzen BMW",
  },
  private: {
    width: 1200,
    height: 675,
    alt: "Schwarzer BMW mit glänzendem Lack vor bewaldeten Hügeln",
  },
  felgen: {
    width: 1200,
    height: 900,
    alt: "Seitenansicht eines schwarzen BMW mit Mehrspeichenfelgen",
  },
};

// Intrinsic dimensions of the four workshop photos used by the editorial guides.
const editorialDimensions: Record<string, [number, number]> = {
  "own-02": [960, 600],
  "own-04": [1148, 718],
  "own-07": [1148, 1531],
  "own-08": [1082, 676],
};

export function PagePhoto({
  shot,
  src,
  alt,
  priority = false,
  sizes = pageHeroSizes,
}: {
  shot?: ShotName;
  src?: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  const source = src ?? `/media/${shot ?? "hero"}.webp`;
  const imageProps = {
    alt,
    sizes,
    loading: priority ? ("eager" as const) : ("lazy" as const),
    fetchPriority: priority ? ("high" as const) : ("low" as const),
    decoding: "async" as const,
    className: "block size-full object-cover",
  };
  const stem = source.match(/^\/media\/([a-z]+)\.webp$/)?.[1];
  if (stem && Object.hasOwn(pageShots, stem)) {
    const photo = pageShots[stem as ShotName];
    const base = `/media/${stem}`;
    const variants = (format: string) =>
      [480, 800, 1200].map((w) => `${base}-${w}.${format} ${w}w`).join(", ");
    const hero = stem === "hero";
    return (
      <picture className="block size-full">
        <source type="image/avif" srcSet={hero ? heroAvifSrcSet : variants("avif")} sizes={sizes} />
        <img
          {...imageProps}
          src={`${base}-${hero ? 720 : 480}.webp`}
          srcSet={hero ? heroWebpSrcSet : variants("webp")}
          width={photo.width}
          height={photo.height}
          alt={alt ? photo.alt : ""}
        />
      </picture>
    );
  }
  const editorial = source.match(
    /^(\/media\/dark\/customer-selection\/(own-\d+))-(?:full|800|480)\.webp$/,
  );
  const size = editorial && editorialDimensions[editorial[2]];
  if (editorial && size) {
    const path = editorial[1];
    return (
      <img
        src={`${path}-480.webp`}
        srcSet={`${path}-480.webp 480w, ${path}-800.webp 800w, ${path}-full.webp ${size[0]}w`}
        width={size[0]}
        height={size[1]}
        {...imageProps}
      />
    );
  }
  return <img src={source} {...imageProps} />;
}

/**
 * Shared Dark Edition opening. Keep the artwork in normal reading order,
 * below the copy, so links and long headings stay usable on mobile.
 */
export function PageHero({
  kicker,
  title,
  lead,
  shot,
  src,
  alt,
  priority = true,
  actions,
  crumbs,
  media,
  children,
}: {
  kicker?: string;
  title: string;
  lead?: string;
  shot?: ShotName;
  src?: string;
  alt: string;
  priority?: boolean;
  actions?: ReactNode;
  crumbs?: { label: string; to?: string }[];
  media?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="phero page-hero">
      <div className="phero__shade" aria-hidden="true" />
      <div className="wrap phero__in phero__in--fig">
        <div className="phero__copy">
          {crumbs ? <PageCrumbs items={crumbs} /> : null}
          {kicker ? <p className="kicker">{kicker}</p> : null}
          <h1 className="phero__title chrome">{title}</h1>
          {lead ? <p className="hero__lead">{lead}</p> : null}
          {actions ? <div className="hero__actions">{actions}</div> : null}
          {children}
        </div>
        <figure className="phero__fig">
          <div className="phero__frame">
            {media ?? <PagePhoto shot={shot} src={src} alt={alt} priority={priority} />}
          </div>
        </figure>
      </div>
    </section>
  );
}

export function MediaTile({
  shot,
  src,
  alt,
  children,
  className,
}: {
  shot?: ShotName;
  src?: string;
  alt: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group flex h-full flex-col", className)}>
      <div className="aspect-[16/10] overflow-hidden rounded-[var(--r)]">
        <PagePhoto
          shot={shot}
          src={src}
          alt={alt}
          sizes="(min-width: 1356px) 570px, (min-width: 768px) 43vw, 90vw"
        />
      </div>
      <div className="min-w-0 px-1 pt-5 pb-2 sm:pt-7">{children}</div>
    </div>
  );
}
