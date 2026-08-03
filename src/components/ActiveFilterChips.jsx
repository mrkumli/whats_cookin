import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUtensils, faClock, faXmark } from "@fortawesome/free-solid-svg-icons";
import "./ActiveFilterChips.css";

// One row of chips for a single filter category (e.g. all selected
// cuisines). Renders nothing if there's nothing selected in this
// category, so an empty category never leaves a stray label behind.
function ChipRow({ label, icon, values, onRemove }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="active-filter-chips__row">
      <span className="active-filter-chips__row-label">{label}:</span>
      <div className="active-filter-chips__list">
        {values.map((value) => (
          <span key={value} className="active-filter-chip">
            <FontAwesomeIcon
              icon={icon}
              aria-hidden="true"
              className="active-filter-chip__icon"
            />
            {value}
            <button
              type="button"
              className="active-filter-chip__remove"
              onClick={() => onRemove(value)}
              aria-label={`Remove ${value} filter`}
            >
              <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

// ActiveFilterChips
// Shows the currently APPLIED filters (not the modal's draft) as
// removable chips below the search bar. Removing a chip updates the
// applied filters immediately -- no modal involved. Renders nothing
// at all when no filters are applied.
function ActiveFilterChips({ cuisines, times, onRemoveCuisine, onRemoveTime }) {
  if (cuisines.length === 0 && times.length === 0) {
    return null;
  }

  return (
    <div className="active-filter-chips">
      <ChipRow
        label="Cuisine"
        icon={faUtensils}
        values={cuisines}
        onRemove={onRemoveCuisine}
      />
      <ChipRow
        label="Meal Time"
        icon={faClock}
        values={times}
        onRemove={onRemoveTime}
      />
    </div>
  );
}

export default ActiveFilterChips;
