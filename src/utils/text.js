// Small shared text helper. Used anywhere ingredient names get
// compared, so casing/whitespace differences ("garlic " vs "Garlic")
// don't cause false mismatches.
export function normalizeText(value) {
  return value.trim().toLowerCase();
}
