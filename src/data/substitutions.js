// Ingredient substitution database
//
// Maps an ingredient name to a list of common substitutes for it.
// This is a static reference table for now (not tied to any recipe
// or pantry) -- utils/substitution.js decides which of these
// substitutes are actually usable given the current pantry.
//
// Keys are matched case-insensitively by the lookup helper in
// utils/substitution.js, so write them however reads best here.

export const substitutionDatabase = {
  "Heavy Cream": ["Greek Yogurt", "Milk"],
  "Butter": ["Olive Oil"],
  "Sour Cream": ["Greek Yogurt"],
  "Lemon Juice": ["Vinegar"],
  "Cornstarch": ["Flour"],
  "Milk": ["Greek Yogurt"],
  "Vegetable Oil": ["Olive Oil"],
  "Honey": ["Sugar"],
};
