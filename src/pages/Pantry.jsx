import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  subscribeToPantry,
  addPantryItem,
  deletePantryItem,
} from "../services/pantryService";

export default function Pantry() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToPantry(currentUser.uid, (items) => {
      setItems(items);
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser]);

  async function handleAdd() {
    if (!input.trim()) return;
    setError("");
    try {
      await addPantryItem(currentUser.uid, input);
      setInput("");
    } catch {
      setError("Failed to add item.");
    }
  }

  async function handleDelete(itemId) {
    try {
      await deletePantryItem(currentUser.uid, itemId);
    } catch {
      setError("Failed to remove item.");
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleAdd();
  }

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <h1>Pantry</h1>

      <div className="pantry-add">
        <input
          type="text"
          placeholder="Add an ingredient..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <input
        className="pantry-search"
        type="text"
        placeholder="Search pantry..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="pantry-empty">
          {search ? "No matching items." : "Your pantry is empty — add something!"}
        </p>
      ) : (
        <ul className="pantry-list">
          {filtered.map((item) => (
            <li key={item.id} className="pantry-item">
              <span>{item.name}</span>
              <button onClick={() => handleDelete(item.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}