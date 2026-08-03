import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import "./IngredientStatusIcon.css";

// IngredientStatusIcon
// Small, reusable status indicator for an ingredient: a green check
// circle when it's available in the pantry, a red "x" circle when
// it's missing. Purely decorative (the color-coded list item and
// text already convey the state), so it's hidden from screen readers.
function IngredientStatusIcon({ available }) {
  return (
    <FontAwesomeIcon
      icon={available ? faCheckCircle : faCircleXmark}
      className={
        available
          ? "ingredient-status-icon ingredient-status-icon--available"
          : "ingredient-status-icon ingredient-status-icon--missing"
      }
      aria-hidden="true"
    />
  );
}

export default IngredientStatusIcon;
