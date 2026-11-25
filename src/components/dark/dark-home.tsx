import { Link, useRouter } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  cities,
  cityPickupPriceText,
  packageServiceSlug,
  packages,
  pickupKeramikNote,
  pickupTierSummary,
  services,
  site,
  vehicleClasses,
  type PackageId,
  type VehicleClass,
} from "@/data/site";
import { homeCopy } from "@/data/home-copy";
import { LazyConfigurator } from "@/components/lazy-configurator";
import { LazyRundumInquiry } from "@/components/lazy-rundum-inquiry";
import { focusBookingHeading } from "@/lib/booking-anchor-focus";
import { cityDistanceLine, pickupDistanceLabel } from "@/lib/city-copy";
import { LazyGoogleReviews } from "@/components/lazy-google-reviews";
import "./dark-hero.css";
import { darkFrameSrc, initDarkHome, tweenNumber } from "@/lib/dark-motion";

const IMG = "/media/dark/gen";

/** Überschrift Wort für Wort maskiert (Einblendung wie in der Vorlage). */
function Words({ text }: { text: string }) {
  let i = 0;
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, l) => (
        <Fragment key={l}>
          {l > 0 && <br />}
          {line.split(/\s+/).filter(Boolean).map((word, w) => (
            <Fragment key={w}>
              {(w > 0 || l > 0) && " "}
              <span className="w">
                <span style={{ ["--i" as string]: i++ }}>{word}</span>
              </span>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </>
  );
}

function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}

const packImage: Record<PackageId, [string, string]> = {
  basis: ["foam-sq-800.webp", "Schaum auf schwarzem Lack bei der Außenreinigung"],
  premium: ["polish-sq-800.webp", "Poliermaschine auf glänzendem schwarzem Lack"],
  keramik: ["beads-sq-800.webp", "Abperleffekt auf keramikversiegeltem Lack"],
};

function atmo(name: string) {
  return (
    <div className="atmo" aria-hidden="true">
      <img
        src={`${IMG}/${name}-1600.webp`}
        srcSet={`${IMG}/${name}-800.webp 800w, ${IMG}/${name}-1600.webp 1600w`}
        sizes="100vw"
        alt=""
        loading="lazy"
        data-par="0.18"
      />
    </div>
  );
}

function Packages() {
  const [cls, setCls] = useState<VehicleClass>(vehicleClasses[0]);
  const listRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.querySelectorAll<HTMLElement>(".num").forEach((n) => {
      tweenNumber(n, Number(n.dataset.base) * cls.factor);
    });
  }, [cls]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = vehicleClasses.indexOf(cls);
    const n = (i + (e.key === "ArrowRight" ? 1 : vehicleClasses.length - 1)) % vehicleClasses.length;
    setCls(vehicleClasses[n]);
    tabsRef.current?.querySelectorAll("button")[n]?.focus();
  };
  return (
    <section className="sec sec--packs" id="preise" aria-labelledby="preise-h">
      <span id="pakete" className="anchor" aria-hidden="true" />
      {atmo("drops-wide")}
      <div className="wrap">
        <div className="packs-head">
          <div>
            <p className="label label--rule" data-reveal>01 / Pakete &amp; Preise</p>
            <h2 className="h2 chrome" id="preise-h" data-reveal>
              <Words text={"Welche Pflege passt\nzu deinem Auto?"} />
            </h2>
          </div>
          <div className="packs-head__r" data-reveal>
            <div className="tabs" role="radiogroup" aria-label="Fahrzeugklasse" ref={tabsRef} onKeyDown={onKey}>
              {vehicleClasses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={c.id === cls.id}
                  tabIndex={c.id === cls.id ? 0 : -1}
                  onClick={() => setCls(c)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="muted small tabs__hint" aria-live="polite">{cls.hint}</p>
          </div>
        </div>

        <div className="prows" ref={listRef}>
          {packages.map((p, i) => (
            <article key={p.id} className={`prow${p.featured ? " prow--rec" : ""}`} data-reveal>
              <figure className="prow__img clip">
                <img src={`${IMG}/${packImage[p.id][0]}`} alt={packImage[p.id][1]} loading="lazy" />
              </figure>
              <div className="prow__main">
                <span className="prow__n">0{i + 1}</span>
                <h3 className="prow__t">{p.name}</h3>
                <p className="prow__d">{p.kicker}</p>
                <p className="prow__meta">{site.vatNote} · {p.duration}</p>
              </div>
              <div className="prow__price">
                <small>ab</small>
                <span>
                  <span className="num" data-base={p.price}>{p.price}</span> €
                </span>
              </div>
              <div className="prow__act">
                <Link
                  to="/"
                  search={{ paket: p.id }}
                  hash="buchung"
                  className={`btn ${p.featured ? "btn--solid" : "btn--line"} btn--sm`}
                  onClick={focusBookingHeading}
                >
                  Paket wählen
                </Link>
                <Link className="tlink" to="/leistungen/$slug" params={{ slug: packageServiceSlug[p.id] }}>
                  Paket ansehen <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="packs-foot" data-reveal>
          <Link className="tlink" to="/preise">
            Alle Preise und Zusatzleistungen <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

const videos = [
  { src: "/media/customer-beading.mp4", poster: "/media/customer-beading-poster.jpg", alt: "Wasser perlt auf versiegeltem Lack ab", tag: "White-Gloss Ceramic", len: "0:11 Min.", title: "Hydrophober Lackschutz", text: "Der Abperleffekt auf der Motorhaube macht den aufbereiteten und geschützten Lack sichtbar." },
  { src: "/media/customer-interior.mp4", poster: "/media/customer-interior-poster.jpg", alt: "Innenraum nach der Aufbereitung", tag: "Innenraum", len: "0:16 Min.", title: "Innenraum im Detail", text: "Mittelkonsole, Leder und Einstiegsbereich nach der Innenraumaufbereitung." },
  { src: "/media/customer-exterior.mp4", poster: "/media/customer-exterior-poster.jpg", alt: "Seitenlinie eines aufbereiteten Kundenfahrzeugs", tag: "Lackkorrektur", len: "0:09 Min.", title: "Lackfinish & Seitenlinie", text: "Felgen, Karosserielinien und Lackglanz am freigegebenen Kundenfahrzeug." },
];

function VideoCard({ v }: { v: (typeof videos)[number] }) {
  const [playing, setPlaying] = useState(false);
  return (
    <article className="work" data-reveal>
      {playing ? (
        <video className="vid__el" src={v.src} poster={v.poster} controls autoPlay playsInline />
      ) : (
        <button className="vid" type="button" aria-label={`Video abspielen: ${v.title}`} onClick={() => setPlaying(true)}>
          <img src={v.poster} alt={v.alt} loading="lazy" />
          <span className="vid__meta"><span>{v.tag}</span><span>{v.len}</span></span>
          <span className="vid__play" aria-hidden="true" />
        </button>
      )}
      <div className="work__body">
        <h3 className="h3">{v.title}</h3>
        <p className="muted">{v.text}</p>
      </div>
    </article>
  );
}

// Laufband: Hochformat-Kundenfotos (S-Klasse Coupé, Inhaber 24.11.2026) im Wechsel mit Atelier-Motiven.
const CP = "/media/customer-photos";
const gallery: { src: string; srcSet: string; sizes: string; shape: "t" | "w" }[] = [
  ...[
    "sclass-01:t", "hood-wide:w", "sclass-03:t", "taillight:w", "sclass-04:t",
    "cockpit-wide:w", "sclass-05:t", "foamwash:w", "sclass-06:t", "profile-wide:w", "sclass-02:t",
  ].map((entry) => {
    const [name, shape] = entry.split(":") as [string, "t" | "w"];
    return name.startsWith("sclass-")
      ? { src: `${CP}/${name}-1400.webp`, srcSet: `${CP}/${name}-480.webp 480w, ${CP}/${name}-900.webp 900w, ${CP}/${name}-1400.webp 1200w`, sizes: "(max-width:820px) 80vw, 34vw", shape }
      : { src: `${IMG}/${name}-1600.webp`, srcSet: `${IMG}/${name}-800.webp 800w, ${IMG}/${name}-1600.webp 1600w`, sizes: "(max-width:820px) 80vw, 50vw", shape };
  }),
];

const steps = [
  ["Persönliche Beratung & Festpreis", "Du schickst uns deine Anfrage. Wir besprechen den Zustand deines Autos und klären Pflegeumfang, Preis und Termin verbindlich. Erst wenn du zusagst, ist der Termin fest."],
  ["Hol- & Bringservice. Zeit für dich.", "Kein Hin- und Herfahren: Wir holen dein Fahrzeug nach Absprache bei dir zu Hause oder am Arbeitsplatz ab und bringen es aufbereitet wieder zurück. Ort, Uhrzeit und Abholkosten stehen vorher fest."],
  ["Ein fester Ansprechpartner für alles", "Vom ersten Foto bei der Übergabe bis zum letzten Finish: Lars betreut dein Auto persönlich, stimmt alle Arbeiten mit dir ab und kümmert sich um jedes Detail."],
  ["Übergabe mit Wow-Effekt", "Du bekommst dein Fahrzeug frisch aufbereitet zurück. Wir gehen das Ergebnis gemeinsam durch – inklusive transparenter Dokumentation der vereinbarten Arbeiten und Tipps, damit du lange Freude daran hast."],
];

const isRundumRequest = () =>
  ["#rundum-anfrage", "#rundum-service", "#service"].includes(window.location.hash);

/** Terminanfrage im Vorlagen-Look – mit dem echten Buchungsformular. */
function DarkBooking({
  initialPackage,
  initialCity,
  serviceArea,
}: {
  initialPackage?: PackageId;
  initialCity?: string;
  serviceArea: string;
}) {
  const router = useRouter();
  const subscribe = useCallback(
    (notify: () => void) => {
      const unsubscribe = router.history.subscribe(() => queueMicrotask(notify));
      addEventListener("hashchange", notify);
      return () => {
        unsubscribe();
        removeEventListener("hashchange", notify);
      };
    },
    [router],
  );
  const rundum = useSyncExternalStore(subscribe, isRundumRequest, () => false);
  return (
    <section className="sec" id="buchung" aria-labelledby="buchung-heading">
      {["termin", "service", "rundum-service"].map((id) => (
        <span key={id} id={id} className="anchor" aria-hidden="true" />
      ))}
      {atmo("leather-wide")}
      <div className="wrap book">
        <div className="book__intro home-booking-promise">
          <p className="label label--rule" data-reveal>08 / Dein Rundum-Service</p>
          <h2 className="h2 h2--xl chrome" id="buchung-heading" tabIndex={-1} data-reveal>
            <Words text={"Dein Auto.\nDein Wunsch.\nWir kümmern uns."} />
          </h2>
          <p className="muted" data-reveal>
            Ob regelmäßige Autopflege, gründliche Innenraumreinigung oder Vorbereitung auf die
            Leasingrückgabe: Sag uns, was dein Auto braucht.
          </p>
          <div className="book__facts" data-reveal>
            <div>
              <strong>Pflege und Reparatur aus einer Hand</strong>
              <p className="muted small">
                Detailing, Lackaufbereitung und Keramikversiegelung in unserer Werkstatt.
                Dellenentfernung, Felgen- oder Sitzreparaturen stimmen wir mit unserem
                Partnerbetrieb ab.
              </p>
            </div>
            <div>
              <strong>Ein Angebot, das zu deinem Auto passt</strong>
              <p className="muted small">Du kennst Leistungen und Festpreis, bevor du zusagst.</p>
            </div>
            <div>
              <strong>Abholung passend zu deinem Alltag</strong>
              <p className="muted small">Dein Servicegebiet: {serviceArea}.</p>
            </div>
          </div>
          <p className="small book__note" data-reveal>
            Deine Anfrage ist unverbindlich. Deinen Termin bestätigen wir persönlich.
          </p>
        </div>

        <div className="cfg wgt-booking home-booking-form" aria-labelledby="anfrage-heading">
          <h3 className="h3 h3--lg" id="anfrage-heading">Jetzt Termin anfragen</h3>
          <nav className="cfg__mode" aria-label="Art der Anfrage">
            <a href="#buchung" aria-current={!rundum ? "location" : undefined} aria-controls="paket-formular">
              Paket wählen
            </a>
            <a
              href="#rundum-anfrage"
              id="rundum-anfrage"
              aria-current={rundum ? "location" : undefined}
              aria-controls="rundum-formular"
            >
              Rundum-Service
            </a>
          </nav>
          <div id="paket-formular" hidden={rundum}>
            <p className="muted small cfg__intro">
              Wähle dein Paket und deinen Wunschtermin. Alle weiteren Details klären wir direkt mit dir.
            </p>
            <LazyConfigurator
              eager={Boolean(initialPackage || initialCity)}
              initialPackage={initialPackage}
              initialCity={initialCity}
            />
          </div>
          <div id="rundum-formular" hidden={!rundum}>
            <p className="muted small cfg__intro">
              Sag uns, was dein Auto braucht. Alle weiteren Details klären wir direkt mit dir.
            </p>
            <LazyRundumInquiry />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Startseite im Look der Dark-Edition-Vorlage (Sandbox 25.11.2026). */
export function DarkHome({
  location = "horb",
  title = homeCopy.title,
  lead = homeCopy.lead,
  initialPackage,
  initialCity,
  jsonLd,
  studio,
  aboutPublished = false,
}: {
  aboutPublished?: boolean;
  location?: "horb" | "lossburg";
  title?: string;
  lead?: string;
  initialPackage?: PackageId;
  initialCity?: string;
  jsonLd?: ReactNode;
  studio?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? initDarkHome(ref.current) : undefined), []);
  const regional = location === "lossburg";
  const serviceArea = regional ? "Loßburg, Freudenstadt und Nordschwarzwald" : "Horb am Neckar und Umgebung";
  const heroTitle = title.includes("\n") ? title : title.replace(" – ", " –\n");

  return (
    <div className="wgt wgt-root" ref={ref}>
      <main id="main-content" tabIndex={-1} data-home="dark">
        {jsonLd}
        {/* Hero: Cockpit-Bildfolge, drei Kapitel */}
        <section className="reel" id="top" data-ch="0" aria-label={site.name}>
          <div className="reel__stick">
            <canvas className="reel__canvas" aria-hidden="true" />
            <img className="reel__poster" src={darkFrameSrc("d", 0)} alt="" aria-hidden="true" fetchPriority="high" />
            <div className="reel__shade" aria-hidden="true" />

            <div className="reel__ch reel__ch--0 is-on" data-ch="0">
              <p className="kicker" data-hero>Hol- und Bringservice · {regional ? "Loßburg / Freudenstadt" : site.city}</p>
              <h1 className="hero__title chrome" data-hero><Lines text={heroTitle} /></h1>
              <p className="hero__lead" data-hero>{lead}</p>
              <div className="hero__actions film-actions" data-hero>
                <Link className="btn btn--solid scroll-film-cta" to={regional ? "/freudenstadt-lossburg" : "/"} hash="buchung" onClick={focusBookingHeading}>
                  Jetzt Termin anfragen <span className="arr" aria-hidden="true">→</span>
                </Link>
                <a className="btn btn--line scroll-film-prices" href="#ablauf">Hol- &amp; Bringservice entdecken</a>
              </div>
              <div className="hero__trust scroll-film-trust" data-hero>
                <p><strong>Dein Fahrzeug in guten Händen</strong></p>
                <span>Persönliche Fahrzeugannahme · Ein fester Ansprechpartner · Transparente Festpreise</span>
              </div>
              <nav className="hero__loc" data-hero aria-label="Standort wählen">
                <span className="hero__loc-l">Dein Standort</span>
                <Link to="/" aria-current={!regional ? "page" : undefined}>{site.city}</Link>
                <Link to="/freudenstadt-lossburg" aria-current={regional ? "page" : undefined}>
                  Loßburg / Freudenstadt <small>Werkstatt in Vorbereitung</small>
                </Link>
              </nav>
            </div>

            <div className="reel__ch reel__ch--1" data-ch="1" aria-hidden="true">
              <p className="kicker">Premium-Pflege</p>
              <p className="reel__big chrome"><Lines text={"Dein Auto.\nWieder besonders."} /></p>
            </div>
            <div className="reel__ch reel__ch--2" data-ch="2" aria-hidden="true">
              <p className="kicker">Das Finish</p>
              <p className="reel__big chrome"><Lines text={"Klarer Lack.\nFrischer Innenraum."} /></p>
              <p className="reel__sub">Ein Finish, das den Unterschied macht.</p>
            </div>

            <div className="reel__bar" aria-hidden="true">
              <span className="reel__bar-l">Mehr entdecken ↓</span>
              <span className="reel__track"><i className="reel__fill" /></span>
              <span className="reel__count"><b className="reel__n">01</b> / 03</span>
            </div>
          </div>
        </section>

        {studio}

        <Packages />

        {/* Bildbühne mit Laufband */}
        <section className="pin" aria-hidden="true">
          <div className="pin__stick">
            <figure className="pin__img">
              <img
                src={`${IMG}/headlight-wide-1600.webp`}
                srcSet={`${IMG}/headlight-wide-800.webp 800w, ${IMG}/headlight-wide-1600.webp 1600w`}
                sizes="100vw"
                alt=""
                loading="lazy"
              />
            </figure>
            <div className="ribbon">
              <span>
                White Gloss <i /> Detailing <i /> No compromises. Only results. <i /> White Gloss <i /> Detailing <i /> No compromises. Only results. <i />
              </span>
            </div>
          </div>
        </section>

        <section className="sec" id="ergebnisse" aria-labelledby="ergebnisse-h">
          <div className="wrap">
            <div className="sec__head">
              <div>
                <p className="label label--rule" data-reveal>02 / Kundenfahrzeuge</p>
                <h2 className="h2 chrome" id="ergebnisse-h" data-reveal><Words text={"So sieht unsere\nArbeit aus."} /></h2>
              </div>
              <Link className="tlink" to="/galerie" data-reveal>Alle Ergebnisse <span aria-hidden="true">→</span></Link>
            </div>
            <div className="works works--4">
              <article className="work" data-reveal>
                <div className="compare" style={{ ["--pos" as string]: "50%" }}>
                  <img src="/media/compare-after-1200.avif" alt="Lack nach der Politur" className="compare__after" loading="lazy" width={1200} height={904} />
                  <div className="compare__before">
                    <img src="/media/compare-before-1200.avif" alt="Lack vor der Politur" loading="lazy" width={1200} height={904} />
                  </div>
                  <span className="compare__tag compare__tag--l">Vorher</span>
                  <span className="compare__tag compare__tag--r">Nachher</span>
                  <span className="compare__handle" aria-hidden="true"><i>‹ ›</i></span>
                  <input className="compare__range" type="range" min={0} max={100} defaultValue={50} aria-label="Vorher-Nachher-Vergleich verschieben" />
                </div>
                <div className="work__body">
                  <h3 className="h3">Lackaufbereitung im Vergleich</h3>
                  <p className="muted">Zieh den Griff nach links oder rechts: So verändert die Politur den Lack unter demselben Prüflicht.</p>
                </div>
              </article>
              {videos.map((v) => <VideoCard key={v.src} v={v} />)}
            </div>
            <p className="muted small works__note">Die Aufnahmen stammen aus freigegebenen Kundenaufträgen. Du startest die Videos per Klick.</p>
          </div>
        </section>

        {/* Horizontale Atelier-Galerie */}
        <section className="hg" aria-hidden="true">
          <div className="hg__stick">
            <div className="hg__track">
              {gallery.map(({ src, srcSet, sizes, shape }, i) => (
                <figure key={src} className={`hg__f hg__f--${shape}`}>
                  <img src={src} srcSet={srcSet} sizes={sizes} alt="" loading="lazy" decoding="async" />
                  <span className="hg__n">{String(i + 1).padStart(2, "0")}</span>
                </figure>
              ))}
            </div>
            <div className="hg__bar"><span className="hg__fill" /></div>
          </div>
        </section>

        <section className="sec sec--tight" id="bewertungen" aria-labelledby="rev-h">
          <div className="wrap review">
            <div>
              <p className="label label--rule" data-reveal>03 / Google</p>
              <h2 className="h2 chrome" id="rev-h" data-reveal><Words text={"Erfahrungen\nunserer Kunden."} /></h2>
            </div>
            {/* Echte Google-Bewertungen (wie bisher), lädt erst kurz vor dem Sichtbereich. */}
            <div className="review__live" data-reveal>
              <LazyGoogleReviews compact />
            </div>
          </div>
        </section>

        <section className="sec" id="ablauf" aria-labelledby="ablauf-h">
          <div className="wrap process">
            <div className="process__intro">
              <div className="process__stick">
                <p className="label label--rule" data-reveal>04 / Dein Hol- und Bringservice</p>
                <h2 className="h2 chrome" id="ablauf-h" data-reveal><Words text={"Ein Ansprechpartner.\nAlles für dein Auto."} /></h2>
                <p className="muted" data-reveal>
                  Du behältst deinen Alltag. Wir kümmern uns um Abholung, Aufbereitung und Rückgabe –
                  persönlich, abgestimmt und ohne Umwege.
                </p>
                <p className="small" data-reveal>Dein Servicegebiet: {serviceArea}.</p>
                <figure className="process__img clip" data-reveal>
                  <img src="/media/atmosphere/interior-1440.webp" alt="Innenraum eines Fahrzeugs in der Werkstatt" loading="lazy" />
                </figure>
                <Link className="tlink" to="/qualitaet" data-reveal>Ein Blick in die Werkstatt <span aria-hidden="true">→</span></Link>
              </div>
            </div>
            <ol className="steps">
              {steps.map(([t, d], i) => (
                <li key={t} className="step" data-reveal>
                  <span className="step__n">0{i + 1}</span>
                  <div>
                    <h3 className="h3">{t}</h3>
                    <p className="muted">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="sec" id="leistungen" aria-labelledby="leistungen-h">
          {atmo("chrome-curves")}
          <div className="wrap">
            <div className="services">
              <div>
                <p className="label label--rule" data-reveal>05 / Detailing</p>
                <h2 className="h2 chrome" id="leistungen-h" data-reveal>
                  <Words text={regional ? "Fahrzeugaufbereitung für\nLoßburg und Freudenstadt" : `Fahrzeugaufbereitung\nin ${site.city}`} />
                </h2>
              </div>
              <p className="muted lead-r" data-reveal>
                Autopflege passend zu deinem Fahrzeug: von der Innenraumreinigung über Lackaufbereitung
                und Keramikversiegelung bis zur Dellenentfernung mit unserem Partnerbetrieb. Vor jeder
                Politur prüfen wir den Lack mit einer Lackdickenmessung.
              </p>
            </div>
            <ul className="svc svc--wide" data-reveal>
              {services.map((s) => (
                <li key={s.slug}><Link to="/leistungen/$slug" params={{ slug: s.slug }}>{s.nav}</Link></li>
              ))}
              <li><Link to="/dellen-hagelschaden">Dellen- und Hagelschäden</Link></li>
              <li><Link to="/luxusfahrzeuge">Luxusfahrzeuge</Link></li>
              <li><Link to="/b2b">Firmen, Flotten und Autohäuser</Link></li>
              <li><Link to="/ratgeber">Ratgeber</Link></li>
            </ul>
          </div>
        </section>

        <section className="sec" id="standorte" aria-labelledby="standorte-h">
          <div className="wrap">
            <p className="label label--rule" id="standorte-h" data-reveal>06 / Standorte</p>
            <div className="locs">
              <article className="loc" data-reveal>
                <figure className="loc__img clip">
                  <img src="/media/atmosphere/exterior-1440.webp" alt="Fahrzeug vor der Werkstatt" loading="lazy" />
                </figure>
                <h2 className="h2 h2--md chrome"><Lines text={`Werkstatt in\n${site.city}`} /></h2>
                <p className="muted">
                  {site.street}, {site.postalCode} {site.city}
                  <br />
                  {site.hoursLabel}
                </p>
                <div className="loc__links">
                  <Link className="tlink" to="/kontakt">Kontakt &amp; Anfahrt <span aria-hidden="true">→</span></Link>
                  {aboutPublished && (
                    <Link className="tlink" to="/ueber-uns">Über White-Gloss <span aria-hidden="true">→</span></Link>
                  )}
                </div>
              </article>
              <article className="loc" data-reveal>
                <figure className="loc__img clip">
                  <img src="/media/atmosphere/paint-1440.webp" alt="Lackoberfläche unter Prüflicht" loading="lazy" />
                  <span className="pack__tag">Werkstatt in Vorbereitung</span>
                </figure>
                <h2 className="h2 h2--md chrome"><Lines text={"Neue Werkstatt in\nLoßburg bei Freudenstadt"} /></h2>
                <p className="muted">
                  Die Werkstatt in Loßburg ist in Vorbereitung. Bis zur Eröffnung bereiten wir dein Auto
                  in Horb am Neckar auf. Unser Hol- und Bringservice verbindet dich schon jetzt mit uns
                  – in Loßburg, Freudenstadt und im Landkreis Freudenstadt / Nordschwarzwald. Abholort
                  und Konditionen stimmen wir vor deinem Termin mit dir ab.
                </p>
                <div className="loc__links">
                  <Link className="tlink" to="/freudenstadt-lossburg">Standort Loßburg / Freudenstadt <span aria-hidden="true">→</span></Link>
                  <Link className="tlink" to="/abholservice/$city" params={{ city: "lossburg" }}>Loßburg <span aria-hidden="true">→</span></Link>
                  <Link className="tlink" to="/abholservice/$city" params={{ city: "freudenstadt" }}>Freudenstadt <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="sec" id="abholung" aria-labelledby="abholung-h">
          {atmo("wheel-wide")}
          <div className="wrap pickup">
            <div className="pickup__intro">
              <p className="label label--rule" data-reveal>07 / Abholung</p>
              <h2 className="h2 chrome" id="abholung-h" data-reveal><Words text={"Was kostet die\nAbholung bei dir?"} /></h2>
              <p className="muted" data-reveal>
                {pickupTierSummary()}. {pickupKeramikNote()}. Alle Beträge {site.vatNote}.
              </p>
              <Link className="tlink" to="/abholservice" data-reveal>Abholorte &amp; Konditionen <span aria-hidden="true">→</span></Link>
            </div>
            <ul className="cities" aria-label="Abholorte und Preise">
              {cities.map((c) => (
                <li key={c.slug}>
                  <Link
                    className={`city${c.km === 0 ? " city--home" : ""}`}
                    to="/abholservice/$city"
                    params={{ city: c.slug }}
                    aria-label={
                      c.km === 0
                        ? `${c.name}, Werkstattstandort, direkte Fahrzeugabgabe möglich, Abholung ${cityPickupPriceText(c)}`
                        : `${c.name}, ${cityDistanceLine(c)}, Abholung ${cityPickupPriceText(c)}`
                    }
                  >
                    <span className="city__name">{c.name}</span>
                    <span className="city__row" aria-hidden="true">
                      <span>{pickupDistanceLabel(c)}</span>
                      <span className="city__p">{cityPickupPriceText(c)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <DarkBooking initialPackage={initialPackage} initialCity={initialCity} serviceArea={serviceArea} />
      </main>
    </div>
  );
}
