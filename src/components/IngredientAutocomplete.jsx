import { useId, useState } from "react";
import { getIngredientSuggestions } from "../utils/ingredientAutocomplete";
import "./IngredientAutocomplete.css";

// Text input with a live suggestions dropdown from the local
// ingredient dictionary. Fully controlled -- `value`/`onChange` work
// like a plain text input, so users can always type (and save) a
// custom ingredient that isn't in the dictionary; suggestions are
// just a shortcut, never a restriction.
function IngredientAutocomplete({
  value,
  onChange,
  placeholder = "Ingredient name",
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listId = useId();

  const suggestions = getIngredientSuggestions(value);
  const showList = isOpen && suggestions.length > 0;

  function selectSuggestion(name) {
    onChange(name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(event) {
    if (!showList) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="ingredient-autocomplete">
      <input
        id={id}
        type="text"
        className="ingredient-autocomplete__input"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        // Slight delay so a suggestion's onMouseDown can fire before
        // the list closes -- otherwise blur closes it first and the
        // click never registers.
        onBlur={() => setTimeout(() => setIsOpen(false), 100)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {showList && (
        <ul className="ingredient-autocomplete__list" id={listId} role="listbox">
          {suggestions.map((name, index) => (
            <li
              key={name}
              role="option"
              aria-selected={index === highlightedIndex}
              className={
                index === highlightedIndex
                  ? "ingredient-autocomplete__option ingredient-autocomplete__option--active"
                  : "ingredient-autocomplete__option"
              }
              onMouseDown={() => selectSuggestion(name)}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default IngredientAutocomplete;
