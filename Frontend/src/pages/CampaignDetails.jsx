import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/campaignDetails.css";

function CampaignDetails() {
  const { id } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  // ==========================================
  // FETCH CAMPAIGN
  // ==========================================

  const fetchCampaign = async () => {
    setLoading(true);
    setError(false);

    try {
      const token = localStorage.getItem("token");

      const res = await API.get(`/campaigns/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCampaign(res.data);
    } catch (err) {
      console.error("Fetch Campaign Error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="cd-status">
          Loading campaign…
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !campaign) {
    return (
      <DashboardLayout>
        <div className="cd-status cd-status-error">
          Couldn't load this campaign. It may have
          been removed, or you might not have
          permission to view it.
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================
  // REQUIREMENTS
  // ==========================================

  const requirements = campaign.requirements || [];

  // ==========================================
  // TOTAL GOAL / COLLECTED
  // ==========================================

  const totalGoal = requirements.reduce(
    (total, requirement) =>
      total + Number(requirement.goalQuantity || 0),
    0
  );

  const totalCollected = requirements.reduce(
    (total, requirement) =>
      total +
      Number(requirement.currentQuantity || 0),
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
            (totalCollected / totalGoal) * 100
          )
        )
      : 0;

  // ==========================================
  // DAYS LEFT
  // ==========================================

  const daysLeft = campaign.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(campaign.endDate) -
            new Date()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : campaign.duration || 0;

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const statusClass = () => {
    switch (campaign.status) {
      case "active":
        return "cd-badge-active";

      case "completed":
        return "cd-badge-completed";

      case "expired":
        return "cd-badge-expired";

      case "pending":
        return "cd-badge-pending";

      case "rejected":
        return "cd-badge-rejected";

      default:
        return "cd-badge-default";
    }
  };

  // ==========================================
  // IMAGE
  // ==========================================

  const getImageUrl = (image) => {
    if (!image) {
      return "https://placehold.co/1200x450?text=Campaign";
    }

    if (image.startsWith("http")) {
      return image;
    }

    return `http://localhost:5000${image}`;
  };

  return (
    <DashboardLayout>

      <PageHeader
        title="Campaign Details"
        subtitle="Support this campaign and help make an impact."
      />

      <div className="cd-card">

        {/* =====================================
            CAMPAIGN IMAGE
        ===================================== */}

        <div className="cd-hero">

          {campaign.campaignImages?.length > 0 ? (
            <div
              id={`campaign-details-carousel-${campaign._id}`}
              className="carousel slide"
              data-bs-ride="carousel"
            >

              <div className="carousel-inner">

                {campaign.campaignImages.map(
                  (image, index) => (
                    <div
                      key={index}
                      className={`carousel-item ${
                        index === 0
                          ? "active"
                          : ""
                      }`}
                    >

                      <img
                        src={getImageUrl(image)}
                        alt={`${campaign.title} ${
                          index + 1
                        }`}
                        className="d-block w-100"
                      />

                    </div>
                  )
                )}

              </div>

              {campaign.campaignImages.length >
                1 && (
                <>
                  <button
                    className="carousel-control-prev"
                    type="button"
                    data-bs-target={`#campaign-details-carousel-${campaign._id}`}
                    data-bs-slide="prev"
                  >
                    <span className="carousel-control-prev-icon"></span>
                  </button>

                  <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target={`#campaign-details-carousel-${campaign._id}`}
                    data-bs-slide="next"
                  >
                    <span className="carousel-control-next-icon"></span>
                  </button>
                </>
              )}

            </div>
          ) : (
            <img
              src="https://placehold.co/1200x450?text=Campaign"
              alt="Campaign"
            />
          )}

          <div className="cd-hero-fade" />

        </div>

        {/* =====================================
            BODY
        ===================================== */}

        <div className="cd-body">

          {/* TITLE */}

          <div className="cd-title-row">

            <div>

              <h2 className="cd-title">
                {campaign.title}
              </h2>

              <p className="cd-org">
                🏢{" "}
                {campaign.ngo?.organizationName ||
                  campaign.ngo?.name ||
                  "Unknown organization"}
              </p>

            </div>

            <span
              className={`cd-badge ${statusClass()}`}
            >
              {(campaign.status || "unknown").toUpperCase()}
            </span>

          </div>

          <div className="cd-divider" />

          {/* =====================================
              BASIC CAMPAIGN INFORMATION
          ===================================== */}

          <div className="cd-metric-grid">

            <div className="cd-metric">

              <span className="cd-metric-label">
                Category
              </span>

              <span className="cd-metric-value text-capitalize">
                {campaign.category || "-"}
              </span>

            </div>

            <div className="cd-metric">

              <span className="cd-metric-label">
                Requirements
              </span>

              <span className="cd-metric-value">
                {requirements.length} Items
              </span>

            </div>

            <div className="cd-metric">

              <span className="cd-metric-label">
                Duration
              </span>

              <span className="cd-metric-value">
                {campaign.duration || 0} Days
              </span>

            </div>

            <div className="cd-metric">

              <span className="cd-metric-label">
                Days Left
              </span>

              <span className="cd-metric-value">
                {daysLeft}
              </span>

            </div>

          </div>

          {/* =====================================
              OVERALL PROGRESS
          ===================================== */}

          <div className="cd-progress-summary">

            <div className="cd-progress-header">

              <strong>
                Overall Campaign Progress
              </strong>

              <span>
                {overallProgress}%
              </span>

            </div>

            <div className="cd-progress-track">

              <div
                className="cd-progress-fill"
                style={{
                  width: `${overallProgress}%`,
                }}
              />

            </div>

            <div className="cd-progress-numbers">

              <span>
                Collected:{" "}
                <strong>
                  {totalCollected}
                </strong>
              </span>

              <span>
                Goal:{" "}
                <strong>
                  {totalGoal}
                </strong>
              </span>

              <span>
                Remaining:{" "}
                <strong>
                  {totalRemaining}
                </strong>
              </span>

            </div>

          </div>

          <div className="cd-divider" />

          {/* =====================================
              DONATION REQUIREMENTS
          ===================================== */}

          <h4 className="cd-section-heading">
            🎁 Donation Requirements
          </h4>

          <div className="cd-requirements">

            {requirements.length > 0 ? (
              requirements.map(
                (requirement, index) => {

                  const goal = Number(
                    requirement.goalQuantity || 0
                  );

                  const current = Number(
                    requirement.currentQuantity || 0
                  );

                  const remaining = Math.max(
                    0,
                    goal - current
                  );

                  const progress =
                    goal > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (current / goal) *
                              100
                          )
                        )
                      : 0;

                  return (
                    <div
                      className="cd-requirement"
                      key={
                        requirement._id ||
                        index
                      }
                    >

                      <div className="cd-requirement-top">

                        <div>

                          <span className="cd-requirement-number">
                            {index + 1}
                          </span>

                          <strong>
                            {requirement.itemName}
                          </strong>

                        </div>

                        <span className="cd-requirement-percent">
                          {progress}%
                        </span>

                      </div>

                      <div className="cd-requirement-info">

                        <span>
                          Collected:{" "}
                          <strong>
                            {current}{" "}
                            {requirement.unit}
                          </strong>
                        </span>

                        <span>
                          Goal:{" "}
                          <strong>
                            {goal}{" "}
                            {requirement.unit}
                          </strong>
                        </span>

                        <span>
                          Remaining:{" "}
                          <strong>
                            {remaining}{" "}
                            {requirement.unit}
                          </strong>
                        </span>

                      </div>

                      <div className="cd-progress-track">

                        <div
                          className="cd-progress-fill"
                          style={{
                            width: `${progress}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )
            ) : (
              <div className="cd-alert">
                No donation requirements have
                been added to this campaign.
              </div>
            )}

          </div>

          {/* =====================================
              SUPPORTERS / DAYS
          ===================================== */}

          <div className="cd-stat-row">

            <div className="cd-stat">

              <span className="cd-stat-icon">
                ❤️
              </span>

              <strong>
                {campaign.supporters || 0}
              </strong>

              <span className="cd-stat-caption">
                Supporters
              </span>

            </div>

            <div className="cd-stat">

              <span className="cd-stat-icon">
                ⏳
              </span>

              <strong>
                {daysLeft}
              </strong>

              <span className="cd-stat-caption">
                Days Left
              </span>

            </div>

          </div>

          <div className="cd-divider" />

          {/* =====================================
              CAMPAIGN STORY
          ===================================== */}

          <h4 className="cd-section-heading">
            Campaign Story
          </h4>

          <p className="cd-text">
            {campaign.description}
          </p>

          {/* =====================================
              IMPACT REPORT
          ===================================== */}

          <div className="cd-divider" />

          <h4 className="cd-section-heading">
            Impact Report
          </h4>

          {campaign.impactTitle ? (
            <>
              <h5 className="cd-impact-title">
                {campaign.impactTitle}
              </h5>

              <p className="cd-text">
                {campaign.impactDescription}
              </p>

              {campaign.impactImage && (
                <img
                  src={getImageUrl(
                    campaign.impactImage
                  )}
                  alt="Campaign impact"
                  className="cd-impact-image"
                />
              )}
            </>
          ) : (
            <div className="cd-alert">
              No impact report has been published
              yet.
            </div>
          )}

          {/* =====================================
              DONATE BUTTON
          ===================================== */}

          <div className="cd-cta">

            {campaign.status === "active" ? (
              <Link
                to={`/campaigns/${campaign._id}/donate`}
                className="cd-donate-btn"
              >
                ❤️ Donate to Campaign
              </Link>
            ) : (
              <button
                className="cd-closed-btn"
                disabled
              >
                Campaign Closed
              </button>
            )}

          </div>

        </div>
      </div>

    </DashboardLayout>
  );
}

export default CampaignDetails;