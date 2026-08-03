import { useEffect, useState } from "react";
import { MOCK_PANTRY } from "../data/mockPantry";

// usePantry
//
// The single place recipe-feature code asks "what's in the pantry?".
// Right now it resolves MOCK_PANTRY after a short simulated delay
// (so loading states have something real to show). Every consumer
// (Home, RecipeDetails) reads pantry data through this hook instead
// of importing mock data directly, so integration is a one-file change.
//
// TODO (integration): once the pantry-management branch is merged,
// replace the body of the effect below with a real fetch, e.g.:
//   const { currentUser } = useAuth();
//   getPantryItems(currentUser.uid).then(setItems).catch(setError);
// and delete the setTimeout/MOCK_PANTRY simulation entirely.
export function usePantry() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // TODO (integration): remove this simulated delay -- it only
    // exists so skeleton/loading UI has something to render against
    // while real pantry data isn't wired up yet.
    const timer = setTimeout(() => {
      setItems(MOCK_PANTRY);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return { items, loading, error };
}
