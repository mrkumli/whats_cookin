import { normalizeText } from "./text";

// Recipe <-> pantry matching utils
//
// This is the core of the recipe <-> pantry integration: every
// comparison between "what a recipe needs" and "what the user has"
// happens here. Pure functions: plain data in, plain data out. No
// mock data, no UI, no Firebase -- callers (pages, hooks) are
// responsible for supplying pantry data, which now comes from the
// authenticated user's real Firestore pantry via hooks/usePantry
// (see services/pantryProvider.js for how that's wired up).
//
// `pantryItems` looks like: [{ name: string, ... }] -- real Firestore
// pantry documents are { id, name, createdAt }, with no `quantity`
// field, but that's fine: everything below only ever reads `.name`,
// so no shape translation was needed when the mock pantry was
// replaced with real data.

// True if the pantry contains an ingredient with this name.
// Only checks presence, not quantity -- quantity-aware matching can
// be layered on later without changing this function's signature.
export function isIngredientInPantry(ingredientName, pantryItems) {
  const target = normalizeText(ingredientName);
  return pantryItems.some((item) => normalizeText(item.name) === target);
}

// Returns the list of ingredient names (strings) from a recipe that
// are NOT currently in the pantry.
export function getMissingIngredients(recipe, pantryItems) {
  return recipe.ingredients
    .filter((ingredient) => !isIngredientInPantry(ingredient.name, pantryItems))
    .map((ingredient) => ingredient.name);
}

// How many ingredients a recipe is missing from the given pantry.
export function countMissingIngredients(recipe, pantryItems) {
  return getMissingIngredients(recipe, pantryItems).length;
}

// True if every ingredient the recipe needs is already in the pantry.
export function isRecipeCookable(recipe, pantryItems) {
  return countMissingIngredients(recipe, pantryItems) === 0;
}
