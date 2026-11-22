import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { packageServiceSlug, packages, site, vehicleClasses } from "@/data/site";
import { customerPhotos } from "@/data/customer-photos";
import { eur } from "@/lib/utils";
import { IconArrowRight } from "./icons";
import { MediaRail } from "./media-rail";

const photos = [
  customerPhotos.find((photo) => photo.id === "customer-14")!,
  customerPhotos.find((photo) => photo.id === "customer-05")!,
  {
    src: "/media/customer-photos/ceramic-sclass-1400.webp",
    srcSet:
      "/media/customer-photos/ceramic-sclass-480.webp 480w, /media/customer-photos/ceramic-sclass-900.webp 900w, /media/customer-photos/ceramic-sclass-1400.webp 1064w",
    width: 1064,
    height: 1332,
    alt: "Schwarze Mercedes-Benz S-Klasse mit spiegelndem Keramik-Finish und AMG-Felge in der Werkstatt",
  },
];
const focalPoints = ["50% 58%", "50% 64%", "50% 58%"];

export function PackageShowcase() {
  const [vehicle, setVehicle] = useState(vehicleClasses[0]);
  return (
    <section
      id="pakete"
      className="wg-home-packages mx-auto max-w-7xl px-4 sm:px-6"
      aria-labelledby="packages-title"
    >
      <header className="wg-collection-head">
        <div>
          <p className="kicker">Pakete & Preise</p>
          <h2 id="packages-title" className="heading-2 mt-3" data-scroll-title>
            Welche Pflege passt zu deinem Auto?
          </h2>
        </div>
        <Link to="/preise" className="atelier-text-link">
          Alle Preise und Zusatzleistungen <IconArrowRight aria-hidden />
        </Link>
      </header>
      <div
        role="group"
        aria-label="Fahrzeugklasse für die Paketpreise"
        className="wg-vehicle-switch"
      >
        {vehicleClasses.map((option) => (
          <button
            type="button"
            key={option.id}
            aria-pressed={vehicle.id === option.id}
            onClick={() => setVehicle(option)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <MediaRail
        label="Aufbereitungspakete"
        selectionLabel="Paket auswählen"
        items={packages.map((pack, index) => {
          const photo = photos[index];
          return {
            label: pack.name.replace("White-Gloss ", ""),
            content: (
              <>
                <div className="wg-rail-frame">
                  <img
                    src={photo.src}
                    srcSet={photo.srcSet}
                    sizes="(min-width: 1280px) 400px, (min-width: 960px) 32vw, 88vw"
                    style={{ objectPosition: focalPoints[index] }}
                    width={photo.width}
                    height={photo.height}
                    alt={photo.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="wg-rail-copy">
                  <h3>{pack.name}</h3>
                  <p>{pack.kicker}</p>
                  <div className="wg-package-detail">
                    <p className="wg-rail-price">
                      ab <strong>{eur(pack.price * vehicle.factor)}</strong>
                    </p>
                    <p className="wg-rail-terms">
                      {site.vatNote} · {pack.duration}
                    </p>
                    <Link
                      to="/leistungen/$slug"
                      params={{ slug: packageServiceSlug[pack.id] }}
                      className="atelier-text-link"
                      aria-label={`Paket ${pack.name} ansehen`}
                    >
                      Paket ansehen <IconArrowRight aria-hidden />
                    </Link>
                  </div>
                </div>
              </>
            ),
          };
        })}
      />
    </section>
  );
}
