import { normalizeText } from "./text";

// Recipe <-> pantry matching utils
//
// Pure functions: plain data in, plain data out. No mock data, no
// UI, no Firebase -- callers (pages, hooks) are responsible for
// supplying real pantry data, currently sourced via hooks/usePantry.
//
// `pantryItems` looks like: [{ name: string, quantity: string }]
// (same shape as a recipe's `ingredients`, minus anything recipe-specific).

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
