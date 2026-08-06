import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    closeMenu();
    await logout();
    navigate("/login");
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
          <Link to="/" onClick={closeMenu}>Home</Link>
          {currentUser ? (
            <>
              <Link to="/pantry" onClick={closeMenu}>Pantry</Link>
              <button className="navbar__logout" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>Login</Link>
              <Link to="/signup" className="navbar__cta" onClick={closeMenu}>Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navigation;