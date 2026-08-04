// Filter option lists for the Home page Filters control.
// Kept separate from recipe data (now fetched from Spoonacular via
// services/recipeService.js) so the option lists can be maintained
// independently of whatever recipes the API returns.

export const CUISINE_OPTIONS = [
  "All",
  "Italian",
  "American",
  "Mexican",
  "Indian",
  "Chinese",
  "Japanese",
];

export const TIME_OF_DAY_OPTIONS = [
  "All",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Dessert",
];
