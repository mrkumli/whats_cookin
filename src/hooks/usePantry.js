import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribePantryData } from "../services/pantryProvider";

// usePantry
//
// The React-facing wrapper every recipe-feature component uses to
// read pantry data (Home, RecipeDetails). Backed by a LIVE Firestore
// subscription for the signed-in user (via PantryProvider ->
// pantryService.subscribeToPantry), not a one-time fetch -- so
// pantry edits made on the Pantry page (add/remove ingredients)
// update `items` here automatically, with no page reload and no
// manual refetch. Re-subscribes whenever the signed-in user changes
// (login/logout), and reports an empty pantry while logged out.
export function usePantry() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let unsubscribe = () => {};
    try {
      unsubscribe = subscribePantryData(currentUser?.uid, (data) => {
        setItems(data);
        setLoading(false);
      });
    } catch (subscribeError) {
      setError(subscribeError.message || "Couldn't load pantry data.");
      setItems([]);
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  return { items, loading, error };
}
