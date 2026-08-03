import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import RecipeCard from "../components/RecipeCard";
import RecipeCardSkeleton from "../components/RecipeCardSkeleton";
import EmptyState from "../components/EmptyState";
import { recipes } from "../data/recipes";
import { isRecipeCookable, countMissingIngredients } from "../utils/matching";
import { usePantry } from "../hooks/usePantry";
import "./Home.css";

const SKELETON_COUNT = 3;

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
  const { items: pantryItems, loading: pantryLoading } = usePantry();

  const filteredRecipes = useMemo(() => {
    if (!normalizedSearch) {
      return recipes;
    }
    return recipes.filter((recipe) => matchesSearch(recipe, normalizedSearch));
  }, [normalizedSearch]);

  const cookableRecipes = useMemo(
    () =>
      filteredRecipes.filter((recipe) => isRecipeCookable(recipe, pantryItems)),
    [filteredRecipes, pantryItems]
  );

  const missingIngredientRecipes = useMemo(
    () =>
      filteredRecipes
        .filter((recipe) => !isRecipeCookable(recipe, pantryItems))
        .sort(
          (a, b) =>
            countMissingIngredients(a, pantryItems) -
            countMissingIngredients(b, pantryItems)
        ),
    [filteredRecipes, pantryItems]
  );

  const hasNoRecipesAtAll = recipes.length === 0;
  const hasNoSearchResults = !hasNoRecipesAtAll && filteredRecipes.length === 0;
  const isPantryEmpty = !pantryLoading && pantryItems.length === 0;

  return (
    <div className="home-page">
      <section className="home-hero">
        <h1>What can you cook today?</h1>
        <p className="home-hero__subtitle">
          Recipes matched against what's already in your pantry.
        </p>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </section>

      {isPantryEmpty && (
        <EmptyState
          title="Your pantry is empty"
          message="Add a few ingredients to your pantry to see which recipes you can make."
          action={<Link to="/pantry">Go to Pantry →</Link>}
        />
      )}

      {hasNoRecipesAtAll && (
        <EmptyState
          title="No recipes available"
          message="Check back soon -- new recipes are on the way."
        />
      )}

      {hasNoSearchResults && (
        <EmptyState
          title={`No recipes match "${searchTerm}"`}
          message="Try a different recipe name or ingredient."
        />
      )}

      {!hasNoRecipesAtAll && !hasNoSearchResults && (
        <>
          <section className="home-section">
            <h2>Recipes You Can Make</h2>
            {pantryLoading ? (
              <div className="recipe-grid">
                {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                  <RecipeCardSkeleton key={index} />
                ))}
              </div>
            ) : cookableRecipes.length === 0 ? (
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
            {pantryLoading ? (
              <div className="recipe-grid">
                {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                  <RecipeCardSkeleton key={index} />
                ))}
              </div>
            ) : missingIngredientRecipes.length === 0 ? (
              <p className="home-section__empty">
                Everything here is ready to cook!
              </p>
            ) : (
              <div className="recipe-grid">
                {missingIngredientRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    missingCount={countMissingIngredients(recipe, pantryItems)}
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
