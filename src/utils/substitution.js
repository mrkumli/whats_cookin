import { substitutionDatabase } from "../data/substitutions";
import { isIngredientInPantry, mockPantry } from "./matching";

// Substitution utils
//
// Independent of any UI -- looks up possible substitutes for an
// ingredient and narrows them down to only the ones the pantry
// actually has right now.

function normalizeName(name) {
  return name.trim().toLowerCase();
}

// Case-insensitive lookup into the substitution database.
function getSubstituteCandidates(ingredientName) {
  const target = normalizeName(ingredientName);
  const matchingKey = Object.keys(substitutionDatabase).find(
    (key) => normalizeName(key) === target
  );
  return matchingKey ? substitutionDatabase[matchingKey] : [];
}

// Returns the substitutes for `ingredientName` that are currently
// available in the given pantry (empty array if none, or if the
// ingredient has no known substitutes at all).
export function getAvailableSubstitutes(ingredientName, pantryItems = mockPantry) {
  return getSubstituteCandidates(ingredientName).filter((candidate) =>
    isIngredientInPantry(candidate, pantryItems)
  );
}
