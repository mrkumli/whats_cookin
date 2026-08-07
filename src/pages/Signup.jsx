import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) return setError("Whoops! Taste test failed, Passwords do not match.");
    setError("");
    setLoading(true);
    try {
      await signup(email, password);
      navigate("/");
    } catch {
      setError("Half-baked attempt! Failed to create an account.\n\nPassword requirements:\n• At least 6 characters long\n• Must contain a valid email address\n• Avoid using common passwords.");
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign up</h1>
        {error && <p style={{ whiteSpace: "pre-line" }} className="auth-error">{error}</p>}
        <div className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </div>
        <p>Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}