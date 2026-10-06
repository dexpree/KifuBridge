import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";
import HeroBanner from "../components/HeroBanner";
import DashboardCard from "../components/DashboardCard";
import QuickActionCard from "../components/QuickActionCard";

import "../styles/VolunteerDashboard.css";

function VolunteerDashboard() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user")
      );
    } catch {
      return null;
    }
  });

  const [stats, setStats] = useState({
    availableDeliveries: 0,
    myDeliveries: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    recentActivity: [],
  });

  const [loading, setLoading] = useState(true);

  // ==========================================================
  // FETCH DASHBOARD
  // ==========================================================

  useEffect(() => {
    fetchStats();
  }, []);

  // ==========================================================
  // REFRESH USER
  // ==========================================================

  useEffect(() => {
    const refreshUser = () => {
      try {
        const storedUser =
          localStorage.getItem("user");

        setUser(
          storedUser
            ? JSON.parse(storedUser)
            : null
        );
      } catch {
        setUser(null);
      }
    };

    window.addEventListener(
      "user-updated",
      refreshUser
    );

    window.addEventListener(
      "storage",
      refreshUser
    );

    return () => {
      window.removeEventListener(
        "user-updated",
        refreshUser
      );

      window.removeEventListener(
        "storage",
        refreshUser
      );
    };
  }, []);

  // ==========================================================
  // FETCH VOLUNTEER STATS
  // ==========================================================

  const fetchStats = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      const res = await API.get(
        "/requests/volunteer-dashboard-stats",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      console.log(
        "VOLUNTEER DASHBOARD:",
        res.data
      );

      setStats({
        availableDeliveries:
          Number(
            res.data?.availableDeliveries
          ) || 0,

        myDeliveries:
          Number(
            res.data?.myDeliveries
          ) || 0,

        activeDeliveries:
          Number(
            res.data?.activeDeliveries
          ) || 0,

        completedDeliveries:
          Number(
            res.data?.completedDeliveries
          ) || 0,

        recentActivity:
          Array.isArray(
            res.data?.recentActivity
          )
            ? res.data.recentActivity
            : [],
      });
    } catch (error) {
      console.error(
        "Volunteer Dashboard Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // DISPLAY DATE
  // ==========================================================

  const formatActivityDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================================
  // ACTIVITY COUNTS
  // ==========================================================

  const assignedActions =
    stats.recentActivity.filter(
      (activity) =>
        activity.type ===
        "delivery_assigned"
    ).length;

  const completedActions =
    stats.recentActivity.filter(
      (activity) =>
        activity.type ===
        "delivery_finished"
    ).length;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      {/* ======================================================
          HERO
      ====================================================== */}

      <HeroBanner
        name={user?.name}
        role="Volunteer"
      />

      {/* ======================================================
          VOLUNTEER PROFILE STRIP
      ====================================================== */}

      <div className="vol-profile-strip">

        <div className="vol-profile-main">

          <div className="vol-profile-icon">
            <i className="bi bi-truck"></i>
          </div>

          <div>
            <h5>
              {user?.name || "Volunteer"}
            </h5>

            <p>
              {user?.vehicleType ||
                "Volunteer Delivery Service"}
            </p>
          </div>

        </div>

        <div className="vol-profile-meta">

          <span className="vol-availability-badge">
            <span></span>

            {user?.availability ||
              "Availability unknown"}
          </span>

          <Link
            to="/profile"
            className="vol-profile-link"
          >
            View Profile
            <i className="bi bi-arrow-right"></i>
          </Link>

        </div>

      </div>

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div className="row mb-4">

        <DashboardCard
          title="My Deliveries"
          value={
            loading
              ? "..."
              : stats.myDeliveries
          }
          icon="bi bi-box-seam"
          color="warning"
        />

        <DashboardCard
          title="Active Deliveries"
          value={
            loading
              ? "..."
              : stats.activeDeliveries
          }
          icon="bi bi-arrow-repeat"
          color="info"
        />

        <DashboardCard
          title="Completed"
          value={
            loading
              ? "..."
              : stats.completedDeliveries
          }
          icon="bi bi-check-circle"
          color="success"
        />

      </div>

      {/* ======================================================
          WORK CENTER + DELIVERY STATUS
      ====================================================== */}

      <div className="row g-4">

        {/* ================= WORK CENTER ================= */}

        <div className="col-lg-7">

          <div className="vol-dashboard-panel">

            <div className="vol-panel-header">

              <div>
                <span className="vol-panel-eyebrow">
                  WORK CENTER
                </span>

                <h4>
                  Your delivery tasks
                </h4>
              </div>

              <i className="bi bi-lightning-charge-fill"></i>

            </div>

            <div className="vol-action-list">

              <Link
                to="/my-deliveries"
                className="vol-action-row"
              >
                <div className="vol-action-icon vol-action-primary">
                  <i className="bi bi-truck"></i>
                </div>

                <div className="vol-action-content">

                  <strong>
                    Assigned Deliveries
                  </strong>

                  <span>
                    {stats.activeDeliveries} active
                    delivery
                    {stats.activeDeliveries !== 1
                      ? "ies"
                      : ""}
                  </span>

                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

              <Link
                to="/my-deliveries"
                className="vol-action-row"
              >
                <div className="vol-action-icon vol-action-warning">
                  <i className="bi bi-box-seam"></i>
                </div>

                <div className="vol-action-content">

                  <strong>
                    Manage Pickups
                  </strong>

                  <span>
                    Respond to assignments and pickup tasks
                  </span>

                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

              <Link
                to="/my-deliveries"
                className="vol-action-row"
              >
                <div className="vol-action-icon vol-action-success">
                  <i className="bi bi-clock-history"></i>
                </div>

                <div className="vol-action-content">

                  <strong>
                    Delivery History
                  </strong>

                  <span>
                    View completed delivery records
                  </span>

                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

            </div>

          </div>

        </div>

        {/* ================= DELIVERY STATUS ================= */}

        <div className="col-lg-5">

          <div className="vol-dashboard-panel vol-status-panel">

            <div className="vol-panel-header">

              <div>
                <span className="vol-panel-eyebrow">
                  DELIVERY STATUS
                </span>

                <h4>
                  Current workload
                </h4>
              </div>

              <i className="bi bi-activity"></i>

            </div>

            <div className="vol-status-stat">

              <div className="vol-status-icon">
                <i className="bi bi-arrow-repeat"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : stats.activeDeliveries}
                </strong>

                <span>
                  Active deliveries
                </span>
              </div>

            </div>

            <div className="vol-status-stat">

              <div className="vol-status-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : stats.completedDeliveries}
                </strong>

                <span>
                  Completed deliveries
                </span>
              </div>

            </div>

            <div className="vol-status-stat">

              <div className="vol-status-icon">
                <i className="bi bi-box"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : stats.myDeliveries}
                </strong>

                <span>
                  Total assignments
                </span>
              </div>

            </div>

            <Link
              to="/my-deliveries"
              className="vol-status-link"
            >
              Open delivery dashboard
              <i className="bi bi-arrow-right"></i>
            </Link>

          </div>

        </div>

      </div>

      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}

      <h3 className="fw-bold mt-5 mb-4">

        <i className="bi bi-grid-fill text-warning me-2"></i>

        Quick Actions

      </h3>

      <div className="row">

        <QuickActionCard
          title="Assigned Deliveries"
          description="Review and respond to new assignments."
          icon="bi bi-truck"
          color="primary"
          link="/my-deliveries"
          button="Open"
        />

        <QuickActionCard
          title="My Deliveries"
          description="Manage pickup and delivery tasks."
          icon="bi bi-box-seam"
          color="success"
          link="/my-deliveries"
          button="Manage"
        />

        <QuickActionCard
          title="Delivery History"
          description="Review successfully completed deliveries."
          icon="bi bi-clock-history"
          color="warning"
          link="/my-deliveries"
          button="View History"
        />

        <QuickActionCard
          title="Volunteer Profile"
          description="Manage your vehicle and volunteer information."
          icon="bi bi-person-circle"
          color="info"
          link="/profile"
          button="View Profile"
        />

      </div>

      {/* ======================================================
          RECENT ACTIVITY
      ====================================================== */}

      <div className="card shadow-lg border-0 mt-5 volunteer-recent-card">

        <div className="card-body">

          <div className="vol-recent-header">

            <div>
              <span className="vol-panel-eyebrow">
                ACTIVITY FEED
              </span>

              <h4 className="fw-bold volunteer-recent-title">
                Recent Activity
              </h4>

              <p>
                Your latest delivery updates and assignments.
              </p>
            </div>

            <Link
              to="/my-deliveries"
              className="vol-view-all"
            >
              View Deliveries
              <i className="bi bi-arrow-right"></i>
            </Link>

          </div>

          <hr />

          {loading ? (

            <div className="volunteer-activity-loading">
              Loading recent activity...
            </div>

          ) : stats.recentActivity.length === 0 ? (

            <div className="volunteer-activity-empty">

              <div className="volunteer-empty-icon">
                <i className="bi bi-clock-history"></i>
              </div>

              <h6>
                No recent activity
              </h6>

              <small>
                Delivery assignments and progress updates
                will appear here.
              </small>

            </div>

          ) : (

            <div className="volunteer-activity-list">

              {stats.recentActivity.map(
                (activity, index) => (

                  <VolunteerActivityItem
                    key={
                      activity.requestId ||
                      activity.donationId ||
                      `${activity.type}-${index}`
                    }
                    activity={activity}
                    date={
                      formatActivityDate(
                        activity.createdAt
                      )
                    }
                    isLast={
                      index ===
                      stats.recentActivity.length - 1
                    }
                  />

                )
              )}

            </div>

          )}

        </div>

      </div>

    </DashboardLayout>
  );
}

// ============================================================
// ACTIVITY ITEM
// ============================================================

function VolunteerActivityItem({
  activity,
  date,
  isLast,
}) {
  return (
    <div
      className={`volunteer-activity-item ${
        isLast
          ? "volunteer-activity-item-last"
          : ""
      }`}
    >

      <div className="volunteer-activity-icon-wrapper">

        <div
          className={`volunteer-activity-icon volunteer-activity-${
            activity.color || "primary"
          }`}
        >
          <i
            className={`bi ${
              activity.icon ||
              "bi-circle"
            }`}
          ></i>
        </div>

        {!isLast && (
          <div className="volunteer-activity-line"></div>
        )}

      </div>

      <div className="volunteer-activity-content">

        <div className="volunteer-activity-content-top">

          <div>

            <h6 className="mb-1">
              {activity.title ||
                "Activity"}
            </h6>

            <small className="text-muted">
              {activity.description ||
                ""}
            </small>

          </div>

          {date && (
            <small className="volunteer-activity-date">
              {date}
            </small>
          )}

        </div>

      </div>

    </div>
  );
}

export default VolunteerDashboard;