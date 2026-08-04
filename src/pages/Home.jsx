import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import FilterButton from "../components/FilterButton";
import FilterModal from "../components/FilterModal";
import ActiveFilterChips from "../components/ActiveFilterChips";
import RecipeCard from "../components/RecipeCard";
import RecipeCardSkeleton from "../components/RecipeCardSkeleton";
import EmptyState from "../components/EmptyState";
import { isRecipeCookable, countMissingIngredients } from "../utils/matching";
import { usePantry } from "../hooks/usePantry";
import { useRecipes } from "../hooks/useRecipes";
import "./Home.css";

const SKELETON_COUNT = 3;

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

  const { items: pantryItems, loading: pantryLoading } = usePantry();

  // "Recommended Recipes" -- search-aware (calls RecipeService's
  // search when there's a query, random recipes otherwise), then
  // narrowed to what the current pantry can actually make.
  const {
    recipes: recommendedPool,
    loading: recommendedLoading,
    error: recommendedError,
    retry: retryRecommended,
  } = useRecipes(searchTerm);

  // "Random Recipes" -- an independent, always-random discovery feed
  // (RecipeService's getRandomRecipes), deliberately NOT tied to the
  // search box, so there's always something to browse regardless of
  // what's been searched. Still respects the cuisine/time filters.
  const {
    recipes: randomPool,
    loading: randomLoading,
    error: randomError,
    retry: retryRandom,
  } = useRecipes("");

  const hasActiveFilters = appliedCuisines.length > 0 || appliedTimes.length > 0;
  const isPantryEmpty = !pantryLoading && pantryItems.length === 0;

  const recommendedRecipes = useMemo(
    () =>
      recommendedPool
        .filter((recipe) => matchesFilters(recipe, appliedCuisines, appliedTimes))
        .filter((recipe) => isRecipeCookable(recipe, pantryItems)),
    [recommendedPool, appliedCuisines, appliedTimes, pantryItems]
  );

  const randomRecipes = useMemo(
    () =>
      randomPool.filter((recipe) =>
        matchesFilters(recipe, appliedCuisines, appliedTimes)
      ),
    [randomPool, appliedCuisines, appliedTimes]
  );

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

  function recommendedEmptyMessage() {
    if (searchTerm && hasActiveFilters) {
      return `Nothing you can make matches "${searchTerm}" with the selected filters.`;
    }
    if (searchTerm) {
      return `Nothing you can make matches "${searchTerm}" yet.`;
    }
    if (hasActiveFilters) {
      return "Nothing you can make matches the selected filters yet.";
    }
    return "Nothing fully cookable yet with what's on hand.";
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

      <section className="home-section">
        <h2>Recommended Recipes</h2>
        {recommendedLoading || pantryLoading ? (
          <div className="recipe-grid">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <RecipeCardSkeleton key={index} />
            ))}
          </div>
        ) : recommendedError ? (
          <EmptyState
            title="Couldn't load recipes"
            message={recommendedError}
            action={
              <button
                type="button"
                className="home-reset-filters"
                onClick={retryRecommended}
              >
                Try again
              </button>
            }
          />
        ) : recommendedRecipes.length === 0 ? (
          <EmptyState
            title="No recommended recipes"
            message={recommendedEmptyMessage()}
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
        ) : (
          <div className="recipe-grid">
            {recommendedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} missingCount={0} />
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <h2>Random Recipes</h2>
        {randomLoading || pantryLoading ? (
          <div className="recipe-grid">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <RecipeCardSkeleton key={index} />
            ))}
          </div>
        ) : randomError ? (
          <EmptyState
            title="Couldn't load recipes"
            message={randomError}
            action={
              <button
                type="button"
                className="home-reset-filters"
                onClick={retryRandom}
              >
                Try again
              </button>
            }
          />
        ) : randomRecipes.length === 0 ? (
          <EmptyState
            title="No random recipes"
            message={
              hasActiveFilters
                ? "No random recipes match the selected filters right now."
                : "No recipes were returned. Try again in a moment."
            }
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
        ) : (
          <div className="recipe-grid">
            {randomRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                missingCount={countMissingIngredients(recipe, pantryItems)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
