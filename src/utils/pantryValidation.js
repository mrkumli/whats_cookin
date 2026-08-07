// Validates the add/edit pantry item form fields. Returns an object
// keyed by field name -- empty object means valid. Pure function, no
// UI, so both the add form and the edit modal can share it.
export function validatePantryItemInput({ name, quantity, expiryDate }) {
  const errors = {};

  if (!name || !name.trim()) {
    errors.name = "Ingredient name is required.";
  }

  if (quantity === "" || quantity === null || quantity === undefined) {
    errors.quantity = "Quantity is required.";
  } else {
    const numericQuantity = Number(quantity);
    if (Number.isNaN(numericQuantity)) {
      errors.quantity = "Quantity must be a number.";
    } else if (numericQuantity <= 0) {
      errors.quantity = "Quantity must be greater than zero.";
    }
  }

  if (expiryDate) {
    const date = new Date(`${expiryDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      errors.expiryDate = "Expiry date is invalid.";
    }
  }

  return errors;
}
