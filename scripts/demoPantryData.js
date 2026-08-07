/**
 * scripts/demoPantryData.js
 *
 * DEVELOPMENT-ONLY. Shared pantry dataset for scripts/seedDemoPantry.js.
 * Not imported by the application -- only by the sibling dev scripts.
 *
 * Expiry dates are computed relative to "today" every time this
 * module is loaded (not hardcoded), so re-running the seed script
 * next week still produces a fresh mix of expired/expiring/fresh
 * items instead of everything silently drifting into "expired."
 *
 * Units use this app's actual Pantry unit vocabulary exactly (see
 * src/data/units.js: piece/pack/can/bottle/jar/dozen, not "pieces"/
 * "cans") so the Edit Pantry Item modal's unit dropdown correctly
 * pre-selects the seeded value instead of showing nothing selected.
 */

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0]; // "YYYY-MM-DD", matches app's stored format
}

// name, quantity, unit, days-from-today for expiry.
// Status buckets (see utils/expiryStatus.js): <0 = expired,
// 0-7 = expiring soon, >7 = fresh.
const RAW_ITEMS = [
  // ---- Proteins ----
  ["Chicken Breast", 1.5, "kg", 10],
  ["Chicken Thigh", 1, "kg", 4], // expiring
  ["Ground Beef", 0.5, "kg", 12],
  ["Eggs", 12, "piece", 21],
  ["Tuna", 3, "can", 365],
  ["Salmon", 400, "g", 2], // expiring

  // ---- Vegetables ----
  ["Onion", 5, "piece", 30],
  ["Garlic", 2, "piece", 45],
  ["Tomato", 6, "piece", 5], // expiring
  ["Bell Pepper", 4, "piece", 6], // expiring
  ["Carrot", 8, "piece", 21],
  ["Broccoli", 2, "piece", 10],
  ["Spinach", 200, "g", 3], // expiring
  ["Mushrooms", 250, "g", 4], // expiring
  ["Potato", 2, "kg", 30],
  ["Cucumber", 3, "piece", -2], // expired
  ["Lettuce", 1, "piece", -1], // expired

  // ---- Fruit ----
  ["Lemon", 4, "piece", 21],
  ["Lime", 4, "piece", 21],
  ["Apple", 6, "piece", 25],
  ["Banana", 6, "piece", -3], // expired

  // ---- Dairy ----
  ["Milk", 1, "L", 5], // expiring
  ["Greek Yogurt", 500, "g", 6], // expiring
  ["Butter", 250, "g", 45],
  ["Cheddar Cheese", 300, "g", 30],
  ["Parmesan", 150, "g", 60],

  // ---- Grains ----
  ["Rice", 2, "kg", 365],
  ["Pasta", 1, "kg", 365],
  ["Flour", 2, "kg", 180],
  ["Bread", 1, "pack", 8],
  ["Tortillas", 1, "pack", 14],

  // ---- Canned ----
  ["Black Beans", 2, "can", 365],
  ["Chickpeas", 2, "can", 365],
  ["Corn", 2, "can", 365],
  ["Canned Tomatoes", 3, "can", 365],

  // ---- Sauces ----
  ["Soy Sauce", 1, "bottle", 365],
  ["Ketchup", 1, "bottle", 180],
  ["Mayonnaise", 1, "jar", 60],
  ["Mustard", 1, "jar", 180],
  ["Olive Oil", 500, "ml", 365],

  // ---- Spices ----
  ["Salt", 1, "pack", 730],
  ["Black Pepper", 1, "jar", 730],
  ["Paprika", 1, "jar", 365],
  ["Cumin", 1, "jar", 365],
  ["Oregano", 1, "jar", 365],
  ["Basil", 1, "jar", 365],
  ["Chili Powder", 1, "jar", 365],
];

// Deliberately NOT included, so a good number of matched recipes
// naturally show "Missing X Ingredients" for instructors to see that
// feature in action:
//   Heavy Cream, Shrimp, Coconut Milk, Fresh Basil, Cilantro

export function buildDemoPantryItems() {
  return RAW_ITEMS.map(([name, quantity, unit, days]) => ({
    name,
    quantity,
    unit,
    expiryDate: daysFromNow(days),
  }));
}

// Turns an ingredient name into a stable, deterministic Firestore
// document id (e.g. "Bell Pepper" -> "bell-pepper"). Using a
// deterministic id -- instead of an auto-generated one -- is what
// lets the seed script upsert safely with zero reads: re-running it
// always resolves to the same document per ingredient, so it updates
// in place instead of creating a duplicate.
export function slugifyIngredientName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
