import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import "../styles/sidebar.css";

gsap.registerPlugin(useGSAP);

// ============================================================
// SERVER BASE URL
// ============================================================

const RAW_API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

// Remove /api from the end because uploaded files are served
// from /uploads, not /api/uploads.
const SERVER_BASE = RAW_API_BASE
  .replace(/\/api\/?$/, "")
  .replace(/\/+$/, "");

// ============================================================
// NAVIGATION
// ============================================================

const NAV_ITEMS = {
  donor: [
    {
      to: "/donor",
      icon: "bi-speedometer2",
      label: "Dashboard",
    },
    {
      to: "/create-donation",
      icon: "bi-plus-circle",
      label: "Create Donation",
    },
    {
      to: "/my-donations",
      icon: "bi-box2-heart",
      label: "My Donations",
    },
    {
      to: "/donation-requests",
      icon: "bi-inboxes",
      label: "Donation Requests",
    },
    {
      to: "/campaigns",
      icon: "bi-megaphone-fill",
      label: "Campaigns",
    },
    {
      to: "/create-complaint",
      icon: "bi-exclamation-circle",
      label: "Raise Complaint",
    },
    {
      to: "/my-complaints",
      icon: "bi-flag-fill",
      label: "My Complaints",
    },
       {
      to: "/ngos",
      icon: "bi-building",
      label: "NGOs",
    },
    
   
  ],

  ngo: [
    {
      to: "/ngo",
      icon: "bi-speedometer2",
      label: "Dashboard",
    },
    {
      to: "/available-donations",
      icon: "bi-box-seam",
      label: "Available Donations",
    },
    {
      to: "/my-requests",
      icon: "bi-clipboard-check",
      label: "My Requests",
    },
    {
      to: "/ngo/create-campaign",
      icon: "bi-megaphone-fill",
      label: "Create Campaign",
    },
    {
      to: "/ngo/my-campaigns",
      icon: "bi-kanban-fill",
      label: "My Campaigns",
    },
    {
      to: "/create-complaint",
      icon: "bi-exclamation-circle",
      label: "Raise Complaint",
    },
    {
      to: "/my-complaints",
      icon: "bi-flag-fill",
      label: "My Complaints",
    },
    {
  to: "/ngo/public-profile",
  icon: "bi-building-gear",
  label: "Public Profile",
},
  {
    to: "/ngo-public-view",
    icon: "bi-eye",
    label: "View Public Profile",
  },
  {
  to: "/ngo-payment-details",
  icon: "bi-bank2",
  label: "Payment Details",
},{
  to: "/ngo/payments",
  icon: "bi-cash-stack",
  label: "Received Payments",
},

  ],

  volunteer: [
    {
      to: "/volunteer-dashboard",
      icon: "bi-speedometer2",
      label: "Dashboard",
    },
    {
      to: "/my-deliveries",
      icon: "bi-truck",
      label: "My Deliveries",
    },
    {
      to: "/create-complaint",
      icon: "bi-exclamation-circle",
      label: "Raise Complaint",
    },
    {
      to: "/my-complaints",
      icon: "bi-flag-fill",
      label: "My Complaints",
    },
  ],

  admin: [
    {
      to: "/admin",
      icon: "bi-speedometer2",
      label: "Dashboard",
    },
    {
      to: "/admin/users",
      icon: "bi-people-fill",
      label: "User Management",
    },
    {
      to: "/admin/donations",
      icon: "bi-box-seam-fill",
      label: "Donation Management",
    },
    {
      to: "/admin/campaign-approval",
      icon: "bi-megaphone-fill",
      label: "Campaign Approval",
    },
    {
      to: "/admin/campaigns",
      icon: "bi-kanban-fill",
      label: "Campaign Management",
    },
    {
      to: "/admin/complaints",
      icon: "bi-exclamation-triangle-fill",
      label: "Complaint Management",
    },
    {
      to: "/admin/audit-logs",
      icon: "bi-clock-history",
      label: "Audit Logs",
    },
    {
      to: "/admin/payment-verification",
      icon: "bi-cash-stack",
      label: "Payment Verification",
    },
    {
  to: "/admin/payments",
  icon: "bi-cash-stack",
  label: "All Payments",
},
  ],
};

