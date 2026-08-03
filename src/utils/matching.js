// Recipe <-> pantry matching utils
//
// These functions are intentionally independent of any UI, service,
// or Firebase code -- they just take plain data in and return plain
// data out, so they're easy to test and easy to reuse once the real
// pantry (from Firestore) is wired up.
//
// `pantryItems` is expected to look like: [{ name: string, quantity: string }]
// (same shape as a recipe's `ingredients`, minus anything recipe-specific).

// Temporary mock pantry, used only as a default so these utilities
// can be developed/tested before the real pantry feature exists.
// The pantry-feature branch will supply real pantry data instead.
export const mockPantry = [
  { name: "Eggs", quantity: "6 large" },
  { name: "Butter", quantity: "1 stick" },
  { name: "Milk", quantity: "1 L" },
  { name: "Salt", quantity: "1 box" },
  { name: "Garlic", quantity: "1 bulb" },
  { name: "Olive Oil", quantity: "500 ml" },
  { name: "Flour", quantity: "2 cups" },
  { name: "Greek Yogurt", quantity: "1 cup" },
  { name: "Onion", quantity: "3" },
  { name: "Tomato", quantity: "4" },
  { name: "Cheddar Cheese", quantity: "200 g" },
  { name: "Bread", quantity: "1 loaf" },
];

// Normalizes an ingredient name so comparisons aren't broken by
// casing or stray whitespace (e.g. "garlic " vs "Garlic").
function normalizeName(name) {
  return name.trim().toLowerCase();
}

// True if the pantry contains an ingredient with this name.
// Only checks presence, not quantity -- quantity-aware matching can
// be layered on later without changing this function's signature.
function pantryHasIngredient(ingredientName, pantryItems) {
  const target = normalizeName(ingredientName);
  return pantryItems.some((item) => normalizeName(item.name) === target);
}

// Exported single-ingredient version of the check above, for UI that
// needs to highlight individual ingredients (e.g. Recipe Details)
// rather than whole recipes.
export function isIngredientInPantry(ingredientName, pantryItems = mockPantry) {
  return pantryHasIngredient(ingredientName, pantryItems);
}

// Returns the list of ingredient names (strings) from a recipe that
// are NOT currently in the pantry.
export function getMissingIngredients(recipe, pantryItems = mockPantry) {
  return recipe.ingredients
    .filter((ingredient) => !pantryHasIngredient(ingredient.name, pantryItems))
    .map((ingredient) => ingredient.name);
}

// How many ingredients a recipe is missing from the given pantry.
export function countMissingIngredients(recipe, pantryItems = mockPantry) {
  return getMissingIngredients(recipe, pantryItems).length;
}

// True if every ingredient the recipe needs is already in the pantry.
export function isRecipeCookable(recipe, pantryItems = mockPantry) {
  return countMissingIngredients(recipe, pantryItems) === 0;
}
