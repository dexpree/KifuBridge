import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";

import "../styles/AdminCampaigns.css";

function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // =========================================================
  // FETCH ALL CAMPAIGNS
  // =========================================================

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      console.log("========== ADMIN CAMPAIGNS ==========");

      const res = await API.get("/campaigns/admin/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Admin Campaigns Response:", res.data);

      // Supports:
      // { campaigns: [...] }
      // or directly [...]

      const campaignData = Array.isArray(res.data)
        ? res.data
        : res.data.campaigns || [];

      setCampaigns(campaignData);
    } catch (error) {
      console.error("Admin Campaigns Error:", error);

      console.error(
        "Backend Response:",
        error.response?.data
      );

      setError(
        error.response?.data?.message ||
          "Failed to load campaigns."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FILTER CAMPAIGNS
  // =========================================================

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesFilter =
      filter === "all" ||
      campaign.status?.toLowerCase() === filter;

    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      campaign.title
        ?.toLowerCase()
        .includes(searchText) ||

      campaign.category
        ?.toLowerCase()
        .includes(searchText) ||

      campaign.ngo?.name
        ?.toLowerCase()
        .includes(searchText) ||

      campaign.ngo?.organizationName
        ?.toLowerCase()
        .includes(searchText);

    return matchesFilter && matchesSearch;
  });

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "approved";

      case "pending":
        return "pending";

      case "rejected":
        return "rejected";

      case "completed":
        return "completed";

      default:
        return "unknown";
    }
  };

  // =========================================================
  // IMAGE URL
  // =========================================================

  const getImageUrl = (campaign) => {
    const image = campaign.campaignImages?.[0];

    if (!image) {
      return "https://placehold.co/800x450?text=Campaign";
    }

    if (image.startsWith("http")) {
      return image;
    }

    return `http://localhost:5000${image}`;
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader
          title="All Campaigns"
          subtitle="View and monitor all campaigns created by NGOs."
        />

        <div className="ac-page">
          <div className="ac-loading">
            <div className="ac-spinner"></div>

            <p>Loading campaigns...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader
          title="All Campaigns"
          subtitle="View and monitor all campaigns created by NGOs."
        />

        <div className="ac-page">
          <div className="ac-container">

            <div className="ac-error">
              <strong>Error:</strong> {error}

              <div>
                <button
                  className="ac-error-button"
                  onClick={fetchCampaigns}
                >
                  🔄 Try Again
                </button>
              </div>
            </div>

          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <DashboardLayout>

      <PageHeader
        title="All Campaigns"
        subtitle="View and monitor every campaign created by NGOs."
      />

      <div className="ac-page">

        <div className="ac-container">

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="ac-stats">

            {/* TOTAL */}

            <div className="ac-stat total">

              <span className="ac-stat-label">
                Total Campaigns
              </span>

              <strong className="ac-stat-value">
                {campaigns.length}
              </strong>

            </div>


            {/* PENDING */}

            <div className="ac-stat pending">

              <span className="ac-stat-label">
                Pending
              </span>

              <strong className="ac-stat-value">
                {
                  campaigns.filter(
                    (c) =>
                      c.status?.toLowerCase() ===
                      "pending"
                  ).length
                }
              </strong>

            </div>


            {/* APPROVED */}

            <div className="ac-stat approved">

              <span className="ac-stat-label">
                Approved
              </span>

              <strong className="ac-stat-value">
                {
                  campaigns.filter(
                    (c) =>
                      c.status?.toLowerCase() ===
                      "approved"
                  ).length
                }
              </strong>

            </div>


            {/* REJECTED */}

            <div className="ac-stat rejected">

              <span className="ac-stat-label">
                Rejected
              </span>

              <strong className="ac-stat-value">
                {
                  campaigns.filter(
                    (c) =>
                      c.status?.toLowerCase() ===
                      "rejected"
                  ).length
                }
              </strong>

            </div>

          </div>


          {/* =================================================
              SEARCH + FILTER
          ================================================= */}

          <div className="ac-toolbar">

            {/* SEARCH */}

            <input
              type="text"
              className="ac-search"
              placeholder="🔍 Search campaign, NGO or category..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />


            {/* FILTERS */}

            <div className="ac-filters">

              <button
                className={`ac-filter ${
                  filter === "all"
                    ? "active-all"
                    : ""
                }`}
                onClick={() =>
                  setFilter("all")
                }
              >
                All
              </button>


              <button
                className={`ac-filter ${
                  filter === "pending"
                    ? "active-pending"
                    : ""
                }`}
                onClick={() =>
                  setFilter("pending")
                }
              >
                Pending
              </button>


              <button
                className={`ac-filter ${
                  filter === "approved"
                    ? "active-approved"
                    : ""
                }`}
                onClick={() =>
                  setFilter("approved")
                }
              >
                Approved
              </button>


              <button
                className={`ac-filter ${
                  filter === "rejected"
                    ? "active-rejected"
                    : ""
                }`}
                onClick={() =>
                  setFilter("rejected")
                }
              >
                Rejected
              </button>

            </div>

          </div>


          {/* =================================================
              RESULT INFORMATION
          ================================================= */}

          <div className="ac-result-info">

            <span>
              Showing{" "}
              <strong>
                {filteredCampaigns.length}
              </strong>{" "}
              of{" "}
              <strong>
                {campaigns.length}
              </strong>{" "}
              campaigns
            </span>

            {search && (
              <span>
                Search:{" "}
                <strong>
                  "{search}"
                </strong>
              </span>
            )}

          </div>


          {/* =================================================
              NO CAMPAIGNS
          ================================================= */}

          {filteredCampaigns.length === 0 && (
            <div className="ac-empty">

              <div className="ac-empty-icon">
                📋
              </div>

              <strong>
                No campaigns found
              </strong>

              <span>
                Try changing your search or filter.
              </span>

            </div>
          )}


          {/* =================================================
              CAMPAIGN GRID
          ================================================= */}

          {filteredCampaigns.length > 0 && (
            <div className="ac-grid">

              {filteredCampaigns.map((campaign) => (

                <div
                  className="ac-card"
                  key={campaign._id}
                >

                  {/* =================================================
                      IMAGE
                  ================================================= */}

                  <div className="ac-image-wrapper">

                    <img
                      src={getImageUrl(campaign)}
                      alt={
                        campaign.title ||
                        "Campaign"
                      }
                      className="ac-image"
                    />


                    {/* STATUS */}

                    <span
                      className={`ac-status ${getStatusClass(
                        campaign.status
                      )}`}
                    >
                      {campaign.status ||
                        "Unknown"}
                    </span>

                  </div>


                  {/* =================================================
                      CARD BODY
                  ================================================= */}

                  <div className="ac-card-body">

                    {/* CATEGORY */}

                    <span className="ac-category">
                      {campaign.category ||
                        "General"}
                    </span>


                    {/* TITLE */}

                    <h5 className="ac-title">
                      {campaign.title ||
                        "Untitled Campaign"}
                    </h5>


                    {/* DESCRIPTION */}

                    <p className="ac-description">

                      {campaign.description
                        ? campaign.description.length >
                          120
                          ? `${campaign.description.substring(
                              0,
                              120
                            )}...`
                          : campaign.description
                        : "No description provided."}

                    </p>


                    {/* DIVIDER */}

                    <div className="ac-divider"></div>


                    {/* =================================================
                        NGO
                    ================================================= */}

                    <div className="ac-ngo">

                      <span className="ac-label">
                        NGO
                      </span>

                      <div className="ac-ngo-name">
                        🏢{" "}
                        {campaign.ngo
                          ?.organizationName ||
                          campaign.ngo?.name ||
                          "Unknown NGO"}
                      </div>

                    </div>


                    {/* =================================================
                        CAMPAIGN INFO
                    ================================================= */}

                    <div className="ac-info-grid">

                      {/* DURATION */}

                      <div className="ac-info-box">

                        <span className="ac-label">
                          Duration
                        </span>

                        <strong className="ac-info-value">
                          {campaign.duration ||
                            0}{" "}
                          days
                        </strong>

                      </div>


                      {/* REQUIREMENTS */}

                      <div className="ac-info-box">

                        <span className="ac-label">
                          Requirements
                        </span>

                        <strong className="ac-info-value">
                          {campaign.requirements
                            ?.length || 0}
                        </strong>

                      </div>

                    </div>


                    {/* =================================================
                        CREATED DATE
                    ================================================= */}

                    <small className="ac-created">

                      Created:{" "}

                      <strong>
                        {campaign.createdAt
                          ? new Date(
                              campaign.createdAt
                            ).toLocaleDateString()
                          : "-"}
                      </strong>

                    </small>


                    {/* =================================================
                        VIEW DETAILS
                    ================================================= */}

                    <Link
                      to={`/admin/campaigns/${campaign._id}`}
                      className="ac-view-button"
                    >
                      👁️ View Complete Details
                    </Link>

                  </div>

                </div>

              ))}

            </div>
          )}

        </div>

      </div>

    </DashboardLayout>
  );
}

export default AdminCampaigns;