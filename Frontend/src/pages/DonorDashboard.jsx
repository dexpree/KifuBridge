import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";
import DashboardCard from "../components/DashboardCard";
import HeroBanner from "../components/HeroBanner";
import QuickActionCard from "../components/QuickActionCard";

import "../styles/DonorDashboard.css";

function DonorDashboard() {
  const [stats, setStats] = useState({
    totalDonations: 0,
    pendingRequests: 0,
    activeDeliveries: 0,
    completedDonations: 0,
    recentActivity: [],
  });

  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user")
      );
    } catch {
      return null;
    }
  });

  // ==========================================================
  // FETCH DASHBOARD
  // ==========================================================

  useEffect(() => {
    fetchDashboardStats();
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
  // DASHBOARD API
  // ==========================================================

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      const res = await API.get(
        "/donations/dashboard-stats",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      console.log(
        "DONOR DASHBOARD:",
        res.data
      );

      setStats({
        totalDonations:
          Number(
            res.data?.totalDonations
          ) || 0,

        pendingRequests:
          Number(
            res.data?.pendingRequests
          ) || 0,

        activeDeliveries:
          Number(
            res.data?.activeDeliveries
          ) || 0,

        completedDonations:
          Number(
            res.data?.completedDonations
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
        "Donor Dashboard Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // DISPLAY NAME
  // ==========================================================

  const displayName =
    user?.role === "donor" &&
    user?.donorType ===
      "organization"
      ? user?.organizationName ||
        user?.name ||
        "Organization Donor"
      : user?.name ||
        "Donor";

  // ==========================================================
  // DONOR TYPE
  // ==========================================================

  const donorTypeLabel =
    user?.donorType ===
    "organization"
      ? "Organization Donor"
      : "Individual Donor";

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatActivityDate = (
    value
  ) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================================
  // ACTION COUNTS
  // ==========================================================

  const pendingCount =
    stats.pendingRequests;

  const activeCount =
    stats.activeDeliveries;

  const completedCount =
    stats.completedDonations;

  return (
    <DashboardLayout>

      {/* ======================================================
          HERO
      ====================================================== */}

      <HeroBanner
        name={displayName}
        role={donorTypeLabel}
      />

      {/* ======================================================
          DONOR PROFILE STRIP
      ====================================================== */}

      <div className="donor-profile-strip">

        <div className="donor-profile-main">

          <div className="donor-profile-icon">
            <i className="bi bi-heart-fill"></i>
          </div>

          <div>
            <h5>
              {displayName}
            </h5>

            <p>
              {donorTypeLabel}
            </p>
          </div>

        </div>

        <div className="donor-profile-meta">

          <span className="donor-impact-badge">
            <i className="bi bi-heart-fill"></i>
            Making an impact
          </span>

          <Link
            to="/profile"
            className="donor-profile-link"
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
          title="My Donations"
          value={
            loading
              ? "..."
              : stats.totalDonations
          }
          icon="bi bi-box2-heart"
          color="primary"
        />

        <DashboardCard
          title="Pending Requests"
          value={
            loading
              ? "..."
              : stats.pendingRequests
          }
          icon="bi bi-clock-history"
          color="warning"
        />

        <DashboardCard
          title="Active Deliveries"
          value={
            loading
              ? "..."
              : stats.activeDeliveries
          }
          icon="bi bi-truck"
          color="info"
        />

        <DashboardCard
          title="Completed"
          value={
            loading
              ? "..."
              : stats.completedDonations
          }
          icon="bi bi-check-circle"
          color="success"
        />

      </div>

      {/* ======================================================
          DONATION CENTER + IMPACT
      ====================================================== */}

      <div className="row g-4">

        {/* ================= DONATION CENTER ================= */}

        <div className="col-lg-7">

          <div className="donor-dashboard-panel">

            <div className="donor-panel-header">

              <div>
                <span className="donor-panel-eyebrow">
                  DONATION CENTER
                </span>

                <h4>
                  Manage your giving
                </h4>
              </div>

              <i className="bi bi-gift-fill"></i>

            </div>

            <div className="donor-action-list">

              <Link
                to="/create-donation"
                className="donor-action-row"
              >
                <div className="donor-action-icon donor-action-primary">
                  <i className="bi bi-plus-circle-fill"></i>
                </div>

                <div className="donor-action-content">

                  <strong>
                    Create a Donation
                  </strong>

                  <span>
                    Share food, clothing, books and other items
                  </span>

                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

              <Link
                to="/donation-requests"
                className="donor-action-row"
              >
                <div className="donor-action-icon donor-action-warning">
                  <i className="bi bi-clipboard-check-fill"></i>
                </div>

                <div className="donor-action-content">

                  <strong>
                    Review NGO Requests
                  </strong>

                  <span>
                    {pendingCount > 0
                      ? `${pendingCount} request${
                          pendingCount !== 1
                            ? "s"
                            : ""
                        } waiting for your response`
                      : "No pending NGO requests"}
                  </span>

                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

              <Link
                to="/my-donations"
                className="donor-action-row"
              >
                <div className="donor-action-icon donor-action-success">
                  <i className="bi bi-box2-heart-fill"></i>
                </div>

                <div className="donor-action-content">

                  <strong>
                    Manage My Donations
                  </strong>

                  <span>
                    Track availability and donation status
                  </span>

                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

            </div>

          </div>

        </div>

        {/* ================= IMPACT OVERVIEW ================= */}

        <div className="col-lg-5">

          <div className="donor-dashboard-panel donor-impact-panel">

            <div className="donor-panel-header">

              <div>
                <span className="donor-panel-eyebrow">
                  YOUR IMPACT
                </span>

                <h4>
                  Donation progress
                </h4>
              </div>

              <i className="bi bi-bar-chart-fill"></i>

            </div>

            <div className="donor-impact-stat">

              <div className="donor-impact-stat-icon">
                <i className="bi bi-box-seam"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : stats.totalDonations}
                </strong>

                <span>
                  Total donations
                </span>
              </div>

            </div>

            <div className="donor-impact-stat">

              <div className="donor-impact-stat-icon">
                <i className="bi bi-truck"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : activeCount}
                </strong>

                <span>
                  Currently in delivery
                </span>
              </div>

            </div>

            <div className="donor-impact-stat">

              <div className="donor-impact-stat-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : completedCount}
                </strong>

                <span>
                  Successfully completed
                </span>
              </div>

            </div>

            <div className="donor-impact-message">
              <i className="bi bi-heart-fill"></i>

              Every completed donation
              creates a meaningful impact.
            </div>

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
          title="Create Donation"
          description="Donate food, clothes, books and more."
          icon="bi bi-plus-circle-fill"
          color="primary"
          link="/create-donation"
          button="Create Donation"
        />

        <QuickActionCard
          title="My Donations"
          description="Track and manage all your donations."
          icon="bi bi-box2-heart-fill"
          color="success"
          link="/my-donations"
          button="View Donations"
        />

        <QuickActionCard
          title="Donation Requests"
          description="Review and manage NGO requests."
          icon="bi bi-clipboard-check-fill"
          color="warning"
          link="/donation-requests"
          button="View Requests"
        />

        <QuickActionCard
          title="Donor Profile"
          description="Manage your donor information."
          icon="bi bi-person-circle"
          color="info"
          link="/profile"
          button="View Profile"
        />

      </div>

      {/* ======================================================
          RECENT ACTIVITY
      ====================================================== */}

      <div className="card mt-5 shadow-lg border-0 donor-recent-card">

        <div className="card-body">

          <div className="donor-recent-header">

            <div>

              <span className="donor-panel-eyebrow">
                ACTIVITY FEED
              </span>

              <h4 className="fw-bold donor-recent-title">
                Recent Activity
              </h4>

              <p>
                Your latest donation and delivery updates.
              </p>

            </div>

            <Link
              to="/donation-requests"
              className="donor-view-all"
            >
              View Requests
              <i className="bi bi-arrow-right"></i>
            </Link>

          </div>

          <hr />

          {loading ? (

            <div className="donor-activity-loading">
              Loading recent activity...
            </div>

          ) : stats.recentActivity.length ===
            0 ? (

            <div className="donor-activity-empty">

              <div className="donor-activity-empty-icon">
                <i className="bi bi-clock-history"></i>
              </div>

              <h6>
                No recent activity
              </h6>

              <small>
                Your donation requests, deliveries
                and completed donations will appear here.
              </small>

            </div>

          ) : (

            <div className="donor-activity-list">

              {stats.recentActivity.map(
                (activity, index) => (

                  <ActivityItem
                    key={
                      activity.requestId ||
                      activity.donationId ||
                      activity._id ||
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

function ActivityItem({
  activity,
  date,
  isLast,
}) {
  return (
    <div
      className={`donor-activity-item ${
        isLast
          ? "donor-activity-item-last"
          : ""
      }`}
    >

      <div className="donor-activity-icon-wrapper">

        <div
          className={`donor-activity-icon donor-activity-${
            activity.color ||
            "primary"
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
          <div className="donor-activity-line"></div>
        )}

      </div>

      <div className="donor-activity-content">

        <div className="donor-activity-content-top">

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
            <small className="donor-activity-date">
              {date}
            </small>
          )}

        </div>

      </div>

    </div>
  );
}

export default DonorDashboard;