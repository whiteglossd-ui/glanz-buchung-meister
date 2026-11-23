/**
 * Public catalog URL contract. Keep byte-identical in the Panel and Website.
 * Validates before URL parsing can hide traversal or browser URL repairs.
 */
const BASE = "https://catalog-reference.invalid";
const MAX_LENGTH = 500;

/** @param {string} value */
function hasUnsafeCharacters(value) {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 || "\\<>".includes(character);
  });
}

/** @param {string} value @param {boolean} path */
function checkEscapes(value, path) {
  let current = value;
  // Each successful decoding shortens the string, so even nested escapes are
  // bounded by the input length. A literal encoded percent remains allowed.
  for (;;) {
    if (hasUnsafeCharacters(current)) throw Error("catalog_reference_invalid");
    if (
      path &&
      (/%(?:2f|5c)/i.test(current) ||
        /[?#]/.test(current) ||
        current.split("/").some((part) => part === "." || part === ".."))
    )
      throw Error("catalog_reference_invalid");
    const decoded = current.replace(/%([a-f0-9]{2})/gi, (_match, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
    if (decoded === current) return;
    current = decoded;
  }
}

/**
 * Normalize safe root-relative or HTTPS references; empty optional values stay
 * empty. Path spaces become %20, while escaped query values retain their bytes.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeCatalogReference(value) {
  if (typeof value !== "string" || value.length > MAX_LENGTH || hasUnsafeCharacters(value))
    throw Error("catalog_reference_invalid");
  const input = value.trim();
  if (!input) return "";
  if (/%(?![a-f0-9]{2})/i.test(input)) throw Error("catalog_reference_invalid");
  const relative = input.startsWith("/");
  let path;
  if (relative) {
    if (input.startsWith("//")) throw Error("catalog_reference_invalid");
    path = input.split(/[?#]/, 1)[0];
  } else {
    const absolute = input.match(/^https:\/\/([^/?#]+)(\/[^?#]*)?/i);
    if (!absolute || /[\s@]/.test(absolute[1])) throw Error("catalog_reference_invalid");
    path = absolute[2] || "/";
  }
  checkEscapes(input, false);
  checkEscapes(path, true);
  let parsed;
  try {
    parsed = new URL(input, BASE);
  } catch {
    throw Error("catalog_reference_invalid");
  }
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    (relative && parsed.origin !== BASE)
  )
    throw Error("catalog_reference_invalid");
  const normalized = relative ? parsed.pathname + parsed.search + parsed.hash : parsed.href;
  if (normalized.length > MAX_LENGTH) throw Error("catalog_reference_invalid");
  return normalized;
}

/** @param {unknown} value */
export function isCatalogReference(value) {
  try {
    normalizeCatalogReference(value);
    return true;
  } catch {
    return false;
  }
}
