import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/navbar.css";
import NotificationBell from "./NotificationBell";

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function BackIcon() {
  return (
    <svg {...iconProps}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <line x1="12" y1="15" x2="16" y2="10" />
      <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <polyline points="14 15 19 10 14 5" />
      <line x1="19" y1="10" x2="8" y2="10" />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <polyline points="9 15 4 10 9 5" />
      <line x1="4" y1="10" x2="15" y2="10" />
    </svg>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/";

    switch (user.role) {
      case "admin":
        return "/admin";
      case "donor":
        return "/donor";
      case "ngo":
        return "/ngo";
      case "volunteer":
        return "/volunteer-dashboard";
      default:
        return "/";
    }
  };

  const isHome = location.pathname === "/";
  const showBack = !isHome;

  return (
    <nav
      className={`custom-navbar${scrolled ? " scrolled" : ""}${
        isHome ? " navbar-full" : ""
      }`}
    >
      {/* Left — back button */}
      <div className="navbar-side navbar-side-left">
        {showBack && (
          <button
            className="nav-icon-btn"
            onClick={() => navigate(-1)}
            title="Go back"
            aria-label="Go back"
          >
            <BackIcon />
          </button>
        )}
      </div>

      {/* Center — brand */}
      <Link to={token ? getDashboardLink() : "/"} className="navbar-brand">
        <svg
          className="brand-mark"
          width="24"
          height="18"
          viewBox="0 0 26 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="4" y1="17" x2="22" y2="17" stroke="#e8a33d" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="4" x2="6" y2="17" stroke="#d19029" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="4" x2="20" y2="17" stroke="#fdf8f0" strokeWidth="2" strokeLinecap="round" />
          <path d="M6,6 Q13,13 20,6" fill="none" stroke="#e8a33d" strokeWidth="1.4" />
          <line x1="10" y1="17" x2="10" y2="9" stroke="rgba(253,248,240,0.5)" strokeWidth="1" />
          <line x1="16" y1="17" x2="16" y2="9" stroke="rgba(253,248,240,0.5)" strokeWidth="1" />
        </svg>
        <span>KifuBridge</span>
      </Link>

      {/* Right — actions */}
      <div className="navbar-side navbar-side-right">
        {token && <NotificationBell />}

        {token ? (
          <>
            <Link to={getDashboardLink()} className="nav-icon-btn" title="Dashboard">
              <DashboardIcon />
            </Link>

            <button className="nav-icon-btn danger" onClick={logout}>
              <LogoutIcon />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-icon-btn">
              <LoginIcon />
            </Link>

            <Link to="/register" className="btn-getstarted">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;