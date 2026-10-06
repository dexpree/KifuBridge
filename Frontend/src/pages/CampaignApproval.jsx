import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";

// ============================================================
// IMAGE URL
// ============================================================

const getImageUrl = (image) => {
  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  return `http://localhost:5000${
    image.startsWith("/") ? image : `/${image}`
  }`;
};

// ============================================================
// FORMAT CATEGORIES
// ============================================================

const formatCategory = (category) => {
  if (!category) return "-";

  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

// ============================================================
// CAMPAIGN APPROVAL
// ============================================================

function CampaignApproval() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // ==========================================================
  // FETCH CAMPAIGNS
  // ==========================================================

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await API.get("/campaigns", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        "=========================================="
      );

      console.log(
        "ADMIN CAMPAIGNS RESPONSE:",
        res.data
      );

      if (Array.isArray(res.data)) {
        res.data.forEach((campaign) => {
          console.log(
            "CAMPAIGN:",
            campaign.title,
            "| STATUS:",
            campaign.status,
            "| APPROVED:",
            campaign.isApproved
          );
        });
      }

      console.log(
        "=========================================="
      );

      setCampaigns(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (error) {
      console.error(
        "Fetch Campaigns Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to load campaigns."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // APPROVE CAMPAIGN
  // ==========================================================

  const approveCampaign = async (id) => {
    try {
      setActionLoading(id);

      const token =
        localStorage.getItem("token");

      await API.put(
        `/campaigns/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        "Campaign approved successfully."
      );

      await fetchCampaigns();
    } catch (error) {
      console.error(
        "Approve Campaign Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to approve campaign."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================================
  // REJECT CAMPAIGN
  // ==========================================================

  const rejectCampaign = async (id) => {
    try {
      setActionLoading(id);

      const token =
        localStorage.getItem("token");

      await API.put(
        `/campaigns/${id}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        "Campaign rejected successfully."
      );

      await fetchCampaigns();
    } catch (error) {
      console.error(
        "Reject Campaign Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to reject campaign."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================================
  // PENDING CAMPAIGNS
  // ==========================================================

  const pendingCampaigns =
    campaigns.filter((campaign) => {
      return (
        campaign.status === "pending" &&
        campaign.isApproved === false
      );
    });

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Campaign Approval"
          subtitle="Review NGO campaigns before publishing them."
        />

        <div className="text-center py-5">
          <div
            className="spinner-border"
            role="status"
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>

          <p className="mt-3 text-muted">
            Loading campaigns...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <DashboardLayout>
      <PageHeader
        title="Campaign Approval"
        subtitle="Review NGO campaigns before publishing them."
      />

      <div className="container-fluid py-3">

        {/* =====================================================
            DEBUG / SUMMARY
        ===================================================== */}

        <div className="d-flex justify-content-between align-items-center mb-4">

          <div>
            <h5 className="mb-1">
              Pending Campaigns
            </h5>

            <p className="text-muted mb-0">
              Review campaigns submitted by NGOs.
            </p>
          </div>

          <span className="badge bg-warning text-dark fs-6">
            {pendingCampaigns.length} Pending
          </span>

        </div>

        {/* =====================================================
            NO PENDING CAMPAIGNS
        ===================================================== */}

        {pendingCampaigns.length === 0 && (
          <div className="alert alert-success shadow-sm">
            <strong>
              🎉 No pending campaigns.
            </strong>

            <div className="mt-1">
              All submitted campaigns have
              been reviewed.
            </div>
          </div>
        )}

        {/* =====================================================
            CAMPAIGN LIST
        ===================================================== */}

        <div className="row">

          {pendingCampaigns.map(
            (campaign) => {

              const isProcessing =
                actionLoading ===
                campaign._id;

              return (
                <div
                  className="col-xl-6 col-lg-6 mb-4"
                  key={campaign._id}
                >

                  <div className="card shadow-sm h-100 campaign-approval-card">

                    {/* =================================================
                        IMAGE CAROUSEL
                    ================================================= */}

                    {Array.isArray(
                      campaign.campaignImages
                    ) &&
                      campaign
                        .campaignImages
                        .length > 0 && (

                        <div
                          id={`campaign-carousel-${campaign._id}`}
                          className="carousel slide"
                          data-bs-ride="carousel"
                        >

                          <div className="carousel-inner">

                            {campaign.campaignImages.map(
                              (
                                image,
                                index
                              ) => (

                                <div
                                  key={index}
                                  className={`carousel-item ${
                                    index === 0
                                      ? "active"
                                      : ""
                                  }`}
                                >

                                  <img
                                    src={getImageUrl(
                                      image
                                    )}
                                    alt={`${campaign.title} ${
                                      index + 1
                                    }`}
                                    className="d-block w-100"
                                    style={{
                                      height:
                                        "280px",
                                      objectFit:
                                        "cover",
                                    }}
                                    onError={(
                                      event
                                    ) => {
                                      console.error(
                                        "Campaign image failed:",
                                        getImageUrl(
                                          image
                                        )
                                      );

                                      event.currentTarget.style.display =
                                        "none";
                                    }}
                                  />

                                  <div className="carousel-caption">

                                    <span>
                                      Image{" "}
                                      {index +
                                        1}{" "}
                                      /{" "}
                                      {
                                        campaign
                                          .campaignImages
                                          .length
                                      }
                                    </span>

                                  </div>

                                </div>

                              )
                            )}

                          </div>

                          {campaign
                            .campaignImages
                            .length > 1 && (
                            <>
                              <button
                                className="carousel-control-prev"
                                type="button"
                                data-bs-target={`#campaign-carousel-${campaign._id}`}
                                data-bs-slide="prev"
                              >
                                <span className="carousel-control-prev-icon"></span>
                              </button>

                              <button
                                className="carousel-control-next"
                                type="button"
                                data-bs-target={`#campaign-carousel-${campaign._id}`}
                                data-bs-slide="next"
                              >
                                <span className="carousel-control-next-icon"></span>
                              </button>
                            </>
                          )}

                        </div>
                      )}

                    {/* =================================================
                        CAMPAIGN BODY
                    ================================================= */}

                    <div className="card-body">

                      {/* =================================================
                          TITLE
                      ================================================= */}

                      <div className="d-flex justify-content-between align-items-start gap-3">

                        <div>

                          <h4 className="mb-1">
                            📢{" "}
                            {campaign.title ||
                              "Untitled Campaign"}
                          </h4>

                          <span className="badge bg-warning text-dark">
                            Pending Approval
                          </span>

                        </div>

                      </div>

                      <hr />

                      {/* =================================================
                          DESCRIPTION
                      ================================================= */}

                      <div className="mb-4">

                        <h6 className="fw-bold">
                          Campaign Description
                        </h6>

                        <p className="text-muted mb-0">
                          {campaign.description ||
                            "No description provided."}
                        </p>

                      </div>

                      {/* =================================================
                          NGO DETAILS
                      ================================================= */}

                      <div className="campaign-detail-section">

                        <h6 className="section-title">
                          🏢 NGO Details
                        </h6>

                        <div className="detail-grid">

                          <div className="detail-item">

                            <span className="detail-label">
                              Organization
                            </span>

                            <strong>
                              {campaign
                                .ngo
                                ?.organizationName ||
                                campaign
                                  .ngo
                                  ?.name ||
                                "-"}
                            </strong>

                          </div>

                          <div className="detail-item">

                            <span className="detail-label">
                              NGO Category
                            </span>

                            <strong>
                              {campaign
                                .ngo
                                ?.ngoCategory ||
                                "-"}
                            </strong>

                          </div>

                        </div>

                      </div>

                      <hr />

                      {/* =================================================
                          CAMPAIGN DETAILS
                      ================================================= */}

                      <div className="campaign-detail-section">

                        <h6 className="section-title">
                          📋 Campaign Details
                        </h6>

                        <div className="detail-grid">

                          {/* CATEGORIES */}

                          <div className="detail-item">

                            <span className="detail-label">
                              Categories
                            </span>

                            <strong className="text-capitalize">

                              {Array.isArray(
                                campaign.categories
                              ) &&
                              campaign
                                .categories
                                .length >
                                0
                                ? campaign.categories
                                    .map(
                                      (
                                        category
                                      ) =>
                                        formatCategory(
                                          category
                                        )
                                    )
                                    .join(
                                      ", "
                                    )
                                : "-"}

                            </strong>

                          </div>

                          {/* DURATION */}

                          <div className="detail-item">

                            <span className="detail-label">
                              Duration
                            </span>

                            <strong>
                              {
                                campaign.duration
                              }{" "}
                              Days
                            </strong>

                          </div>

                          {/* STATUS */}

                          <div className="detail-item">

                            <span className="detail-label">
                              Status
                            </span>

                            <strong className="text-warning">
                              Pending Approval
                            </strong>

                          </div>

                          {/* APPROVAL */}

                          <div className="detail-item">

                            <span className="detail-label">
                              Admin Approval
                            </span>

                            <strong className="text-warning">
                              {campaign.isApproved
                                ? "Approved"
                                : "Pending"}
                            </strong>

                          </div>

                        </div>

                      </div>

                      <hr />

                      {/* =================================================
                          DONATION REQUIREMENTS
                      ================================================= */}

                      <div className="campaign-detail-section">

                        <div className="d-flex justify-content-between align-items-center mb-3">

                          <h6 className="section-title mb-0">
                            🎁 Donation Requirements
                          </h6>

                          <span className="badge bg-primary">

                            {campaign
                              .requirements
                              ?.length ||
                              0}{" "}
                            Items

                          </span>

                        </div>

                        {Array.isArray(
                          campaign.requirements
                        ) &&
                        campaign
                          .requirements
                          .length >
                          0 ? (

                          <div className="requirements-list">

                            {campaign.requirements.map(
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

                                const progress =
                                  goal >
                                  0
                                    ? Math.min(
                                        100,
                                        Math.round(
                                          (current /
                                            goal) *
                                            100
                                        )
                                      )
                                    : 0;

                                return (
                                  <div
                                    className="requirement-row"
                                    key={
                                      requirement._id ||
                                      index
                                    }
                                  >

                                    {/* NUMBER */}

                                    <div className="requirement-number">
                                      {index +
                                        1}
                                    </div>

                                    {/* INFO */}

                                    <div className="requirement-info">

                                      <strong>
                                        {
                                          requirement.itemName
                                        }
                                      </strong>

                                      <span className="text-capitalize">
                                        Category:{" "}
                                        {formatCategory(
                                          requirement.category
                                        )}
                                      </span>

                                      <span>
                                        Goal:{" "}
                                        {
                                          requirement.goalQuantity
                                        }{" "}
                                        {
                                          requirement.unit
                                        }
                                      </span>

                                    </div>

                                    {/* PROGRESS */}

                                    <div className="requirement-progress">

                                      <span>
                                        Current:{" "}
                                        {
                                          requirement.currentQuantity ||
                                          0
                                        }{" "}
                                        {
                                          requirement.unit
                                        }
                                      </span>

                                      <div className="progress mt-1">

                                        <div
                                          className="progress-bar"
                                          role="progressbar"
                                          style={{
                                            width: `${progress}%`,
                                          }}
                                        ></div>

                                      </div>

                                      <small className="text-muted">
                                        {
                                          progress
                                        }
                                        % complete
                                      </small>

                                    </div>

                                  </div>
                                );
                              }
                            )}

                          </div>

                        ) : (

                          <p className="text-muted">
                            No requirements found.
                          </p>

                        )}

                      </div>

                      <hr />

                      {/* =================================================
                          CAMPAIGN CREATED DATE
                      ================================================= */}

                      <div className="campaign-detail-section">

                        <div className="detail-grid">

                          <div className="detail-item">

                            <span className="detail-label">
                              Submitted
                            </span>

                            <strong>
                              {campaign.createdAt
                                ? new Date(
                                    campaign.createdAt
                                  ).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month:
                                        "short",
                                      year:
                                        "numeric",
                                      hour:
                                        "2-digit",
                                      minute:
                                        "2-digit",
                                    }
                                  )
                                : "-"}
                            </strong>

                          </div>

                        </div>

                      </div>

                      {/* =================================================
                          ACTION BUTTONS
                      ================================================= */}

                      <div className="d-flex gap-2 mt-4">

                        <Link
                          to={`/admin/campaigns/${campaign._id}`}
                          className="btn btn-outline-primary flex-fill"
                        >
                          👁️ View Details
                        </Link>

                        <button
                          type="button"
                          className="btn btn-success flex-fill"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            approveCampaign(
                              campaign._id
                            )
                          }
                        >
                          {isProcessing
                            ? "Processing..."
                            : "✅ Approve Campaign"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger flex-fill"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            rejectCampaign(
                              campaign._id
                            )
                          }
                        >
                          {isProcessing
                            ? "Processing..."
                            : "❌ Reject Campaign"}
                        </button>

                      </div>

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}

export default CampaignApproval;