// Unit options for the pantry quantity dropdown, grouped to match
// how they're presented in the add/edit forms (rendered as <optgroup>
// sections).
export const UNIT_GROUPS = [
  { label: "Weight", units: ["g", "kg", "oz", "lb"] },
  { label: "Volume", units: ["ml", "L", "tsp", "tbsp", "cup"] },
  {
    label: "Count",
    units: ["piece", "pack", "can", "bottle", "jar", "dozen"],
  },
];

// Flat list, for places that just need "is this a valid unit" rather
// than the grouped structure (e.g. validation).
export const UNIT_OPTIONS = UNIT_GROUPS.flatMap((group) => group.units);
