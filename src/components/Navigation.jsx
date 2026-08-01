import { useState } from "react";
import { Link } from "react-router-dom";

// Navigation bar
// Logo + links. On small screens, links collapse behind a menu
// button. Purely visual for now -- no active-link highlighting or
// auth-based show/hide logic yet (that comes with the auth feature).
function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" onClick={closeMenu}>
          <span className="navbar__logo-mark" aria-hidden="true">
            🍲
          </span>
          <span className="navbar__logo-text">What's Cookin'</span>
        </Link>

        <button
          type="button"
          className="navbar__toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
        </button>

        <nav
          className={
            menuOpen ? "navbar__links navbar__links--open" : "navbar__links"
          }
        >
          <Link to="/" onClick={closeMenu}>
            Home
          </Link>
          <Link to="/pantry" onClick={closeMenu}>
            Pantry
          </Link>
          <Link to="/login" onClick={closeMenu}>
            Login
          </Link>
          <Link to="/signup" className="navbar__cta" onClick={closeMenu}>
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navigation;
