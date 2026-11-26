# Meta Pixel, Google Search Console und Veröffentlichung

## Meta Pixel und Conversions API

`VITE_META_PIXEL_ID` ist eine öffentliche Build-Variable. Die Pixel-ID steht
im Meta Events Manager unter **Datenquellen → Web → Pixel**.

Für die serverseitige Conversions API gehören `META_PIXEL_ID` und
`META_CAPI_ACCESS_TOKEN` ausschließlich in die geschützte Laufzeitkonfiguration
des Website-Diensts auf dem Hostinger-VPS. Das Token wird im Meta Events Manager
unter **Einstellungen → Conversions API** ausgestellt.

Nach erfolgreichem Release kann der Meta Events Manager den Status der
Browser- und Serveranbindung anzeigen. Die Website lädt die Messung nach
Einwilligung. Keine echten Buchungen oder Kundenanfragen zu Testzwecken auslösen.

## Google Search Console

1. In der [Search Console](https://search.google.com/search-console) die
   Domain-Property `white-gloss.de` öffnen.
2. Bei Einrichtung einer DNS-Verifizierung den von Google vorgegebenen TXT-Eintrag
   im Hostinger hPanel für `white-gloss.de` ergänzen.
3. Unter **Sitemaps** die Adresse `https://white-gloss.de/sitemap.xml` verwenden.

[DNS-Einträge bei Hostinger](docs/dns-eintraege.md)

## GitHub und Hostinger

Quellcode und Pull Requests liegen im
[aktuellen GitHub-Repository](https://github.com/whiteglossd-ui/glanz-buchung-meister).
Nach bestandenen Pflichtprüfungen veröffentlicht GitHub Actions den aktuellen
Commit auf `main` automatisch auf dem Hostinger-VPS. Den erfolgreichen Run
und den aktiven Stand auf `https://white-gloss.de` prüfen.

[Veröffentlichung und Serverkonfiguration](docs/deployment.md)

## Ratgeber

Vorbereitete Artikel liegen in `blog-articles/`. Inhalte im bestehenden
Website-Studio des CMS bearbeiten und vor der Freigabe prüfen.
