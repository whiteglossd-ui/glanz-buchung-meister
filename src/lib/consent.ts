/**
 * COOKIE-EINWILLIGUNG (§ 25 TDDDG, Art. 6 Abs. 1 lit. a DSGVO)
 * --------------------------------------------------------------
 * Speichert die Entscheidung der Besucher:in zu nicht technisch notwendigen
 * Skripten (Google Ads, GA4, Meta Pixel) in localStorage unter dem Schlüssel
 * `wg-consent`. Ohne gespeicherte Entscheidung wird nichts geladen — das
 * Banner bleibt sichtbar, bis aktiv gewählt wurde.
 */

export type ConsentChoice = "accepted" | "rejected";

export const CONSENT_STORAGE_KEY = "wg-consent";

/**
 * Read-only first-paint hint. The SSR dialog is hidden only for a valid existing
 * choice; React still reads the authoritative storage value after hydration.
 */
export const CONSENT_INITIAL_STATE_SCRIPT =
  '(function(){try{var c=window.localStorage.getItem("wg-consent");' +
  'if(c==="accepted"||c==="rejected")document.documentElement.setAttribute("data-consent-stored","true")' +
  '}catch{}})();';

/**
 * ResizeObserver delivers border-box sizes after layout and before paint. An
 * inline synchronous measurement here otherwise forces layout of the whole
 * partially parsed homepage before the browser can paint the dialog.
 */
export const CONSENT_INITIAL_LAYOUT_SCRIPT =
  '(function(){var r=document.documentElement,e=document.querySelector(".consent-banner[data-consent-initial]");' +
  'if(!e||r.hasAttribute("data-consent-stored"))return;' +
  'r.setAttribute("data-consent-initial-open","true");' +
  'var o=new ResizeObserver(function(entries){if(!e.hasAttribute("data-consent-initial")){o.disconnect();return;}' +
  'var b=entries[0].borderBoxSize,h=b?(b[0]||b).blockSize:e.getBoundingClientRect().height;' +
  'if(h>0)r.style.setProperty("--consent-banner-height",h+"px");o.disconnect()});' +
  'o.observe(e,{box:"border-box"})})();';

const CONSENT_CHANGE_EVENT = "wg-consent-change";
export const CONSENT_SETTINGS_EVENT = "wg-consent-settings";
let failedStorageChoice: { owner: Window; choice: ConsentChoice } | undefined;

function isConsentChoice(value: unknown): value is ConsentChoice {
  return value === "accepted" || value === "rejected";
}

/** Liefert die gespeicherte Entscheidung, oder `null` wenn noch keine getroffen wurde. */
export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  if (failedStorageChoice?.owner === window) return failedStorageChoice.choice;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return isConsentChoice(value) ? value : null;
  } catch {
    // localStorage kann in privaten/eingeschränkten Kontexten eine Ausnahme
    // werfen (z. B. Safari im privaten Modus). Dann gilt: keine Entscheidung.
    return failedStorageChoice?.owner === window ? failedStorageChoice.choice : null;
  }
}

/** Speichert die Entscheidung und benachrichtigt Listener im selben Tab. */
export function setStoredConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    failedStorageChoice = undefined;
  } catch {
    // Speichern fehlgeschlagen: Banner erscheint beim nächsten Aufruf erneut.
    failedStorageChoice = { owner: window, choice };
    // A full/quota-limited store must not retain an earlier acceptance on reload.
    if (choice === "rejected") {
      try { window.localStorage.removeItem(CONSENT_STORAGE_KEY); } catch { /* storage unavailable */ }
    }
  }
  window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_CHANGE_EVENT, { detail: choice }));
}

/** Meldet Änderungen der Einwilligung innerhalb desselben Tabs (z. B. für einen erneuten Ladeversuch). */
export function onConsentChange(listener: (choice: ConsentChoice) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ConsentChoice>).detail;
    if (isConsentChoice(detail)) listener(detail);
  };
  const storageHandler = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY || event.key === null) {
      listener(event.newValue === "accepted" ? "accepted" : "rejected");
    }
  };
  window.addEventListener(CONSENT_CHANGE_EVENT, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
