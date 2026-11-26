import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { googleProfile, type GoogleReview, type GoogleReviewsData } from "@/data/google-profile";
import reviewLinks from "@/data/review-links.json";
import { originalReviewText, selectReviewHighlights } from "@/lib/review-highlights";
import "@/styles/review-showcase.css";

function ReviewSource({ href, label, subject }: { href: string; label: string; subject?: string }) {
  return <a className="wg-reviews__source" href={href} aria-label={subject ? `${label}: ${subject}` : undefined} target="_blank" rel="noopener noreferrer">{label}<span aria-hidden="true">↗</span></a>;
}

function Quote({ review }: { review: GoogleReview }) {
  return (
    <figure className="m-0">
      <span className="wg-reviews__stars" role="img" aria-label={`${review.rating} von 5 Sternen`}>
        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
      </span>
      <blockquote className="wg-reviews__quote">
        <p>„{originalReviewText(review.text)}“</p>
      </blockquote>
      <figcaption className="wg-reviews__meta">
        <strong>{review.author}</strong>
        <span>Google Maps</span>
        <time dateTime={review.date}>{new Date(review.date).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })}</time>
      </figcaption>
    </figure>
  );
}

export function ReviewShowcase({ data }: { data?: GoogleReviewsData | null }) {
  const { featured, more } = selectReviewHighlights(data?.reviews ?? []);
  const track = useRef<HTMLUListElement>(null);
  const trackId = useId();
  const headingId = useId();
  const [edges, setEdges] = useState({ back: false, next: false });

  useEffect(() => {
    const list = track.current;
    if (!list) return;
    function update() {
      if (!list) return;
      const back = list.scrollLeft > 2;
      const next = list.scrollLeft < list.scrollWidth - list.clientWidth - 2;
      setEdges((old) => old.back === back && old.next === next ? old : { back, next });
    }
    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    list.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", update);
    };
  }, [featured?.id, more.length]);

  function move(direction: number) {
    const list = track.current;
    const [first, second] = Array.from(list?.children ?? []) as HTMLElement[];
    if (!list || !first || !second || !(direction < 0 ? edges.back : edges.next)) return;
    const step = second.offsetLeft - first.offsetLeft;
    // Move to the previous/next actual snap point, including partly-visible desktop ends.
    const offset = list.scrollLeft;
    const index = direction < 0 ? Math.ceil((offset - 2) / step) - 1 : Math.floor((offset + 2) / step) + 1;
    list.scrollTo({ left: Math.max(0, index * step), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function keyMove(event: KeyboardEvent<HTMLUListElement>) {
    if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  }

  const moreLinks = !featured || more.length === 0 ? reviewLinks.more : null;
  return (
    <div className="wg-reviews">
      <p className="label label--rule">03 / Google</p>
      <h2 id={headingId} className="h2 chrome wg-reviews__heading">Erfahrungen unserer Kunden.</h2>
      <div className="wg-reviews__deck">
        <div className="wg-reviews__focus">
          <p className="wg-reviews__eyebrow">Im Fokus · Google Maps</p>
          {featured ? <Quote review={featured} /> : <h3>{reviewLinks.featured.title}</h3>}
          {!featured && <ReviewSource href={reviewLinks.featured.url} label="Originalrezension auf Google Maps lesen" />}
          {featured && data && (
            <p className="wg-reviews__meta">
              <strong>{data.averageRating.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} von 5 Sternen</strong>
              <span>{data.totalReviewCount} Bewertungen auf Google Maps</span>
            </p>
          )}
        </div>
        <div className="wg-reviews__art" aria-hidden="true">
          <img src="/media/dark/customer-selection/own-04-800.webp" alt="" width="800" height="500" loading="lazy" decoding="async" />
        </div>
      </div>
      {(moreLinks || more.length > 0) && (
        <>
          <div className="wg-reviews__bar">
            <h3 id={`${headingId}-more`}>Weitere Kundenstimmen</h3>
            <div className="wg-reviews__actions" hidden={!edges.back && !edges.next}>
              <button type="button" aria-label="Vorherige Kundenstimme" aria-controls={trackId} aria-disabled={!edges.back} onClick={() => move(-1)}>←</button>
              <button type="button" aria-label="Nächste Kundenstimme" aria-controls={trackId} aria-disabled={!edges.next} onClick={() => move(1)}>→</button>
            </div>
          </div>
          <ul id={trackId} ref={track} className="wg-reviews__track" data-lenis-prevent-horizontal="" aria-labelledby={`${headingId}-more`} tabIndex={0} onKeyDown={keyMove}>
            {moreLinks ? moreLinks.map((item) => (
              <li className="wg-reviews__item" key={item.url}>
                <p className="wg-reviews__eyebrow">Google Maps</p>
                <h4>{item.title}</h4>
                <ReviewSource href={item.url} label="Original lesen" subject={item.title} />
              </li>
            )) : more.map((review) => (
              <li className="wg-reviews__item" key={review.id}><Quote review={review} /></li>
            ))}
          </ul>
        </>
      )}
      <p className="wg-reviews__caption">
        {featured ? "Auswahl aus den zuletzt aktualisierten schriftlichen Rezensionen." : "Ausgewählte Originalrezensionen. Die Texte öffnen sich direkt auf Google Maps."}
      </p>
      <ReviewSource href={googleProfile.url} label="Alle Bewertungen auf Google ansehen" />
    </div>
  );
}
