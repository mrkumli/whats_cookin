import { Link } from "react-router-dom";
import "./RecipeCard.css";

// RecipeCard
// Reusable card for displaying a recipe in a grid. Purely
// presentational -- it receives the recipe plus its already-computed
// missing-ingredient count and just renders them. Clicking the card
// navigates to that recipe's details page (not implemented yet, but
// the route already exists).
function RecipeCard({ recipe, missingCount }) {
  const isReadyToCook = missingCount === 0;
  const statusLabel = isReadyToCook
    ? "Ready to cook"
    : `Missing ${missingCount} ${missingCount === 1 ? "ingredient" : "ingredients"}`;

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="recipe-card"
      aria-label={`${recipe.title} — ${recipe.cookTime} min, ${recipe.difficulty}, ${statusLabel}`}
    >
      <div className="recipe-card__image">
        <img src={recipe.image} alt="" />
        {isReadyToCook && (
          <span className="recipe-card__badge">Ready to Cook</span>
        )}
      </div>

      <div className="recipe-card__body">
        <h3 className="recipe-card__title">{recipe.title}</h3>

        <div className="recipe-card__meta">
          <span>⏱ {recipe.cookTime} min</span>
          <span>•</span>
          <span>{recipe.difficulty}</span>
        </div>

        {!isReadyToCook && (
          <p className="recipe-card__missing">
            Missing {missingCount}{" "}
            {missingCount === 1 ? "ingredient" : "ingredients"}
          </p>
        )}
      </div>
    </Link>
  );
}

export default RecipeCard;
