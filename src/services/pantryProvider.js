import { MOCK_PANTRY } from "../data/mockPantry";
// PantryProvider
//
// The single abstraction the recipe feature goes through to ask
// "what's in the pantry?". Nothing else -- not RecipeService, not
// utils/matching.js, not any page -- should read pantry data from
// anywhere but here (directly or via hooks/usePantry.js, which just
// wraps this in React state).
//
// For now this always resolves the temporary mock pantry.
//
// TODO (integration): once the pantry-management branch (Firestore,
// real user accounts) is merged, this is the ONLY file that should
// need to change. Replace the body of getPantryData() with a real
// fetch, e.g.:
//
//   import { getPantryItems } from "./pantryService";
//   import { auth } from "./firebase";
//
//   export async function getPantryData() {
//     const user = auth.currentUser;
//     if (!user) return [];
//     return getPantryItems(user.uid);
//   }
//
// and delete MOCK_PANTRY / data/mockPantry.js once that's live.
// hooks/usePantry.js and every recipe-feature consumer can stay
// exactly as they are -- they only know about getPantryData(), not
// where the data actually comes from.
export async function getPantryData() {
  // TODO (integration): remove this simulated delay -- it only
  // exists so loading/skeleton UI has something real to render
  // against before real (naturally-latent) Firestore reads replace it.
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_PANTRY;
}
