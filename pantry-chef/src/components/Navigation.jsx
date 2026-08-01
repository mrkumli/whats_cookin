import { Link } from "react-router-dom";

// Navigation bar
// Simple links between pages. No active-link styling or auth-based
// show/hide logic yet -- that will be added once auth is implemented.
function Navigation() {
  return (
    <nav className="navigation">
      <Link to="/">Home</Link>
      <Link to="/pantry">Pantry</Link>
      <Link to="/login">Login</Link>
      <Link to="/signup">Sign Up</Link>
    </nav>
  );
}

export default Navigation;