// ============================================================
// READ USER FROM LOCAL STORAGE
// ============================================================

function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Sidebar: failed to read localStorage user:",
      error
    );

    return null;
  }
}

// ============================================================
// BUILD PROFILE IMAGE URL
// ============================================================

function getProfileImageUrl(profileImage) {
  if (!profileImage) {
    return null;
  }

  const image = String(profileImage).trim();

  if (!image) {
    return null;
  }

  // Already complete URL
  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  // /uploads/file.jpg
  if (image.startsWith("/")) {
    return `${SERVER_BASE}${image}`;
  }

  // uploads/file.jpg
  return `${SERVER_BASE}/${image}`;
}

// ============================================================
// SIDEBAR
// ============================================================

function Sidebar() {
  const location = useLocation();

  // Home page doesn't use sidebar
  const isHome =
    location.pathname === "/";

  // ==========================================================
  // USER STATE
  // ==========================================================

  const [user, setUser] = useState(
    getStoredUser
  );

  // ==========================================================
  // USER REFRESH
  // ==========================================================

  useEffect(() => {
    const refreshUser = () => {
      const updatedUser =
        getStoredUser();

      console.log(
        "SIDEBAR USER:",
        updatedUser
      );

      console.log(
        "SIDEBAR PROFILE IMAGE:",
        updatedUser?.profileImage
      );

      setUser(updatedUser);
    };

    const handleStorage = (event) => {
      if (event.key === "user") {
        refreshUser();
      }
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "user-updated",
      refreshUser
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "user-updated",
        refreshUser
      );
    };
  }, []);

  // ==========================================================
  // COLLAPSED STATE
  // ==========================================================

  const [collapsed, setCollapsed] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            "sidebarCollapsed"
          );

        return saved
          ? JSON.parse(saved)
          : false;
      } catch {
        return false;
      }
    });

  // ==========================================================
  // BODY CLASSES
  // ==========================================================

  useEffect(() => {
    if (isHome) {
      document.body.classList.remove(
        "sidebar-collapsed",
        "sidebar-expanded"
      );

      return;
    }

    localStorage.setItem(
      "sidebarCollapsed",
      JSON.stringify(collapsed)
    );

    document.body.classList.toggle(
      "sidebar-collapsed",
      collapsed
    );

    document.body.classList.toggle(
      "sidebar-expanded",
      !collapsed
    );
  }, [collapsed, isHome]);

  // ==========================================================
  // REFS
  // ==========================================================

  const sidebarRef =
    useRef(null);

  const navRef =
    useRef(null);

  const toggleRef =
    useRef(null);

  const indicatorRef =
    useRef(null);

  // ==========================================================
  // SIDEBAR WIDTH ANIMATION
  // ==========================================================

  useGSAP(() => {
    if (
      !sidebarRef.current ||
      !toggleRef.current
    ) {
      return;
    }

    gsap.to(
      sidebarRef.current,
      {
        width: collapsed
          ? 90
          : 290,

        duration: 0.45,

        ease: "power3.inOut",
      }
    );

    gsap.to(
      toggleRef.current,
      {
        left: collapsed
          ? 90
          : 290,

        duration: 0.45,

        ease: "power3.inOut",
      }
    );
  }, [collapsed]);

  // ==========================================================
  // ACTIVE NAV INDICATOR
  // ==========================================================

  useGSAP(() => {
    const nav = navRef.current;
    const indicator =
      indicatorRef.current;

    if (!nav || !indicator) {
      return;
    }

    const activeItem =
      nav.querySelector(
        ".sidebar-nav-item.active"
      );

    if (!activeItem) {
      gsap.to(
        indicator,
        {
          opacity: 0,
          duration: 0.25,
        }
      );

      return;
    }

    gsap.to(
      indicator,
      {
        top:
          activeItem.offsetTop,

        height:
          activeItem.offsetHeight,

        opacity: 1,

        duration: 0.5,

        ease: "power3.out",
      }
    );
  }, [
    location.pathname,
    collapsed,
  ]);

  // ==========================================================
  // NAV ICON MOUSE MOVEMENT
  // ==========================================================

  useGSAP(() => {
    if (!navRef.current) {
      return;
    }

    const items =
      Array.from(
        navRef.current.querySelectorAll(
          ".sidebar-nav-item"
        )
      );

    const cleanupFunctions = [];

    items.forEach((item) => {
      const icon =
        item.querySelector("i");

      if (!icon) {
        return;
      }

      const moveX =
        gsap.quickTo(
          icon,
          "x",
          {
            duration: 0.35,
            ease: "power3.out",
          }
        );

      const moveY =
        gsap.quickTo(
          icon,
          "y",
          {
            duration: 0.35,
            ease: "power3.out",
          }
        );

      const handleMove =
        (event) => {
          const rect =
            item.getBoundingClientRect();

          const relativeX =
            event.clientX -
            rect.left -
            rect.width * 0.15;

          const relativeY =
            event.clientY -
            rect.top -
            rect.height / 2;

          moveX(
            relativeX * 0.15
          );

          moveY(
            relativeY * 0.25
          );
        };

      const handleLeave =
        () => {
          moveX(0);
          moveY(0);
        };

      item.addEventListener(
        "pointermove",
        handleMove
      );

      item.addEventListener(
        "pointerleave",
        handleLeave
      );

      cleanupFunctions.push(
        () => {
          item.removeEventListener(
            "pointermove",
            handleMove
          );

          item.removeEventListener(
            "pointerleave",
            handleLeave
          );
        }
      );
    });

    return () => {
      cleanupFunctions.forEach(
        (cleanup) =>
          cleanup()
      );
    };
  }, [
    collapsed,
    location.pathname,
  ]);

  // ==========================================================
  // ACTIVE ICON POP ANIMATION
  // ==========================================================

  useGSAP(() => {
    const activeIcon =
      navRef.current?.querySelector(
        ".sidebar-nav-item.active i"
      );

    if (!activeIcon) {
      return;
    }

    gsap.fromTo(
      activeIcon,
      {
        scale: 0.6,
      },
      {
        scale: 1,
        duration: 0.5,
        ease: "back.out(2.5)",
      }
    );
  }, [location.pathname]);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    const button =
      document.querySelector(
        ".footer-btn.logout"
      );

    gsap.to(button, {
      keyframes: [
        { x: -4 },
        { x: 4 },
        { x: -3 },
        { x: 3 },
        { x: 0 },
      ],

      duration: 0.4,

      ease: "power1.inOut",

      onComplete: () => {
        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        window.location.href =
          "/login";
      },
    });
  };

  // ==========================================================
  // HOME
  // ==========================================================

  if (isHome) {
    return null;
  }

  // ==========================================================
  // DISPLAY NAME
  // ==========================================================

  const displayName = useMemo(() => {
    if (!user) {
      return "User";
    }

    // Organization donor
    if (
      user.role === "donor" &&
      user.donorType ===
        "organization"
    ) {
      return (
        user.organizationName ||
        user.name ||
        "Organization Donor"
      );
    }

    // NGO
    if (user.role === "ngo") {
      return (
        user.organizationName ||
        user.name ||
        "NGO"
      );
    }

    return user.name ||
      "User";
  }, [user]);

  // ==========================================================
  // INITIALS
  // ==========================================================

  const initials = useMemo(() => {
    const parts =
      displayName
        .split(" ")
        .filter(Boolean);

    const value =
      parts
        .slice(0, 2)
        .map(
          (part) =>
            part.charAt(0)
        )
        .join("");

    return (
      value || "KB"
    ).toUpperCase();
  }, [displayName]);

  // ==========================================================
  // PROFILE IMAGE URL
  // ==========================================================

  const profileImageUrl =
    useMemo(
      () =>
        getProfileImageUrl(
          user?.profileImage
        ),
      [user?.profileImage]
    );

  // ==========================================================
  // ROLE LABEL
  // ==========================================================

  const roleLabel = useMemo(() => {
    if (!user) {
      return "User";
    }

    if (user.role === "ngo") {
      return "NGO";
    }

    if (
      user.role ===
      "volunteer"
    ) {
      return "Volunteer";
    }

    if (
      user.role === "admin"
    ) {
      return "Administrator";
    }

    if (
      user.role === "donor" &&
      user.donorType ===
        "organization"
    ) {
      return "Organization Donor";
    }

    return "Individual Donor";
  }, [user]);

  // ==========================================================
  // ROLE ICON
  // ==========================================================

  const roleIcon =
    useMemo(() => {
      if (!user) {
        return "bi-person";
      }

      if (
        user.role === "ngo"
      ) {
        return "bi-building";
      }

      if (
        user.role ===
        "volunteer"
      ) {
        return "bi-truck";
      }

      if (
        user.role === "admin"
      ) {
        return "bi-shield-check";
      }

      return "bi-person";
    }, [user]);

  // ==========================================================
  // NAV ITEMS
  // ==========================================================

  const items =
    NAV_ITEMS[
      user?.role
    ] || [];

  const isActive =
    (path) =>
      location.pathname ===
      path;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ====================================================
          TOGGLE
      ==================================================== */}

      <button
        ref={toggleRef}
        className="sidebar-toggle"
        onClick={() =>
          setCollapsed(
            (previous) =>
              !previous
          )
        }
        aria-label={
          collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
        }
      >
        <i
          className={`bi ${
            collapsed
              ? "bi-plus-lg"
              : "bi-x-lg"
          }`}
        />
      </button>

      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <aside
        ref={sidebarRef}
        className={`sidebar ${
          collapsed
            ? "collapsed"
            : ""
        }`}
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="sidebar-header">
          <div className="logo-box">
            <div
              className="logo-icon"
              aria-hidden="true"
            />

            {!collapsed && (
              <div className="logo-text">
                <h2>
                  KifuBridge
                </h2>

                <span>
                  Donation Route
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            PROFILE
        ================================================== */}

        <div className="profile-card">
          <div className="sidebar-avatar-wrapper">
            <div className="sidebar-avatar">
              {profileImageUrl ? (
                <img
                  src={
                    profileImageUrl
                  }
                  alt={
                    displayName
                  }
                  className="sidebar-avatar-img"
                  loading="eager"
                  onLoad={() => {
                    console.log(
                      "PROFILE IMAGE LOADED:",
                      profileImageUrl
                    );
                  }}
                  onError={(event) => {
                    console.error(
                      "PROFILE IMAGE FAILED:",
                      profileImageUrl
                    );

                    event.currentTarget.style.display =
                      "none";

                    const fallback =
                      event.currentTarget
                        .parentElement
                        ?.querySelector(
                          ".sidebar-avatar-fallback"
                        );

                    if (
                      fallback
                    ) {
                      fallback.style.display =
                        "flex";
                    }
                  }}
                />
              ) : null}

              <div
                className="sidebar-avatar-fallback"
                style={{
                  display:
                    profileImageUrl
                      ? "none"
                      : "flex",
                }}
              >
                {initials}
              </div>
            </div>

            <span className="profile-online-dot" />
          </div>

          {!collapsed && (
            <div className="sidebar-profile-info">
              <h3
                title={
                  displayName
                }
              >
                {displayName}
              </h3>

              <div className="sidebar-profile-role">
                <i
                  className={`bi ${roleIcon}`}
                />

                <span>
                  {roleLabel}
                </span>
              </div>

              <div className="profile-status">
                <span className="profile-status-dot" />

                <span>
                  Active now
                </span>
              </div>

              <Link
                to="/profile"
                className="profile-view-btn"
              >
                <span>
                  <i className="bi bi-person-circle" />

                  View Profile
                </span>

                <i className="bi bi-arrow-right" />
              </Link>
            </div>
          )}
        </div>

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <nav
          ref={navRef}
          className="sidebar-nav"
        >
          <div
            ref={indicatorRef}
            className="nav-indicator"
            aria-hidden="true"
          />

          {items.map(
            (item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-nav-item ${
                  isActive(
                    item.to
                  )
                    ? "active"
                    : ""
                }`}
                title={
                  collapsed
                    ? item.label
                    : undefined
                }
              >
                <i
                  className={`bi ${item.icon}`}
                />

                {!collapsed && (
                  <span>
                    {
                      item.label
                    }
                  </span>
                )}
              </Link>
            )
          )}
        </nav>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="sidebar-footer">
          <button
            className="footer-btn logout"
            onClick={
              handleLogout
            }
          >
            <i className="bi bi-box-arrow-right" />

            {!collapsed && (
              <span>
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;