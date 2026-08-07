const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Calculates a pantry item's expiry status purely from today's date
// and the item's stored expiryDate ("YYYY-MM-DD", or null/undefined
// if the user didn't set one). No manual status field is ever
// stored -- this is always derived fresh, so it's automatically
// correct no matter how much time has passed since the item was added.
//
// Returns "expired" | "expiring" | "fresh" | null (null = no expiry
// date set for this item, so there's nothing to indicate).
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) {
    return null;
  }

  const expiry = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysRemaining = Math.round((expiry.getTime() - today.getTime()) / ONE_DAY_MS);

  if (daysRemaining < 0) {
    return "expired";
  }
  if (daysRemaining <= 7) {
    return "expiring";
  }
  return "fresh";
}
