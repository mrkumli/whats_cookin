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
import { useUseSoonRecipes } from "../hooks/useUseSoonRecipes";
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

  const isSearching = searchTerm.trim().length > 0;

  // Recipe <-> pantry integration point: pantryItems here is the
  // signed-in user's real, live Firestore pantry (empty while logged
  // out). Everything below that calls isRecipeCookable/
  // countMissingIngredients against it re-runs automatically whenever
  // the pantry changes, since usePantry's `items` come from a live
  // subscription, not a one-time fetch.
  const { items: pantryItems, loading: pantryLoading } = usePantry();

  // "Recommended Recipes" -- always the random pool, deliberately NOT
  // tied to the search box (see "Search Results" below for that),
  // narrowed to what the current pantry can actually make.
  const {
    recipes: recommendedPool,
    loading: recommendedLoading,
    error: recommendedError,
    retry: retryRecommended,
  } = useRecipes("");

  // "Random Recipes" -- an independent discovery feed. Shares the
  // same underlying random batch as Recommended (same cache entry,
  // so this costs no extra API call), but shown WITHOUT narrowing to
  // cookable-only -- every recipe is shown, with its missing-
  // ingredient count, same as before.
  const {
    recipes: randomPool,
    loading: randomLoading,
    error: randomError,
    retry: retryRandom,
  } = useRecipes("");

  // "Search Results" -- a real, unfiltered-by-pantry search. This is
  // the fix for requirement #1: searching now shows every matching
  // Spoonacular recipe (with an accurate missing-ingredient count on
  // each card), never hiding one just because the pantry can't make
  // it. Only fetches when there's an actual query; resolves to the
  // random pool (harmlessly, from cache) while idle.
  const {
    recipes: searchPool,
    loading: searchLoading,
    error: searchError,
    retry: retrySearch,
  } = useRecipes(searchTerm);

  // "Use Soon" -- recipes for pantry ingredients that are close to
  // expiring. See hooks/useUseSoonRecipes.js for how the expiring
  // ingredient list is derived and cached.
  const {
    recipes: useSoonPool,
    loading: useSoonLoading,
    error: useSoonError,
    retry: retryUseSoon,
    expiringIngredientNames,
  } = useUseSoonRecipes(pantryItems);

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

  // Search results are filtered by cuisine/time like everything else,
  // but deliberately NOT by isRecipeCookable -- a search result never
  // disappears just because an ingredient is missing.
  const searchResults = useMemo(
    () =>
      searchPool.filter((recipe) =>
        matchesFilters(recipe, appliedCuisines, appliedTimes)
      ),
    [searchPool, appliedCuisines, appliedTimes]
  );

  const useSoonRecipes = useMemo(
    () =>
      useSoonPool.filter((recipe) =>
        matchesFilters(recipe, appliedCuisines, appliedTimes)
      ),
    [useSoonPool, appliedCuisines, appliedTimes]
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
    if (hasActiveFilters) {
      return "Oops! Nothing you can make matches the selected filters yet. Let's broaden our taste horizons <3";
    }
    return "Oops! Nothing fully cookable yet with your pantry. Time to go grocery shopping perhaps.";
  }

  function searchEmptyMessage() {
    if (hasActiveFilters) {
      return `Oops! No recipes match "${searchTerm}" with the selected filters.`;
    }
    return `Oop! No recipes match "${searchTerm}". Try a different recipe name or ingredient.`;
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
          message="Add a few ingredients to your pantry to see which recipes you can make, chief."
          action={<Link to="/pantry">Go to Pantry →</Link>}
        />
      )}

      {isSearching ? (
        // Option A from the search fix: while a search is active, it
        // replaces the homepage recipe grid entirely instead of
        // living alongside Recommended/Use Soon/Random.
        <section className="home-section">
          <h2>Search Results</h2>
          {searchLoading ? (
            <div className="recipe-grid">
              {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <RecipeCardSkeleton key={index} />
              ))}
            </div>
          ) : searchError ? (
            <EmptyState
              title="Couldn't load recipes"
              message={searchError}
              action={
                <button
                  type="button"
                  className="home-reset-filters"
                  onClick={retrySearch}
                >
                  Try again
                </button>
              }
            />
          ) : searchResults.length === 0 ? (
            <EmptyState
              title="No matching recipes"
              message={searchEmptyMessage()}
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
              {searchResults.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  missingCount={countMissingIngredients(recipe, pantryItems)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
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
            <h2>Use ingredients expiring Soon</h2>
            {expiringIngredientNames.length === 0 ? (
              <p className="home-section__empty">
                Nothing expiring soon -- your pantry looks fresh.
              </p>
            ) : useSoonLoading || pantryLoading ? (
              <div className="recipe-grid">
                {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                  <RecipeCardSkeleton key={index} />
                ))}
              </div>
            ) : useSoonError ? (
              <EmptyState
                title="Couldn't load recipes"
                message={useSoonError}
                action={
                  <button
                    type="button"
                    className="home-reset-filters"
                    onClick={retryUseSoon}
                  >
                    Try again
                  </button>
                }
              />
            ) : useSoonRecipes.length === 0 ? (
              <EmptyState
                title="No recipes found"
                message="We couldn't find recipes using your soon-to-expire ingredients. Let's chuck those cookbooks this time."
              />
            ) : (
              <div className="recipe-grid">
                {useSoonRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    missingCount={countMissingIngredients(recipe, pantryItems)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="home-section">
            <h2>Today's Recommended Recipes</h2>
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
        </>
      )}
    </div>
  );
}

export default Home;
