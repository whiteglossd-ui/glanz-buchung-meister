import { Link } from "@tanstack/react-router";
import { pickupKeramikNote, site } from "@/data/site";

/** Regionaler Nutzwert statt der allgemeinen Startseiten-Ablaufstrecke. */
export function RegionalHomeDetails() {
  return (
    <section className="sec" id="ablauf" aria-labelledby="regional-ablauf-h">
      <span id="abholung" className="anchor" aria-hidden="true" />
      <div className="wrap">
        <div className="sec__head">
          <div>
            <p className="label label--rule" data-reveal>
              Fahrzeugpflege im Landkreis Freudenstadt
            </p>
            <h2 className="h2 chrome" id="regional-ablauf-h" data-reveal>
              Bei dir abgeholt.
              <br />
              In Horb aufbereitet.
            </h2>
          </div>
          <p className="muted lead-r" data-reveal>
          Die Werkstatt in Loßburg ist noch in Vorbereitung. Bis zur Eröffnung arbeiten wir in Horb
          am Neckar. Deinen Abholort, die Rückgabe und den Preis stimmen wir vor dem Termin mit dir
          ab.
          </p>
        </div>
        <div className="locs">
          <article className="loc" data-reveal>
            <h3 className="h3">Abholung in Freudenstadt</h3>
            <p className="muted">
              Du nennst uns deine Übergabeadresse und das gewünschte Paket. Wir holen den Wagen nach
              Absprache ab, bereiten ihn in Horb auf und bringen ihn zurück. Der Abholpreis
              richtet sich nach der Reichweite; wir bestätigen ihn vor deiner Zusage anhand deiner Adresse.
            </p>
            <Link className="tlink min-h-11" to="/abholservice/$city" params={{ city: "freudenstadt" }}>
              Abholung in Freudenstadt <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="loc" data-reveal>
            <h3 className="h3">Abholung in Loßburg</h3>
            <p className="muted">
              In Loßburg bieten wir die Abholung ebenfalls nach Vereinbarung an. Der Abholpreis
              richtet sich nach der Reichweite. Bitte gib deine genaue Adresse an; wir bestätigen Kosten und Übergabezeit
              persönlich.
            </p>
            <Link className="tlink min-h-11" to="/abholservice/$city" params={{ city: "lossburg" }}>
              Abholung in Loßburg <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>
        <p className="muted small" data-reveal>
          {pickupKeramikNote()}. Alle Beträge {site.vatNote} Du kannst dein Fahrzeug auch direkt
          nach Horb bringen. <Link className="underline underline-offset-4" to="/abholservice">Alle Abholorte und Konditionen</Link> findest
          du in der Übersicht. <Link className="underline underline-offset-4" to="/galerie">Unsere Arbeiten</Link> zeigen freigegebene
          Kundenfahrzeuge.
        </p>
      </div>
    </section>
  );
}
