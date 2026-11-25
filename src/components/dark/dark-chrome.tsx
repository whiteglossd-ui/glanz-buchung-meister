import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { site, services } from "@/data/site";
import { CookieSettingsButton } from "@/components/consent-banner";
import { focusBookingHeading } from "@/lib/booking-anchor-focus";

/** Startseite des aktuellen Standorts (Horb oder Loßburg). */
function useHomePath() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return pathname === "/freudenstadt-lossburg" ? "/freudenstadt-lossburg" : "/";
}

/** Kopfzeile und Vollbild-Menü der Dark Edition (Vorlage 25.11.2026). */
export function DarkHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const homePath = useHomePath();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [visible, setVisible] = useState(false);
  const [solid, setSolid] = useState(false);
  const [up, setUp] = useState(false);
  const openRef = useRef(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  openRef.current = open;

  useEffect(() => setOpen(false), [pathname, hash]);

  // Menü: erst einblenden, dann mit Klasse öffnen; beim Schließen ausblenden.
  useEffect(() => {
    if (open) {
      setShown(true);
      setUp(false);
      document.body.style.overflow = "hidden";
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setVisible(false);
    document.body.style.overflow = "";
    const t = window.setTimeout(() => setShown(false), 500);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => void (document.body.style.overflow = ""), []);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let lastY = scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = scrollY;
      setSolid(y > 30);
      if (!openRef.current) {
        if (!reduce.matches && y > 700 && y > lastY + 4) setUp(true);
        else if (y < lastY - 4 || y < 700 || reduce.matches) setUp(false);
      }
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const close = () => setOpen(false);

  return (
    <div className="wgt wgt-chrome">
      <header
        className={`hdr${solid ? " is-solid" : ""}${up ? " is-up" : ""}`}
        onFocusCapture={() => setUp(false)}
      >
        <nav className="hdr__links" aria-label="Hauptnavigation">
          <Link to="/leistungen" activeProps={{ className: "is-active" }}>Leistungen</Link>
          <Link to="/preise" activeProps={{ className: "is-active" }}>Preise</Link>
          <Link to="/galerie" activeProps={{ className: "is-active" }}>Ergebnisse</Link>
          <Link to={homePath} hash="standorte" activeOptions={{ includeHash: true }}>Standorte</Link>
          <Link to="/abholservice" activeProps={{ className: "is-active" }}>Abholservice</Link>
        </nav>
        <Link to={homePath} className="hdr__logo" aria-label={`${site.name} – zur Startseite`}>
          <img src="/media/logo-280.avif" alt={site.name} width={140} height={70} />
        </Link>
        <div className="hdr__right">
          <Link to={homePath} hash="buchung" className="btn btn--solid btn--sm" onClick={focusBookingHeading}>
            Jetzt Termin anfragen
          </Link>
          <button
            ref={toggleRef}
            className="hdr__menu"
            type="button"
            aria-expanded={open}
            aria-controls="wgt-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="hdr__menu-label">{open ? "Schließen" : "Menü"}</span>
            <span className="hdr__menu-icon" aria-hidden="true"><i /><i /><i /></span>
          </button>
        </div>
      </header>

      <div className={`menu${visible ? " is-open" : ""}`} id="wgt-menu" hidden={!shown}>
        <figure className="menu__fig" aria-hidden="true">
          <img src="/media/dark/gen/profile-wide-1600.webp" alt="" loading="lazy" />
        </figure>
        <div className="menu__inner">
          <nav className="menu__nav" aria-label="Menü">
            <Link to="/leistungen" onClick={close}><span>01</span>Leistungen</Link>
            <Link to="/preise" onClick={close}><span>02</span>Preise</Link>
            <Link to="/galerie" onClick={close}><span>03</span>Ergebnisse</Link>
            <Link to={homePath} hash="standorte" onClick={close}><span>04</span>Standorte</Link>
            <Link to="/abholservice" onClick={close}><span>05</span>Abholservice</Link>
            <Link to={homePath} hash="buchung" onClick={(e) => { close(); focusBookingHeading(e); }}>
              <span>06</span>Jetzt Termin anfragen
            </Link>
          </nav>
          <div className="menu__aside">
            <p className="label">Dein Standort</p>
            <Link to="/" onClick={close}>Horb am Neckar</Link>
            <Link to="/freudenstadt-lossburg" onClick={close}>Loßburg / Freudenstadt</Link>
            <p className="muted small">Werkstatt in Vorbereitung</p>
            <p className="label menu__gap">Detailing</p>
            <div className="menu__svc">
              {services.map((s) => (
                <Link key={s.slug} to="/leistungen/$slug" params={{ slug: s.slug }} onClick={close}>{s.nav}</Link>
              ))}
              <Link to="/dellen-hagelschaden" onClick={close}>Dellen- und Hagelschäden</Link>
              <Link to="/luxusfahrzeuge" onClick={close}>Luxusfahrzeuge</Link>
              <Link to="/b2b" onClick={close}>Firmen, Flotten und Autohäuser</Link>
              <Link to="/ratgeber" onClick={close}>Ratgeber</Link>
            </div>
            <p className="label menu__gap">Kontakt</p>
            <a href={site.phoneHref}>{site.phoneDisplay}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <p className="muted">
              {site.street} · {site.postalCode} {site.city}
              <br />
              {site.hoursLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Fußzeile der Dark Edition. */
export function DarkFooter() {
  const homePath = useHomePath();
  return (
    <div className="wgt wgt-chrome">
      <footer className="foot">
        <div className="foot__bg" aria-hidden="true">
          <img src="/media/dark/gen/hood-wide-1600.webp" alt="" loading="lazy" />
        </div>
        <div className="wrap foot__top">
          <div className="foot__brand">
            <img src="/media/logo-280.avif" alt={site.name} width={140} height={70} loading="lazy" />
            <p className="muted small">
              Innenraumreinigung, Lackkorrektur und Keramikversiegelung in {site.city}. Auf Wunsch hole
              ich dein Auto ab und bringe es dir frisch aufbereitet zurück.
            </p>
          </div>
          <div className="foot__addr small">
            <address>
              {site.legalName}
              <br />
              {site.owner}
              <br />
              {site.street}
              <br />
              {site.postalCode} {site.city}
            </address>
            <p>
              <span className="label">Öffnungszeiten</span>
              <br />
              Montag bis Freitag 09:00–17:00 Uhr
            </p>
          </div>
          <div className="foot__contact">
            <a className="foot__big" href={site.phoneHref}>{site.phoneDisplay}</a>
            <a className="foot__big" href={`mailto:${site.email}`}>{site.email}</a>
            <div className="foot__btns">
              <a className="btn btn--line btn--sm" href={site.phoneHref}>Anrufen</a>
              <a className="btn btn--line btn--sm" href={site.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
        </div>
        <div className="wrap foot__locs">
          <Link to="/">Horb am Neckar · aktuelle Werkstatt</Link>
          <Link to="/freudenstadt-lossburg">Loßburg / Freudenstadt · in Vorbereitung</Link>
          <Link to={homePath} hash="buchung" className="btn btn--solid btn--sm" onClick={focusBookingHeading}>
            Jetzt Termin anfragen
          </Link>
          <a className="foot__insta" href={site.instagram} target="_blank" rel="noopener noreferrer">
            Einblicke aus der Werkstatt <strong>@{site.instagramHandle}</strong>
            <span className="sr-only"> auf Instagram, öffnet in neuem Tab</span>
          </a>
        </div>
        <div className="wrap foot__grid">
          <nav aria-label="Leistungen">
            <p className="label">Leistungen</p>
            <Link to="/leistungen/$slug" params={{ slug: "keramikversiegelung" }}>Keramikversiegelung</Link>
            <Link to="/leistungen/$slug" params={{ slug: "lackkorrektur" }}>Lackkorrektur</Link>
            <Link to="/leistungen/$slug" params={{ slug: "innenraumreinigung" }}>Innenraumreinigung</Link>
            <Link to="/leistungen/$slug" params={{ slug: "lederreparatur" }}>Lederreparatur</Link>
            <Link to="/preise">Preise</Link>
            <Link to="/luxusfahrzeuge">Luxusfahrzeuge</Link>
            <Link to="/b2b">Geschäftskunden</Link>
          </nav>
          <nav aria-label="Informationen">
            <p className="label">Informationen</p>
            <Link to="/abholservice">Hol- und Bringservice</Link>
            <Link to="/freudenstadt-lossburg">Fahrzeugaufbereitung Loßburg</Link>
            <Link to="/abholservice/$city" params={{ city: "freudenstadt" }}>Abholservice Freudenstadt</Link>
            <Link to="/ratgeber">Ratgeber</Link>
            <Link to="/galerie">Ergebnisse</Link>
            <Link to="/kontakt">Kontakt</Link>
            <Link to="/faq">Häufige Fragen</Link>
          </nav>
          <nav aria-label="Rechtliches">
            <p className="label">Rechtliches</p>
            <CookieSettingsButton />
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
            <Link to="/agb">AGB</Link>
            <Link to="/widerruf">Widerruf</Link>
            <Link to="/barrierefreiheit">Barrierefreiheit</Link>
          </nav>
        </div>
        <div className="wrap foot__base small muted">
          <span>© {new Date().getFullYear()} {site.name}. Alle Rechte vorbehalten.</span>
        </div>
      </footer>
    </div>
  );
}
