import { useState } from "react";
import Modal from "./Modal";
import { UNIT_GROUPS } from "../data/units";
import { validatePantryItemInput } from "../utils/pantryValidation";
import "./EditPantryItemModal.css";

// EditPantryItemModal
// Reuses the existing Modal component (same one the recipe feature's
// substitution picker uses) for open/close/backdrop/Escape behavior,
// so this is just the form content inside it. Ingredient name,
// quantity, unit, and expiry date are all editable; saving calls
// `onSave` with the validated values and lets the caller (Pantry.jsx)
// handle the actual Firestore update + refresh + toast.
function EditPantryItemModal({ item, onClose, onSave }) {
  const [name, setName] = useState(item.name || "");
  const [quantity, setQuantity] = useState(
    item.quantity !== undefined && item.quantity !== null ? String(item.quantity) : ""
  );
  const [unit, setUnit] = useState(item.unit || "");
  const [expiryDate, setExpiryDate] = useState(item.expiryDate || "");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validatePantryItemInput({ name, quantity, expiryDate });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      await onSave({
        name: name.trim(),
        quantity: Number(quantity),
        unit,
        expiryDate: expiryDate || null,
      });
    } catch {
      setSaveError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Pantry Item" onClose={onClose}>
      <form className="edit-pantry-form" onSubmit={handleSubmit}>
        <label className="edit-pantry-form__field">
          <span>Ingredient</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {errors.name && (
            <span className="edit-pantry-form__error">{errors.name}</span>
          )}
        </label>

        <div className="edit-pantry-form__row">
          <label className="edit-pantry-form__field">
            <span>Quantity</span>
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            {errors.quantity && (
              <span className="edit-pantry-form__error">{errors.quantity}</span>
            )}
          </label>

          <label className="edit-pantry-form__field">
            <span>Unit</span>
            <select value={unit} onChange={(event) => setUnit(event.target.value)}>
              <option value="">Select unit</option>
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
          </label>
        </div>

        <label className="edit-pantry-form__field">
          <span>Expiry date (optional)</span>
          <input
            type="date"
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
          />
          {errors.expiryDate && (
            <span className="edit-pantry-form__error">{errors.expiryDate}</span>
          )}
        </label>

        {saveError && <p className="edit-pantry-form__error">{saveError}</p>}

        <div className="edit-pantry-form__actions">
          <button type="button" className="edit-pantry-form__cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="edit-pantry-form__save" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditPantryItemModal;
