import "./EmptyState.css";

// EmptyState
// Reusable "nothing to show" panel: a title, an optional message,
// and optional action content (e.g. a link). Used anywhere the
// recipe feature has nothing to render -- no search results, no
// recipes at all, empty pantry, recipe not found.
function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {message && <p className="empty-state__message">{message}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

export default EmptyState;
