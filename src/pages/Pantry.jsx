import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  subscribeToPantry,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
} from "../services/pantryService";
import PantryItemCard from "../components/PantryItemCard";
import IngredientAutocomplete from "../components/IngredientAutocomplete";
import EditPantryItemModal from "../components/EditPantryItemModal";
import Toast from "../components/Toast";
import { UNIT_GROUPS } from "../data/units";
import { validatePantryItemInput } from "../utils/pantryValidation";
import "./Pantry.css";

const TOAST_DURATION_MS = 2500;

export default function Pantry() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add-form fields
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [addErrors, setAddErrors] = useState({});

  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToPantry(currentUser.uid, (nextItems) => {
      setItems(nextItems);
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser]);

  // Clears the toast automatically a couple seconds after it appears.
  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = setTimeout(() => setToastMessage(""), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  function resetAddForm() {
    setName("");
    setQuantity("");
    setUnit("");
    setExpiryDate("");
    setAddErrors({});
  }

  async function handleAdd(event) {
    event.preventDefault();
    const validationErrors = validatePantryItemInput({ name, quantity, expiryDate });
    setAddErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setError("");
    try {
      await addPantryItem(currentUser.uid, {
        name,
        quantity: Number(quantity),
        unit,
        expiryDate: expiryDate || null,
      });
      resetAddForm();
      setToastMessage("Added to pantry");
      // subscribeToPantry's live listener refreshes `items`
      // automatically -- no manual refetch needed here.
    } catch {
      setError("Failed to add item.");
    }
  }

  async function handleSaveEdit(updates) {
    await updatePantryItem(currentUser.uid, editingItem.id, updates);
    setEditingItem(null);
    setToastMessage("Item updated");
  }

  async function handleDelete(itemId) {
    try {
      await deletePantryItem(currentUser.uid, itemId);
      setToastMessage("Item removed");
    } catch {
      setError("Failed to remove item.");
    }
  }

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page pantry-page">
      <h1>Pantry</h1>

      <div className="pantry-legend">
        <span>
          <span className="expiry-dot expiry-dot--fresh" /> Fresh
        </span>
        <span>
          <span className="expiry-dot expiry-dot--expiring" /> Expiring Soon
        </span>
        <span>
          <span className="expiry-dot expiry-dot--expired" /> Expired
        </span>
      </div>

      <form className="pantry-add" onSubmit={handleAdd} noValidate>
        <div className="pantry-add__row">
          <IngredientAutocomplete
            value={name}
            onChange={setName}
            placeholder="Add an ingredient..."
          />
          <input
            type="number"
            className="pantry-add__quantity"
            placeholder="Qty"
            min="0"
            step="any"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <select
            className="pantry-add__unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          >
            <option value="">Unit</option>
            {UNIT_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <input
            type="date"
            className="pantry-add__expiry"
            aria-label="Expiry date (optional)"
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
          />
          <button type="submit">Add</button>
        </div>
        {(addErrors.name || addErrors.quantity || addErrors.expiryDate) && (
          <div className="pantry-add__errors">
            {addErrors.name && <span>{addErrors.name}</span>}
            {addErrors.quantity && <span>{addErrors.quantity}</span>}
            {addErrors.expiryDate && <span>{addErrors.expiryDate}</span>}
          </div>
        )}
      </form>

      {error && <p className="auth-error">{error}</p>}

      <input
        className="pantry-search"
        type="text"
        placeholder="Search pantry..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="pantry-empty">
          {search ? "No matching items." : "Your pantry is empty — add something!"}
        </p>
      ) : (
        <div className="pantry-grid">
          {filtered.map((item) => (
            <PantryItemCard
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editingItem && (
        <EditPantryItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      )}

      <Toast message={toastMessage} />
    </div>
  );
}
