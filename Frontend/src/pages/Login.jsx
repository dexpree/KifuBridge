import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import API from "../services/api";
import "../styles/login.css";

// ==========================================================
// SMALL "WHO ARE THEY" CARDS — donor / ngo / volunteer.
// These auto-cycle one at a time (CSS-driven) the same way a
// PowerPoint "Appear" + "Fly In" sequence would step through
// a set of bullets. Only one is visible at a time, in "small".
// ==========================================================
const ROLE_CARDS = [
  {
    key: "donor",
    emoji: "💛",
    label: "YOUR DONATION",
    text: "May become a meal, a useful item, or a new opportunity for someone who needs it.",
  },
  {
    key: "ngo",
    emoji: "🤝",
    label: "YOUR NGO",
    text: "Turns every contribution into real support delivered to the people who need it most.",
  },
  {
    key: "volunteer",
    emoji: "🚚",
    label: "YOUR EFFORT",
    text: "Carries hope from doorstep to doorstep, one delivery at a time.",
  },
];

function Login() {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const submitRef = useRef(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================================
  // INPUT CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (message) {
      setMessage("");
    }
  };

  // ==========================================================
  // CURSOR SPOTLIGHT — tracks the pointer over the glass card
  // and feeds its position into CSS custom properties, purely
  // imperative (no re-renders) for smooth 60fps tracking.
  // ==========================================================

  const handleCardMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);
  };

  // ==========================================================
  // BUTTON RIPPLE — a short-lived span that expands from the
  // click point, cleaned up once its animation finishes.
  // ==========================================================

  const handleSubmitRipple = (e) => {
    const button = submitRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");

    const size = Math.max(rect.width, rect.height) * 1.6;

    ripple.className = "auth-submit-ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    button.appendChild(ripple);

    ripple.addEventListener("animationend", () => {
      ripple.remove();
    });
  };

  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const res = await API.post("/auth/login", formData);

      // ------------------------------------------------------
      // STORE TOKEN
      // ------------------------------------------------------

      localStorage.setItem("token", res.data.token);

      // ------------------------------------------------------
      // STORE USER
      // ------------------------------------------------------

      const loggedInUser = res.data.user;

      localStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );

      // Notify other components
      window.dispatchEvent(new Event("user-updated"));

      // ------------------------------------------------------
      // ROLE REDIRECTION
      // ------------------------------------------------------

      const role = loggedInUser?.role;

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "ngo") {
        navigate("/ngo");
      } else if (role === "volunteer") {
        navigate("/volunteer-dashboard");
      } else if (role === "donor") {
        navigate("/donor");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to login. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* =====================================================
          BACKGROUND DECORATIONS
      ===================================================== */}

      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />
      <div className="background-glow glow-three" />

      <div className="floating-particle particle-1" />
      <div className="floating-particle particle-2" />
      <div className="floating-particle particle-3" />
      <div className="floating-particle particle-4" />
      <div className="floating-particle particle-5" />
      <div className="floating-particle particle-6" />

      {/* Floating hearts */}

      <span className="floating-heart heart-1">♥</span>
      <span className="floating-heart heart-2">♥</span>
      <span className="floating-heart heart-3">♥</span>

      {/* =====================================================
          MAIN SHELL
      ===================================================== */}

      <div className="auth-shell">

        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <section className="auth-visual">

          {/* BRAND */}

          <div className="visual-brand anim-appear" style={{ "--d": "0s" }}>

            <span className="visual-brand-mark">
              K
            </span>

            <span className="visual-brand-name">
              KifuBridge
            </span>

          </div>


          {/* MAIN MESSAGE */}

          <div className="auth-visual-content">

            <div className="welcome-line anim-appear" style={{ "--d": "0.15s" }}>
              <span>👋</span>
              <span>Welcome to KifuBridge</span>
            </div>

            <h1 className="anim-fly-in" style={{ "--d": "0.3s" }}>
              Give a little.
              <br />

              <span className="anim-fly-in" style={{ "--d": "0.5s" }}>
                Change a lot.
              </span>
            </h1>

            <p className="visual-description anim-fly-in" style={{ "--d": "0.7s" }}>
              Every donation can become someone's hope.
              Every helping hand can build a stronger
              community.
            </p>


            {/* =================================================
                ROLE SHOWCASE — small cards that cycle through
                Donor / NGO / Volunteer, one at a time, the same
                way a PowerPoint sequence steps through bullets
                using Appear + Fly In + Transport (morph) style
                motion.
            ================================================= */}

            <div
              className="role-showcase anim-transport"
              style={{ "--d": "0.9s" }}
            >

              {ROLE_CARDS.map((card, index) => (
                <div
                  className="role-showcase-card"
                  key={card.key}
                  style={{ "--slide-delay": `${index * 3}s` }}
                >

                  <div className="donation-emoji-wrap">
                    <span className="donation-emoji-ring"></span>
                    <div className="donation-emoji">
                      {card.emoji}
                    </div>
                  </div>

                  <div>

                    <div className="donation-title">
                      {card.label}
                    </div>

                    <p>
                      {card.text}
                    </p>

                  </div>

                </div>
              ))}

              <div className="role-showcase-dots">
                {ROLE_CARDS.map((card, index) => (
                  <span
                    className="role-showcase-dot"
                    key={card.key}
                    style={{ "--slide-delay": `${index * 3}s` }}
                  />
                ))}
              </div>

            </div>


            {/* =================================================
                ROLE LIST
            ================================================= */}

            <div className="role-list">

              <div className="role-item anim-fly-in" style={{ "--d": "1.1s" }}>

                <div className="role-icon">
                  🎁
                </div>

                <div className="role-content">

                  <strong>
                    Donors
                  </strong>

                  <span>
                    Give what you can
                  </span>

                </div>

              </div>


              <div className="role-item anim-fly-in" style={{ "--d": "1.25s" }}>

                <div className="role-icon">
                  🤝
                </div>

                <div className="role-content">

                  <strong>
                    NGOs
                  </strong>

                  <span>
                    Keep helping others
                  </span>

                </div>

              </div>


              <div className="role-item anim-fly-in" style={{ "--d": "1.4s" }}>

                <div className="role-icon">
                  🚚
                </div>

                <div className="role-content">

                  <strong>
                    Volunteers
                  </strong>

                  <span>
                    Deliver kindness
                  </span>

                </div>

              </div>

            </div>


            {/* =================================================
                BOTTOM MESSAGE
            ================================================= */}

            <div className="impact-message anim-appear" style={{ "--d": "1.6s" }}>

              <span className="impact-heart">
                ♥
              </span>

              <span>
                Together, we can make
                <strong> generosity </strong>
                go further.
              </span>

            </div>

          </div>


          {/* =================================================
              FLOATING DONATION PATH
          ================================================= */}

          <div className="floating-donation gift-float">
            🎁
          </div>

          <div className="floating-donation hand-float">
            🤝
          </div>

          <div className="floating-donation truck-float">
            🚚
          </div>


          {/* =================================================
              DECORATIVE CONNECTION LINE
          ================================================= */}

          <div className="connection-line">
            <span />
            <span />
            <span />
          </div>

        </section>


        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <section className="auth-form-side">

          <div className="auth-form-area">

            {/* =================================================
                LOGIN GLASS CARD
            ================================================= */}

            <div
              className="auth-card"
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
            >

              {/* Rotating conic sheen tracing the border */}
              <div className="auth-card-sheen"></div>

              {/* Cursor-following spotlight */}
              <div className="auth-card-spotlight"></div>

              {/* =================================================
                  BACK TO HOME — now lives inside the card
              ================================================= */}

              <Link
                to="/"
                className="auth-back"
              >

                <span className="auth-back-icon">

                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >

                    <path
                      d="M10 3L5 8L10 13"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                  </svg>

                </span>

                <span>
                  Back to Home
                </span>

              </Link>


              {/* Small label */}

              <div className="auth-heading">

                <span className="auth-heading-label">
                  WELCOME BACK
                </span>

                <h2>
                  Welcome back.
                </h2>

                <p>
                  Sign in to continue making a difference.
                </p>

              </div>


              {/* =================================================
                  ERROR MESSAGE
              ================================================= */}

              {message && (
                <div className="auth-alert error">

                  <span className="alert-icon">
                    !
                  </span>

                  <span>
                    {message}
                  </span>

                </div>
              )}


              {/* =================================================
                  FORM
              ================================================= */}

              <form
                className="auth-form"
                onSubmit={handleSubmit}
              >

                {/* EMAIL */}

                <div className="auth-field">

                  <label htmlFor="email">
                    Email Address
                  </label>

                  <div className="input-wrapper">

                    <span className="input-icon">

                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >

                        <path
                          d="M4 5H20C21.1 5 22 5.9 22 7V17C22 18.1 21.1 19 20 19H4C2.9 19 2 18.1 2 17V7C2 5.9 2.9 5 4 5Z"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />

                        <path
                          d="M22 7L12 13L2 7"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                      </svg>

                    </span>


                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      required
                    />

                  </div>

                </div>


                {/* PASSWORD */}

                <div className="auth-field">

                  <label htmlFor="password">
                    Password
                  </label>

                  <div className="input-wrapper">

                    <span className="input-icon">

                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >

                        <rect
                          x="4"
                          y="10"
                          width="16"
                          height="11"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />

                        <path
                          d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />

                      </svg>

                    </span>


                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      required
                    />


                    {/* PASSWORD VISIBILITY */}

                    <button
                      type="button"
                      className="auth-toggle-visibility"
                      onClick={() =>
                        setShowPassword(
                          (previous) => !previous
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >

                      {showPassword ? (

                        <svg
                          width="19"
                          height="19"
                          viewBox="0 0 24 24"
                          fill="none"
                        >

                          <path
                            d="M3 3L21 21"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />

                          <path
                            d="M10.6 10.6C10.2 11 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 13 13.8 13.4 13.4"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />

                          <path
                            d="M9.9 4.2C10.6 4.1 11.3 4 12 4C17.5 4 21 8.3 22 12C21.6 13.5 20.7 15.1 19.3 16.4"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />

                          <path
                            d="M6.6 6.6C4.7 8 3.4 10.1 2 12C3 15.7 6.5 20 12 20C13.7 20 15.2 19.6 16.5 19"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />

                        </svg>

                      ) : (

                        <svg
                          width="19"
                          height="19"
                          viewBox="0 0 24 24"
                          fill="none"
                        >

                          <path
                            d="M2 12C3.5 7.5 7.1 4 12 4C16.9 4 20.5 7.5 22 12C20.5 16.5 16.9 20 12 20C7.1 20 3.5 16.5 2 12Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />

                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />

                        </svg>

                      )}

                    </button>

                  </div>

                </div>


                {/* =================================================
                    SIGN IN BUTTON
                ================================================= */}

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                  ref={submitRef}
                  onClick={handleSubmitRipple}
                >

                  {loading ? (

                    <span className="login-loading">

                      <span className="loading-spinner" />

                      Logging in...

                    </span>

                  ) : (

                    <>
                      <span>
                        Sign In
                      </span>

                      <span className="auth-submit-arrow">
                        →
                      </span>
                    </>

                  )}

                </button>

              </form>


              {/* =================================================
                  REGISTER
              ================================================= */}

              <p className="auth-footer">

                Don't have an account?

                <Link to="/register">
                  Create an account
                </Link>

              </p>


              {/* =================================================
                  SECURITY
              ================================================= */}

              <div className="auth-security">

                <span className="auth-security-badge">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >

                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />

                    <path
                      d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />

                  </svg>
                </span>

                <span>
                  Your information is securely protected.
                </span>

              </div>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Login;