import { useRouter } from "@tanstack/react-router";
import { useCallback, useSyncExternalStore } from "react";
import type { PackageId } from "@/data/site";
import { LazyConfigurator } from "./lazy-configurator";
import { LazyRundumInquiry } from "./lazy-rundum-inquiry";
import "@/styles/home-booking.css";

const isRundumRequest = () =>
  ["#rundum-anfrage", "#rundum-service", "#service"].includes(window.location.hash);
const defaultRequest = () => false;

export function HomeBooking({
  initialPackage,
  initialCity,
  serviceArea = "Horb am Neckar und Umgebung",
}: {
  initialPackage?: PackageId;
  initialCity?: string;
  serviceArea?: string;
}) {
  const router = useRouter();
  // Both plain hash links and client-side router links open this shared section.
  const subscribe = useCallback(
    (notify: () => void) => {
      // The router commits its browser URL in a microtask after notifying.
      const unsubscribe = router.history.subscribe(() => queueMicrotask(notify));
      window.addEventListener("hashchange", notify);
      return () => {
        unsubscribe();
        window.removeEventListener("hashchange", notify);
      };
    },
    [router],
  );
  const rundum = useSyncExternalStore(subscribe, isRundumRequest, defaultRequest);

  return (
    <section
      id="buchung"
      className="section booking-section home-booking mx-auto max-w-7xl px-4 sm:px-6"
      aria-labelledby="buchung-heading"
    >
      {["termin", "service", "rundum-service", "rundum-anfrage"].map((id) => (
        <span key={id} id={id} className="home-booking-anchor" aria-hidden="true" />
      ))}
      <div className="home-booking-layout">
        <header className="home-booking-promise">
          <p className="kicker">Dein Rundum-Service</p>
          <h2 id="buchung-heading" className="heading-2 mt-3" tabIndex={-1} data-scroll-title>
            Dein Auto. Dein Wunsch. Wir kümmern uns.
          </h2>
          <p className="home-booking-intro">
            Ob regelmäßige Autopflege, gründliche Innenraumreinigung oder Vorbereitung auf die
            Leasingrückgabe: Sag uns, was dein Auto braucht.
          </p>
          <ul className="home-booking-benefits" data-stagger>
            <li data-stagger-item>
              <strong>Pflege und Reparatur aus einer Hand</strong>
              <span>
                Detailing, Lackaufbereitung und Keramikversiegelung in unserer Werkstatt.
                Dellenentfernung, Felgen- oder Sitzreparaturen stimmen wir mit unserem
                Partnerbetrieb ab.
              </span>
            </li>
            <li data-stagger-item>
              <strong>Ein Angebot, das zu deinem Auto passt</strong>
              <span>Du kennst Leistungen und Festpreis, bevor du zusagst.</span>
            </li>
            <li data-stagger-item>
              <strong>Abholung passend zu deinem Alltag</strong>
              <span>Dein Servicegebiet: {serviceArea}.</span>
            </li>
          </ul>
          <p className="home-booking-note">
            Deine Anfrage ist unverbindlich. Deinen Termin bestätigen wir persönlich.
          </p>
        </header>
        <div className="home-booking-form" aria-labelledby="anfrage-heading">
          <h3 id="anfrage-heading" className="home-booking-form-title">
            Jetzt Termin anfragen
          </h3>
          <nav className="home-booking-options" aria-label="Art der Anfrage">
            <a
              href="#buchung"
              aria-current={!rundum ? "location" : undefined}
              aria-controls="paket-formular"
            >
              Paket wählen
            </a>
            <a
              href="#rundum-anfrage"
              aria-current={rundum ? "location" : undefined}
              aria-controls="rundum-formular"
            >
              Rundum-Service
            </a>
          </nav>
          <noscript>
            <style>{".home-booking-options { display: none; }"}</style>
          </noscript>
          <div id="paket-formular" hidden={rundum}>
            <p className="home-booking-lead">
              Wähle dein Paket und deinen Wunschtermin. Alle weiteren Details klären wir direkt mit
              dir.
            </p>
            <LazyConfigurator
              eager={Boolean(initialPackage || initialCity)}
              initialPackage={initialPackage}
              initialCity={initialCity}
            />
          </div>
          <div id="rundum-formular" className="rundum-request max-w-3xl" hidden={!rundum}>
            <p className="home-booking-lead">
              Eine Delle, eine zerkratzte Felge oder mehrere Wünsche auf einmal? Erzähl mir, was
              ansteht. Wir bündeln deine Wünsche in einem persönlichen Angebot.
            </p>
            <LazyRundumInquiry />
          </div>
        </div>
      </div>
    </section>
  );
}
