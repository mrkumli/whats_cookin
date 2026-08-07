import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import IngredientStatusIcon from "../components/IngredientStatusIcon";
import { getRecipeDetails } from "../services/recipeService";
import { isIngredientInPantry } from "../utils/matching";
import { getAvailableSubstitutes } from "../utils/substitution";
import { usePantry } from "../hooks/usePantry";
import "./RecipeDetails.css";

// Builds the initial "displayed ingredients" list for a recipe: the
// same ingredients as the fetched recipe, plus a `substitutedFrom`
// flag (null until the user picks a substitute). This local copy is
// what gets edited -- the recipe object returned by the recipe
// service is never mutated.
function buildDisplayedIngredients(recipe) {
  return recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    substitutedFrom: null,
  }));
}

function RecipeDetails() {
  const { recipeId } = useParams();
  // Recipe <-> pantry integration point: pantryItems is the signed-in
  // user's real, live Firestore pantry. It drives both the green/red
  // availability icons below (isIngredientInPantry) and which
  // substitutes get offered (getAvailableSubstitutes) -- an ingredient
  // only shows as available, and a substitute only gets suggested, if
  // it's actually in this user's pantry right now.
  const { items: pantryItems, loading: pantryLoading } = usePantry();

  const [recipe, setRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(true);
  const [recipeError, setRecipeError] = useState(null);
  const [displayedIngredients, setDisplayedIngredients] = useState([]);
  const [activeIngredientIndex, setActiveIngredientIndex] = useState(null);

  // Fetch the recipe whenever the route param changes. A friendly
  // error is stored (not thrown) on failure so a bad id or a flaky
  // request shows an empty state instead of crashing the page.
  useEffect(() => {
    let cancelled = false;
    setLoadingRecipe(true);
    setRecipeError(null);
    setRecipe(null);
    setActiveIngredientIndex(null);

    getRecipeDetails(recipeId)
      .then((result) => {
        if (!cancelled) {
          setRecipe(result);
          setDisplayedIngredients(buildDisplayedIngredients(result));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRecipeError(
            error.message || "Something went wrong loading this recipe."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRecipe(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  if (loadingRecipe) {
    return (
      <div className="page">
        <p className="recipe-details__loading">Loading recipe...</p>
      </div>
    );
  }

  if (recipeError || !recipe) {
    return (
      <div className="page">
        <EmptyState
          title="Couldn't load this recipe"
          message={recipeError || "We couldn't find that recipe."}
          action={<Link to="/">← Back to Home</Link>}
        />
      </div>
    );
  }

  function openSubstituteModal(index) {
    setActiveIngredientIndex(index);
  }

  function closeSubstituteModal() {
    setActiveIngredientIndex(null);
  }

  function chooseSubstitute(substituteName) {
    setDisplayedIngredients((current) =>
      current.map((ingredient, index) =>
        index === activeIngredientIndex
          ? {
              ...ingredient,
              name: substituteName,
              substitutedFrom: ingredient.substitutedFrom ?? ingredient.name,
            }
          : ingredient
      )
    );
    closeSubstituteModal();
  }

  const activeIngredient =
    activeIngredientIndex !== null
      ? displayedIngredients[activeIngredientIndex]
      : null;
  const activeSubstitutes = activeIngredient
    ? getAvailableSubstitutes(activeIngredient.name, pantryItems)
    : [];

  return (
    <div className="recipe-details">
      <Link to="/" className="recipe-details__back">
        ← Back to Home
      </Link>

      <div className="recipe-details__image">
        <img src={recipe.image} alt="" />
      </div>

      <h1>{recipe.title}</h1>

      <div className="recipe-details__meta">
        <span>⏱ {recipe.cookTime} min</span>
        <span>•</span>
        <span>{recipe.difficulty}</span>
        <span>•</span>
        <span>{recipe.category}</span>
        {typeof recipe.servings === "number" && (
          <>
            <span>•</span>
            <span>
              {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}
            </span>
          </>
        )}
        {recipe.cuisine && recipe.cuisine !== "Other" && (
          <>
            <span>•</span>
            <span>{recipe.cuisine}</span>
          </>
        )}
      </div>

      <section className="recipe-details__section">
        <h2>Ingredients</h2>
        {pantryLoading ? (
          <p className="recipe-details__loading">Checking your pantry...</p>
        ) : displayedIngredients.length === 0 ? (
          <p className="recipe-details__loading">
            No ingredient information available for this recipe.
          </p>
        ) : (
          <ul className="ingredient-list">
            {displayedIngredients.map((ingredient, index) => {
              const available = isIngredientInPantry(
                ingredient.name,
                pantryItems
              );
              return (
                <li
                  key={`${ingredient.name}-${index}`}
                  className={
                    available
                      ? "ingredient-list__item ingredient-list__item--available"
                      : "ingredient-list__item ingredient-list__item--missing"
                  }
                >
                  <div className="ingredient-list__info">
                    <span className="ingredient-list__name-row">
                      <IngredientStatusIcon available={available} />
                      <span className="ingredient-list__name">
                        {ingredient.name}
                      </span>
                    </span>
                    <span className="ingredient-list__qty">
                      {ingredient.quantity}
                    </span>
                    {ingredient.substitutedFrom && (
                      <span className="ingredient-list__sub-note">
                        Substituted for {ingredient.substitutedFrom}
                      </span>
                    )}
                  </div>

                  {!available && (
                    <button
                      type="button"
                      className="ingredient-list__sub-button"
                      onClick={() => openSubstituteModal(index)}
                      aria-label={`Find a substitute for ${ingredient.name}`}
                    >
                      Substitute
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="recipe-details__section">
        <h2>Instructions</h2>
        {recipe.instructions.length === 0 ? (
          <p className="recipe-details__loading">
            No instructions available for this recipe.
          </p>
        ) : (
          <ol className="instruction-list">
            {recipe.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        )}
      </section>

      {activeIngredient && (
        <Modal
          title={`Substitute for ${activeIngredient.name}`}
          onClose={closeSubstituteModal}
        >
          {activeSubstitutes.length === 0 ? (
            <p>No pantry substitutes are available for this ingredient. Let's go grocery shopping, chief.</p>
          ) : (
            <>
              <p>Choose a substitute already in your pantry:</p>
              <div className="substitute-options">
                {activeSubstitutes.map((substitute) => (
                  <button
                    key={substitute}
                    type="button"
                    className="substitute-options__choice"
                    onClick={() => chooseSubstitute(substitute)}
                  >
                    {substitute}
                  </button>
                ))}
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

export default RecipeDetails;
