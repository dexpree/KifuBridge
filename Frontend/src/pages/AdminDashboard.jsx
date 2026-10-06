import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";
import DashboardCard from "../components/DashboardCard";
import HeroBanner from "../components/HeroBanner";
import QuickActionCard from "../components/QuickActionCard";

import "../styles/AdminDashboard.css";

function AdminDashboard() {
  // ==========================================================
  // USER
  // ==========================================================

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
  // STATS
  // ==========================================================

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalNgos: 0,
    totalVolunteers: 0,
    totalDonations: 0,
    totalRequests: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    recentActivity: [],
  });

  const [loading, setLoading] = useState(true);

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
        "/admin/dashboard-stats",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      console.log(
        "ADMIN DASHBOARD:",
        res.data
      );

      setStats({
        totalUsers:
          Number(
            res.data?.totalUsers
          ) || 0,

        totalDonors:
          Number(
            res.data?.totalDonors
          ) || 0,

        totalNgos:
          Number(
            res.data?.totalNgos
          ) || 0,

        totalVolunteers:
          Number(
            res.data?.totalVolunteers
          ) || 0,

        totalDonations:
          Number(
            res.data?.totalDonations
          ) || 0,

        totalRequests:
          Number(
            res.data?.totalRequests
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
        "Admin Dashboard Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatActivityDate = (value) => {
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
  // QUICK CALCULATIONS
  // Only based on values your API already returns.
  // ==========================================================

  const totalPeople =
    stats.totalDonors +
    stats.totalNgos +
    stats.totalVolunteers;

  const deliveryCompletionRate =
    stats.totalRequests > 0
      ? Math.round(
          (stats.completedDeliveries /
            stats.totalRequests) *
            100
        )
      : 0;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      {/* ======================================================
          HERO
      ====================================================== */}

      <HeroBanner
        name={
          user?.name ||
          "Administrator"
        }
        role="Administrator"
      />

      {/* ======================================================
          ADMIN PROFILE STRIP
      ====================================================== */}

      <div className="admin-profile-strip">

        <div className="admin-profile-main">

          <div className="admin-profile-icon">
            <i className="bi bi-shield-check"></i>
          </div>

          <div>
            <h5>
              KifuBridge Administration
            </h5>

            <p>
              Platform management and operations center
            </p>
          </div>

        </div>

        <div className="admin-profile-meta">

          <span className="admin-status-badge">
            <span></span>
            System Online
          </span>

          <Link
            to="/profile"
            className="admin-profile-link"
          >
            Admin Profile
            <i className="bi bi-arrow-right"></i>
          </Link>

        </div>

      </div>

      {/* ======================================================
          PLATFORM STATISTICS
      ====================================================== */}

      <div className="row mb-4">

        <DashboardCard
          title="Total Users"
          value={
            loading
              ? "..."
              : stats.totalUsers
          }
          icon="bi bi-people-fill"
          color="primary"
        />

        <DashboardCard
          title="Donors"
          value={
            loading
              ? "..."
              : stats.totalDonors
          }
          icon="bi bi-person-heart"
          color="success"
        />

        <DashboardCard
          title="NGOs"
          value={
            loading
              ? "..."
              : stats.totalNgos
          }
          icon="bi bi-building"
          color="warning"
        />

        <DashboardCard
          title="Volunteers"
          value={
            loading
              ? "..."
              : stats.totalVolunteers
          }
          icon="bi bi-truck"
          color="info"
        />

      </div>

      <div className="row mb-4">

        <DashboardCard
          title="Donations"
          value={
            loading
              ? "..."
              : stats.totalDonations
          }
          icon="bi bi-box2-heart"
          color="primary"
        />

        <DashboardCard
          title="Requests"
          value={
            loading
              ? "..."
              : stats.totalRequests
          }
          icon="bi bi-clipboard-check"
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
          title="Completed Deliveries"
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
          MANAGEMENT CENTER
      ====================================================== */}

      <div className="row g-4">

        {/* ================= ADMIN CONTROL ================= */}

        <div className="col-lg-7">

          <div className="admin-dashboard-panel">

            <div className="admin-panel-header">

              <div>
                <span className="admin-panel-eyebrow">
                  CONTROL CENTER
                </span>

                <h4>
                  Manage KifuBridge
                </h4>
              </div>

              <i className="bi bi-sliders2"></i>

            </div>

            <div className="admin-action-list">

              <Link
                to="/admin/users"
                className="admin-action-row"
              >

                <div className="admin-action-icon admin-action-primary">
                  <i className="bi bi-people-fill"></i>
                </div>

                <div className="admin-action-content">

                  <strong>
                    User Management
                  </strong>

                  <span>
                    Manage donors, NGOs and volunteers
                  </span>

                </div>

                <div className="admin-action-count">
                  {stats.totalUsers}
                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

              <Link
                to="/admin/donations"
                className="admin-action-row"
              >

                <div className="admin-action-icon admin-action-success">
                  <i className="bi bi-box-seam-fill"></i>
                </div>

                <div className="admin-action-content">

                  <strong>
                    Donation Management
                  </strong>

                  <span>
                    Monitor the platform donation registry
                  </span>

                </div>

                <div className="admin-action-count">
                  {stats.totalDonations}
                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

              <Link
                to="/admin/complaints"
                className="admin-action-row"
              >

                <div className="admin-action-icon admin-action-danger">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                </div>

                <div className="admin-action-content">

                  <strong>
                    Complaint Management
                  </strong>

                  <span>
                    Review and resolve user complaints
                  </span>

                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

              <Link
                to="/admin/audit-logs"
                className="admin-action-row"
              >

                <div className="admin-action-icon admin-action-info">
                  <i className="bi bi-clock-history"></i>
                </div>

                <div className="admin-action-content">

                  <strong>
                    Audit Logs
                  </strong>

                  <span>
                    Track administrative activity
                  </span>

                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

            </div>

          </div>

        </div>

        {/* ================= PLATFORM OVERVIEW ================= */}

        <div className="col-lg-5">

          <div className="admin-dashboard-panel admin-overview-panel">

            <div className="admin-panel-header">

              <div>
                <span className="admin-panel-eyebrow">
                  PLATFORM OVERVIEW
                </span>

                <h4>
                  Current network
                </h4>
              </div>

              <i className="bi bi-bar-chart-fill"></i>

            </div>

            <div className="admin-overview-stat">

              <div className="admin-overview-icon">
                <i className="bi bi-people-fill"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : totalPeople}
                </strong>

                <span>
                  Active platform roles
                </span>
              </div>

            </div>

            <div className="admin-overview-stat">

              <div className="admin-overview-icon">
                <i className="bi bi-box2-heart-fill"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : stats.totalDonations}
                </strong>

                <span>
                  Donations registered
                </span>
              </div>

            </div>

            <div className="admin-overview-stat">

              <div className="admin-overview-icon">
                <i className="bi bi-clipboard-check-fill"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : stats.totalRequests}
                </strong>

                <span>
                  Donation requests
                </span>
              </div>

            </div>

            <div className="admin-overview-stat">

              <div className="admin-overview-icon">
                <i className="bi bi-truck"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : stats.activeDeliveries}
                </strong>

                <span>
                  Deliveries in progress
                </span>
              </div>

            </div>

            <div className="admin-overview-progress">

              <div className="admin-progress-header">
                <span>
                  Delivery completion
                </span>

                <strong>
                  {deliveryCompletionRate}%
                </strong>
              </div>

              <div className="admin-progress-track">

                <div
                  className="admin-progress-fill"
                  style={{
                    width: `${deliveryCompletionRate}%`,
                  }}
                />

              </div>

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
          title="Manage Users"
          description="View and manage all registered users."
          icon="bi bi-people-fill"
          color="primary"
          link="/admin/users"
          button="Open"
        />

        <QuickActionCard
          title="Donation Management"
          description="View and monitor all donations."
          icon="bi bi-box2-heart-fill"
          color="success"
          link="/admin/donations"
          button="View Donations"
        />

        <QuickActionCard
          title="Campaign Approval"
          description="Review NGO campaigns before publishing."
          icon="bi bi-megaphone-fill"
          color="warning"
          link="/admin/campaign-approval"
          button="Review"
        />

        <QuickActionCard
          title="Complaint Management"
          description="Review and resolve platform complaints."
          icon="bi bi-exclamation-octagon-fill"
          color="danger"
          link="/admin/complaints"
          button="Open"
        />

        <QuickActionCard
          title="Audit Logs"
          description="Track administrative actions."
          icon="bi bi-clock-history"
          color="info"
          link="/admin/audit-logs"
          button="View Logs"
        />

      </div>

      {/* ======================================================
          RECENT PLATFORM ACTIVITY
      ====================================================== */}

      <div className="card shadow-lg border-0 mt-5 admin-recent-card">

        <div className="card-body">

          <div className="admin-recent-header">

            <div>

              <span className="admin-panel-eyebrow">
                SYSTEM ACTIVITY
              </span>

              <h4 className="fw-bold admin-recent-title">
                Recent Platform Activity
              </h4>

              <p>
                Latest events recorded across KifuBridge.
              </p>

            </div>

            <Link
              to="/admin/audit-logs"
              className="admin-view-all"
            >
              View Audit Logs
              <i className="bi bi-arrow-right"></i>
            </Link>

          </div>

          <hr />

          {loading ? (

            <div className="admin-activity-loading">
              Loading platform activity...
            </div>

          ) : stats.recentActivity.length ===
            0 ? (

            <div className="admin-activity-empty">

              <div className="admin-empty-icon">
                <i className="bi bi-clock-history"></i>
              </div>

              <h6>
                No recent activity
              </h6>

              <small>
                Platform activities will appear here
                as the system is used.
              </small>

            </div>

          ) : (

            <div className="admin-activity-list">

              {stats.recentActivity.map(
                (activity, index) => (

                  <AdminActivityItem
                    key={
                      activity.userId ||
                      activity.donationId ||
                      activity.requestId ||
                      activity.campaignId ||
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

function AdminActivityItem({
  activity,
  date,
  isLast,
}) {
  return (
    <div
      className={`admin-activity-item ${
        isLast
          ? "admin-activity-item-last"
          : ""
      }`}
    >

      <div className="admin-activity-icon-wrapper">

        <div
          className={`admin-activity-icon admin-activity-${
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
          <div className="admin-activity-line"></div>
        )}

      </div>

      <div className="admin-activity-content">

        <div className="admin-activity-content-top">

          <div>

            <h6>
              {activity.title ||
                "Platform Activity"}
            </h6>

            <small>
              {activity.description ||
                ""}
            </small>

          </div>

          {date && (
            <small className="admin-activity-date">
              {date}
            </small>
          )}

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;