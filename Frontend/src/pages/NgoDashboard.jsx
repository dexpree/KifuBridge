import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";
import HeroBanner from "../components/HeroBanner";
import DashboardCard from "../components/DashboardCard";
import QuickActionCard from "../components/QuickActionCard";

import "../styles/NgoDashboard.css";

function NgoDashboard() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const [stats, setStats] = useState({
    availableDonations: 0,
    myRequests: 0,
    activeDeliveries: 0,
    receivedDonations: 0,
    recentActivity: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // ==========================================================
  // REFRESH USER
  // ==========================================================

  useEffect(() => {
    const refreshUser = () => {
      try {
        const storedUser = localStorage.getItem("user");

        setUser(
          storedUser
            ? JSON.parse(storedUser)
            : null
        );
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("user-updated", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener("user-updated", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  // ==========================================================
  // FETCH DASHBOARD
  // ==========================================================

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await API.get(
        "/requests/ngo-dashboard-stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("NGO DASHBOARD STATS:", res.data);

      setStats({
        availableDonations:
          Number(res.data?.availableDonations) || 0,

        myRequests:
          Number(res.data?.myRequests) || 0,

        activeDeliveries:
          Number(res.data?.activeDeliveries) || 0,

        receivedDonations:
          Number(res.data?.receivedDonations) || 0,

        recentActivity:
          Array.isArray(res.data?.recentActivity)
            ? res.data.recentActivity
            : [],
      });
    } catch (error) {
      console.error("NGO Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // DISPLAY NAME
  // ==========================================================

  const displayName =
    user?.organizationName ||
    user?.name ||
    "NGO";

  // ==========================================================
  // DATE
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
  // SIMPLE ACTIVITY COUNTS
  // ==========================================================

  const pendingActions =
    stats.recentActivity.filter(
      (activity) =>
        activity.type === "request_created"
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
        name={displayName}
        role="NGO"
      />

      {/* ======================================================
          NGO QUICK INFO
      ====================================================== */}

      <div className="ngo-profile-strip">

        <div className="ngo-profile-main">

          <div className="ngo-profile-icon">
            <i className="bi bi-building"></i>
          </div>

          <div>
            <h5>
              {displayName}
            </h5>

            <p>
              {user?.ngoCategory ||
                "Community Service Organization"}
            </p>
          </div>

        </div>

        <div className="ngo-profile-meta">

          <span className="ngo-approved-badge">
            <i className="bi bi-check-circle-fill"></i>
            {user?.isApproved
              ? "Approved NGO"
              : "Pending Approval"}
          </span>

          <Link
            to="/profile"
            className="ngo-profile-link"
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
          title="Available Donations"
          value={
            loading
              ? "..."
              : stats.availableDonations
          }
          icon="bi bi-box-seam"
          color="primary"
        />

        <DashboardCard
          title="My Requests"
          value={
            loading
              ? "..."
              : stats.myRequests
          }
          icon="bi bi-clipboard-check"
          color="warning"
        />

        <DashboardCard
          title="Incoming Deliveries"
          value={
            loading
              ? "..."
              : stats.activeDeliveries
          }
          icon="bi bi-truck"
          color="info"
        />

        <DashboardCard
          title="Received Donations"
          value={
            loading
              ? "..."
              : stats.receivedDonations
          }
          icon="bi bi-check-circle"
          color="success"
        />

      </div>

      {/* ======================================================
          ACTION CENTER + DELIVERY OVERVIEW
      ====================================================== */}

      <div className="row g-4">

        {/* ================= ACTION CENTER ================= */}

        <div className="col-lg-7">

          <div className="ngo-dashboard-panel">

            <div className="ngo-panel-header">

              <div>
                <span className="ngo-panel-eyebrow">
                  ACTION CENTER
                </span>

                <h4>
                  What needs your attention?
                </h4>
              </div>

              <i className="bi bi-lightning-charge-fill"></i>

            </div>

            <div className="ngo-action-list">

              <Link
                to="/available-donations"
                className="ngo-action-row"
              >
                <div className="ngo-action-icon ngo-action-primary">
                  <i className="bi bi-box-seam"></i>
                </div>

                <div className="ngo-action-content">

                  <strong>
                    Browse Available Donations
                  </strong>

                  <span>
                    {stats.availableDonations} donation
                    {stats.availableDonations !== 1
                      ? "s"
                      : ""} available
                  </span>

                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

              <Link
                to="/my-requests"
                className="ngo-action-row"
              >
                <div className="ngo-action-icon ngo-action-warning">
                  <i className="bi bi-clipboard-check"></i>
                </div>

                <div className="ngo-action-content">

                  <strong>
                    Review My Requests
                  </strong>

                  <span>
                    {pendingActions > 0
                      ? `${pendingActions} request${
                          pendingActions !== 1
                            ? "s"
                            : ""
                        } awaiting attention`
                      : "Track your donation requests"}
                  </span>

                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

              <Link
                to="/profile"
                className="ngo-action-row"
              >
                <div className="ngo-action-icon ngo-action-success">
                  <i className="bi bi-building"></i>
                </div>

                <div className="ngo-action-content">

                  <strong>
                    Manage NGO Profile
                  </strong>

                  <span>
                    Update your organization information
                  </span>

                </div>

                <i className="bi bi-chevron-right"></i>

              </Link>

            </div>

          </div>

        </div>

        {/* ================= DELIVERY OVERVIEW ================= */}

        <div className="col-lg-5">

          <div className="ngo-dashboard-panel ngo-delivery-panel">

            <div className="ngo-panel-header">

              <div>
                <span className="ngo-panel-eyebrow">
                  DELIVERY OVERVIEW
                </span>

                <h4>
                  Donation movement
                </h4>
              </div>

              <i className="bi bi-truck"></i>

            </div>

            <div className="ngo-delivery-stat">

              <div className="ngo-delivery-icon">
                <i className="bi bi-arrow-repeat"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : stats.activeDeliveries}
                </strong>

                <span>
                  Incoming deliveries
                </span>
              </div>

            </div>

            <div className="ngo-delivery-stat">

              <div className="ngo-delivery-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>

              <div>
                <strong>
                  {loading
                    ? "..."
                    : stats.receivedDonations}
                </strong>

                <span>
                  Successfully received
                </span>
              </div>

            </div>

            <Link
              to="/my-requests"
              className="ngo-delivery-link"
            >
              View all requests
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
          title="Available Donations"
          description="Browse all available donations."
          icon="bi bi-box-seam"
          color="primary"
          link="/available-donations"
          button="Browse"
        />

        <QuickActionCard
          title="My Requests"
          description="Track all donation requests."
          icon="bi bi-clipboard-check-fill"
          color="success"
          link="/my-requests"
          button="Open"
        />

        <QuickActionCard
          title="Create Campaign"
          description="Start a campaign for your organization's needs."
          icon="bi bi-megaphone-fill"
          color="warning"
          link="/ngo/create-campaign"
          button="Create"
        />

        <QuickActionCard
          title="NGO Profile"
          description="Manage your NGO profile."
          icon="bi bi-building"
          color="info"
          link="/profile"
          button="View Profile"
        />

      </div>

      {/* ======================================================
          RECENT ACTIVITY
      ====================================================== */}

      <div className="card mt-5 shadow-lg border-0 ngo-recent-card">

        <div className="card-body">

          <div className="ngo-recent-header">

            <div>
              <span className="ngo-panel-eyebrow">
                ACTIVITY FEED
              </span>

              <h4 className="fw-bold ngo-recent-title">
                Recent Activity
              </h4>

              <p>
                Latest updates from your NGO account.
              </p>
            </div>

            <Link
              to="/my-requests"
              className="ngo-view-all"
            >
              View Requests
              <i className="bi bi-arrow-right"></i>
            </Link>

          </div>

          <hr />

          {loading ? (

            <div className="ngo-activity-loading">
              Loading recent activity...
            </div>

          ) : stats.recentActivity.length === 0 ? (

            <div className="ngo-activity-empty">

              <div className="ngo-empty-icon">
                <i className="bi bi-clock-history"></i>
              </div>

              <h6>
                No recent activity
              </h6>

              <small>
                Your requests and delivery updates
                will appear here.
              </small>

            </div>

          ) : (

            <div className="ngo-activity-list">

              {stats.recentActivity.map(
                (activity, index) => (

                  <NgoActivityItem
                    key={
                      activity.requestId ||
                      activity.donationId ||
                      `${activity.type}-${index}`
                    }
                    activity={activity}
                    date={formatActivityDate(
                      activity.createdAt
                    )}
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

function NgoActivityItem({
  activity,
  date,
  isLast,
}) {
  return (
    <div
      className={`ngo-activity-item ${
        isLast
          ? "ngo-activity-item-last"
          : ""
      }`}
    >

      <div className="ngo-activity-icon-wrapper">

        <div
          className={`ngo-activity-icon ngo-activity-${
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
          <div className="ngo-activity-line"></div>
        )}

      </div>

      <div className="ngo-activity-content">

        <div className="ngo-activity-content-top">

          <div>

            <h6>
              {activity.title ||
                "Activity"}
            </h6>

            <small>
              {activity.description ||
                ""}
            </small>

          </div>

          {date && (
            <small className="ngo-activity-date">
              {date}
            </small>
          )}

        </div>

      </div>

    </div>
  );
}

export default NgoDashboard;