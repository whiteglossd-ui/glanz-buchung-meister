import { Link } from "@tanstack/react-router";
import { conciergeAtmosphere } from "@/data/atmosphere-media";
import { RevealLines } from "./reveal-lines";
import { IconArrowRight } from "./icons";

export function HomeProcess({
  serviceArea = "Horb am Neckar und Umgebung",
}: {
  serviceArea?: string;
}) {
  return (
    <section className="concierge-service" aria-labelledby="concierge-heading" id="ablauf">
      <span id="craft-heading" className="concierge-anchor" aria-hidden="true" />
      <header>
        <p className="kicker">Dein Hol- und Bringservice</p>
        <h2 id="concierge-heading" className="heading-2" data-lines>
          <RevealLines lines={["Ein Ansprechpartner.", "Alles für dein Auto."]} />
        </h2>
        <p>
          Du behältst deinen Alltag. Wir kümmern uns um Abholung, Aufbereitung und Rückgabe –
          persönlich, abgestimmt und ohne Umwege.
        </p>
        <p className="concierge-area">Dein Servicegebiet: {serviceArea}.</p>
        <Link to="/qualitaet" className="atelier-text-link mt-5">
          Ein Blick in die Werkstatt <IconArrowRight aria-hidden />
        </Link>
        <div className="concierge-media" aria-hidden="true">
          {conciergeAtmosphere.map((photo) => (
            <div className="concierge-frame" key={photo.id}>
              <img
                className="concierge-media-backdrop"
                src={photo.backdrop}
                width={384}
                height={216}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <img
                className="concierge-media-sharp"
                src={photo.src}
                srcSet={photo.srcSet}
                sizes="(min-width: 960px) 33vh, 72vw"
                width={photo.width}
                height={photo.height}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </header>
      <ol aria-label="In vier Schritten zu deinem aufbereiteten Auto" data-stagger>
        <li data-stagger-item>
          <span aria-hidden="true">01</span>
          <h3>Persönliche Beratung &amp; Festpreis</h3>
          <p>
            Du schickst uns deine Anfrage. Wir besprechen den Zustand deines Autos und klären
            Pflegeumfang, Preis und Termin verbindlich. Erst wenn du zusagst, ist der Termin fest.
          </p>
        </li>
        <li data-stagger-item>
          <span aria-hidden="true">02</span>
          <h3>Hol- &amp; Bringservice. Zeit für dich.</h3>
          <p>
            Kein Hin- und Herfahren: Wir holen dein Fahrzeug nach Absprache bei dir zu Hause oder am
            Arbeitsplatz ab und bringen es aufbereitet wieder zurück. Ort, Uhrzeit und Abholkosten
            stehen vorher fest.
          </p>
        </li>
        <li data-stagger-item>
          <span aria-hidden="true">03</span>
          <h3>Ein fester Ansprechpartner für alles</h3>
          <p>
            Vom ersten Foto bei der Übergabe bis zum letzten Finish: Lars betreut dein Auto
            persönlich, stimmt alle Arbeiten mit dir ab und kümmert sich um jedes Detail.
          </p>
        </li>
        <li data-stagger-item>
          <span aria-hidden="true">04</span>
          <h3>Übergabe mit Wow-Effekt</h3>
          <p>
            Du bekommst dein Fahrzeug frisch aufbereitet zurück. Wir gehen das Ergebnis gemeinsam
            durch – inklusive transparenter Dokumentation der vereinbarten Arbeiten und Tipps, damit
            du lange Freude daran hast.
          </p>
        </li>
      </ol>
    </section>
  );
}
