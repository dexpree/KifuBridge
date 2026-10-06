import { useState, useEffect, useRef } from "react";
import "../styles/notification.css";

// Matches the stroke-icon style already used in Navbar.jsx
const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function BellIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function NotificationBell({ notifications = [], onMarkAllRead, onNotificationClick }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePanel = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && unreadCount > 0 && onMarkAllRead) {
        onMarkAllRead();
      }
      return next;
    });
  };

  return (
    <div className="notif-wrapper">
      <button
        ref={btnRef}
        className="notif-bell-btn"
        onClick={togglePanel}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div ref={panelRef} className="notif-panel">
          <div className="notif-panel-header">
            <span>Notifications</span>
          </div>

          <div className="notif-panel-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">You're all caught up.</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className={`notif-item ${n.read ? "" : "notif-item-unread"}`}
                  onClick={() => onNotificationClick && onNotificationClick(n)}
                >
                  <span className="notif-item-dot" />
                  <div className="notif-item-body">
                    <p className="notif-item-text">{n.message}</p>
                    {n.timeAgo && (
                      <span className="notif-item-time">{n.timeAgo}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;