import "./Toast.css";

// Minimal confirmation toast -- no library needed. Pantry.jsx owns
// the message/visibility state and clears it after a short delay;
// this component just renders whatever message it's given (or
// nothing at all).
function Toast({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

export default Toast;
