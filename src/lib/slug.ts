/**
 * Slug utilities for public order form URLs.
 *
 * Slugs are kebab-case ASCII (a-z, 0-9, hyphens). They appear in URLs like
 * /order/{slug} so they must be URL-safe and human-readable.
 *
 * Constraints (also enforced by DB CHECK constraint):
 *   - lowercase letters, digits, single hyphens between segments
 *   - 3-60 characters
 *   - cannot start or end with a hyphen
 *   - no consecutive hyphens
 */

const MIN_LEN = 3;
const MAX_LEN = 60;
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Convert any string into a candidate slug. Strips diacritics (so "Magnólia"
 * becomes "magnolia"), lowercases, replaces non-alphanumeric runs with
 * hyphens, trims leading/trailing hyphens, and clips to the max length.
 *
 * Sinhala characters get stripped — a business with a pure Sinhala name will
 * end up with an empty slug and need to set one manually.
 */
export function slugify(input: string): string {
  if (!input) return "";
  return input
    .normalize("NFKD")
    // strip combining marks (accents)
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // anything that isn't a-z0-9 becomes a hyphen
    .replace(/[^a-z0-9]+/g, "-")
    // collapse multiple hyphens
    .replace(/-+/g, "-")
    // trim leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LEN);
}

/**
 * True if the given string is a valid slug (matches DB constraints).
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  if (slug.length < MIN_LEN || slug.length > MAX_LEN) return false;
  return SLUG_REGEX.test(slug);
}

/**
 * Human-readable validation error or null if valid.
 */
export function getSlugError(slug: string): string | null {
  if (!slug) return "Slug is required";
  if (slug.length < MIN_LEN) return `Slug must be at least ${MIN_LEN} characters`;
  if (slug.length > MAX_LEN) return `Slug must be at most ${MAX_LEN} characters`;
  if (slug.startsWith("-") || slug.endsWith("-")) return "Slug cannot start or end with a hyphen";
  if (slug.includes("--")) return "Slug cannot contain consecutive hyphens";
  if (!/^[a-z0-9-]+$/.test(slug)) return "Slug can only contain lowercase letters, digits, and hyphens";
  if (!SLUG_REGEX.test(slug)) return "Invalid slug format";
  return null;
}