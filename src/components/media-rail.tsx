import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type MediaRailProps = {
  label: string;
  selectionLabel: string;
  items: { label: string; content: ReactNode }[];
};

/** One native horizontal list on small screens, the same cards in a desktop grid. */
export function MediaRail({ label, selectionLabel, items }: MediaRailProps) {
  const track = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
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
      if (!hasOverflow) return;
      const middle = list.getBoundingClientRect().left + list.clientWidth / 2;
      let nearest = 0;
      let best = Infinity;
      Array.from(list.children).forEach((item, index) => {
        const { left, width } = item.getBoundingClientRect();
        const distance = Math.abs(left + width / 2 - middle);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      });
      setCurrent(nearest);
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

  function select(index: number) {
    const list = track.current;
    const item = list?.children[index];
    if (!list || !item) return;
    const rect = item.getBoundingClientRect();
    const center =
      rect.left - list.getBoundingClientRect().left + (rect.width - list.clientWidth) / 2;
    list.scrollBy({
      left: center,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <>
      <ul ref={track} id={id} className="wg-media-rail" aria-label={label}>
        {items.map(({ label: itemLabel, content }) => (
          <li className="wg-rail-card" key={itemLabel}>
            {content}
          </li>
        ))}
      </ul>
      {overflowing && (
        <div role="group" aria-label={selectionLabel} className="wg-rail-nav">
          {items.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-controls={id}
              aria-current={current === index ? "true" : undefined}
              onClick={() => select(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
