import { Link } from "@tanstack/react-router";
import { conciergeAtmosphere } from "@/data/atmosphere-media";
import { RevealLines } from "./reveal-lines";
import { IconArrowRight } from "./icons";

export function HomeProcess() {
  return (
    <section className="concierge-service" aria-labelledby="concierge-heading" id="craft-heading">
      <header>
        <p className="kicker">Hol- und Bringservice</p>
        <h2 id="concierge-heading" className="heading-2" data-lines>
          <RevealLines lines={["So läuft die", "Aufbereitung ab."]} />
        </h2>
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
      <ol>
        <li>
          <span aria-hidden="true">01</span>
          <h3>Du fragst an</h3>
          <p>
            Beschreib mir dein Auto und was dich stört. Du bekommst ein persönliches Angebot mit
            Preis und Termin. Erst wenn du zusagst, ist der Termin fest.
          </p>
        </li>
        <li>
          <span aria-hidden="true">02</span>
          <h3>Ich hole es ab</h3>
          <p>
            Wir vereinbaren Ort und Uhrzeit. Bist du unterwegs, können wir die Schlüsselübergabe
            vorab regeln. In der Werkstatt bekommt dein Auto die vereinbarte Pflege.
          </p>
        </li>
        <li>
          <span aria-hidden="true">03</span>
          <h3>Du fährst los</h3>
          <p>
            Ich bringe dir dein Auto zurück. Die Übergabe halte ich digital für dich fest. Hast du
            danach eine Frage zur Pflege, erreichst du mich direkt.
          </p>
        </li>
      </ol>
    </section>
  );
}
