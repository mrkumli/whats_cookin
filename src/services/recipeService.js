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
//   servings: number | null,
//   difficulty: "Easy" | "Medium" | "Hard",
//   category: string,        // time-of-day bucket, e.g. "Breakfast", "Dinner"
//   ingredients: [{ name: string, quantity: string }],
//   instructions: string[],
// }
//
// That's the same shape the old hardcoded data/recipes.js used, so
// utils/matching.js, utils/substitution.js, RecipeCard, and the
// filters all keep working unchanged.

import { classifyCuisine, classifyMealTime } from "../utils/recipeClassification";

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
    cuisine: classifyCuisine(raw.cuisines),
    title: raw.title || "Untitled recipe",
    image: raw.image || PLACEHOLDER_IMAGE,
    cookTime: typeof raw.readyInMinutes === "number" ? raw.readyInMinutes : 30,
    servings: typeof raw.servings === "number" ? raw.servings : null,
    difficulty: estimateDifficulty(raw.readyInMinutes),
    category: classifyMealTime({ title: raw.title, dishTypes: raw.dishTypes }),
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

// ======================================================================
// Caching & request optimization
//
// Goal: minimize Spoonacular API usage during development (the free
// tier has a small daily quota) without changing what any caller of
// this service sees or how it's called -- searchRecipes(),
// getRandomRecipes(), and getRecipeDetails() keep the exact same
// signatures and return shapes as before.
//
// Layering, cheapest/fastest first:
//   1. In-memory cache (Map)   -- instant, cleared on full page reload
//   2. localStorage cache      -- survives refresh, expires after 24h
//   3. In-flight request map   -- de-dupes concurrent identical calls
//   4. Spoonacular API         -- only reached if 1-3 all miss
//
// Every cache entry (memory or localStorage) is stored as
// { data, timestamp, type }, where `type` is one of CACHE_TYPES below
// and is only used for bookkeeping/debugging -- lookups are by key.
// ======================================================================

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours, per the spec
const CACHE_KEY_PREFIX = "whats_cookin:recipe_cache:";

const CACHE_TYPES = {
  HOMEPAGE: "homepage", // random/recommended recipes shown on Home
  SEARCH: "search", // complexSearch results
  DETAILS: "details", // single recipe /information lookups
};

// In-memory (session) cache -- Map<cacheKey, { data, timestamp, type }>
const memoryCache = new Map();

// Tracks requests currently in flight so a second call for the exact
// same thing (e.g. two Home sections both asking for the homepage
// random batch, or the same recipe opened from two places at once)
// reuses the same Promise instead of firing a second request.
const inFlightRequests = new Map();

function isFresh(entry) {
  return Boolean(entry) && Date.now() - entry.timestamp < CACHE_TTL_MS;
}

function readMemoryCache(key) {
  return memoryCache.get(key) || null;
}

function writeMemoryCache(key, data, type) {
  memoryCache.set(key, { data, timestamp: Date.now(), type });
}

function readLocalStorageCache(key) {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!raw) {
      return null;
    }
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.timestamp !== "number") {
      return null;
    }
    return entry;
  } catch {
    // Corrupt entry, private-browsing storage restrictions, quota
    // errors, etc. -- treat it as a cache miss rather than crashing.
    return null;
  }
}

function writeLocalStorageCache(key, data, type) {
  try {
    window.localStorage.setItem(
      CACHE_KEY_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now(), type })
    );
  } catch {
    // Storage full or unavailable -- caching is an optimization, not
    // a requirement, so just skip persisting it for next time.
  }
}

// Reads through both cache layers: memory first, then localStorage
// (promoting a localStorage hit back into memory so this session's
// next lookup is instant). Returns { entry, fresh }; entry is null on
// a total miss across both layers.
function readThroughCache(key) {
  const memEntry = readMemoryCache(key);
  if (memEntry) {
    return { entry: memEntry, fresh: isFresh(memEntry) };
  }

  const storedEntry = readLocalStorageCache(key);
  if (storedEntry) {
    memoryCache.set(key, storedEntry);
    return { entry: storedEntry, fresh: isFresh(storedEntry) };
  }

  return { entry: null, fresh: false };
}

function writeThroughCache(key, data, type) {
  writeMemoryCache(key, data, type);
  writeLocalStorageCache(key, data, type);
}

