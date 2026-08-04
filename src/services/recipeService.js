// RecipeService
//
// All Spoonacular API access lives here -- nothing outside this file
// should know the API exists, what its response shapes look like, or
// where the key comes from. Every exported function returns data
// already normalized into the app's existing recipe shape:
//
// {
//   id: string,
//   cuisine: string,
//   title: string,
//   image: string,
//   cookTime: number,        // minutes
//   difficulty: "Easy" | "Medium" | "Hard",
//   category: string,        // time-of-day bucket, e.g. "Breakfast", "Dinner"
//   ingredients: [{ name: string, quantity: string }],
//   instructions: string[],
// }
//
// That's the same shape the old hardcoded data/recipes.js used, so
// utils/matching.js, utils/substitution.js, RecipeCard, and the
// filters all keep working unchanged.

const BASE_URL = "https://api.spoonacular.com/recipes";
const PLACEHOLDER_IMAGE = "/placeholders/recipe.svg";

function getApiKey() {
  const apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Spoonacular API key is not configured. Set VITE_SPOONACULAR_API_KEY in your .env file."
    );
  }
  return apiKey;
}

// Low-level request helper: builds the URL, attaches the API key,
// and turns network/HTTP failures into friendly, catchable errors
// instead of letting raw fetch/HTTP errors (or a crash) reach the UI.
async function request(path, params = {}) {
  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("apiKey", apiKey);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  let response;
  try {
    response = await fetch(url.toString());
  } catch {
    throw new Error(
      "Couldn't reach the recipe service. Check your connection and try again."
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("That recipe couldn't be found.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "The recipe service rejected the request. Check that the API key is valid."
      );
    }
    if (response.status === 402 || response.status === 429) {
      throw new Error(
        "The recipe service's daily quota has been reached. Try again later."
      );
    }
    throw new Error(
      "The recipe service returned an unexpected error. Please try again."
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error("The recipe service returned an unreadable response.");
  }
}

// ---- Normalization -------------------------------------------------

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

// Spoonacular doesn't provide a difficulty rating, so this is a
// simple, documented heuristic based on cook time -- not a stand-in
// for real recipe difficulty data.
function estimateDifficulty(readyInMinutes) {
  if (typeof readyInMinutes !== "number") {
    return "Medium";
  }
  if (readyInMinutes <= 20) {
    return "Easy";
  }
  if (readyInMinutes <= 45) {
    return "Medium";
  }
  return "Hard";
}

const CATEGORY_MATCHERS = [
  { category: "Breakfast", dishTypes: ["breakfast", "brunch"] },
  { category: "Lunch", dishTypes: ["lunch"] },
  { category: "Dessert", dishTypes: ["dessert"] },
  { category: "Snack", dishTypes: ["snack", "appetizer", "antipasti"] },
  { category: "Dinner", dishTypes: ["dinner", "main course", "main dish"] },
];

// Maps Spoonacular's `dishTypes` list onto the app's single
// time-of-day category. Falls back to "Dinner" since most Spoonacular
// recipes are main dishes without an explicit meal-time tag.
function mapCategory(dishTypes = []) {
  const lower = dishTypes.map((type) => type.toLowerCase());
  const match = CATEGORY_MATCHERS.find(({ dishTypes: candidates }) =>
    candidates.some((candidate) => lower.includes(candidate))
  );
  return match ? match.category : "Dinner";
}

function mapCuisine(cuisines = []) {
  return cuisines.length > 0 ? titleCase(cuisines[0]) : "Other";
}

function normalizeIngredients(extendedIngredients = []) {
  return extendedIngredients.map((ingredient) => ({
    name: ingredient.nameClean || ingredient.name || "Ingredient",
    quantity:
      ingredient.original ||
      [ingredient.amount, ingredient.unit].filter(Boolean).join(" ") ||
      "",
  }));
}

function extractInstructions(raw) {
  const steps = raw.analyzedInstructions?.[0]?.steps;
  if (steps && steps.length > 0) {
    return steps.map((step) => step.step);
  }
  if (raw.instructions) {
    const text = raw.instructions.replace(/<[^>]+>/g, " ").trim();
    return text ? [text] : [];
  }
  return [];
}

// Converts one raw Spoonacular recipe (from complexSearch with
// addRecipeInformation=true, /random, or /{id}/information -- all
// three return the same shape) into the app's recipe shape.
export function normalizeRecipe(raw) {
  return {
    id: `sp-${raw.id}`,
    cuisine: mapCuisine(raw.cuisines),
    title: raw.title || "Untitled recipe",
    image: raw.image || PLACEHOLDER_IMAGE,
    cookTime: typeof raw.readyInMinutes === "number" ? raw.readyInMinutes : 30,
    difficulty: estimateDifficulty(raw.readyInMinutes),
    category: mapCategory(raw.dishTypes),
    ingredients: normalizeIngredients(raw.extendedIngredients),
    instructions: extractInstructions(raw),
  };
}

// Recipe ids are stored as "sp-<spoonacularId>" so they're clearly
// distinguishable if a local/other recipe source is ever added later.
function toSpoonacularId(id) {
  const match = String(id).match(/(\d+)$/);
  if (!match) {
    throw new Error("Invalid recipe id.");
  }
  return match[1];
}

// ---- Public API ------------------------------------------------------

// Searches Spoonacular's recipe database by keyword (title/ingredients).
// `addRecipeInformation` pulls back full details in the same request
// so search results don't need a second round-trip per recipe.
export async function searchRecipes(query, { number = 20 } = {}) {
  const data = await request("/complexSearch", {
    query,
    number,
    addRecipeInformation: true,
    fillIngredients: true,
  });
  return (data.results || []).map(normalizeRecipe);
}

// Fetches a batch of random recipes -- used for the default Home
// page listing when there's no active search term.
export async function getRandomRecipes({ number = 20 } = {}) {
  const data = await request("/random", { number });
  return (data.recipes || []).map(normalizeRecipe);
}

// Fetches full details for one recipe by id (accepts either a raw
// Spoonacular id or one of this app's "sp-<id>" ids).
export async function getRecipeDetails(id) {
  const spoonacularId = toSpoonacularId(id);
  const raw = await request(`/${spoonacularId}/information`);
  return normalizeRecipe(raw);
}

// Alias: Spoonacular's "recipe information by id" endpoint is the
// same /{id}/information call used for full recipe details, so this
// is intentionally the same function under the name requested.
export const getRecipeInformationById = getRecipeDetails;
