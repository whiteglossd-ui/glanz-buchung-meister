import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { site, services } from "@/data/site";
import { logoAvifSrcSet } from "@/data/media-src";
import { CookieSettingsButton } from "@/components/consent-banner";
import { BOOKING_JUMP, focusBookingHeading } from "@/lib/booking-anchor-focus";

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
  const [visible, setVisible] = useState(false);
  const [solid, setSolid] = useState(false);
  const [up, setUp] = useState(false);
  const openRef = useRef(false);
  // "navigate": Menülink gewählt → Modal sofort schließen, Fokus übernimmt die Zielseite.
  const closeMode = useRef<"dismiss" | "navigate">("dismiss");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  openRef.current = open;

  useEffect(() => {
    closeMode.current = "navigate";
    setOpen(false);
  }, [pathname, hash]);

  // Natives Modal (showModal): Hintergrund ist inert, Escape schließt, der
  // Fokus bleibt im Menü und kehrt danach zum Menü-Knopf zurück.
  useEffect(() => {
    const dialog = menuRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      setUp(false);
      document.body.style.overflow = "hidden";
      // Erst der Schließen-Knopf: ein fokussierter Link würde seine Zielseite
      // schon beim Öffnen vorladen. Tab führt direkt zu den Menüpunkten.
      dialog.querySelector<HTMLElement>(".hdr__menu")?.focus({ preventScroll: true });
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
    if (!dialog.open) return;
    if (closeMode.current === "navigate") {
      closeMode.current = "dismiss";
      dialog.close();
      return;
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      if (dialog.open) dialog.close();
      toggleRef.current?.focus({ preventScroll: true });
    };
    if (reduce) {
      finish();
      return;
    }
    const t = window.setTimeout(finish, 450);
    return () => window.clearTimeout(t);
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

  const dismiss = () => {
    closeMode.current = "dismiss";
    setOpen(false);
  };
  const close = () => {
    closeMode.current = "navigate";
    // Sofort schließen, damit die Zielseite bzw. der Buchungsbereich den Fokus bekommt.
    if (menuRef.current?.open) menuRef.current.close();
    setOpen(false);
  };
  // Tab-Schleife innerhalb des Menüs (wie im bisherigen Menü-Dialog).
  const trapFocus = (event: ReactKeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  // Im Menü ist das Logo das erste Fokusziel: kein Vorladen beim bloßen
  // Tastaturfokus, sonst startet jeder Menü-Öffner eine Startseiten-Abfrage.
  const logo = (onClick?: () => void) => (
    <Link to={homePath} className="hdr__logo" data-site-logo onClick={onClick} preload={onClick ? false : undefined} aria-label={`${site.name} – zur Startseite`}>
      <img
        src="/media/logo-280.avif"
        srcSet={logoAvifSrcSet}
        sizes="(max-width: 820px) 84px, 104px"
        alt={site.name}
        width={280}
        height={161}
      />
    </Link>
  );

  return (
    <div className="wgt wgt-chrome">
      <header
        className={`hdr${solid ? " is-solid" : ""}${up ? " is-up" : ""}`}
        data-site-header
        onFocusCapture={() => setUp(false)}
      >
        <nav className="hdr__links" aria-label="Hauptnavigation">
          <Link to="/leistungen" activeProps={{ className: "is-active" }}>Leistungen</Link>
          <Link to="/preise" activeProps={{ className: "is-active" }}>Preise</Link>
          <Link to="/galerie" activeProps={{ className: "is-active" }}>Ergebnisse</Link>
          <Link to={homePath} hash="standorte" activeOptions={{ includeHash: true }}>Standorte</Link>
          <Link to="/abholservice" activeProps={{ className: "is-active" }}>Abholservice</Link>
        </nav>
        {logo()}
        <div className="hdr__right">
          {/* Inhaberentscheidung 25.11.2026: Termin-Button auch am Handy sichtbar. */}
          <Link
            to={homePath}
            hash="buchung" hashScrollIntoView={BOOKING_JUMP}
            className="btn btn--solid btn--sm hdr__cta"
            data-header-cta
            aria-label="Jetzt Termin anfragen"
            onClick={focusBookingHeading}
          >
            <span className="hdr__cta-long">Jetzt Termin anfragen</span>
            <span className="hdr__cta-short" aria-hidden="true">Termin</span>
          </Link>
          <button
            ref={toggleRef}
            className="hdr__menu"
            data-menu-toggle
            type="button"
            aria-expanded={open}
            aria-controls="wgt-menu"
            aria-haspopup="dialog"
            aria-label="Menü öffnen"
            onClick={() => setOpen(true)}
          >
            <span className="hdr__menu-label">Menü</span>
            <span className="hdr__menu-icon" aria-hidden="true"><i /><i /><i /></span>
          </button>
        </div>
      </header>

      <dialog
        ref={menuRef}
        className={`menu${visible ? " is-open" : ""}`}
        id="wgt-menu"
        aria-label="Hauptnavigation"
        onKeyDown={trapFocus}
        onCancel={(event) => {
          event.preventDefault();
          dismiss();
        }}
      >
        <div className="hdr hdr--menu is-solid">
          <span className="hdr__links" aria-hidden="true" />
          {logo(close)}
          <div className="hdr__right">
            <button className="hdr__menu" type="button" aria-expanded="true" aria-label="Menü schließen" onClick={dismiss}>
              <span className="hdr__menu-label">Schließen</span>
              <span className="hdr__menu-icon" aria-hidden="true"><i /><i /><i /></span>
            </button>
          </div>
        </div>
        <figure className="menu__fig" aria-hidden="true">
          <img src="/media/dark/gen/profile-wide-1600.webp" alt="" loading="lazy" />
        </figure>
        <div className="menu__inner">
          <nav className="menu__nav" aria-label="Menü">
            <Link to="/leistungen" onClick={close}><span aria-hidden="true">01</span>Leistungen</Link>
            <Link to="/preise" onClick={close}><span aria-hidden="true">02</span>Preise &amp; Pakete</Link>
            <Link to="/galerie" onClick={close}><span aria-hidden="true">03</span>Ergebnisse</Link>
            <Link to={homePath} hash="standorte" onClick={close}><span aria-hidden="true">04</span>Standorte</Link>
            <Link to="/abholservice" onClick={close}><span aria-hidden="true">05</span>Hol- und Bringservice</Link>
            <Link to={homePath} hash="buchung" hashScrollIntoView={BOOKING_JUMP} onClick={(e) => { close(); focusBookingHeading(e); }}>
              <span aria-hidden="true">06</span>Jetzt Termin anfragen
            </Link>
            <Link to="/luxusfahrzeuge" onClick={close}><span aria-hidden="true">07</span>Luxusfahrzeuge</Link>
          </nav>
          <div className="menu__aside">
            <p className="label">Dein Standort</p>
            <Link to="/" onClick={close}>Horb am Neckar</Link>
            <Link to="/freudenstadt-lossburg" onClick={close}>Loßburg / Freudenstadt</Link>
            <p className="muted small">Werkstatt in Vorbereitung</p>
            <p className="label menu__gap" id="wgt-menu-business">Business · Geschäftskunden</p>
            <nav className="menu__svc" aria-labelledby="wgt-menu-business">
              <Link to="/b2b" onClick={close}>B2B im Überblick</Link>
              <Link to="/b2b" hash="firmenfahrzeuge" onClick={close}>Firmen- &amp; Poolfahrzeuge</Link>
              <Link to="/b2b" hash="fuhrpark" onClick={close}>Flotten &amp; Fuhrpark</Link>
              <Link to="/b2b" hash="autohaeuser" onClick={close}>Autohäuser &amp; Fahrzeughandel</Link>
              <Link to="/b2b" hash="leasingruecklaeufer" onClick={close}>Leasingrückläufer</Link>
            </nav>
            <p className="label menu__gap">Detailing</p>
            <div className="menu__svc">
              {services.map((s) => (
                <Link key={s.slug} to="/leistungen/$slug" params={{ slug: s.slug }} onClick={close}>{s.nav}</Link>
              ))}
              <Link to="/dellen-hagelschaden" onClick={close}>Dellen- und Hagelschäden</Link>
            </div>
            <p className="label menu__gap" id="wgt-menu-info">Informationen</p>
            <nav className="menu__svc" aria-labelledby="wgt-menu-info">
              <Link to="/qualitaet" onClick={close}>Arbeitsweise</Link>
              <Link to="/fahrzeug-zustand" onClick={close}>Individuelles Angebot</Link>
              <Link to={homePath} hash="bewertungen" onClick={close}>Google-Bewertungen</Link>
              <Link to="/ratgeber" onClick={close}>Blog &amp; Ratgeber</Link>
              <Link to="/faq" onClick={close}>FAQ · Häufige Fragen</Link>
              <Link to="/kontakt" onClick={close}>Kontakt</Link>
            </nav>
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
      </dialog>
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
            <img
              src="/media/logo-280.avif"
              srcSet={logoAvifSrcSet}
              sizes="132px"
              alt={site.name}
              width={280}
              height={161}
              loading="lazy"
            />
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
          <Link to={homePath} hash="buchung" hashScrollIntoView={BOOKING_JUMP} className="btn btn--solid btn--sm" onClick={focusBookingHeading}>
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
            <Link to="/leistungen" activeOptions={{ exact: true }}>Alle Leistungen</Link>
            <Link to="/leistungen/$slug" params={{ slug: "keramikversiegelung" }}>Keramikversiegelung</Link>
            <Link to="/leistungen/$slug" params={{ slug: "lackkorrektur" }}>Lackkorrektur</Link>
            <Link to="/leistungen/$slug" params={{ slug: "innenraumreinigung" }}>Innenraumreinigung</Link>
            <Link to="/leistungen/$slug" params={{ slug: "lederreparatur" }}>Lederreparatur</Link>
            <Link to="/dellen-hagelschaden">Dellen und Hagelschäden</Link>
            <Link to="/preise">Preise</Link>
            <Link to="/luxusfahrzeuge">Luxusfahrzeuge</Link>
            <Link to="/b2b">Geschäftskunden</Link>
          </nav>
          <nav aria-label="Informationen">
            <p className="label">Informationen</p>
            <Link to="/abholservice">Hol- und Bringservice</Link>
            <Link to="/freudenstadt-lossburg">Fahrzeugaufbereitung Loßburg</Link>
            <Link to="/abholservice/$city" params={{ city: "freudenstadt" }}>Abholservice Freudenstadt</Link>
            <Link to="/fahrzeug-zustand">Individuelles Angebot</Link>
            <Link to="/qualitaet">Arbeitsweise</Link>
            <Link to="/ratgeber">Ratgeber</Link>
            <Link to="/galerie">Ergebnisse</Link>
            <Link to="/kontakt">Kontakt</Link>
            <a href="/visitenkarte.html">Digitale Visitenkarte</a>
            <Link to="/faq">Häufige Fragen</Link>
          </nav>
          <nav aria-label="Rechtliches">
            <p className="label">Rechtliches</p>
            <CookieSettingsButton />
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
            <Link to="/datenloeschung">Datenlöschung</Link>
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
