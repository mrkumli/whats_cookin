import { substitutionDatabase } from "../data/substitutions";
import { isIngredientInPantry } from "./matching";
import { normalizeText } from "./text";

// Substitution utils
//
// Pure functions, same pattern as matching.js: no mock data baked
// in, callers supply the current pantry (via hooks/usePantry).

// Case-insensitive lookup into the substitution database.
function getSubstituteCandidates(ingredientName) {
  const target = normalizeText(ingredientName);
  const matchingKey = Object.keys(substitutionDatabase).find(
    (key) => normalizeText(key) === target
  );
  return matchingKey ? substitutionDatabase[matchingKey] : [];
}

// Returns the substitutes for `ingredientName` that are currently
// available in the given pantry (empty array if none, or if the
// ingredient has no known substitutes at all).
export function getAvailableSubstitutes(ingredientName, pantryItems) {
  return getSubstituteCandidates(ingredientName).filter((candidate) =>
    isIngredientInPantry(candidate, pantryItems)
  );
}
