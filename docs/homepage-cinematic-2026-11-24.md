# Startseite: Filmkapitel und mobile Gestaltung, 24. November 2026

Der Betreiber hat die Optimierung des zweiten Textabschnitts „Fahrzeugaufbereitung“
im Scroll-Video, zusätzliche visuelle Effekte auf der Startseite, die mobile
Optimierung und die automatische Veröffentlichung auf Hostinger beauftragt.

Die bisherigen CI-Bilder des veröffentlichten Stands `e947bc3` zeigen, dass das
lange Wort „Fahrzeugaufbereitung“ bei 390 px im zweiten Filmkapitel rechts
abgeschnitten wird. Es wird zum kleinen Kapitelbezeichner. Die neue zweizeilige
Aussage lautet „Dein Auto. Wieder besonders.“ mit kurzem Finish-Text und dem
bestehenden Standort. Sie enthält keine neue Leistungs- oder Standortzusage.

Einleitung und zweites Kapitel haben getrennte Einblendungsbereiche. Die
Pausensteuerung hält Film und zugehörige Schrift gleichzeitig an. Der bisherige
statische Modus bei reduzierter Bewegung, kleinen Ansichten, angepasstem
Studio-Hero oder schwachen Verbindungen bleibt bestehen. Ein zweites Dekorations-
Kapitel wird dort nicht erzwungen. Die zugängliche H1 und die Beschreibungen der
Leistungen bleiben im Dokument; ausgeblendete Aktionen sind nicht fokussierbar.

Die übrige Startseite erhält einmalige Lichtreflexe, Abschnittslinien, klarere
Leistungsüberschriften und verbesserte Abstände sowie Touch-Flächen. Verwendet
werden die bestehenden öffentlichen Schrift- und Farbvariablen. Keine neuen
Medien, Schriftdateien oder Laufzeitabhängigkeiten werden geladen.

Der exakte Inhaltspin für `scroll-film-hero.tsx` folgt diesem beauftragten Text-
und Ablaufwechsel. Die übrigen Inhaltspins bleiben unverändert. Automatisierte
Tests prüfen unter anderem Vor-/Rückwärtslauf, gemeinsame Pause und Fokus. Die
bestehende CI-Browserprüfung misst zusätzlich die tatsächlichen Textgrenzen des
zweiten Kapitels zwischen Navigation und Filmsteuerung. Lokales Hosting bleibt
ausgeschaltet. Veröffentlichung über den bestehenden GitHub→Hostinger-Weg nach
erfolgreichen Pflichtprüfungen.
