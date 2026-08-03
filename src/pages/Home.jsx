import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Filters from "../components/Filters";
import RecipeCard from "../components/RecipeCard";
import RecipeCardSkeleton from "../components/RecipeCardSkeleton";
import EmptyState from "../components/EmptyState";
import { recipes } from "../data/recipes";
import { isRecipeCookable, countMissingIngredients } from "../utils/matching";
import { usePantry } from "../hooks/usePantry";
import "./Home.css";

const SKELETON_COUNT = 3;
const ALL_OPTION = "All";

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

// Checks whether a recipe satisfies the active cuisine / time-of-day
// filters. "All" for either filter means that dimension is unrestricted.
function matchesFilters(recipe, cuisine, timeOfDay) {
  const matchesCuisine = cuisine === ALL_OPTION || recipe.cuisine === cuisine;
  const matchesTimeOfDay =
    timeOfDay === ALL_OPTION || recipe.category === timeOfDay;
  return matchesCuisine && matchesTimeOfDay;
}

function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState(ALL_OPTION);
  const [timeOfDayFilter, setTimeOfDayFilter] = useState(ALL_OPTION);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const { items: pantryItems, loading: pantryLoading } = usePantry();

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const searchMatch =
        !normalizedSearch || matchesSearch(recipe, normalizedSearch);
      return (
        searchMatch && matchesFilters(recipe, cuisineFilter, timeOfDayFilter)
      );
    });
  }, [normalizedSearch, cuisineFilter, timeOfDayFilter]);

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
  const hasActiveFilters =
    cuisineFilter !== ALL_OPTION || timeOfDayFilter !== ALL_OPTION;
  const hasNoResults = !hasNoRecipesAtAll && filteredRecipes.length === 0;
  const isPantryEmpty = !pantryLoading && pantryItems.length === 0;

  function resetFilters() {
    setCuisineFilter(ALL_OPTION);
    setTimeOfDayFilter(ALL_OPTION);
  }

  // Builds a message for the "no results" empty state that reflects
  // whichever combination of search + filters is currently active.
  function noResultsMessage() {
    if (searchTerm && hasActiveFilters) {
      return `No recipes match "${searchTerm}" with the selected filters.`;
    }
    if (searchTerm) {
      return `No recipes match "${searchTerm}". Try a different recipe name or ingredient.`;
    }
    return "No recipes match the selected filters. Try a different combination.";
  }

  return (
    <div className="home-page">
      <section className="home-hero">
        <h1>What can you cook today?</h1>
        <p className="home-hero__subtitle">
          Recipes matched against what's already in your pantry.
        </p>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </section>

      <Filters
        cuisine={cuisineFilter}
        onCuisineChange={setCuisineFilter}
        timeOfDay={timeOfDayFilter}
        onTimeOfDayChange={setTimeOfDayFilter}
      />

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

      {hasNoResults && (
        <EmptyState
          title="No matching recipes"
          message={noResultsMessage()}
          action={
            hasActiveFilters && (
              <button type="button" className="home-reset-filters" onClick={resetFilters}>
                Reset filters
              </button>
            )
          }
        />
      )}

      {!hasNoRecipesAtAll && !hasNoResults && (
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
