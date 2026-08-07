import { getExpiryStatus } from "../utils/expiryStatus";
import "./ExpiryStatusIndicator.css";

const STATUS_LABELS = {
  fresh: "Fresh",
  expiring: "Expiring soon",
  expired: "Expired",
};

// Small colored status dot for a pantry card. Renders nothing if the
// item has no expiry date set -- there's nothing to indicate.
// The same `.expiry-dot--<status>` classes are reused by the legend
// at the top of the Pantry page, so the colors only need to be
// defined once (see ExpiryStatusIndicator.css).
function ExpiryStatusIndicator({ expiryDate }) {
  const status = getExpiryStatus(expiryDate);
  if (!status) {
    return null;
  }

  return (
    <span
      className={`expiry-dot expiry-dot--${status}`}
      role="img"
      aria-label={STATUS_LABELS[status]}
      title={STATUS_LABELS[status]}
    />
  );
}

export default ExpiryStatusIndicator;
