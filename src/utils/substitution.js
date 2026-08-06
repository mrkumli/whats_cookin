import { substitutionDatabase } from "../data/substitutions";
import { isIngredientInPantry } from "./matching";
import { normalizeText } from "./text";

// Substitution utils
//
// Pure functions, same pattern as matching.js: no mock data baked
// in, callers supply the current pantry (via hooks/usePantry, backed
// by the authenticated user's real Firestore pantry).

// Case-insensitive lookup into the substitution database. This part
// is pantry-agnostic -- it just answers "what COULD substitute for
// this ingredient in general," independent of any user's pantry.
function getSubstituteCandidates(ingredientName) {
  const target = normalizeText(ingredientName);
  const matchingKey = Object.keys(substitutionDatabase).find(
    (key) => normalizeText(key) === target
  );
  return matchingKey ? substitutionDatabase[matchingKey] : [];
}

// ---- Recipe <-> pantry integration point ---------------------------
// This is where a substitution candidate becomes an actual
// suggestion: candidates come from the substitution database above
// (recipe-side, no pantry involved), but isIngredientInPantry checks
// each one against the user's real pantry (pantryItems, from
// usePantry -> PantryProvider -> Firestore). Only candidates the
// user actually has on hand are returned -- a substitute that exists
// "in general" but not in this user's pantry is filtered out here.
export function getAvailableSubstitutes(ingredientName, pantryItems) {
  return getSubstituteCandidates(ingredientName).filter((candidate) =>
    isIngredientInPantry(candidate, pantryItems)
  );
}
