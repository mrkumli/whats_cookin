import "./RecipeCardSkeleton.css";

// RecipeCardSkeleton
// Placeholder shown in place of a RecipeCard while pantry data (and
// therefore cookable/missing status) is still loading.
function RecipeCardSkeleton() {
  return (
    <div className="recipe-card-skeleton" aria-hidden="true">
      <div className="recipe-card-skeleton__image" />
      <div className="recipe-card-skeleton__body">
        <div className="recipe-card-skeleton__line recipe-card-skeleton__line--title" />
        <div className="recipe-card-skeleton__line recipe-card-skeleton__line--meta" />
      </div>
    </div>
  );
}

export default RecipeCardSkeleton;
