import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { FluidImg, Shot, type ShotName } from "./media";
import { cn } from "@/lib/utils";

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
        </div>
        <figure className="phero__fig">
          <div className="phero__frame">
            {media ?? (shot ? (
              <Shot
                name={shot}
                alt={alt}
                priority={priority}
                framed={false}
                className="size-full"
                sizes={priority ? "100vw" : "(min-width: 821px) 40vw, 90vw"}
              />
            ) : (
              <FluidImg
                src={src ?? "/media/hero.webp"}
                alt={alt}
                priority={priority}
                className="size-full object-cover"
                sizes="(min-width: 821px) 40vw, 90vw"
              />
            ))}
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
    <div
      className={cn(
        "group relative min-h-[22rem] overflow-hidden sm:min-h-[26rem]",
        className,
      )}
    >
      {shot ? (
        <Shot
          name={shot}
          alt={alt}
          framed={false}
          className="absolute inset-0 h-full w-full"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      ) : (
        <FluidImg
          src={src ?? "/media/atelier.webp"}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">{children}</div>
    </div>
  );
}
