# Panel-Katalog: Empfang vorbereiten

Diese erste Stufe nimmt vollständige öffentliche Katalogfassungen vom Panel entgegen und archiviert sie. **Sie aktiviert keine Inhalte auf der öffentlichen Website.** Bestehende Seiten, Preise, CMS-Fassungen und Kundenanfragen bleiben in ihren bisherigen Datenquellen.

## Vertrag v1

`POST /api/panel-catalog` erwartet das unveränderte Snapshot-JSON des Panels mit `source: "panel"`, `preview: false`, positiver ganzzahliger `revision`, `publishedAt`, `services`, `pages`, `settings` und `redirects`.

Serverseitige Header:

- `Authorization: Bearer <bestehender HUB_SYNC_TOKEN>`
- `Content-Type: application/json`
- `X-White-Gloss-Snapshot: <HMAC-SHA256 der exakten UTF-8-Bytes mit demselben Schlüssel, hex>`

Der Empfänger prüft erst Zugang und Signatur, dann Inhalt und Datenbank. Browseranfragen mit `Origin` oder Browser-Metadaten wie `Sec-Fetch-Site`, `Sec-Fetch-Dest` und `Sec-Fetch-User` werden zurückgewiesen. Ein einzelnes `Sec-Fetch-Mode: cors` ist zulässig, weil auch natives Node-Fetch diesen Header bei Serveranfragen ergänzt. Zugang und Signatur bleiben erforderlich; es gibt keine CORS-Freigabe. Antworten sind `private, no-store` und `noindex`.

Maximal 2 MiB pro Fassung und 15 Sekunden zum Lesen des Körpers. Nur veröffentlichte öffentliche Felder, begrenzte Texte/Listen, sichere Medienreferenzen und eindeutige Identitäten werden akzeptiert. Private Preise, unbekannte Felder, Entwürfe, externe oder zyklische Weiterleitungen werden abgewiesen.

`src/lib/catalog-reference.mjs` enthält denselben URL-Vertrag wie `src/catalog-reference.mjs` im Panel. Website-Pfade und HTTPS-Adressen sind zulässig; normale Leerzeichen im Pfad werden beim Speichern im Panel zu `%20`, gewöhnliche Query-Escapes wie `%2F` bleiben erhalten. Zugangsdaten in URLs, protokollrelative Adressen, Steuerzeichen, Backslashes und Pfad-Traversal werden auch bei verschachtelter Escape-Kodierung abgewiesen. Der Empfänger validiert Referenzen nach demselben Vertrag, verändert aber niemals die signierten Rohbytes einer empfangenen Fassung.

Neue Revisionen erhalten HTTP 201. Die Wiederholung derselben Revision mit byteidentischer Nutzlast erhält HTTP 200. Dieselbe Revision mit verändertem Inhalt sowie ältere Revisionen erhalten HTTP 409. Der Sender muss deshalb seine einmal erstellte Nutzlast einschließlich `publishedAt` dauerhaft speichern und unverändert wiederholen.

Erfolgsantwort:

```json
{
  "ok": true,
  "protocol": "white-gloss-catalog/v1",
  "ready": true,
  "status": "ready",
  "revision": 1,
  "hash": "SHA256_DER_EXAKTEN_NUTZLAST",
  "publishedAt": "2026-11-23T22:00:00.000Z",
  "active": false
}
```

Der Hash ist im echten Ergebnis ein 64-stelliger SHA-256-Hexwert. Das Panel muss Protokoll, Revision, Hash und Zeitpunkt prüfen. Ein HTTP-200-HTML-Dokument ist keine gültige Bestätigung.

`GET /api/panel-catalog` verlangt denselben Bearer und liefert den identischen Status der jüngsten intakten Empfangsfassung, ohne Inhalte auszulesen. Vor dem ersten Empfang sind `revision`, `hash` und `publishedAt` jeweils `null`. Ein beschädigter jüngster Eintrag führt zu HTTP 503; der Empfänger meldet nicht eine ältere Fassung als neuen Erfolg.

Bei deaktiviertem Empfang: HTTP 503, `ok: false`, `ready: false`, `status: "disabled"`, `active: false`. Fehlende Schlüssel-/Datenbankkonfiguration liefert `status: "unconfigured"`; ein Speicherfehler `status: "unavailable"`. Fehlende Berechtigung liefert HTTP 401, Browseranfragen HTTP 403.

**Passender Paneltext: „Übertragen, noch nicht aktiviert“.** Erst eine spätere geprüfte Anbindung aller öffentlichen Verbraucher darf einen aktiven Veröffentlichungszustand ergänzen.

## Datenbank und spätere Einrichtung

Migration `0027_panel_catalog.sql` legt ausschließlich die private Tabelle `panel_catalog_snapshots` an. Sie ist additiv, schaltet RLS ein und verändert keine bestehenden Fach- oder CMS-Tabellen. Speicherung und Versionsvergleich erfolgen zusammen in einer PostgreSQL-Transaktion mit Sperre gegen konkurrierende Empfänger.

Die vorhandene automatische Codeveröffentlichung führt **keine** Datenbankmigration aus: `deploy-guarded-hostinger.sh` ruft den eingeschränkten Aktivierungshelfer auf; dieser extrahiert und aktiviert nur den geprüften Release. Die allgemeine Readiness verlangt angewandte Migrationen weiterhin unverändert.

Vor einer späteren Aktivierung dieses Code-Releases:

1. Datenbankziel und Sicherung prüfen.
2. Mit dem vorhandenen `scripts/migrate.mjs --dry-run` die vollständige Liste ausstehender Migrationen feststellen.
3. Die geprüfte additive Migration über den bestehenden separaten Migrationsweg anwenden. Eine gezielte Auswahl verwendet `--only=0027_panel_catalog.sql` zusammen mit der vollständigen tatsächlichen `--expect-pending`-Liste.
4. Pflichtprüfungen und Release-Readiness bestehen lassen; Code über den vorhandenen GitHub→Hostinger-Weg veröffentlichen.
5. Erst nach bestätigter Datenbank und übereinstimmendem serverseitigem Schlüssel `PANEL_CATALOG_ENABLED=1` im Website-Dienst setzen. Der Handler verlangt eine konfigurierte `DATABASE_URL` und benutzt keinen flüchtigen Ersatzspeicher für Empfangsbestätigungen.
6. Zuerst geschützten GET-Status prüfen, danach eine bewusst ausgewählte Fassung übertragen und per GET die exakte Revision/Prüfsumme nachlesen.

Das Flag aktiviert nur den Empfänger. Ein Entfernen des Flags sperrt weitere Zugriffe; archivierte Fassungen bleiben erhalten. Öffentliche Website-Inhalte werden in dieser Stufe niemals daraus geladen.

## Tests ohne Website-Server

`node --experimental-strip-types --test src/lib/panel-catalog.test.ts` prüft HTTP-Vertrag direkt im Prozess, Bytesignatur, Zugangsschutz, Limits, Inhaltsschema, Replay, konkurrierende Revisionen, PostgreSQL-Rollback, Archivintegrität, RLS sowie unveränderte Geschäfts- und CMS-Daten. Der Test ist außerdem in `npm test` aufgenommen.
