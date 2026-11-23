import { useEffect, useRef, useState } from "react";

type PackagePhoto = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
};

/** Native lazy loading can fetch an entire offscreen rail several screens early.
 * Keep its reserved media frame, but fetch the photo only near the real viewport.
 */
export function DeferredPackagePhoto({
  photo,
  position,
}: {
  photo: PackagePhoto;
  position: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (typeof IntersectionObserver === "undefined") {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setReady(true);
        observer.disconnect();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const image = (
    <img
      src={photo.src}
      srcSet={photo.srcSet}
      sizes="(min-width: 1280px) 400px, (min-width: 960px) 32vw, 88vw"
      style={{ objectPosition: position }}
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      loading="lazy"
      decoding="async"
    />
  );

  return (
    <div className="wg-rail-frame" ref={frameRef}>
      {ready && image}
      <noscript>{image}</noscript>
    </div>
  );
}
