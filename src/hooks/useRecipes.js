import { useEffect, useState } from "react";
import { getRandomRecipes, searchRecipes } from "../services/recipeService";

const SEARCH_DEBOUNCE_MS = 400;

// usePantry's counterpart for recipes: the single place Home reads
// recipe data from. When `searchTerm` is empty it loads a batch of
// random recipes; when there's a search term, it calls the recipe
// service's search after a short debounce so a fast typist doesn't
// fire a request per keystroke.
//
// NOTE: cuisine/time-of-day filtering still happens client-side (in
// Home.jsx) over whatever this hook returns, same as it did with the
// old hardcoded data. Spoonacular does support server-side
// cuisine/type params too -- combining those with this app's
// multi-select filters is a reasonable future improvement, not
// implemented here to keep this change minimal.
export function useRecipes(searchTerm) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const trimmed = searchTerm.trim();

    setLoading(true);
    setError(null);

    const timer = setTimeout(
      () => {
        const fetchRecipes = trimmed
          ? searchRecipes(trimmed)
          : getRandomRecipes();

        fetchRecipes
          .then((results) => {
            if (!cancelled) {
              setRecipes(results);
            }
          })
          .catch((fetchError) => {
            if (!cancelled) {
              setError(
                fetchError.message ||
                  "Something went wrong loading recipes. Please try again."
              );
              setRecipes([]);
            }
          })
          .finally(() => {
            if (!cancelled) {
              setLoading(false);
            }
          });
      },
      trimmed ? SEARCH_DEBOUNCE_MS : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, retryToken]);

  function retry() {
    setRetryToken((token) => token + 1);
  }

  return { recipes, loading, error, retry };
}
