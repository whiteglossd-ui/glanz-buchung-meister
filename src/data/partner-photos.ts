import type { SlotPhoto } from "@/components/partner-landing";

/**
 * Illustrative atmosphere image from /media/dark/gen (800 and 1600 webp).
 * Decorative (empty alt): it sets the mood and never claims to show partner work.
 */
export function atmosphere(name: string, width = 1600, height = 900): SlotPhoto {
  const base = `/media/dark/gen/${name}`;
  // The "-800" file is 800 px on its longer side.
  const small = Math.round((width * 800) / Math.max(width, height));
  return {
    src: `${base}-800.webp`,
    srcSet: `${base}-800.webp ${small}w, ${base}-1600.webp ${width}w`,
    alt: "",
    width,
    height,
  };
}

/** Dent in light paint, seen under raking light (illustrative). */
export const dentPhoto: SlotPhoto = {
  src: "/media/dellen-800.webp",
  srcSet: "/media/dellen-480.webp 480w, /media/dellen-800.webp 800w, /media/dellen-1200.webp 1200w",
  alt: "Delle im hellen Autolack, im Streiflicht gut sichtbar",
  width: 1200,
  height: 800,
};
