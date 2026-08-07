import { INGREDIENT_DICTIONARY } from "../data/ingredientDictionary";

// Suggests ingredients from the local dictionary that match `query`.
// Matching is case-insensitive and tolerates partial words: the
// query only needs to be a prefix of ANY word in the ingredient name
// (not just the first word), so "chi" matches "Chicken Breast" and
// "Chickpeas", and "breast" would also match "Chicken Breast".
//
// This never blocks a user from saving something not in the list --
// see components/IngredientAutocomplete.jsx, which just lets
// whatever the user typed through as the value regardless of
// whether they picked a suggestion.
export function getIngredientSuggestions(
  query,
  { dictionary = INGREDIENT_DICTIONARY, limit = 8 } = {}
) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  const matches = dictionary.filter((name) =>
    name
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.startsWith(trimmed))
  );

  // Rank a match higher if the query matches its FIRST word (e.g.
  // "chi" -> "Chickpeas") over one where only a later word matches
  // (e.g. "chi" -> "Ground Chicken") -- the former is what a user
  // typing an ingredient name is almost always looking for.
  matches.sort((a, b) => {
    const aFirstWordMatch = a.toLowerCase().startsWith(trimmed);
    const bFirstWordMatch = b.toLowerCase().startsWith(trimmed);
    if (aFirstWordMatch !== bFirstWordMatch) {
      return aFirstWordMatch ? -1 : 1;
    }
    return a.localeCompare(b);
  });

  return matches.slice(0, limit);
}
