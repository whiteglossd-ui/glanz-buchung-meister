import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { IconArrowRight } from "./icons";
import "@/styles/media-rail.css";

export type MediaRailItem = { label: string; content: ReactNode; id?: string };

type MediaRailProps = {
  label: string;
  selectionLabel: string;
  items: MediaRailItem[];
};

type RailDirection = -1 | 1 | "start" | "end";
const keyDirections: Partial<Record<string, RailDirection>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  Home: "start",
  End: "end",
};

/** Native touch scrolling and the same controls for every media collection. */
export function MediaRail({ label, selectionLabel, items }: MediaRailProps) {
  const track = useRef<HTMLUListElement>(null);
  const [visible, setVisible] = useState({ first: 1, last: 1 });
  const [edges, setEdges] = useState({ start: true, end: false });
  const [overflowing, setOverflowing] = useState(false);
  const id = useId();

  useEffect(() => {
    const list = track.current;
    if (!list) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const hasOverflow = list.scrollWidth > list.clientWidth + 1;
      setOverflowing(hasOverflow);
      const nextEdges = {
        start: list.scrollLeft <= 1,
        end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 1,
      };
      setEdges((previous) =>
        previous.start === nextEdges.start && previous.end === nextEdges.end ? previous : nextEdges,
      );
      const bounds = list.getBoundingClientRect();
      const shown: number[] = [];
      Array.from(list.children).forEach((item, index) => {
        const { left, right, width } = item.getBoundingClientRect();
        if (Math.min(right, bounds.right) - Math.max(left, bounds.left) >= width / 2)
          shown.push(index + 1);
      });
      if (shown.length) {
        const next = { first: shown[0], last: shown[shown.length - 1] };
        setVisible((previous) =>
          previous.first === next.first && previous.last === next.last ? previous : next,
        );
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(list);
    list.addEventListener("scroll", schedule, { passive: true });
    measure();
    return () => {
      resize.disconnect();
      list.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
    };
  }, [items.length]);

  function move(direction: RailDirection) {
    const list = track.current;
    const first = list?.firstElementChild;
    if (!list || !first) return;
    const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(list).columnGap);
    list.scrollTo({
      left:
        direction === "start"
          ? 0
          : direction === "end"
            ? list.scrollWidth
            : list.scrollLeft + direction * step,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <>
      <ul
        ref={track}
        id={id}
        className="wg-media-rail"
        aria-label={label}
        tabIndex={overflowing ? 0 : undefined}
        data-stagger
        onKeyDown={(event) => {
          // Comparison sliders and links keep their own keyboard controls.
          if (event.target !== event.currentTarget) return;
          const direction = keyDirections[event.key];
          if (direction === undefined) return;
          event.preventDefault();
          move(direction);
        }}
      >
        {items.map(({ label: itemLabel, content, id: itemId }) => (
          <li className="wg-rail-card" key={itemLabel} id={itemId} data-stagger-item>
            {content}
          </li>
        ))}
      </ul>
      {overflowing && (
        <div role="group" aria-label={selectionLabel} className="wg-rail-nav">
          <p className="wg-rail-hint">Wischen oder mit den Pfeilen entdecken</p>
          <div className="wg-rail-controls">
            <button
              type="button"
              aria-controls={id}
              aria-label="Vorherige Karte"
              disabled={edges.start}
              onClick={() => move(-1)}
            >
              <IconArrowRight className="wg-rail-back" />
            </button>
            <span className="wg-rail-position" aria-live="polite" aria-atomic="true">
              <span className="sr-only">Sichtbare Karten: </span>
              {visible.first}
              {visible.last > visible.first ? `–${visible.last}` : ""} / {items.length}
            </span>
            <button
              type="button"
              aria-controls={id}
              aria-label="Nächste Karte"
              disabled={edges.end}
              onClick={() => move(1)}
            >
              <IconArrowRight />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
