import { z } from "zod";
import { isCatalogReference, normalizeCatalogReference } from "./catalog-reference.mjs";

export const PANEL_CATALOG_PROTOCOL = "white-gloss-catalog/v1" as const;
export const PANEL_CATALOG_MAX_BYTES = 2 * 1024 * 1024;

const plain = (max: number, min = 0) =>
  z
    .string()
    .min(min)
    .max(max)
    .refine(
      (value) =>
        !value.includes("<") &&
        [...value].every((character) => {
          const code = character.charCodeAt(0);
          return [9, 10, 13].includes(code) || (code >= 32 && code !== 127);
        }),
    );
const slug = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const id = z
  .string()
  .max(160)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/);
const timestamp = z.string().refine((value) => {
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
});

const reference = plain(500).refine(isCatalogReference);
const nonEmptyReference = reference.refine(
  (value) => isCatalogReference(value) && normalizeCatalogReference(value) !== "",
);
const links = z.array(nonEmptyReference).max(12);
const image = z.strictObject({
  src: nonEmptyReference,
  alt: plain(300, 1),
});
const gallery = z
  .array(image)
  .max(24)
  .refine(
    (images) =>
      images.every((item) => isCatalogReference(item.src)) &&
      new Set(images.map((item) => normalizeCatalogReference(item.src))).size === images.length,
  );
const lines = (max: number) => z.array(plain(300, 1)).max(max);
const price = z.number().int().min(0).max(10_000_000);

// The archive accepts the existing public Panel contract only. Unknown fields,
// private prices, arbitrary markup and draft envelopes never enter this store.
const service = z.strictObject({
  id,
  catalogId: slug.nullable(),
  slug,
  name: plain(120, 2),
  kind: z.enum(["package", "extra", "custom"]),
  status: z.literal("active"),
  priceCents: price,
  description: plain(20000),
  summary: plain(500),
  seoTitle: plain(160),
  metaDescription: plain(320),
  landingSlug: z.union([z.literal(""), slug]),
  sortOrder: z.number().finite().min(0).max(1_000_000),
  updatedAt: timestamp,
  shortTitle: plain(80).optional(),
  priceFrom: z.boolean().optional(),
  vehicleCategory: z.enum(["", "kompakt", "suv", "transporter", "alle"]).optional(),
  scopeSummary: plain(500).optional(),
  steps: lines(40).optional(),
  addons: lines(40).optional(),
  duration: plain(80).optional(),
  previewImage: reference.optional(),
  gallery: gallery.optional(),
  icon: plain(40).optional(),
  category: plain(80).optional(),
  featured: z.boolean().optional(),
  internalLinks: links.optional(),
  socialImage: reference.optional(),
  ctaText: plain(80).optional(),
});

const page = z.strictObject({
  id,
  serviceId: id.nullable(),
  slug,
  status: z.literal("active"),
  title: plain(200, 2),
  lead: plain(4000),
  body: plain(20000),
  seoTitle: plain(160),
  metaDescription: plain(320),
  updatedAt: timestamp,
  kicker: plain(120).optional(),
  advantages: lines(24).optional(),
  steps: z
    .array(z.strictObject({ title: plain(200, 1), text: plain(2000, 1) }))
    .max(24)
    .optional(),
  priceNote: plain(500).optional(),
  faqs: z
    .array(z.strictObject({ question: plain(300, 1), answer: plain(4000, 1) }))
    .max(24)
    .optional(),
  images: gallery.optional(),
  beforeAfter: z
    .array(
      z.strictObject({
        before: nonEmptyReference,
        after: nonEmptyReference,
        alt: plain(300, 1),
      }),
    )
    .max(12)
    .optional(),
  reviews: z
    .array(z.strictObject({ quote: plain(1000, 1), author: plain(120, 1) }))
    .max(12)
    .optional(),
  ctaText: plain(80).optional(),
  showForm: z.boolean().optional(),
  socialImage: reference.optional(),
  links: links.optional(),
});

const settings = z.strictObject({
  name: plain(120, 1),
  legalName: plain(160, 1),
  owner: plain(160).optional(),
  phone: plain(40).optional(),
  email: plain(180)
    .refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    .optional(),
  street: plain(160).optional(),
  postalCode: plain(12).optional(),
  city: plain(80).optional(),
  country: plain(80).optional(),
  website: reference.optional(),
  hoursLabel: plain(160).optional(),
  whatsapp: reference.optional(),
  instagram: reference.optional(),
  facebook: reference.optional(),
  logo: reference.optional(),
  profileImage: reference.optional(),
  description: plain(4000).optional(),
  ctaText: plain(80).optional(),
  imprintPath: reference.optional(),
  privacyPath: reference.optional(),
  seoTitle: plain(160).optional(),
  metaDescription: plain(320).optional(),
  socialImage: reference.optional(),
});

const servicePath = z
  .string()
  .max(100)
  .regex(/^\/leistungen\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
const snapshot = z.strictObject({
  source: z.literal("panel"),
  preview: z.literal(false),
  revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  publishedAt: timestamp,
  services: z.array(service).max(500),
  pages: z.array(page).max(500),
  settings,
  redirects: z.array(z.strictObject({ source: servicePath, target: servicePath })).max(1000),
});

export type PanelCatalogSnapshot = z.infer<typeof snapshot>;

function unique(values: string[]) {
  return new Set(values).size === values.length;
}

function validateReferences(value: PanelCatalogSnapshot) {
  if (
    !unique(value.services.map((item) => item.id)) ||
    !unique(value.services.map((item) => item.slug)) ||
    !unique(value.services.flatMap((item) => (item.catalogId ? [item.catalogId] : []))) ||
    !unique(value.pages.map((item) => item.id)) ||
    !unique(value.pages.map((item) => item.slug)) ||
    !unique(value.redirects.map((item) => item.source))
  )
    throw Error("catalog_duplicate");
  const active = new Set(
    [...value.services, ...value.pages].map((item) => `/leistungen/${item.slug}`),
  );
  const redirects = new Map(value.redirects.map((item) => [item.source, item.target]));
  for (const from of redirects.keys()) {
    if (active.has(from)) throw Error("catalog_redirect_shadows_content");
    const seen = new Set<string>();
    let target = from;
    while (redirects.has(target)) {
      if (seen.has(target)) throw Error("catalog_redirect_cycle");
      seen.add(target);
      target = redirects.get(target)!;
    }
    if (!active.has(target)) throw Error("catalog_redirect_missing_target");
  }
}

export function parsePanelCatalogSnapshot(raw: Uint8Array): PanelCatalogSnapshot {
  if (!raw.byteLength || raw.byteLength > PANEL_CATALOG_MAX_BYTES) throw Error("catalog_size");
  const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(raw);
  const parsed = JSON.parse(text, (key, value: unknown) => {
    if (["internalPriceCents", "__proto__", "prototype", "constructor"].includes(key))
      throw Error("catalog_private_field");
    return value;
  });
  const value = snapshot.parse(parsed);
  validateReferences(value);
  return value;
}
