import { useEffect, useState } from "react";

import { useParams, Link } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";

import PageHeader from "../components/PageHeader";

import API from "../services/api";

import "../styles/AdminCampaignDetails.css";

// ============================================================
// IMAGE URL HELPER
// ============================================================

const getImageUrl = (image) => {
  if (!image) {
    return "https://placehold.co/1200x400?text=Campaign";
  }

  if (image.startsWith("http")) {
    return image;
  }

  return `http://localhost:5000${image}`;
};

// ============================================================
// DONATION STATUS CLASS
// ============================================================

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

// ============================================================
// FORMAT DELIVERY METHOD
// ============================================================

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

// ============================================================
// FORMAT CATEGORY
// ============================================================

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

// ============================================================
// GET DONATION ITEMS
// ============================================================
//
// New campaign donations use:
//
// donation.categories
//
// If another controller returns:
//
// donation.donationItems
//
// we support that as well.
//
// ============================================================

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

// ============================================================
// ADMIN CAMPAIGN DETAILS
// ============================================================

function AdminCampaignDetails() {
  const { id } = useParams();

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ============================================================
  // FETCH CAMPAIGN DETAILS
  // ============================================================

  useEffect(() => {
    if (id) {
      fetchCampaignDetails();
    }
  }, [id]);

  // ============================================================
  // FETCH
  // ============================================================

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);

      setError("");

      // ========================================================
      // CHECK CAMPAIGN ID
      // ========================================================

      console.log(
        "========== ADMIN CAMPAIGN DETAILS =========="
      );

      console.log(
        "URL PARAM ID:",
        id
      );

      console.log(
        "ID TYPE:",
        typeof id
      );

      if (
        !id ||
        id === ":id"
      ) {
        console.error(
          "INVALID CAMPAIGN ID:",
          id
        );

        setError(
          "Invalid campaign ID. Please open the campaign from the campaign approval page."
        );

        return;
      }

      // ========================================================
      // TOKEN
      // ========================================================

      const token =
        localStorage.getItem(
          "token"
        );

      // ========================================================
      // API URL
      // ========================================================

      const url =
        `/campaigns/admin/${id}`;

      console.log(
        "REQUEST URL:",
        url
      );

      // ========================================================
      // API REQUEST
      // ========================================================

      const res =
        await API.get(
          url,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      // ========================================================
      // DEBUG RESPONSE
      // ========================================================

      console.log(
        "========== ADMIN CAMPAIGN RESPONSE =========="
      );

      console.log(
        "Admin Campaign Details:",
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

      console.log(
        "Analytics:",
        res.data?.analytics
      );

      // ========================================================
      // DEBUG EACH DONATION
      // ========================================================

      if (
        Array.isArray(
          res.data?.donations
        )
      ) {
        res.data.donations.forEach(
          (
            donation,
            index
          ) => {
            console.log(
              `DONATION ${index + 1}:`,
              donation
            );

            console.log(
              "Donation ID:",
              donation?._id
            );

            console.log(
              "Donor:",
              donation?.donor
            );

            console.log(
              "Categories:",
              donation?.categories
            );

            console.log(
              "Donation Items:",
              donation?.donationItems
            );

            console.log(
              "Delivery Methods:",
              donation?.allowedDeliveryMethods
            );

            console.log(
              "Status:",
              donation?.status
            );
          }
        );
      }

      setData(
        res.data
      );

    } catch (err) {

      console.error(
        "Admin Campaign Details Error:",
        err
      );

      console.error(
        "Backend Response:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
          "Unable to load campaign details."
      );

    } finally {

      setLoading(false);

    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <DashboardLayout>

        <div className="acd-status">

          Loading campaign details...

        </div>

      </DashboardLayout>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (
    error ||
    !data
  ) {
    return (
      <DashboardLayout>

        <div className="acd-error">

          {error ||
            "Campaign not found."}

        </div>

      </DashboardLayout>
    );
  }

  // ============================================================
  // DATA
  // ============================================================

  const campaign =
    data.campaign;

  const donations =
    data.donations || [];

  const analytics =
    data.analytics || {};

  const requirements =
    campaign.requirements || [];

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <DashboardLayout>

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <PageHeader
        title="Campaign Details"
        subtitle="View complete campaign information, NGO details, requirements and donor activity."
      />

      <div className="acd-page">

        {/* ====================================================
            BACK BUTTON
        ==================================================== */}

        <div
          style={{
            marginBottom: "20px",
          }}
        >

          <Link
            to="/admin/campaigns"
            className="acd-back-button"
          >
            ← Back to Campaigns
          </Link>

        </div>

        {/* ====================================================
            CAMPAIGN STATUS
        ==================================================== */}

        <div
          style={{
            marginBottom: "20px",
          }}
        >

          <span
            className={`acd-status acd-status-${(
              campaign.status || ""
            ).toLowerCase()}`}
          >
            {campaign.status ||
              "Unknown"}
          </span>

        </div>

        {/* ====================================================
            CAMPAIGN HEADER
        ==================================================== */}

        <div className="acd-card acd-hero">

          <div className="acd-image-wrapper">

            <img
              src={getImageUrl(
                campaign.campaignImages?.[0]
              )}
              alt={
                campaign.title ||
                "Campaign"
              }
            />

          </div>

          <div className="acd-hero-content">

            <span className="acd-category">

              {campaign.category ||
                campaign.categories?.join(
                  ", "
                ) ||
                "General"}

            </span>

            <h2>
              {campaign.title}
            </h2>

            <p>
              {campaign.description}
            </p>

            <div className="acd-meta">

              {/* CREATED */}

              <div>

                <span>
                  Created
                </span>

                <strong>

                  {campaign.createdAt
                    ? new Date(
                        campaign.createdAt
                      ).toLocaleDateString(
                        "en-IN"
                      )
                    : "-"}

                </strong>

              </div>

              {/* DURATION */}

              <div>

                <span>
                  Duration
                </span>

                <strong>

                  {campaign.duration ||
                    0}{" "}
                  days

                </strong>

              </div>

              {/* REQUIREMENTS */}

              <div>

                <span>
                  Requirements
                </span>

                <strong>

                  {requirements.length}

                </strong>

              </div>

            </div>

          </div>

        </div>

        {/* ====================================================
            NGO INFORMATION
        ==================================================== */}

        <div className="acd-card">

          <div className="acd-card-header">

            <div>

              <h4>
                NGO Information
              </h4>

              <p>
                Organization responsible for this campaign.
              </p>

            </div>

          </div>

          <div className="acd-info-grid">

            <div className="acd-info">

              <span>
                NGO Name
              </span>

              <strong>
                {campaign.ngo?.name ||
                  "-"}
              </strong>

            </div>

            <div className="acd-info">

              <span>
                Organization
              </span>

              <strong>
                {campaign.ngo
                  ?.organizationName ||
                  "-"}
              </strong>

            </div>

            <div className="acd-info">

              <span>
                Category
              </span>

              <strong>
                {campaign.ngo
                  ?.ngoCategory ||
                  "-"}
              </strong>

            </div>

            <div className="acd-info">

              <span>
                NGO Email
              </span>

              <strong>
                {campaign.ngo?.email ||
                  "-"}
              </strong>

            </div>

          </div>

        </div>

        {/* ====================================================
            CAMPAIGN ANALYTICS
        ==================================================== */}

        <div className="acd-stat-grid">

          {/* TOTAL DONATIONS */}

          <div className="acd-stat-card">

            <span>
              📦
            </span>

            <strong>

              {analytics.totalDonations ??
                donations.length}

            </strong>

            <small>
              Total Donations
            </small>

          </div>

          {/* SUPPORTERS */}

          <div className="acd-stat-card">

            <span>
              ❤️
            </span>

            <strong>

              {analytics.supporters ||
                0}

            </strong>

            <small>
              Supporters
            </small>

          </div>

          {/* TOTAL GOAL */}

          <div className="acd-stat-card">

            <span>
              🎯
            </span>

            <strong>

              {analytics.goal ||
                campaign.totalGoalQuantity ||
                0}

            </strong>

            <small>
              Total Goal
            </small>

          </div>

          {/* PROGRESS */}

          <div className="acd-stat-card">

            <span>
              📈
            </span>

            <strong>

              {analytics.progress ??
                campaign.progress ??
                0}%

            </strong>

            <small>
              Progress
            </small>

          </div>

        </div>

        {/* ====================================================
            REQUIREMENTS
        ==================================================== */}

        <div className="acd-card">

          <div className="acd-card-header">

            <div>

              <h4>
                Campaign Requirements
              </h4>

              <p>
                Complete breakdown of campaign requirements.
              </p>

            </div>

          </div>

          <div className="acd-requirements">

            {requirements.length === 0 ? (

              <div className="acd-empty">

                No requirements available.

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

                  const collected =
                    Number(
                      requirement.currentQuantity ||
                        0
                    );

                  const remaining =
                    Math.max(
                      0,
                      goal -
                        collected
                    );

                  const progress =
                    goal > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (collected /
                              goal) *
                              100
                          )
                        )
                      : 0;

                  return (

                    <div
                      className="acd-requirement"
                      key={
                        requirement._id ||
                        index
                      }
                    >

                      <div className="acd-requirement-top">

                        <div>

                          <small>
                            Requirement{" "}
                            {index + 1}
                          </small>

                          <h5>
                            {
                              requirement.itemName
                            }
                          </h5>

                          <small>
                            Category:{" "}
                            {formatCategory(
                              requirement.category
                            )}
                          </small>

                        </div>

                        <strong>
                          {progress}%
                        </strong>

                      </div>

                      <div className="acd-requirement-stats">

                        <span>

                          Goal:

                          <b>

                            {goal}{" "}
                            {
                              requirement.unit
                            }

                          </b>

                        </span>

                        <span>

                          Collected:

                          <b>

                            {collected}{" "}
                            {
                              requirement.unit
                            }

                          </b>

                        </span>

                        <span>

                          Remaining:

                          <b>

                            {remaining}{" "}
                            {
                              requirement.unit
                            }

                          </b>

                        </span>

                      </div>

                      <div className="acd-progress">

                        <div
                          style={{
                            width: `${progress}%`,
                          }}
                        />

                      </div>

                    </div>

                  );
                }
              )

            )}

          </div>

        </div>

        {/* ====================================================
            DONATIONS
        ==================================================== */}

        <div className="acd-card">

          <div className="acd-card-header">

            <div>

              <h4>
                Donations
              </h4>

              <p>
                Every donation submitted to this campaign.
              </p>

            </div>

            <span className="acd-count">

              {donations.length}{" "}
              {donations.length === 1
                ? "Donation"
                : "Donations"}

            </span>

          </div>

          <div className="acd-table-wrapper">

            {donations.length === 0 ? (

              <div className="acd-empty">

                No donations have been submitted yet.

              </div>

            ) : (

              <table className="acd-table">

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

                      // ======================================
                      // GET ITEMS
                      // ======================================

                      const donationItems =
                        getDonationItems(
                          donation
                        );

                      // ======================================
                      // DELIVERY METHODS
                      // ======================================

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

                          {/* ================================
                              DONOR
                          ================================= */}

                          <td>

                            <strong>

                              {donation.donor?.name ||
                                donation.donor
                                  ?.organizationName ||
                                "Unknown"}

                            </strong>

                          </td>

                          {/* ================================
                              EMAIL
                          ================================= */}

                          <td>

                            {donation.donor?.email ||
                              "-"}

                          </td>

                          {/* ================================
                              ITEM
                          ================================= */}

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
                                  gap: "6px",
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

                          {/* ================================
                              QUANTITY
                          ================================= */}

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
                                  gap: "6px",
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

                          {/* ================================
                              CONDITION
                          ================================= */}

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
                                  gap: "6px",
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

                          {/* ================================
                              DELIVERY
                          ================================= */}

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
                                  gap: "4px",
                                }}
                              >

                                {deliveryMethods.map(
                                  (
                                    method,
                                    index
                                  ) => (

                                    <span
                                      key={`${method}-${index}`}
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

                          {/* ================================
                              STATUS
                          ================================= */}

                          <td>

                            <span
                              className={`acd-donation-status ${getStatusClass(
                                donation.status
                              )}`}
                            >

                              {donation.status ||
                                "unknown"}

                            </span>

                          </td>

                          {/* ================================
                              DATE
                          ================================= */}

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

        {/* ====================================================
            DELIVERY ANALYTICS
        ==================================================== */}

        <div className="acd-stat-grid">

          {/* COMPLETED */}

          <div className="acd-stat-card">

            <span>
              🚚
            </span>

            <strong>

              {analytics.completedDeliveries ||
                0}

            </strong>

            <small>
              Completed Deliveries
            </small>

          </div>

          {/* PENDING */}

          <div className="acd-stat-card">

            <span>
              ⏳
            </span>

            <strong>

              {analytics.pendingDeliveries ||
                0}

            </strong>

            <small>
              Pending Deliveries
            </small>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default AdminCampaignDetails;