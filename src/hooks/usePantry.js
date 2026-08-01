// usePantry hook (placeholder)
//
// TODO: This hook will call pantryService to load
// the current user's pantry items and expose them (plus loading/error
// state) to any component that needs pantry data.

export function usePantry() {
  return {
    items: [],
    loading: false,
    error: null,
  };
}
