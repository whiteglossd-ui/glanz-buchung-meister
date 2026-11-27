export type CustomerVideo = {
  title: string;
  category: string;
  duration: string;
  description: string;
  src: string;
  poster: string;
  posterWidth: number;
  posterHeight: number;
  featured?: boolean;
};

export const customerVideos: readonly CustomerVideo[] = [
  {
    title: "Glasversiegelung im Wasserlauf",
    category: "Glasversiegelung",
    duration: "0:08 Min.",
    description:
      "Der gleichmäßige Wasserlauf zeigt die hydrophobe Wirkung auf der versiegelten Scheibe.",
    src: "/media/customer-glass",
    poster: "/media/customer-glass-poster.webp",
    posterWidth: 1280,
    posterHeight: 720,
    featured: true,
  },
  {
    title: "Hydrophober Lackschutz",
    category: "White-Gloss Ceramic",
    duration: "0:11 Min.",
    description:
      "Der Abperleffekt auf der Motorhaube macht den aufbereiteten und geschützten Lack sichtbar.",
    src: "/media/customer-beading",
    poster: "/media/customer-beading-poster.webp",
    posterWidth: 720,
    posterHeight: 1280,
  },
  {
    title: "Innenraum im Detail",
    category: "Innenraum",
    duration: "0:16 Min.",
    description: "Mittelkonsole, Leder und Einstiegsbereich nach der Innenraumaufbereitung.",
    src: "/media/customer-interior",
    poster: "/media/customer-interior-poster.webp",
    posterWidth: 480,
    posterHeight: 854,
  },
  {
    title: "Lackfinish & Seitenlinie",
    category: "Lackkorrektur",
    duration: "0:09 Min.",
    description: "Felgen, Karosserielinien und Lackglanz am freigegebenen Kundenfahrzeug.",
    src: "/media/customer-exterior",
    poster: "/media/customer-exterior-poster.webp",
    posterWidth: 480,
    posterHeight: 854,
  },
];
