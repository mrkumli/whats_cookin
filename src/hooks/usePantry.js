import { useEffect, useState } from "react";
import { getPantryData } from "../services/pantryProvider";

// usePantry
//
// The React-facing wrapper every recipe-feature component uses to
// read pantry data (Home, RecipeDetails). It doesn't know or care
// whether that data is the temporary mock pantry or real Firestore
// data -- that's entirely PantryProvider's concern. This hook should
// not need to change when the pantry-management branch is merged;
// see services/pantryProvider.js for the integration TODOs.
export function usePantry() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getPantryData()
      .then((data) => {
        if (!cancelled) {
          setItems(data);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError.message || "Couldn't load pantry data.");
          setItems([]);
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
  }, []);

  return { items, loading, error };
}
