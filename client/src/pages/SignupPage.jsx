import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Auth.css";

const SignupPage = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const googleAuthBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';
  const googleAuthUrl = `${googleAuthBase}/auth/google`;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      setError("Please fill all fields");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/auth/signup", form);
      login(res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <Link to="/" className="auth-logo">
            <img src="/logo2.png" alt="StudyNest Logo" className="logo-img" />
            <span>StudyNest</span>
          </Link>
          <h1 className="auth-tagline">
            Your study<br />
            community awaits.
          </h1>
          <p className="auth-sub">
            Create an account and join topic-based rooms for DBMS, OS, DSA, CN, and more. Real-time help from real students.
          </p>
          <div className="auth-rooms">
            {["DBMS", "DSA", "OS", "CN", "TOC", "React", "GATE", "CP"].map((tag) => (
              <span key={tag} className="room-tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-desc">Join StudyNest for free</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="e.g. ayush_2003"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="btn-loader" /> : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>

          <a href={googleAuthUrl} className="auth-google-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.35 11.1H12v2.8h5.45c-.24 1.35-1.06 2.48-2.27 3.19v2.66h3.67c2.15-1.98 3.4-4.92 3.4-8.65 0-.6-.05-1.18-.15-1.75z" fill="#4285F4"/>
              <path d="M12 22c2.43 0 4.48-.8 5.97-2.17l-3.67-2.66c-1.02.69-2.33 1.1-3.9 1.1-3 0-5.55-2.02-6.46-4.74H1.82v2.97C3.3 19.9 7.34 22 12 22z" fill="#34A853"/>
              <path d="M5.54 13.53A6.99 6.99 0 015 12c0-.66.11-1.3.31-1.9V7.13H1.82A10.98 10.98 0 001 12c0 1.77.39 3.45 1.07 4.97l3.45-3.44z" fill="#FBBC05"/>
              <path d="M12 6.5c1.32 0 2.5.45 3.43 1.33l2.57-2.57C16.46 3.7 14.43 3 12 3 7.34 3 3.3 5.1 1.82 7.89l3.45 2.97C6.45 8.52 9 6.5 12 6.5z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;