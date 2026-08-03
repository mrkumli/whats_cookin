import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Modal from "../components/Modal";
import { recipes } from "../data/recipes";
import { isIngredientInPantry, mockPantry } from "../utils/matching";
import { getAvailableSubstitutes } from "../utils/substitution";
import "./RecipeDetails.css";

// Builds the initial "displayed ingredients" list for a recipe: the
// same ingredients as the recipe data, plus a `substitutedFrom` flag
// (null until the user picks a substitute). This local copy is what
// gets edited -- the original recipe object in data/recipes.js is
// never touched.
function buildDisplayedIngredients(recipe) {
  return recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    substitutedFrom: null,
  }));
}

function RecipeDetails() {
  const { recipeId } = useParams();
  const recipe = recipes.find((item) => item.id === recipeId);

  const [displayedIngredients, setDisplayedIngredients] = useState(() =>
    recipe ? buildDisplayedIngredients(recipe) : []
  );
  const [activeIngredientIndex, setActiveIngredientIndex] = useState(null);

  // Reset the local ingredient list whenever the recipe (route
  // param) changes, so substitutions don't leak between recipes.
  useEffect(() => {
    setDisplayedIngredients(recipe ? buildDisplayedIngredients(recipe) : []);
    setActiveIngredientIndex(null);
  }, [recipe]);

  if (!recipe) {
    return (
      <div className="page">
        <h1>Recipe not found</h1>
        <p>We couldn't find that recipe.</p>
        <Link to="/" className="recipe-details__back">
          ← Back to Home
        </Link>
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
    ? getAvailableSubstitutes(activeIngredient.name, mockPantry)
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
      </div>

      <section className="recipe-details__section">
        <h2>Ingredients</h2>
        <ul className="ingredient-list">
          {displayedIngredients.map((ingredient, index) => {
            const available = isIngredientInPantry(ingredient.name, mockPantry);
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
                  <span className="ingredient-list__name">
                    {ingredient.name}
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
                  >
                    Substitute
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="recipe-details__section">
        <h2>Instructions</h2>
        <ol className="instruction-list">
          {recipe.instructions.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>

      {activeIngredient && (
        <Modal
          title={`Substitute for ${activeIngredient.name}`}
          onClose={closeSubstituteModal}
        >
          {activeSubstitutes.length === 0 ? (
            <p>No pantry substitutes are available for this ingredient.</p>
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
