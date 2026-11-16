# Geprüfter Anfrage- und Zugangsablauf

```mermaid
flowchart TD
    A[Website: Anfrage ohne Fotos] --> B[Website speichert Anfrage und unveränderliche Übergabe]
    B --> C[Authentifizierte Übergabe an das Panel]
    C --> D[Panel speichert eine eindeutig zugeordnete Anfrage]
    C -. Fehler oder verlorene Antwort .-> E[Wiederholung mit derselben Website-ID]
    E --> C
    D --> F[Ein dauerhafter Eingangs-Mailjob]
    F --> G[Bestehendes Passwort: normaler Kundenlogin]
    F --> H[Ohne Passwort: einmaliger befristeter Einrichtungslink]
    H --> I[Passwort selbst festlegen und anmelden]
    G --> J[Eigene Anfrage im geschützten Kundenbereich]
    I --> J
    J --> K[Fotos eindeutig bei dieser Anfrage ergänzen]
    L[Lieber per WhatsApp] --> M[Manuelle Kontaktaufnahme über hinterlegte Nummer]
```

WhatsApp erzeugt keine automatische Panel-Anfrage. Anfrage und Wunschtermin bleiben unverbindlich. Erst ein individuelles, freigegebenes Angebot erlaubt die vereinbarten Arbeiten.

Speicherung, Versandvormerkung, Anbieterannahme und tatsächliche Zustellung sind verschiedene Zustände. Bei einer parallelen Wiederholung kann die Antwort bereits „gespeichert“ und noch „Versand unbestätigt“ lauten, während der andere Aufruf versendet. Daraus entsteht weder eine zweite Anfrage noch ein zweiter Mailjob.

Der Einrichtungslink erlaubt zunächst nur die Passwortvergabe. Er ist kein dauerhafter Anmeldetoken und gewährt allein keinen Datenzugriff. Das Konto und sein Passwort bleiben bestehen; sichere Sitzungen laufen unabhängig davon ab. Abgelaufene Links können unter `/auth/customer?step=renew` ausdrücklich neu angefordert werden. Vorhandene Passwörter werden dabei nicht verändert.
