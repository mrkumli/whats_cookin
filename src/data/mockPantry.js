// TEMPORARY mock pantry data.
//
// This is the ONLY place mock pantry items are defined. Everything
// else (hooks, utils, pages) should get pantry data through
// hooks/usePantry.js rather than importing this array directly.
//
// TODO (integration): delete this file once the pantry-management
// branch is merged and hooks/usePantry.js pulls real data from
// services/pantryService.js instead.

export const MOCK_PANTRY = [
  { name: "Eggs", quantity: "6 large" },
  { name: "Butter", quantity: "1 stick" },
  { name: "Milk", quantity: "1 L" },
  { name: "Salt", quantity: "1 box" },
  { name: "Garlic", quantity: "1 bulb" },
  { name: "Olive Oil", quantity: "500 ml" },
  { name: "Flour", quantity: "2 cups" },
  { name: "Greek Yogurt", quantity: "1 cup" },
  { name: "Onion", quantity: "3" },
  { name: "Tomato", quantity: "4" },
  { name: "Cheddar Cheese", quantity: "200 g" },
  { name: "Bread", quantity: "1 loaf" },
];
