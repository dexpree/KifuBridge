import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/MyCampaigns.css";

const getImageUrl = (image) => {
  if (!image) {
    return "https://placehold.co/800x400?text=Campaign";
  }

  if (image.startsWith("http")) {
    return image;
  }

  return `http://localhost:5000${image}`;
};

// Each status gets its own accent color. It drives the card's glow frame,
// the floating status pill, and every ring gauge inside it — one variable,
// read everywhere, instead of a badge class per status.
const STATUS_ACCENTS = {
  active: "#58c48c",
  pending: "#f2a53e",
  completed: "#6fb4e8",
  expired: "#c992e8",
  rejected: "#ef6f6a",
};

const statusAccent = (status) => STATUS_ACCENTS[status] || "#9aa0ac";

function MyCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await API.get("/campaigns/my-campaigns", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("========== MY CAMPAIGNS ==========");
      console.log(res.data);

      setCampaigns(res.data);
    } catch (error) {
      console.error("My Campaigns Error:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==========================================
   * CALCULATE CAMPAIGN PROGRESS
   * ==========================================
   *
   * Since a campaign can have multiple
   * requirements, calculate the overall
   * progress from all requirements.
   */

  const calculateProgress = (campaign) => {
    const requirements = campaign.requirements || [];

    if (requirements.length === 0) {
      return 0;
    }

    const totalGoal = requirements.reduce(
      (total, requirement) =>
        total + Number(requirement.goalQuantity || 0),
      0
    );

    const totalCollected = requirements.reduce(
      (total, requirement) =>
        total + Number(requirement.currentQuantity || 0),
      0
    );

    if (totalGoal <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((totalCollected / totalGoal) * 100)
    );
  };

  return (
    <DashboardLayout>

      <PageHeader
        title="My Campaigns"
        subtitle="Monitor all your donation campaigns."
      />

      <div className="mycmp-page">

        {loading ? (

          <div className="alert alert-info mycmp-alert">
            Loading campaigns...
          </div>

        ) : campaigns.length === 0 ? (

          <div className="alert alert-info mycmp-alert">
            No campaigns created yet.
          </div>

        ) : (

          <div className="row mycmp-grid">

            {campaigns.map((campaign) => {

              const requirements =
                campaign.requirements || [];

              const progress =
                calculateProgress(campaign);

              const accent = statusAccent(campaign.status);
              const status = campaign.status || "unknown";

              /*
               * Calculate total goal and collected
               */

              const totalGoal = requirements.reduce(
                (total, requirement) =>
                  total +
                  Number(
                    requirement.goalQuantity || 0
                  ),
                0
              );

              const totalCollected =
                requirements.reduce(
                  (total, requirement) =>
                    total +
                    Number(
                      requirement.currentQuantity || 0
                    ),
                  0
                );

              return (

                <div
                  key={campaign._id}
                  className="col-lg-6 mb-4"
                >

                  {/* Gradient glow frame — sits behind the card and bleeds
                      a soft accent-colored halo through a 1px gap */}
                  <div
                    className="mycmp-frame"
                    style={{ "--mycmp-accent": accent }}
                  >

                    <div className="card shadow h-100 mycmp-card">

                      {/* =================================
                          CAMPAIGN IMAGE + FLOATING CHROME
                      ================================= */}

                      <div className="mycmp-img-wrap">

                        <img
                          src={getImageUrl(
                            campaign.campaignImages?.[0]
                          )}
                          alt={campaign.title}
                          className="mycmp-card-img"
                        />

                        <span className="mycmp-status-pill">
                          <span className="mycmp-status-dot" />
                          {status.toUpperCase()}
                        </span>

                        {/* Circular "coin" gauge — overall progress,
                            floats across the image/body seam */}
                        <div
                          className="mycmp-gauge mycmp-gauge-overall"
                          style={{ "--pct": progress }}
                          title={`${progress}% funded`}
                        >
                          <div className="mycmp-gauge-face">
                            <strong>{progress}%</strong>
                            <small>funded</small>
                          </div>
                        </div>

                      </div>

                      <div className="card-body">

                        {/* =================================
                            TITLE
                        ================================= */}

                        <h4 className="mb-2 mycmp-title">
                          📢 {campaign.title}
                        </h4>

                        {/* =================================
                            DESCRIPTION
                        ================================= */}

                        <p className="mycmp-desc">
                          {campaign.description}
                        </p>

                        {/* =================================
                            BASIC DETAILS
                        ================================= */}

                        <div className="mycmp-meta-row">

                          <span className="mycmp-meta-chip">
                            <strong>Category</strong>
                            {campaign.category || "-"}
                          </span>

                          <span className="mycmp-meta-chip">
                            <strong>Duration</strong>
                            {campaign.duration || "-"} days
                          </span>

                          <span className="mycmp-meta-chip">
                            <strong>Created</strong>
                            {campaign.createdAt
                              ? new Date(
                                  campaign.createdAt
                                ).toLocaleDateString()
                              : "-"}
                          </span>

                        </div>

                        {/* =================================
                            REQUIREMENTS
                        ================================= */}

                        <div className="mt-3 mycmp-requirements">

                          <h5 className="mycmp-req-heading">
                            📦 Requirements
                          </h5>

                          {requirements.length === 0 ? (

                            <div className="mycmp-empty-note">
                              No requirements added.
                            </div>

                          ) : (

                            <div className="mycmp-req-list">

                              {requirements.map(
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

                                  const requirementProgress =
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
                                      key={
                                        requirement._id ||
                                        index
                                      }
                                      className="mycmp-req-row"
                                    >

                                      <div
                                        className={`mycmp-gauge mycmp-gauge-sm ${
                                          completed
                                            ? "mycmp-gauge-complete"
                                            : ""
                                        }`}
                                        style={{
                                          "--pct": requirementProgress,
                                        }}
                                      >
                                        <div className="mycmp-gauge-face">
                                          {completed ? "✓" : `${requirementProgress}%`}
                                        </div>
                                      </div>

                                      <div className="mycmp-req-info">

                                        <div className="mycmp-req-top">
                                          <strong className="mycmp-req-name">
                                            {requirement.itemName}
                                          </strong>

                                          <span className="mycmp-req-remaining">
                                            {completed
                                              ? "Fulfilled"
                                              : `${remaining} ${requirement.unit} left`}
                                          </span>
                                        </div>

                                        <div className="mycmp-req-stats">
                                          <span>
                                            <strong>{current}</strong> / {goal} {requirement.unit}
                                          </span>
                                        </div>

                                      </div>

                                    </div>

                                  );
                                }
                              )}

                            </div>

                          )}

                        </div>

                        <div className="mycmp-total-note">
                          {totalCollected} of {totalGoal} total units collected
                        </div>

                        {/* =================================
                            ACTION BUTTONS
                        ================================= */}

                        <div className="mycmp-actions">

                          <Link
                            to={`/ngo/campaigns/${campaign._id}`}
                            className="mycmp-btn mycmp-btn-manage"
                          >
                            <span className="mycmp-btn-icon">⚙️</span>
                            Manage
                          </Link>

                          <Link
                            to={`/ngo/campaigns/${campaign._id}/donations`}
                            className="mycmp-btn mycmp-btn-history"
                          >
                            <span className="mycmp-btn-icon">📦</span>
                            Donation History
                          </Link>

                          {campaign.status ===
                            "completed" && (

                            <Link
                              to={`/campaigns/${campaign._id}/impact`}
                              className="mycmp-btn mycmp-btn-impact"
                            >
                              <span className="mycmp-btn-icon">❤️</span>
                              Add Impact
                            </Link>

                          )}

                        </div>

                      </div>

                    </div>

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

export default MyCampaigns;