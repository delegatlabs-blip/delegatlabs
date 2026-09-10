/** Turn stored enum/slug values into readable UI labels. */
export function formatEnumLabel(value: string | null | undefined): string {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw === "Not specified" || raw === "None provided") return raw;
  if (!/[_-]/.test(raw) && /[A-Z]/.test(raw) && /[a-z]/.test(raw)) return raw;

  const spaced = raw
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return spaced
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bAnd\b/g, "&")
    .replace(/\bLong Form\b/g, "Long-form")
    .replace(/\bOpen Source\b/g, "Open-source");
}

export function formatEnumList(values: string[] | string | null | undefined): string {
  if (values == null) return "";
  const list = Array.isArray(values) ? values : [values];
  return list
    .map((v) => formatEnumLabel(v))
    .filter(Boolean)
    .join(", ");
}
