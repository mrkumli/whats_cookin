import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import FilterButton from "../components/FilterButton";
import FilterModal from "../components/FilterModal";
import ActiveFilterChips from "../components/ActiveFilterChips";
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

// Multi-select filter check:
// - No selections in a category = that category is unrestricted ("All").
// - Multiple selections in a category = match ANY of them.
// - Selections in both categories = recipe must satisfy BOTH.
function matchesFilters(recipe, selectedCuisines, selectedTimes) {
  const cuisineMatch =
    selectedCuisines.length === 0 || selectedCuisines.includes(recipe.cuisine);
  const timeMatch =
    selectedTimes.length === 0 || selectedTimes.includes(recipe.category);
  return cuisineMatch && timeMatch;
}

function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedCuisines, setAppliedCuisines] = useState([]);
  const [appliedTimes, setAppliedTimes] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const { items: pantryItems, loading: pantryLoading } = usePantry();

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const searchMatch =
        !normalizedSearch || matchesSearch(recipe, normalizedSearch);
      return (
        searchMatch && matchesFilters(recipe, appliedCuisines, appliedTimes)
      );
    });
  }, [normalizedSearch, appliedCuisines, appliedTimes]);

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
  const hasActiveFilters = appliedCuisines.length > 0 || appliedTimes.length > 0;
  const hasNoResults = !hasNoRecipesAtAll && filteredRecipes.length === 0;
  const isPantryEmpty = !pantryLoading && pantryItems.length === 0;

  function removeCuisineFilter(cuisine) {
    setAppliedCuisines((current) => current.filter((item) => item !== cuisine));
  }

  function removeTimeFilter(time) {
    setAppliedTimes((current) => current.filter((item) => item !== time));
  }

  function handleApplyFilters(cuisines, times) {
    setAppliedCuisines(cuisines);
    setAppliedTimes(times);
    setIsFilterModalOpen(false);
  }

  function resetFilters() {
    setAppliedCuisines([]);
    setAppliedTimes([]);
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

        <div className="home-search-row">
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
          <FilterButton
            onClick={() => setIsFilterModalOpen(true)}
            activeCount={appliedCuisines.length + appliedTimes.length}
          />
        </div>

        <ActiveFilterChips
          cuisines={appliedCuisines}
          times={appliedTimes}
          onRemoveCuisine={removeCuisineFilter}
          onRemoveTime={removeTimeFilter}
        />
      </section>

      {isFilterModalOpen && (
        <FilterModal
          initialCuisines={appliedCuisines}
          initialTimes={appliedTimes}
          onApply={handleApplyFilters}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}

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
              <button
                type="button"
                className="home-reset-filters"
                onClick={resetFilters}
              >
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
