import { useRouter } from "@tanstack/react-router";
import { useCallback, useSyncExternalStore } from "react";
import type { PackageId } from "@/data/site";
import { LazyConfigurator } from "./lazy-configurator";
import { LazyRundumInquiry } from "./lazy-rundum-inquiry";
import "@/styles/home-booking.css";

const isRundumRequest = () => window.location.hash === "#rundum-anfrage";
const defaultRequest = () => false;

export function HomeBooking({
  initialPackage,
  initialCity,
}: {
  initialPackage?: PackageId;
  initialCity?: string;
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
      <span id="rundum-anfrage" className="home-booking-anchor" aria-hidden="true" />
      <header>
        <p className="kicker">Termin anfragen</p>
        <h2 id="buchung-heading" className="heading-2 mt-3" tabIndex={-1}>
          Was braucht dein Auto?
        </h2>
      </header>
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
          Wähle dein Paket und deinen Wunschtermin. Den Preis und die Abholung kläre ich mit dir
          persönlich.
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
          ansteht. Ich kläre die Arbeiten und den Preis für dich.
        </p>
        <LazyRundumInquiry />
      </div>
    </section>
  );
}
