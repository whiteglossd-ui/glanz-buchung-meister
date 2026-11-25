import { useEffect, useState } from "react";

const sections = [
  { id: "pakete", label: "Pakete" },
  { id: "bewertungen", label: "Bewertungen" },
  { id: "ablauf", label: "Ablauf" },
  { id: "buchung", label: "Buchung" },
];

export function HomeProgressNav() {
  const [pastFilm, setPastFilm] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const switchEl = document.getElementById("nach-dem-film");
    if (!switchEl) return;
    const targets = sections
      .map((section) => ({ ...section, el: document.getElementById(section.id) }))
      .filter((section): section is (typeof sections)[number] & { el: HTMLElement } =>
        Boolean(section.el),
      );
    let frame = 0;
    const update = () => {
      frame = 0;
      setPastFilm(switchEl.getBoundingClientRect().top < window.innerHeight * 0.25);
      const probe = window.innerHeight * 0.4;
      let current: string | null = null;
      for (const section of targets) {
        if (section.el.getBoundingClientRect().top <= probe) current = section.id;
      }
      setActive(current);
    };
    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const visible = pastFilm && active !== null;

  return (
    <nav
      aria-label="Abschnitte der Startseite"
      aria-hidden={!visible}
      className={`fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 motion-reduce:transition-none lg:block ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <ul className="flex flex-col items-end gap-3">
        {sections.map((section) => (
          <li key={section.id}>
            <span className="group flex items-center gap-2">
              <span
                className={`rounded-sm border border-line bg-[rgba(13,14,17,0.95)] px-2 py-1 text-xs text-fg opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none ${
                  active === section.id ? "" : ""
                }`}
              >
                {section.label}
              </span>
              <a
                href={`#${section.id}`}
                aria-label={section.label}
                aria-current={active === section.id ? "true" : undefined}
                className="grid size-6 place-items-center"
              >
                <span
                  aria-hidden="true"
                  className={`block size-2 rounded-full transition-transform duration-200 motion-reduce:transition-none ${
                    active === section.id
                      ? "scale-150 bg-fg opacity-100"
                      : "bg-subtle opacity-45 group-hover:opacity-100"
                  }`}
                />
              </a>
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
