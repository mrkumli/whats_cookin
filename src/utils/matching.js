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
//
// ---- Why this isn't exact-string matching --------------------------
// A pantry item is typically named simply ("Chicken Breast", "Bell
// Pepper"), while Spoonacular's ingredient names are more specific/
// descriptive ("boneless skinless chicken breasts", "red bell
// peppers"). Comparing those with strict equality means almost no
// real recipe would ever match a real pantry, which is exactly what
// made Recommended Recipes show empty. Matching below instead
// compares the SIGNIFICANT WORDS of each name -- lowercased,
// descriptors/preparation words and plurals normalized away -- and
// considers it a match if one name's word set is fully contained in
// the other's, in either direction.

// Descriptive/preparation words that don't change WHICH ingredient
// something is, just its form, cut, or presentation -- stripped
// before comparing so "boneless skinless chicken breast" still
// matches a pantry item just called "Chicken Breast". Colors are
// included deliberately (e.g. "bell pepper" should match "red bell
// peppers") -- the known trade-off is that a generic pantry item
// could over-match a color-specific variant (e.g. "Onion" vs "green
// onion"); this favors recall over precision, appropriate for a
// recommendation feature that should err toward showing recipes.
const DESCRIPTOR_WORDS = new Set([
  "fresh", "frozen", "canned", "dried", "raw", "cooked", "ripe",
  "chopped", "diced", "sliced", "minced", "grated", "shredded",
  "crushed", "ground", "whole", "cut", "peeled", "seeded", "halved",
  "boneless", "skinless", "bone-in", "skin-on",
  "large", "small", "medium", "extra", "jumbo",
  "lean", "organic", "unsalted", "salted",
  "low-fat", "nonfat", "skim", "reduced-fat", "virgin",
  "red", "green", "yellow", "orange", "white", "purple",
]);

// Small, deliberately conservative English singularizer -- just
// enough for common grocery words ("tomatoes" -> "tomato", "peppers"
// -> "pepper", "breasts" -> "breast"). Not a full lemmatizer; a word
// that doesn't match a known plural pattern is left unchanged rather
// than risk mangling it.
function singularize(word) {
  if (word.endsWith("ies") && word.length > 4) {
    return `${word.slice(0, -3)}y`; // berries -> berry
  }
  if (/(oes|shes|ches|xes|sses)$/.test(word)) {
    return word.slice(0, -2); // tomatoes -> tomato, dishes -> dish
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return word.slice(0, -1); // peppers -> pepper, breasts -> breast
  }
  return word;
}

// Breaks an ingredient name into its meaningful, comparable words.
function significantWords(name) {
  return normalizeText(name)
    .split(/[\s,()-]+/)
    .filter(Boolean)
    .filter((word) => !DESCRIPTOR_WORDS.has(word))
    .filter((word) => !/^\d+%?$/.test(word)) // drop bare numbers/percentages, e.g. "2%"
    .map(singularize);
}

// True if two ingredient names refer to the same underlying
// ingredient. Matches if EITHER name's significant words are a full
// subset of the other's -- covers a generic pantry entry matching a
// more specific recipe ingredient ("Bell Pepper" <-> "red bell
// peppers") and the reverse (a specific pantry entry satisfying a
// generic recipe ingredient, e.g. pantry "Chicken Breast" for a
// recipe that just says "chicken").
function ingredientNamesMatch(nameA, nameB) {
  const wordsA = significantWords(nameA);
  const wordsB = significantWords(nameB);
  if (wordsA.length === 0 || wordsB.length === 0) {
    return false;
  }
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  const aSubsetOfB = wordsA.every((word) => setB.has(word));
  const bSubsetOfA = wordsB.every((word) => setA.has(word));
  return aSubsetOfB || bSubsetOfA;
}

// True if the pantry contains an ingredient matching this name.
// Fuzzy, not exact -- see ingredientNamesMatch above. Only checks
// presence, not quantity -- quantity-aware matching can be layered on
// later without changing this function's signature.
export function isIngredientInPantry(ingredientName, pantryItems) {
  return pantryItems.some((item) => ingredientNamesMatch(ingredientName, item.name));
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