// The single choke point every cached endpoint goes through:
// memory/localStorage cache -> in-flight de-dupe -> network -> cache
// write. On a network failure, falls back to whatever cached copy
// exists (even if its 24h TTL has technically passed) so a flaky
// connection doesn't wipe out a perfectly good previous result --
// an error only reaches the caller when there's truly no cached data
// at all, per the offline/failure-handling requirement.
async function cachedFetch(key, type, fetcher) {
  const { entry, fresh } = readThroughCache(key);
  if (fresh) {
    return entry.data;
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const requestPromise = fetcher()
    .then((data) => {
      writeThroughCache(key, data, type);
      return data;
    })
    .catch((error) => {
      if (entry) {
        // Stale-but-present beats no data at all.
        return entry.data;
      }
      throw error;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, requestPromise);
  return requestPromise;
}

// ---- Search debounce ---------------------------------------------------
//
// Debounced separately from cachedFetch's de-duplication: de-dupe
// handles two callers asking for the SAME query at the same time,
// while this handles a single caller asking for a RAPIDLY CHANGING
// query (a user typing). Every call while a debounce window is open
// resets the timer and updates which query will actually be fetched;
// all callers within that window share one Promise that resolves
// with the trailing (most recent) query's results -- exactly what a
// search-as-you-type box wants, and it means only one request goes
// out per pause in typing, not one per keystroke.
const SEARCH_DEBOUNCE_MS = 450; // within the requested 400-500ms range

let searchDebounceTimer = null;
let searchDebouncePromise = null;
let searchDebounceResolvers = null;
let latestSearchRequest = null;

function debouncedSearchFetch(trimmedQuery, number, cacheKey) {
  latestSearchRequest = { trimmedQuery, number, cacheKey };

  if (!searchDebouncePromise) {
    searchDebouncePromise = new Promise((resolve, reject) => {
      searchDebounceResolvers = { resolve, reject };
    });
  }

  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  searchDebounceTimer = setTimeout(() => {
    const { trimmedQuery: query, number: resultCount, cacheKey: key } =
      latestSearchRequest;
    const resolvers = searchDebounceResolvers;

    // Reset shared state before fetching so the next debounce window
    // (the next burst of typing) starts clean.
    searchDebounceTimer = null;
    searchDebouncePromise = null;
    searchDebounceResolvers = null;
    latestSearchRequest = null;

    performSearchFetch(query, resultCount, key)
      .then(resolvers.resolve)
      .catch(resolvers.reject);
  }, SEARCH_DEBOUNCE_MS);

  return searchDebouncePromise;
}

function performSearchFetch(trimmedQuery, number, cacheKey) {
  return cachedFetch(cacheKey, CACHE_TYPES.SEARCH, async () => {
    const data = await request("/complexSearch", {
      query: trimmedQuery,
      number,
      addRecipeInformation: true,
      fillIngredients: true,
    });
    return (data.results || []).map(normalizeRecipe);
  });
}

// ---- Public API ------------------------------------------------------

// Searches Spoonacular's recipe database by keyword (title/ingredients).
// `addRecipeInformation` pulls back full details in the same request
// so search results don't need a second round-trip per recipe.
//
// Optimizations applied: queries under 2 characters are ignored
// entirely (no request, no cache entry); a fresh cached result for
// the exact same query skips the debounce and network layers
// completely; otherwise the request is debounced (~450ms) and cached
// for 24 hours.
export async function searchRecipes(query, { number = 20 } = {}) {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const cacheKey = `search:${trimmed.toLowerCase()}:${number}`;

  // Already have a fresh answer -- no need to wait out the debounce.
  const { entry, fresh } = readThroughCache(cacheKey);
  if (fresh) {
    return entry.data;
  }

  return debouncedSearchFetch(trimmed, number, cacheKey);
}

// Fetches a batch of random recipes -- used for the default Home
// page listing. Cached for 24 hours under a fixed key (per `number`),
// so the homepage shows the same recommendations all day rather than
// re-rolling on every refresh, and only calls the API again once the
// cache expires.
export async function getRandomRecipes({ number = 20 } = {}) {
  const cacheKey = `homepage:random:${number}`;
  return cachedFetch(cacheKey, CACHE_TYPES.HOMEPAGE, async () => {
    const data = await request("/random", { number });
    return (data.recipes || []).map(normalizeRecipe);
  });
}

// Fetches full details for one recipe by id (accepts either a raw
// Spoonacular id or one of this app's "sp-<id>" ids). Cached for 24
// hours and shared across the whole session, so re-opening the same
// recipe (via back/forward navigation, a second click from a
// different list, etc.) never re-fetches it within that window.
export async function getRecipeDetails(id) {
  const spoonacularId = toSpoonacularId(id);
  const cacheKey = `details:${spoonacularId}`;
  return cachedFetch(cacheKey, CACHE_TYPES.DETAILS, async () => {
    const raw = await request(`/${spoonacularId}/information`);
    return normalizeRecipe(raw);
  });
}

// Alias: Spoonacular's "recipe information by id" endpoint is the
// same /{id}/information call used for full recipe details, so this
// is intentionally the same function (and shares its cache) under
// the name requested.
export const getRecipeInformationById = getRecipeDetails;

// ---- Developer utility -------------------------------------------------

// Clears every layer of the cache: in-memory, localStorage (homepage,
// search, and details entries alike -- they all share
// CACHE_KEY_PREFIX), and any pending debounced search. Development
// use only (e.g. from the browser console while testing against a
// limited API quota) -- not wired into any UI.
export function clearRecipeCache() {
  memoryCache.clear();
  inFlightRequests.clear();

  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  searchDebounceTimer = null;
  searchDebouncePromise = null;
  searchDebounceResolvers = null;
  latestSearchRequest = null;

  try {
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // localStorage unavailable -- nothing there to clear.
  }
}

// Dev-console convenience only -- never relied on by app code, and
// only attached outside production builds.
if (import.meta.env.DEV && typeof window !== "undefined") {
  window.clearRecipeCache = clearRecipeCache;
}
