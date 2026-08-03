// SearchBar
// Controlled search input. Purely presentational -- Home page owns
// the search term state and filtering logic.
function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-bar__input"
        placeholder="Search recipes or ingredients..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Search recipes or ingredients"
      />
    </div>
  );
}

export default SearchBar;
