import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders } from "@fortawesome/free-solid-svg-icons";
import "./FilterButton.css";

// FilterButton
// Sits beside the search bar. Shows an icon + "Filter" label on
// larger screens; the label collapses away on small screens so only
// the icon remains (see FilterButton.css). Opens the filter modal.
function FilterButton({ onClick, activeCount = 0 }) {
  return (
    <button
      type="button"
      className="filter-button"
      onClick={onClick}
      aria-label={
        activeCount > 0 ? `Open filters (${activeCount} active)` : "Open filters"
      }
    >
      <FontAwesomeIcon icon={faSliders} aria-hidden="true" />
      <span className="filter-button__label">
        Filter{activeCount > 0 ? ` (${activeCount})` : ""}
      </span>
    </button>
  );
}

export default FilterButton;
