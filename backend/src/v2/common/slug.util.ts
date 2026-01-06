// src/v2/common/slug.util.ts
export function toSlug(input: string, fallback = 'item'): string {
  if (!input) return fallback;
  // remove acentos e normaliza: ex. "Canal Á/B" -> "canal-a-b"
  let s = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || fallback;
}
