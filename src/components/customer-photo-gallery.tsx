import { useEffect, useId, useRef, useState, type TouchEvent } from "react";
import { customerPhotos, featuredPhotoIds } from "@/data/customer-photos";
import type { GalleryPhoto } from "@/lib/studio-public";
import "@/styles/customer-photos.css";

export function CustomerPhotoGallery({ photos }: { photos?: readonly GalleryPhoto[] } = {}) {
  const allPhotos = photos ?? customerPhotos;
  const [category, setCategory] = useState("Auswahl");
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const headingId = useId();
  const categories = ["Auswahl", "Alle", ...new Set(allPhotos.map((photo) => photo.category))];
  const visible = category === "Auswahl"
    ? photos ? allPhotos.slice(0, 6) : featuredPhotoIds.map((id) => customerPhotos.find((item) => item.id === id)!)
    : allPhotos.filter((photo) => category === "Alle" || photo.category === category);
  // The viewer pages through the photos currently shown, in their displayed order.
  const photo = active === null ? null : (visible[active] ?? null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active !== null && !dialog.open) {
      dialog.showModal();
    } else if (active === null && dialog.open) {
      dialog.close();
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [active]);

  const isOpen = active !== null;
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  function finishSwipe(event: TouchEvent<HTMLImageElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || event.touches.length !== 0 || visible.length < 2) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      move(dx < 0 ? 1 : -1);
    }
  }

  function move(direction: number) {
    setActive((current) => current === null ? null : (current + direction + visible.length) % visible.length);
  }

  return (
    <>
      <div className="customer-photo-filters" role="group" aria-label="Kundenbilder filtern">
        {categories.map((value) => (
          <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>
            {value}
          </button>
        ))}
      </div>
      <p className="customer-photo-count" role="status">{visible.length === 0 ? "Aktuell sind hier keine Bilder veröffentlicht." : `${category === "Auswahl" ? `${visible.length} ausgewählte Motive` : `${visible.length} Kundenbilder`} · Zum Vergrößern auswählen`}</p>
      <ul className="customer-photo-grid">
        {visible.map((item, index) => {
          const wide = category === "Auswahl" && (index % 4 === 0 || index % 4 === 3);
          const desktop = wide
            ? "(min-width: 1280px) 814px, (min-width: 1024px) 63vw"
            : "(min-width: 1280px) 395px, (min-width: 1024px) 31vw";
          return (
            <li key={item.id} className={wide ? "customer-photo-wide" : undefined}>
              <button
                type="button"
                className="customer-photo-trigger"
                aria-label={`${item.title} – Bild vergrößern`}
                aria-haspopup="dialog"
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setActive(index);
                }}
              >
                <img
                  src={item.src}
                  srcSet={item.srcSet}
                  sizes={`${desktop}, (min-width: 640px) 46vw, calc(100vw - 32px)`}
                  style={{ objectPosition: item.position }}
                  width={item.width}
                  height={item.height}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                />
                <span className="customer-photo-enlarge" aria-hidden="true">Vergrößern ↗</span>
              </button>
              <p className="customer-photo-category">{item.category}</p>
              <h3 className="heading-3">{item.title}</h3>
            </li>
          );
        })}
      </ul>
      {category === "Auswahl" && allPhotos.length > 0 && <button type="button" className="customer-photo-all" onClick={() => setCategory("Alle")}>Alle {allPhotos.length} Bilder ansehen <span aria-hidden>↗</span></button>}
      <dialog
        ref={dialogRef}
        className="customer-photo-dialog"
        aria-labelledby={headingId}
        onCancel={(event) => { event.preventDefault(); setActive(null); }}
        onClose={() => setActive(null)}
        onClick={(event) => { if (event.target === event.currentTarget) setActive(null); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
          if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        }}
      >
        {photo && active !== null ? (
          <div className="customer-photo-viewer">
            <div className="customer-photo-viewer-head">
              <div>
                <p className="kicker" aria-live="polite">Bild {active + 1} von {visible.length}</p>
                <h2 id={headingId} className="heading-3">{photo.title}</h2>
              </div>
              <button type="button" onClick={() => setActive(null)} autoFocus aria-label="Bild schließen">Schließen ×</button>
            </div>
            <img
              key={photo.id}
              src={photo.src}
              srcSet={photo.srcSet}
              sizes={`min(90vw, 1100px, ${63 * photo.width / photo.height}dvh)`}
              width={photo.width}
              height={photo.height}
              alt={photo.alt}
              decoding="async"
              draggable={false}
              onTouchStart={(event) => {
                const touch = event.touches[0];
                swipeStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
              }}
              onTouchCancel={() => { swipeStart.current = null; }}
              onTouchEnd={finishSwipe}
            />
            <div className="customer-photo-viewer-controls">
              <button type="button" onClick={() => move(-1)} disabled={visible.length < 2} aria-label="Vorheriges Kundenbild">← Zurück</button>
              <p>{photo.category}</p>
              <button type="button" onClick={() => move(1)} disabled={visible.length < 2} aria-label="Nächstes Kundenbild">Weiter →</button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}

