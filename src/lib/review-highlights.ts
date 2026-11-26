import type { GoogleReview } from "../data/google-profile.ts";

/** Show the writer's own wording, not Google's appended translation. */
export function originalReviewText(text: string) {
  return text.split(/\r?\n\r?\n\((?:Translated by Google|Von Google übersetzt)\)\r?\n/i, 1)[0].trim();
}

const concreteDetails: [RegExp, number][] = [
  [/\baufbereitung\b|\bliebe zum detail\b/i, 76],
  [/\black|\bpolitur|\binnenraum|\binnen und außen/i, 65],
  [/\bendergebnis|\bwie neu|\bflecken|\bhundehaar/i, 65],
  [/\bterminfindung|\babholung|\brückgabe/i, 42],
  [/\bpreis[\s-]*leistung/i, 52],
];

/** Prefer the most useful written account, not the newest or longest alone. */
export function selectReviewHighlights(reviews: readonly GoogleReview[]) {
  const written = reviews.filter((review) => originalReviewText(review.text).length > 0);
  function score(review: GoogleReview) {
    const text = originalReviewText(review.text);
    return concreteDetails.reduce((sum, [regex, weight]) => sum + (regex.test(text) ? weight : 0), 0)
      + Math.min(180, text.length) / 4;
  }
  const featured = written.reduce<GoogleReview | undefined>((best, review) => (
    !best || score(review) > score(best) ? review : best
  ), undefined);
  return {
    featured,
    more: written.filter((review) => review.id !== featured?.id).slice(0, 4),
  };
}
