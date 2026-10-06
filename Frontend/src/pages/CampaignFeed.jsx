import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/CampaignFeed.css";

const getUrgency = (days) => {
  if (days <= 3) return "urgent";
  if (days <= 10) return "warn";
  return "fresh";
};

function CampaignFeed() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // ==========================================
  // FETCH CAMPAIGNS
  // ==========================================

  const fetchCampaigns = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await API.get("/campaigns", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCampaigns(
        res.data.filter(
          (campaign) => campaign.status === "active"
        )
      );
    } catch (error) {
      console.error("Campaign Feed Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DAYS LEFT
  // ==========================================

  const daysLeft = (endDate) => {
    if (!endDate) return 0;

    const diff = Math.ceil(
      (new Date(endDate) - new Date()) /
        (1000 * 60 * 60 * 24)
    );

    return diff > 0 ? diff : 0;
  };

  // ==========================================
  // CAMPAIGN PROGRESS
  // ==========================================

  const getCampaignProgress = (campaign) => {
    if (
      !campaign.requirements ||
      campaign.requirements.length === 0
    ) {
      return {
        goal: 0,
        collected: 0,
        progress: 0,
      };
    }

    const totalGoal = campaign.requirements.reduce(
      (total, requirement) =>
        total + Number(requirement.goalQuantity || 0),
      0
    );

    const totalCollected =
      campaign.requirements.reduce(
        (total, requirement) =>
          total +
          Number(requirement.currentQuantity || 0),
        0
      );

    const progress =
      totalGoal > 0
        ? Math.min(
            100,
            Math.round(
              (totalCollected / totalGoal) * 100
            )
          )
        : 0;

    return {
      goal: totalGoal,
      collected: totalCollected,
      progress,
    };
  };

  // ==========================================
  // FORMAT REQUIREMENTS
  // ==========================================

  const getRequirementText = (campaign) => {
    if (
      !campaign.requirements ||
      campaign.requirements.length === 0
    ) {
      return "No requirements";
    }

    const requirements =
      campaign.requirements.slice(0, 3);

    return requirements
      .map(
        (requirement) =>
          `${requirement.itemName} (${requirement.goalQuantity} ${requirement.unit})`
      )
      .join(", ");
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Campaigns"
        subtitle="Support NGO campaigns and make an impact."
      />

      <div className="cf-page">

        {/* ==========================================
            LOADING
        ========================================== */}

        {loading ? (
          <div className="cf-empty">
            Loading campaigns…
          </div>

        ) : campaigns.length === 0 ? (

          /* ==========================================
             EMPTY
          ========================================== */

          <div className="cf-empty">
            No active campaigns right now. Check back
            soon.
          </div>

        ) : (

          /* ==========================================
             CAMPAIGN GRID
          ========================================== */

          <div className="cf-grid">

            {campaigns.map((campaign) => {

              const days = daysLeft(
                campaign.endDate
              );

              const urgency = getUrgency(days);

              const {
                goal,
                collected,
                progress,
              } = getCampaignProgress(campaign);

              return (

                <div
                  key={campaign._id}
                  className="cf-card"
                >

                  {/* ==================================
                      IMAGE
                  ================================== */}

                  <div className="cf-cover">

                    {campaign.campaignImages?.length >
                    0 ? (

                      <div
                        id={`campaign-carousel-${campaign._id}`}
                        className="carousel slide"
                        data-bs-ride="carousel"
                      >

                        <div className="carousel-inner">

                          {campaign.campaignImages.map(
                            (img, index) => (

                              <div
                                key={index}
                                className={`carousel-item ${
                                  index === 0
                                    ? "active"
                                    : ""
                                }`}
                              >

                                <img
                                  src={`http://localhost:5000${img}`}
                                  alt={`${campaign.title} ${
                                    index + 1
                                  }`}
                                  className="d-block w-100"
                                  style={{
                                    height: "350px",
                                    objectFit: "cover",
                                  }}
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
                              data-bs-target={`#campaign-carousel-${campaign._id}`}
                              data-bs-slide="prev"
                            >
                              <span className="carousel-control-prev-icon" />
                            </button>

                            <button
                              className="carousel-control-next"
                              type="button"
                              data-bs-target={`#campaign-carousel-${campaign._id}`}
                              data-bs-slide="next"
                            >
                              <span className="carousel-control-next-icon" />
                            </button>
                          </>
                        )}

                      </div>

                    ) : (

                      <img
                        src="https://placehold.co/600x350?text=Campaign"
                        alt={campaign.title}
                        style={{
                          width: "100%",
                          height: "350px",
                          objectFit: "cover",
                        }}
                      />

                    )}

                    {/* URGENCY */}

                    <span
                      className={`cf-urgency cf-urgency--${urgency}`}
                    >
                      ⏳ {days}{" "}
                      {days === 1
                        ? "Day"
                        : "Days"}{" "}
                      Left
                    </span>

                  </div>

                  {/* ==================================
                      BODY
                  ================================== */}

                  <div className="cf-body">

                    <h4 className="cf-title">
                      {campaign.title}
                    </h4>

                    <p className="cf-org">
                      🏢{" "}
                      {campaign.ngo
                        ?.organizationName ||
                        campaign.ngo?.name ||
                        "Unknown NGO"}
                    </p>

                    <hr className="cf-divider" />

                    {/* ==================================
                        REQUIREMENTS
                    ================================== */}

                    <div className="cf-stat">

                      <span className="cf-stat-label">
                        Needs
                      </span>

                      <span className="cf-stat-value">
                        {getRequirementText(
                          campaign
                        )}

                        {campaign.requirements?.length >
                          3 && (
                          <span>
                            {" "}
                            +{" "}
                            {campaign.requirements
                              .length - 3}{" "}
                            more
                          </span>
                        )}
                      </span>

                    </div>

                    {/* ==================================
                        STATS
                    ================================== */}

                    <div className="cf-stats">

                      <div className="cf-stat">

                        <span className="cf-stat-label">
                          Total Goal
                        </span>

                        <span className="cf-stat-value">
                          {goal}
                        </span>

                      </div>

                      <div className="cf-stat">

                        <span className="cf-stat-label">
                          Collected
                        </span>

                        <span className="cf-stat-value">
                          {collected}
                        </span>

                      </div>

                      <div className="cf-stat">

                        <span className="cf-stat-label">
                          Requirements
                        </span>

                        <span className="cf-stat-value">
                          {campaign.requirements
                            ?.length || 0}
                        </span>

                      </div>

                    </div>

                    {/* ==================================
                        PROGRESS
                    ================================== */}

                    <div className="cf-progress-track">

                      <div
                        className="cf-progress-fill"
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                      <span className="cf-progress-label">
                        {progress}%
                      </span>

                    </div>

                    {/* ==================================
                        META
                    ================================== */}

                    <div className="cf-meta-row">

                      <span className="cf-meta-item">
                        ❤️{" "}
                        {campaign.supporters || 0}{" "}
                        supporters
                      </span>

                      <span className="cf-meta-item">
                        📦{" "}
                        {campaign.requirements
                          ?.length || 0}{" "}
                        items needed
                      </span>

                    </div>

                    {/* ==================================
                        CTA
                    ================================== */}

                    <Link
                      to={`/campaigns/${campaign._id}`}
                      className="cf-cta"
                    >
                      View Campaign
                    </Link>

                  </div>

                </div>

              );
            })}

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default CampaignFeed;