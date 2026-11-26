# DNS-Einträge bei Hostinger pflegen

Die Zone für `white-gloss.de` wird im Hostinger hPanel gepflegt. Unter
**Domains → DNS** die Domain auswählen. Die
[Hostinger-Anleitung](https://www.hostinger.com/support/1583249-how-to-manage-dns-records-at-hostinger/)
beschreibt die Einträge und den Zonenexport.

## Öffentlich gemessener Stand vom 26. November 2026

| Eintrag | Öffentliche DNS-Antwort |
| --- | --- |
| Nameserver | `byte.dns-parking.com`, `pixel.dns-parking.com` |
| Website und Panel, A für `@` und `panel` | `187.126.4.225` |
| Website, CNAME für `www` | `white-gloss.de` |
| Hostinger Mail, MX an `@` | Priorität 5 `mx1.hostinger.com`, Priorität 10 `mx2.hostinger.com` |
| Hostinger Mail, SPF-TXT an `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` |
| Hostinger Mail, DKIM | Drei CNAMEs `hostingermail-a/b/c._domainkey` auf die jeweiligen Ziele unter `dkim.mail.hostinger.com` |
| DMARC-TXT an `_dmarc` | `v=DMARC1; p=none` |
| `send.white-gloss.de` | CNAME auf `send.forge.rmta.net` |
| `resend._domainkey.white-gloss.de` | DKIM-TXT vorhanden |

Die DNS-Antworten bestätigen veröffentlichte Einträge. Die Funktion und
Verifizierung eines Versanddiensts sind im jeweiligen Anbieterkonto zu prüfen.

Vor Änderungen die Zone exportieren und die betroffenen Einträge mit dem
jeweiligen Anbieter abgleichen. Die Zieladressen für Website und Panel am
zugewiesenen VPS prüfen. Anbieterangaben für Versand-Subdomains und DKIM
aus dem jeweils zugehörigen Konto übernehmen. Pro Name nur einen SPF- bzw.
DMARC-Eintrag führen. Google-Site-Verifizierungen sind zusätzliche TXT-Einträge
und ersetzen den SPF-Eintrag nicht.

Die frühere
[Anleitung vor der Domainmigration](https://github.com/whiteglossd-ui/glanz-buchung-meister/blob/504786c04e4cd17e1fd7ec7eaf4b9ba790711669/docs/dns-eintraege.md)
dokumentiert die damalige Zone.
