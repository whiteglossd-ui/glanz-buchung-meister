import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { FluidImg, Shot, type ShotName } from "./media";
import { cn } from "@/lib/utils";
import { heroAvifSrcSet, heroWebpSrcSet, pageHeroSizes } from "@/data/media-src";

export function PageCrumbs({
  items,
}: {
  items: { label: string; to?: string }[];
}) {
  // Dark Edition: Brotkrumen wie in der Vorlage (.crumbs).
  return (
    <nav aria-label="Brotkrumen" className="crumbs">
      {items.map((item, i) => (
        <span key={item.label} className="contents">
          {i > 0 ? <i aria-hidden="true">/</i> : null}
          {item.to ? (
            <Link to={item.to as never} preload={false}>{item.label}</Link>
          ) : (
            <span aria-current={i === items.length - 1 ? "page" : undefined}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

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
    loading: priority ? "eager" as const : "lazy" as const,
    fetchPriority: priority ? "high" as const : "low" as const,
    decoding: "async" as const,
    className: "block size-full object-cover",
  };
  if (source === "/media/hero.webp") {
    return (
      <picture className="block size-full">
        <source type="image/avif" srcSet={heroAvifSrcSet} sizes={sizes} />
        <img src="/media/hero-720.webp" srcSet={heroWebpSrcSet} width={1600} height={907} {...imageProps} />
      </picture>
    );
  }
  const editorial = source.match(/^(\/media\/dark\/customer-selection\/(own-\d+))-(?:full|800|480)\.webp$/);
  const size = editorial && editorialDimensions[editorial[2]];
  if (editorial && size) {
    const path = editorial[1];
    return (
      <img src={`${path}-480.webp`} srcSet={`${path}-480.webp 480w, ${path}-800.webp 800w, ${path}-full.webp ${size[0]}w`}
        width={size[0]} height={size[1]} {...imageProps} />
    );
  }
  return shot
    ? <Shot name={shot} alt={alt} priority={priority} sizes={sizes} framed={false} className="size-full" />
    : <FluidImg src={source} alt={alt} priority={priority} sizes={sizes} className="size-full object-cover" />;
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
        <PagePhoto shot={shot} src={src} alt={alt} sizes="(min-width: 1356px) 570px, (min-width: 768px) 43vw, 90vw" />
      </div>
      <div className="min-w-0 px-1 pt-5 pb-2 sm:pt-7">{children}</div>
    </div>
  );
}
