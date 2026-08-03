import { useMemo, useState } from "react";
import SearchBar from "../components/SearchBar";
import RecipeCard from "../components/RecipeCard";
import { recipes } from "../data/recipes";
import {
  isRecipeCookable,
  countMissingIngredients,
  mockPantry,
} from "../utils/matching";
import "./Home.css";

// Checks whether a recipe matches the search term, by title or by
// any of its ingredient names.
function matchesSearch(recipe, term) {
  if (recipe.title.toLowerCase().includes(term)) {
    return true;
  }
  return recipe.ingredients.some((ingredient) =>
    ingredient.name.toLowerCase().includes(term)
  );
}

function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredRecipes = useMemo(() => {
    if (!normalizedSearch) {
      return recipes;
    }
    return recipes.filter((recipe) => matchesSearch(recipe, normalizedSearch));
  }, [normalizedSearch]);

  const cookableRecipes = useMemo(
    () => filteredRecipes.filter((recipe) => isRecipeCookable(recipe, mockPantry)),
    [filteredRecipes]
  );

  const missingIngredientRecipes = useMemo(
    () =>
      filteredRecipes
        .filter((recipe) => !isRecipeCookable(recipe, mockPantry))
        .sort(
          (a, b) =>
            countMissingIngredients(a, mockPantry) -
            countMissingIngredients(b, mockPantry)
        ),
    [filteredRecipes]
  );

  const hasNoRecipesAtAll = recipes.length === 0;
  const hasNoSearchResults = !hasNoRecipesAtAll && filteredRecipes.length === 0;

  return (
    <div className="home-page">
      <section className="home-hero">
        <h1>What can you cook today?</h1>
        <p className="home-hero__subtitle">
          Recipes matched against what's already in your pantry.
        </p>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </section>

      {hasNoRecipesAtAll && (
        <div className="home-empty-state">
          <p>No recipes are available right now. Check back soon.</p>
        </div>
      )}

      {hasNoSearchResults && (
        <div className="home-empty-state">
          <p>
            No recipes match <strong>"{searchTerm}"</strong>. Try a
            different recipe name or ingredient.
          </p>
        </div>
      )}

      {!hasNoRecipesAtAll && !hasNoSearchResults && (
        <>
          <section className="home-section">
            <h2>Recipes You Can Make</h2>
            {cookableRecipes.length === 0 ? (
              <p className="home-section__empty">
                Nothing fully cookable yet with what's on hand.
              </p>
            ) : (
              <div className="recipe-grid">
                {cookableRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} missingCount={0} />
                ))}
              </div>
            )}
          </section>

          <section className="home-section">
            <h2>Recipes Missing Ingredients</h2>
            {missingIngredientRecipes.length === 0 ? (
              <p className="home-section__empty">
                Everything here is ready to cook!
              </p>
            ) : (
              <div className="recipe-grid">
                {missingIngredientRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    missingCount={countMissingIngredients(recipe, mockPantry)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Home;
