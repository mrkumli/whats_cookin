import { useEffect, useState } from "react";
import { getExpiryStatus } from "../utils/expiryStatus";
import { getRecipesByIngredients } from "../services/recipeService";

// useUseSoonRecipes
//
// Recipe <-> pantry integration point: figures out which pantry
// ingredients are close to expiring (status === "expiring" from
// utils/expiryStatus -- the same calculation that drives the orange
// dot on the Pantry page), then asks RecipeService for recipes that
// use them. Deliberately excludes "expired" items -- recommending a
// recipe built around an ingredient that's already gone bad isn't a
// useful suggestion.
//
// Only re-fetches when the ingredient list keyword changes.
export function useUseSoonRecipes(pantryItems) {
  const expiringNames = pantryItems
    .filter((item) => getExpiryStatus(item.expiryDate) === "expiring")
    .map((item) => item.name);

  // A stable, order-independent key so the effect below only re-runs
  // when the SET of expiring ingredients actually changes -- not on
  // every pantry snapshot. Firestore's live listener can push a new
  // `pantryItems` array reference even when nothing relevant to
  // "Use Soon" changed (e.g. editing an unrelated item's quantity),
  // and we don't want that to trigger a fresh Spoonacular request.
  const expiringKey = [...new Set(expiringNames.map((name) => name.toLowerCase()))]
    .sort()
    .join(",");

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!expiringKey) {
      // Nothing expiring -- nothing to fetch, and nothing to show.
      setRecipes([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getRecipesByIngredients(expiringKey.split(","))
      .then((results) => {
        if (!cancelled) {
          setRecipes(results);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError.message || "Couldn't load Use Soon recipes.");
          setRecipes([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [expiringKey, retryToken]);

  function retry() {
    setRetryToken((token) => token + 1);
  }

  return {
    recipes,
    loading,
    error,
    retry,
    expiringIngredientNames: expiringKey ? expiringKey.split(",") : [],
  };
}
