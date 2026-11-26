// A separate media version keeps cached posters and scroll frames in sync.
const base = "/media/scroll-film/studio-journey";
export const scrollFilm = {
  mobileQuery: "(max-width: 767px)",
  desktopVideo: `${base}/classic-desktop-1280.mp4`,
  mobileVideo: `${base}/classic-mobile-540.mp4`,
  desktopPoster: `${base}/poster-desktop-1280.webp`,
  desktopPosters: `${base}/poster-desktop-1280.webp 1280w, ${base}/poster-desktop-1920.webp 1920w`,
  mobilePoster: `${base}/poster-mobile-540-v2.webp`,
  mobilePosters: `${base}/poster-mobile-540-v2.webp 540w, ${base}/poster-mobile-720-v2.webp 720w`,
};

// The current public hero is the cockpit sequence, not the classic film.
// Keep the media-qualified head hint and its visible picture in agreement.
export const darkMobilePoster = "/media/dark/seq/m/poster-720.avif";
export const scrollFilmPreloads = [
  {
    rel: "preload" as const,
    as: "image",
    type: "image/avif",
    fetchPriority: "high" as const,
    media: scrollFilm.mobileQuery,
    href: darkMobilePoster,
  },
  {
    rel: "preload" as const,
    as: "image",
    type: "image/webp",
    fetchPriority: "high" as const,
    media: "(min-width: 768px)",
    href: "/media/dark/seq/d/001.webp",
  },
];
