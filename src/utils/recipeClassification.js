// recipeClassification
//
// Turns raw Spoonacular metadata into the two filter-facing labels
// the rest of the app already knows how to work with: `cuisine` and
// `category` (meal time). Kept separate from services/recipeService.js
// so this classification logic is independently reusable/testable and
// isn't tangled up with API-fetching concerns.

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

// ---- Cuisine ---------------------------------------------------------

// Spoonacular's `cuisines` array is already fairly reliable when
// present. If a recipe has no cuisine info, it's classified as
// "Other" rather than guessed at -- that keeps it out of every
// specific cuisine filter (Italian, Mexican, etc.) without breaking
// anything, since "no filters selected" still shows it.
export function classifyCuisine(cuisines = []) {
  return cuisines.length > 0 ? titleCase(cuisines[0]) : "Other";
}

// ---- Meal time ---------------------------------------------------------

// Structured signal: Spoonacular's dishTypes, when present, are the
// most reliable indicator of meal time.
const DISH_TYPE_MATCHERS = [
  { category: "Breakfast", dishTypes: ["breakfast", "brunch"] },
  { category: "Lunch", dishTypes: ["lunch"] },
  { category: "Dessert", dishTypes: ["dessert"] },
  { category: "Snack", dishTypes: ["snack", "appetizer", "antipasti"] },
  { category: "Dinner", dishTypes: ["dinner", "main course", "main dish"] },
];

// Fallback signal: keyword scan over the recipe title, used when
// dishTypes doesn't give a clear answer (many Spoonacular recipes
// have sparse or missing dishTypes). Ordered by tie-break priority --
// checked top to bottom, so a title matching more than one category
// equally favors the more distinctive category over broad, staple-
// ingredient-driven ones (a title with both "chicken" and "salad"
// reads more like a Lunch salad than a Dinner entree, so Lunch is
// listed above Dinner; Dessert/Breakfast/Snack are checked first
// since their keywords rarely appear outside their own category).
const TITLE_KEYWORD_MATCHERS = [
  {
    category: "Dessert",
    keywords: [
      "cake",
      "cakes",
      "cookie",
      "cookies",
      "brownie",
      "brownies",
      "ice cream",
      "pie",
      "pies",
    ],
  },
  {
    category: "Breakfast",
    keywords: [
      "pancake",
      "pancakes",
      "egg",
      "eggs",
      "waffle",
      "waffles",
      "cereal",
      "oatmeal",
      "toast",
    ],
  },
  {
    category: "Snack",
    keywords: ["fry", "fries", "nacho", "nachos", "popcorn", "dip", "dips"],
  },
  {
    category: "Lunch",
    keywords: [
      "sandwich",
      "sandwiches",
      "wrap",
      "wraps",
      "burger",
      "burgers",
      "salad",
      "salads",
    ],
  },
  {
    category: "Dinner",
    keywords: [
      "pasta",
      "chicken",
      "beef",
      "curry",
      "curries",
      "seafood",
      "rice",
    ],
  },
];

function matchFromDishTypes(dishTypes = []) {
  const lower = dishTypes.map((type) => type.toLowerCase());
  const match = DISH_TYPE_MATCHERS.find(({ dishTypes: candidates }) =>
    candidates.some((candidate) => lower.includes(candidate))
  );
  return match ? match.category : null;
}

// Whole-word/phrase match (case-insensitive) rather than a naive
// substring check -- plain .includes() would wrongly match "cake"
// (a Dessert keyword) inside "pancake" (Breakfast), for example.
function titleContainsKeyword(title, keyword) {
  const pattern = new RegExp(`\\b${keyword.replace(/\s+/g, "\\s+")}\\b`, "i");
  return pattern.test(title);
}

// Scores each category by how many of its keywords appear in the
// title, and returns the highest-scoring one (ties go to whichever
// category is listed first in TITLE_KEYWORD_MATCHERS above). Returns
// null if nothing matches at all.
function matchFromTitle(title = "") {
  let bestCategory = null;
  let bestScore = 0;

  for (const { category, keywords } of TITLE_KEYWORD_MATCHERS) {
    const score = keywords.filter((keyword) =>
      titleContainsKeyword(title, keyword)
    ).length;
    if (score > bestScore) {
      bestCategory = category;
      bestScore = score;
    }
  }

  return bestCategory;
}

// Classifies a recipe's meal time from whatever metadata is
// available: structured dishTypes first, then a title keyword scan
// as a fallback/refinement. Falls back to "Other" -- same pattern as
// classifyCuisine -- so filtering never breaks even when neither
// signal matches.
export function classifyMealTime({ title = "", dishTypes = [] } = {}) {
  return matchFromDishTypes(dishTypes) || matchFromTitle(title) || "Other";
}
