import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import API from "../services/api";

import "../styles/campaignManagement.css";

// ==========================================
// IMAGE URL HELPER
// ==========================================

const getImageUrl = (image) => {
  if (!image) {
    return "https://placehold.co/1200x400?text=Campaign";
  }

  if (image.startsWith("http")) {
    return image;
  }

  return `http://localhost:5000${image}`;
};

// ==========================================
// DONATION STATUS CLASS
// ==========================================

const getStatusClass = (status) => {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return "cm-status-completed";

    case "available":
      return "cm-status-available";

    case "requested":
      return "cm-status-requested";

    case "approved":
      return "cm-status-approved";

    case "assigned":
      return "cm-status-assigned";

    case "picked_up":
      return "cm-status-picked-up";

    case "delivered":
      return "cm-status-delivered";

    case "received":
      return "cm-status-received";

    default:
      return "cm-status-default";
  }
};

// ==========================================
// FORMAT DELIVERY METHOD
// ==========================================

const formatDeliveryMethod = (method) => {
  if (!method) {
    return "";
  }

  return String(method)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

// ==========================================
// FORMAT CATEGORY
// ==========================================

const formatCategory = (category) => {
  if (!category) {
    return "";
  }

  return String(category)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

// ==========================================
// GET DONATION ITEMS
//
// Campaign donations store items inside:
// donation.donationItems
//
// Older records may only have:
// donation.categories
// ==========================================

const getDonationItems = (donation) => {
  if (
    Array.isArray(donation?.donationItems) &&
    donation.donationItems.length > 0
  ) {
    return donation.donationItems;
  }

  if (
    Array.isArray(donation?.categories) &&
    donation.categories.length > 0
  ) {
    return donation.categories;
  }

  return [];
};

// ==========================================
// CAMPAIGN MANAGEMENT
// ==========================================

function CampaignManagement() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ==========================================
  // FETCH CAMPAIGN
  // ==========================================

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    setLoading(true);
    setError(false);

    try {
      const token = localStorage.getItem("token");

      const res = await API.get(
        `/campaigns/${id}/management`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "========== CAMPAIGN MANAGEMENT =========="
      );

      console.log(
        "Management Data:",
        res.data
      );

      console.log(
        "Campaign:",
        res.data?.campaign
      );

      console.log(
        "Donations:",
        res.data?.donations
      );

      // ========================================
      // DEBUG EACH DONATION
      // ========================================

      if (Array.isArray(res.data?.donations)) {
        res.data.donations.forEach(
          (donation, index) => {
            console.log(
              `========== DONATION ${index + 1} ==========`
            );

            console.log(
              "Donation ID:",
              donation._id
            );

            console.log(
              "Donor:",
              donation.donor
            );

            console.log(
              "Categories:",
              donation.categories
            );

            console.log(
              "Donation Items:",
              donation.donationItems
            );

            console.log(
              "Allowed Delivery Methods:",
              donation.allowedDeliveryMethods
            );

            console.log(
              "Status:",
              donation.status
            );
          }
        );
      }

      setData(res.data);
    } catch (err) {
      console.error(
        "Campaign Management Error:",
        err
      );

      console.error(
        "Backend Response:",
        err.response?.data
      );

      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EDIT CAMPAIGN
  // ==========================================

  const handleEdit = () => {
    navigate(`/ngo/campaigns/${id}/edit`);
  };

  // ==========================================
  // DELETE CAMPAIGN
  // ==========================================

  const handleDelete = async () => {
    if (deleting) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this campaign?\n\n" +
        "This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const token = localStorage.getItem("token");

      await API.delete(
        `/campaigns/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        "Campaign deleted successfully."
      );

      navigate("/ngo/campaigns");
    } catch (error) {
      console.error(
        "Delete Campaign Error:",
        error
      );

      console.error(
        "Backend Response:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          "Unable to delete this campaign."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="cm-status">
          Loading campaign...
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="cm-status cm-status-error">
          Couldn't load this campaign. It may
          have been removed, or you might not
          have permission to view it.
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================
  // DATA
  // ==========================================

  const {
    campaign,
    donations = [],
    analytics = {},
  } = data;

  const requirements =
    campaign.requirements || [];

  // ==========================================
  // OVERALL PROGRESS
  // ==========================================

  const totalGoal =
    requirements.reduce(
      (total, item) =>
        total +
        Number(
          item.goalQuantity || 0
        ),
      0
    );

  const totalCollected =
    requirements.reduce(
      (total, item) =>
        total +
        Number(
          item.currentQuantity || 0
        ),
      0
    );

  const totalRemaining = Math.max(
    0,
    totalGoal - totalCollected
  );

  const overallProgress =
    totalGoal > 0
      ? Math.min(
          100,
          Math.round(
            (totalCollected /
              totalGoal) *
              100
          )
        )
      : 0;

  // ==========================================
  // CAMPAIGN IMAGE
  // ==========================================

  const campaignImage =
    campaign.campaignImages?.length > 0
      ? campaign.campaignImages[0]
      : null;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <DashboardLayout>

      {/* ========================================
          PAGE HEADER
      ======================================== */}

      <PageHeader
        title="Campaign Management"
        subtitle="Monitor campaign progress, requirements and donations."
      />

      {/* ========================================
          CAMPAIGN SUMMARY
      ======================================== */}

      <div className="cm-card cm-summary">

        {/* CAMPAIGN IMAGE */}

        <div className="cm-summary-cover">
          <img
            src={getImageUrl(
              campaignImage
            )}
            alt={campaign.title}
          />
        </div>

        {/* SUMMARY BODY */}

        <div className="cm-summary-body">

          {/* ======================================
              TITLE + ACTIONS
          ====================================== */}

          <div className="cm-title-row">

            <div>
              <h2 className="cm-title">
                {campaign.title}
              </h2>

              <p className="cm-description">
                {campaign.description}
              </p>
            </div>

            {/* STATUS + ACTION BUTTONS */}

            <div className="cm-title-actions">

              <span
                className={`cm-status-pill cm-status-${(
                  campaign.status || ""
                ).toLowerCase()}`}
              >
                {campaign.status}
              </span>

              {/* EDIT */}

              {campaign.status !==
                "rejected" && (
                <button
                  type="button"
                  className="cm-action-btn cm-edit-btn"
                  onClick={
                    handleEdit
                  }
                >
                  ✏️ Edit Campaign
                </button>
              )}

              {/* DELETE */}

              <button
                type="button"
                className="cm-action-btn cm-delete-btn"
                onClick={
                  handleDelete
                }
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "🗑️ Delete"}
              </button>
            </div>
          </div>

          <div className="cm-divider" />

          {/* ======================================
              BASIC CAMPAIGN INFORMATION
          ====================================== */}

          <div className="cm-metric-row">

            <div className="cm-metric">
              <span className="cm-metric-label">
                Category
              </span>

              <span className="cm-metric-value">
                {Array.isArray(
                  campaign.categories
                )
                  ? campaign.categories
                      .map(
                        formatCategory
                      )
                      .join(", ") || "-"
                  : campaign.category ||
                    "-"}
              </span>
            </div>

            <div className="cm-metric">
              <span className="cm-metric-label">
                Requirements
              </span>

              <span className="cm-metric-value">
                {requirements.length}
              </span>
            </div>

            <div className="cm-metric">
              <span className="cm-metric-label">
                Supporters
              </span>

              <span className="cm-metric-value">
                {analytics.supporters ??
                  campaign.supporters ??
                  0}
              </span>
            </div>

            <div className="cm-metric">
              <span className="cm-metric-label">
                Total Donations
              </span>

              <span className="cm-metric-value">
                {analytics.totalDonations ??
                  donations.length}
              </span>
            </div>
          </div>

          {/* ======================================
              OVERALL PROGRESS
          ====================================== */}

          <div className="cm-overall-progress">

            <div className="cm-progress-heading">
              <strong>
                Overall Campaign Progress
              </strong>

              <span>
                {overallProgress}%
              </span>
            </div>

            <div className="cm-progress-track">
              <div
                className="cm-progress-fill"
                style={{
                  width: `${overallProgress}%`,
                }}
              />
            </div>

            <p className="cm-progress-info">
              {totalCollected} of{" "}
              {totalGoal} total units
              collected

              {totalRemaining > 0 &&
                ` • ${totalRemaining} remaining`}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================
          CAMPAIGN REQUIREMENTS
      ======================================== */}

      <div className="cm-card">

        <div className="cm-card-header">
          <div>
            <h4>
              Campaign Requirements
            </h4>

            <p>
              Track the progress of every
              item required for this campaign.
            </p>
          </div>
        </div>

        <div className="cm-requirements-grid">

          {requirements.length === 0 ? (
            <div className="cm-empty">
              No requirements have been
              added to this campaign.
            </div>
          ) : (
            requirements.map(
              (
                requirement,
                index
              ) => {

                const goal =
                  Number(
                    requirement.goalQuantity ||
                      0
                  );

                const current =
                  Number(
                    requirement.currentQuantity ||
                      0
                  );

                const remaining =
                  Math.max(
                    0,
                    goal - current
                  );

                const progress =
                  goal > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (current /
                            goal) *
                            100
                        )
                      )
                    : 0;

                const completed =
                  current >= goal;

                return (
                  <div
                    className="cm-requirement-card"
                    key={
                      requirement._id ||
                      index
                    }
                  >

                    {/* TOP */}

                    <div className="cm-requirement-top">

                      <div>
                        <span className="cm-requirement-number">
                          Requirement{" "}
                          {index + 1}
                        </span>

                        <h5>
                          {
                            requirement.itemName
                          }
                        </h5>

                        {requirement.category && (
                          <small>
                            {formatCategory(
                              requirement.category
                            )}
                          </small>
                        )}
                      </div>

                      <span
                        className={
                          completed
                            ? "cm-requirement-badge completed"
                            : "cm-requirement-badge"
                        }
                      >
                        {completed
                          ? "Completed"
                          : `${progress}%`}
                      </span>
                    </div>

                    {/* STATS */}

                    <div className="cm-requirement-stats">

                      <div>
                        <span>
                          Goal
                        </span>

                        <strong>
                          {goal}{" "}
                          {
                            requirement.unit
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Collected
                        </span>

                        <strong>
                          {current}{" "}
                          {
                            requirement.unit
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Remaining
                        </span>

                        <strong>
                          {remaining}{" "}
                          {
                            requirement.unit
                          }
                        </strong>
                      </div>

                    </div>

                    {/* PROGRESS */}

                    <div className="cm-progress-track">
                      <div
                        className="cm-progress-fill"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <div className="cm-requirement-progress-text">
                      {current} /{" "}
                      {goal}{" "}
                      {requirement.unit}
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </div>

      {/* ========================================
          DONATION HISTORY
      ======================================== */}

      <div className="cm-card">

        <div className="cm-card-header">

          <div>
            <h4>
              Donation History
            </h4>

            <p>
              All donations submitted
              to this campaign.
            </p>
          </div>

          <span className="cm-count-badge">
            {donations.length} Donations
          </span>

        </div>

        <div className="cm-table-wrap">

          {donations.length === 0 ? (

            <div className="cm-empty">
              No donations have been
              submitted yet.
            </div>

          ) : (

            <table className="cm-table">

              <thead>
                <tr>

                  <th>
                    Donor
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Item
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Condition
                  </th>

                  <th>
                    Delivery
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Date
                  </th>

                </tr>
              </thead>

              <tbody>

                {donations.map(
                  (donation) => {

                    // ==================================
                    // GET ITEMS
                    // ==================================

                    const donationItems =
                      getDonationItems(
                        donation
                      );

                    // ==================================
                    // DELIVERY METHODS
                    // ==================================

                    const deliveryMethods =
                      Array.isArray(
                        donation.allowedDeliveryMethods
                      )
                        ? donation.allowedDeliveryMethods
                        : [];

                    return (

                      <tr
                        key={
                          donation._id
                        }
                      >

                        {/* ==============================
                            DONOR
                        ============================== */}

                        <td>
                          {donation.donor
                            ?.name ||
                            donation.donor
                              ?.organizationName ||
                            "Unknown donor"}
                        </td>

                        {/* ==============================
                            EMAIL
                        ============================== */}

                        <td>
                          {donation.donor
                            ?.email ||
                            "-"}
                        </td>

                        {/* ==============================
                            ITEM
                        ============================== */}

                        <td>

                          {donationItems.length ===
                          0 ? (

                            <span>
                              -
                            </span>

                          ) : (

                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap:
                                  "6px",
                              }}
                            >

                              {donationItems.map(
                                (
                                  item,
                                  index
                                ) => (

                                  <div
                                    key={
                                      item._id ||
                                      index
                                    }
                                  >

                                    <strong>
                                      {item.itemName ||
                                        "Unnamed item"}
                                    </strong>

                                    {item.category && (
                                      <small
                                        style={{
                                          display:
                                            "block",
                                          opacity:
                                            0.7,
                                          marginTop:
                                            "2px",
                                        }}
                                      >
                                        {formatCategory(
                                          item.category
                                        )}
                                      </small>
                                    )}

                                  </div>

                                )
                              )}

                            </div>

                          )}

                        </td>

                        {/* ==============================
                            QUANTITY
                        ============================== */}

                        <td>

                          {donationItems.length ===
                          0 ? (

                            "-"

                          ) : (

                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap:
                                  "6px",
                              }}
                            >

                              {donationItems.map(
                                (
                                  item,
                                  index
                                ) => (

                                  <span
                                    key={
                                      item._id ||
                                      index
                                    }
                                  >
                                    {Number(
                                      item.quantity ||
                                        0
                                    )}{" "}
                                    {item.unit ||
                                      ""}
                                  </span>

                                )
                              )}

                            </div>

                          )}

                        </td>

                        {/* ==============================
                            CONDITION
                        ============================== */}

                        <td>

                          {donationItems.length ===
                          0 ? (

                            "-"

                          ) : (

                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap:
                                  "6px",
                              }}
                            >

                              {donationItems.map(
                                (
                                  item,
                                  index
                                ) => (

                                  <span
                                    key={
                                      item._id ||
                                      index
                                    }
                                  >
                                    {item.condition ||
                                      "Good"}
                                  </span>

                                )
                              )}

                            </div>

                          )}

                        </td>

                        {/* ==============================
                            DELIVERY
                        ============================== */}

                        <td>

                          {donation.deliveryMethod ? (

                            formatDeliveryMethod(
                              donation.deliveryMethod
                            )

                          ) : deliveryMethods.length >
                            0 ? (

                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap:
                                  "4px",
                              }}
                            >

                              {deliveryMethods.map(
                                (
                                  method,
                                  index
                                ) => (

                                  <span
                                    key={
                                      `${method}-${index}`
                                    }
                                  >
                                    {formatDeliveryMethod(
                                      method
                                    )}
                                  </span>

                                )
                              )}

                            </div>

                          ) : (

                            "-"

                          )}

                        </td>

                        {/* ==============================
                            STATUS
                        ============================== */}

                        <td>

                          <span
                            className={`cm-status-pill ${getStatusClass(
                              donation.status
                            )}`}
                          >
                            {
                              donation.status ||
                              "unknown"
                            }
                          </span>

                        </td>

                        {/* ==============================
                            DATE
                        ============================== */}

                        <td>

                          {donation.createdAt
                            ? new Date(
                                donation.createdAt
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          )}

        </div>
      </div>

      {/* ========================================
          ANALYTICS
      ======================================== */}

      <div className="cm-stat-grid">

        {/* TOTAL DONATIONS */}

        <div className="cm-card cm-stat-card">

          <span className="cm-stat-icon">
            📦
          </span>

          <h3>
            {analytics.totalDonations ??
              donations.length}
          </h3>

          <p>
            Total Donations
          </p>

        </div>

        {/* COMPLETED DELIVERIES */}

        <div className="cm-card cm-stat-card">

          <span className="cm-stat-icon">
            🚚
          </span>

          <h3>
            {analytics.completedDeliveries ??
              0}
          </h3>

          <p>
            Completed Deliveries
          </p>

        </div>

        {/* PENDING DELIVERIES */}

        <div className="cm-card cm-stat-card">

          <span className="cm-stat-icon">
            ⏳
          </span>

          <h3>
            {analytics.pendingDeliveries ??
              0}
          </h3>

          <p>
            Pending Deliveries
          </p>

        </div>

        {/* SUPPORTERS */}

        <div className="cm-card cm-stat-card">

          <span className="cm-stat-icon">
            ❤️
          </span>

          <h3>
            {analytics.supporters ??
              campaign.supporters ??
              0}
          </h3>

          <p>
            Supporters
          </p>

        </div>

      </div>

      {/* ========================================
          IMPACT REPORT
      ======================================== */}

      <div className="cm-card cm-impact">

        <div className="cm-card-header">

          <div>

            <h4>
              Impact Report
            </h4>

            <p>
              Share the outcome of the
              campaign with your supporters.
            </p>

          </div>

        </div>

        <div className="cm-card-body">

          {campaign.impactTitle ||
          campaign.impactDescription ||
          campaign.impactImage ? (

            <>

              {/* IMPACT TITLE */}

              {campaign.impactTitle && (
                <h5>
                  {
                    campaign.impactTitle
                  }
                </h5>
              )}

              {/* IMPACT DESCRIPTION */}

              {campaign.impactDescription && (
                <p>
                  {
                    campaign.impactDescription
                  }
                </p>
              )}

              {/* IMPACT IMAGE */}

              {campaign.impactImage && (
                <img
                  src={getImageUrl(
                    campaign.impactImage
                  )}
                  className="cm-impact-image"
                  alt="Campaign impact"
                />
              )}

            </>

          ) : (

            <div className="cm-empty">
              No impact report has
              been published yet.
            </div>

          )}

        </div>

      </div>

    </DashboardLayout>
  );
}

export default CampaignManagement;