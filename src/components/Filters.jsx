import { CUISINE_OPTIONS, TIME_OF_DAY_OPTIONS } from "../data/filters";
import "./Filters.css";

// FilterPillGroup
// One labeled row of selectable pills (single-select, like a radio
// group). Reused for both the cuisine and time-of-day rows below.
function FilterPillGroup({ label, options, selected, onChange }) {
  return (
    <div className="filters__group">
      <span className="filters__label">{label}</span>
      <div className="filters__pills">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={
              option === selected
                ? "filters__pill filters__pill--active"
                : "filters__pill"
            }
            aria-pressed={option === selected}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

// Filters
// Controlled cuisine + time-of-day filter control for the Home page.
// Purely presentational -- Home owns the selected values and the
// filtering logic itself.
function Filters({ cuisine, onCuisineChange, timeOfDay, onTimeOfDayChange }) {
  return (
    <div className="filters">
      <h2 className="filters__heading">Filters</h2>
      <FilterPillGroup
        label="Cuisine"
        options={CUISINE_OPTIONS}
        selected={cuisine}
        onChange={onCuisineChange}
      />
      <FilterPillGroup
        label="Time of Day"
        options={TIME_OF_DAY_OPTIONS}
        selected={timeOfDay}
        onChange={onTimeOfDayChange}
      />
    </div>
  );
}

export default Filters;
