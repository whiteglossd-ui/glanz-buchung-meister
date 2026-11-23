import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CONSENT_INITIAL_LAYOUT_SCRIPT, CONSENT_INITIAL_STATE_SCRIPT, CONSENT_SETTINGS_EVENT, getStoredConsent, onConsentChange, setStoredConsent } from "@/lib/consent";
import { loadGoogleTag, stopGoogleTag } from "@/lib/googleTag";
import { ctaGhost, ctaPrimary } from "./ui";

/** Runs before body paint; it neither changes a saved choice nor loads tracking. */
export function ConsentInitialState() {
  const nonce = useRouter().options.ssr?.nonce;
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: CONSENT_INITIAL_STATE_SCRIPT }} />;
}

export function CookieSettingsButton() {
  return <button type="button" className="link-draw inline-flex min-h-11 items-center text-left hover:text-fg" onClick={() => window.dispatchEvent(new Event(CONSENT_SETTINGS_EVENT))}>Cookie-Einstellungen</button>;
}

/**
 * Cookie-Einwilligung (§ 25 TDDDG). Erscheint nur, solange noch keine
 * Entscheidung in localStorage (`wg-consent`) liegt. Erst nach „Akzeptieren“
 * lädt {@link loadGoogleTag} den Google Tag (Ads/GA4) nach — vorher stellt
 * die Website keine Verbindung zu Google her.
 */
export function ConsentBanner() {
  const nonce = useRouter().options.ssr?.nonce;
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const rejectRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const existing = getStoredConsent();
    if (existing !== null) {
      document.documentElement.removeAttribute("data-consent-initial-open");
      document.documentElement.style.removeProperty("--consent-banner-height");
    }
    setAccepted(existing === "accepted");
    setVisible(existing === null);
    setReady(true);
    if (existing === "accepted") {
      loadGoogleTag();
    }
    const openSettings = () => setVisible(true);
    window.addEventListener(CONSENT_SETTINGS_EVENT, openSettings);
    const unsubscribe = onConsentChange((choice) => {
      setAccepted(choice === "accepted");
      if (choice === "accepted") loadGoogleTag();
      else if (stopGoogleTag()) window.location.reload();
    });
    return () => {
      window.removeEventListener(CONSENT_SETTINGS_EVENT, openSettings);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!ready || !visible) return;
    document.body.dataset.consentBanner = "open";
    const banner = bannerRef.current;
    document.documentElement.removeAttribute("data-consent-initial-open");
    const resizeObserver = new ResizeObserver(([entry]) => {
      const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height;
      if (height) document.documentElement.style.setProperty("--consent-banner-height", `${height}px`);
    });
    if (banner) resizeObserver.observe(banner, { box: "border-box" });
    const active = document.activeElement;
    previousFocusRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
    rejectRef.current?.focus();
    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty("--consent-banner-height");
      delete document.body.dataset.consentBanner;
    };
  }, [ready, visible]);

  if (!visible) return null;

  function dismiss() {
    if (bannerRef.current?.contains(document.activeElement)) {
      const previous = previousFocusRef.current;
      const target =
        previous?.isConnected && !previous.closest("[inert]")
          ? previous
          : document.getElementById("main-content");
      target?.focus({ preventScroll: true });
    }
    setVisible(false);
  }

  function accept() {
    setStoredConsent("accepted");
    dismiss();
  }

  function reject() {
    setStoredConsent("rejected");
    dismiss();
  }

  return (
    <>
    <div
      ref={bannerRef}
      data-consent-initial={!ready ? "true" : undefined}
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-describedby="consent-text"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          // Wiedergeöffnete Einstellungen: Escape schließt nur und lässt die
          // gespeicherte Wahl unverändert. Widerruf nur über den Button.
          if (getStoredConsent() === null) reject();
          else dismiss();
        }
      }}
      className="consent-banner fixed inset-x-0 bottom-0 z-50 border-t border-fg/10 bg-bg text-fg"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p id="consent-title" className="font-medium">
            Cookie-Einstellungen
          </p>
          <p id="consent-text" className="text-sm text-fg/80">
            Mit deiner Zustimmung nutzen wir Google Ads und Analytics zur Werbe- und Besucherauswertung. Die Dienste werden erst nach einem Klick auf „Akzeptieren“ geladen. Details findest du in der{" "}
            <Link to="/datenschutz" className="underline underline-offset-2">
              Datenschutzerklärung
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button ref={rejectRef} type="button" disabled={!ready} onClick={reject} className={ctaGhost}>
            {accepted ? "Einwilligung widerrufen" : "Ablehnen"}
          </button>
          <button type="button" disabled={!ready} onClick={accept} className={ctaPrimary}>
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
    <script nonce={nonce} dangerouslySetInnerHTML={{ __html: CONSENT_INITIAL_LAYOUT_SCRIPT }} />
    </>
  );
}
