import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

// Get the pantry collection for a specific user
function pantryRef(userId) {
  return collection(db, "users", userId, "pantryItems");
}

// Listen to pantry items in real time
export function subscribeToPantry(userId, callback) {
  const q = query(pantryRef(userId), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(items);
  });
}

// Get all pantry items (one-time fetch)
export async function getPantryItems(userId) {
  throw new Error("getPantryItems() not implemented yet");
}

// Add an item
export async function addPantryItem(userId, name) {
  return addDoc(pantryRef(userId), {
    name: name.trim(),
    createdAt: Date.now(),
  });
}

// Update an item
export async function updatePantryItem(userId, itemId, updates) {
  return updateDoc(doc(db, "users", userId, "pantryItems", itemId), updates);
}

// Delete an item
export async function deletePantryItem(userId, itemId) {
  return deleteDoc(doc(db, "users", userId, "pantryItems", itemId));
}