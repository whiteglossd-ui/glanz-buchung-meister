# Google-Bewertungen: Stand 27.11.2026

Der produktive Endpunkt `https://white-gloss.de/api/google-reviews` antwortete bei der Prüfung mit `{"data":null}`. Das öffentliche Ergebnis unterscheidet nicht zwischen fehlender Laufzeitkonfiguration und einem Fehler beim Google-Abruf. Es liefert keine verifizierten Sterne, Texte oder Gesamtzahl.

Die Startseite zeigt deshalb einen klaren Link zum öffentlichen Google-Profil sowie die im Projekt hinterlegten direkten Links zu Originalrezensionen. Sie benennt ausdrücklich, dass Texte, Sterne und Gesamtzahl bei Google stehen. Auch wenn die API eine Gesamtbewertung, aber keine schriftliche Rezension liefert, bleibt die verifizierte Gesamtbewertung sichtbar. Der Fallback zeigt keine erfundenen oder veralteten Werte.

Für Rezensionen direkt auf der Website braucht der Betreiber ein für das eigene Profil genehmigtes Google-Business-Profile-API-Projekt, eine ausdrücklich autorisierte `business.manage`-OAuth-Freigabe und die geschützten Laufzeitwerte `GBP_CLIENT_ID`, `GBP_CLIENT_SECRET`, `GBP_REFRESH_TOKEN` und `GBP_LOCATION`. Nach deren Einrichtung kann `GBP_REVIEWS_ENABLED=true` gesetzt werden; anschließend müssen Profilabgleich, tatsächliche API-Antwort und Anzeige produktiv geprüft werden. Die normale Google-Anmeldung der Website ersetzt diese Freigabe nicht. Zugangsdaten gehören weder in Git noch in einen öffentlichen Chat.

Die Änderung am Linkzustand löst die fehlende API-Freigabe nicht. Sie sorgt dafür, dass Besucher die aktuellen Bewertungen erreichen und die Website keine ungeprüften Rezensionen behauptet.
