import ExpiryStatusIndicator from "./ExpiryStatusIndicator";
import "./PantryItemCard.css";

function formatExpiryDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// PantryItemCard
// Responsive card replacing the old plain list row. Shows name,
// quantity + unit, expiry date, and a colored expiry status dot.
// Older pantry documents saved before this feature (name + createdAt
// only) simply omit the quantity/expiry lines rather than showing
// "undefined" -- no backfill needed.
function PantryItemCard({ item, onEdit, onDelete }) {
  const hasQuantity = item.quantity !== undefined && item.quantity !== null;
  const quantityLabel = hasQuantity
    ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
    : null;
  const expiryLabel = item.expiryDate ? formatExpiryDate(item.expiryDate) : null;

  return (
    <div className="pantry-card">
      <div className="pantry-card__header">
        <ExpiryStatusIndicator expiryDate={item.expiryDate} />
        <h3 className="pantry-card__name">{item.name}</h3>
      </div>

      {quantityLabel && <p className="pantry-card__quantity">{quantityLabel}</p>}
      {expiryLabel && (
        <p className="pantry-card__expiry">Expires {expiryLabel}</p>
      )}

      <div className="pantry-card__actions">
        <button
          type="button"
          className="pantry-card__edit"
          onClick={() => onEdit(item)}
        >
          Edit
        </button>
        <button
          type="button"
          className="pantry-card__remove"
          onClick={() => onDelete(item.id)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default PantryItemCard;
