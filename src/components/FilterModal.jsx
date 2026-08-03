import { useState } from "react";
import Modal from "./Modal";
import { CUISINE_OPTIONS, TIME_OF_DAY_OPTIONS } from "../data/filters";
import "./FilterModal.css";

// The modal itself is multi-select, so the "All" entry (meaningful
// only for the old single-select control) is left out here -- an
// empty selection already means "All" in the filtering logic.
const SELECTABLE_CUISINES = CUISINE_OPTIONS.filter((option) => option !== "All");
const SELECTABLE_TIMES = TIME_OF_DAY_OPTIONS.filter((option) => option !== "All");

function toggleValue(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

// One labeled group of multi-select option pills, reused for both
// the cuisine and time-of-day sections.
function FilterOptionGroup({ title, options, selected, onToggle }) {
  return (
    <div className="filter-modal__section">
      <h4 className="filter-modal__section-title">{title}</h4>
      <div className="filter-modal__options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={
              selected.includes(option)
                ? "filter-modal__option filter-modal__option--active"
                : "filter-modal__option"
            }
            aria-pressed={selected.includes(option)}
            onClick={() => onToggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

// FilterModal
// Holds its own DRAFT selections, seeded from whatever is currently
// applied. Nothing reaches Home's applied filters until "Apply
// Filters" is clicked -- closing the modal any other way (backdrop
// click, Escape, the × button) just discards the draft, so the
// previously applied filters are untouched.
function FilterModal({ initialCuisines, initialTimes, onApply, onClose }) {
  const [draftCuisines, setDraftCuisines] = useState(initialCuisines);
  const [draftTimes, setDraftTimes] = useState(initialTimes);

  function toggleCuisine(option) {
    setDraftCuisines((current) => toggleValue(current, option));
  }

  function toggleTime(option) {
    setDraftTimes((current) => toggleValue(current, option));
  }

  function handleClearAll() {
    setDraftCuisines([]);
    setDraftTimes([]);
  }

  function handleApply() {
    onApply(draftCuisines, draftTimes);
  }

  return (
    <Modal title="Filter Recipes" onClose={onClose}>
      <FilterOptionGroup
        title="Filter by Cuisine"
        options={SELECTABLE_CUISINES}
        selected={draftCuisines}
        onToggle={toggleCuisine}
      />
      <FilterOptionGroup
        title="Filter by Time of Day"
        options={SELECTABLE_TIMES}
        selected={draftTimes}
        onToggle={toggleTime}
      />

      <div className="filter-modal__actions">
        <button
          type="button"
          className="filter-modal__clear"
          onClick={handleClearAll}
        >
          Clear All
        </button>
        <button
          type="button"
          className="filter-modal__apply"
          onClick={handleApply}
        >
          Apply Filters
        </button>
      </div>
    </Modal>
  );
}

export default FilterModal;
