import { subscribeToPantry } from "./pantryService";

// PantryProvider
//
// The single abstraction the recipe feature goes through to read
// pantry data. Nothing else -- not RecipeService, not
// utils/matching.js, not any page -- should read pantry data from
// anywhere but here (directly, or via hooks/usePantry.js, which just
// wraps this in React state).
//
// ---- Recipe <-> pantry integration point -------------------------
// This is where the recipe feature and the pantry-management feature
// meet: subscribeToPantry() (owned by the pantry/Firestore team, in
// pantryService.js) streams the authenticated user's real pantry
// documents -- shape { id, name, createdAt } -- and we hand that
// straight through to callers with NO transformation. That's
// intentional, not an oversight: utils/matching.js and
// utils/substitution.js only ever read `.name` off each pantry item
// (see isIngredientInPantry), so the extra `id`/`createdAt` fields
// are simply ignored downstream. Nothing needs to reshape pantry
// documents into a recipe-feature-specific format.
//
// Because subscribeToPantry is a LIVE Firestore listener (onSnapshot)
// rather than a one-time fetch, any pantry change made on the Pantry
// page -- add, edit, delete -- pushes a fresh items array to every
// subscriber automatically. hooks/usePantry.js's state updates in
// response, which in turn recomputes Home's "Recipes You Can Make" /
// "Missing Ingredients" split and RecipeDetails' ingredient
// availability + substitute suggestions, with no page reload and no
// extra wiring on the recipe-feature side.
export function subscribePantryData(userId, onData) {
  if (!userId) {
    // No signed-in user (Home is reachable while logged out, even
    // though Pantry/RecipeDetails require auth) -- report an empty
    // pantry instead of calling into Firestore with an invalid path.
    onData([]);
    return () => {};
  }
  return subscribeToPantry(userId, onData);
}
