import { useEffect, useMemo, useState } from "react";

import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";

import PageHeader from "../components/PageHeader";

import "../styles/MyDeliveries.css";

// ============================================================
// CATEGORY INFORMATION
// ============================================================

const CATEGORY_INFO = {
  food: {
    label: "Food",
    icon: "🍱",
  },

  clothing: {
    label: "Clothing",
    icon: "👕",
  },

  toys: {
    label: "Toys",
    icon: "🧸",
  },

  medicine: {
    label: "Medicine",
    icon: "💊",
  },

  books: {
    label: "Books & Stationery",
    icon: "📚",
  },

  household: {
    label: "Household Items",
    icon: "🏠",
  },

  electronics: {
    label: "Electronics",
    icon: "💻",
  },

  other: {
    label: "Other",
    icon: "📦",
  },
};

// ============================================================
// DELIVERY STATUS ORDER
// ============================================================

const ACTIVE_STATUS_ORDER = {
  volunteer_assigned: 1,
  volunteer_accepted: 2,
  picked_up: 3,
  delivered: 4,
};

const OLD_STATUS_ORDER = {
  received: 5,
  completed: 6,
};

// ============================================================
// IMAGE URL
// ============================================================

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

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
// STATUS LABEL
// ============================================================

const getStatusLabel = (status) => {
  if (!status) {
    return "Pending";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

// ============================================================
// STATUS CLASS
// ============================================================

const getStatusClass = (status) => {
  switch (status) {
    case "volunteer_assigned":
      return "delivery-status delivery-status--assigned";

    case "volunteer_accepted":
      return "delivery-status delivery-status--accepted";

    case "picked_up":
      return "delivery-status delivery-status--picked";

    case "delivered":
      return "delivery-status delivery-status--delivered";

    case "received":
      return "delivery-status delivery-status--received";

    case "completed":
      return "delivery-status delivery-status--completed";

    default:
      return "delivery-status delivery-status--default";
  }
};

// ============================================================
// STATUS ICON
// ============================================================

const getStatusIcon = (status) => {
  switch (status) {
    case "volunteer_assigned":
      return "bi-person-plus";

    case "volunteer_accepted":
      return "bi-person-check";

    case "picked_up":
      return "bi-box-seam";

    case "delivered":
      return "bi-truck";

    case "received":
      return "bi-check-circle";

    case "completed":
      return "bi-check-circle-fill";

    default:
      return "bi-clock";
  }
};

// ============================================================
// DELIVERY PROGRESS
// ============================================================

const DELIVERY_STEPS = [
  {
    key: "volunteer_assigned",
    label: "Assigned",
    icon: "bi-person-plus",
  },

  {
    key: "volunteer_accepted",
    label: "Accepted",
    icon: "bi-person-check",
  },

  {
    key: "picked_up",
    label: "Picked Up",
    icon: "bi-box-seam",
  },

  {
    key: "delivered",
    label: "Delivered",
    icon: "bi-truck",
  },

  {
    key: "received",
    label: "Confirmed",
    icon: "bi-check-circle-fill",
  },
];

// ============================================================
// STATUS PROGRESS INDEX
// ============================================================

const getProgressIndex = (status) => {
  switch (status) {
    case "volunteer_assigned":
      return 0;

    case "volunteer_accepted":
      return 1;

    case "picked_up":
      return 2;

    case "delivered":
      return 3;

    case "received":
      return 4;

    case "completed":
      return 4;

    default:
      return -1;
  }
};

// ============================================================
// MY DELIVERIES
// ============================================================

function MyDeliveries() {
  const [deliveries, setDeliveries] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [pickupProof, setPickupProof] =
    useState({});

  const [deliveryProof, setDeliveryProof] =
    useState({});

  // ==========================================================
  // FETCH DELIVERIES
  // ==========================================================

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      const res = await API.get(
        "/requests/my-deliveries",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      console.log(
        "========== MY DELIVERIES =========="
      );

      console.log(
        "Deliveries:",
        res.data
      );

      setDeliveries(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (error) {
      console.error(
        "Fetch Deliveries Error:",
        error
      );

      setDeliveries([]);

      alert(
        error.response?.data?.message ||
          "Failed to load deliveries."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SORT DELIVERIES
  // ACTIVE / AVAILABLE FIRST
  // OLD / COMPLETED LAST
  // ==========================================================

  const sortedDeliveries = useMemo(() => {
    const list = [...deliveries];

    return list.sort((a, b) => {
      const statusA =
        a.deliveryStatus || "pending";

      const statusB =
        b.deliveryStatus || "pending";

      const orderA =
        ACTIVE_STATUS_ORDER[statusA] ||
        OLD_STATUS_ORDER[statusA] ||
        99;

      const orderB =
        ACTIVE_STATUS_ORDER[statusB] ||
        OLD_STATUS_ORDER[statusB] ||
        99;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return (
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt)
      );
    });
  }, [deliveries]);

  // ==========================================================
  // ACTIVE DELIVERY COUNT
  // ==========================================================

  const activeDeliveriesCount =
    deliveries.filter((delivery) =>
      [
        "volunteer_assigned",
        "volunteer_accepted",
        "picked_up",
        "delivered",
      ].includes(
        delivery.deliveryStatus
      )
    ).length;

  // ==========================================================
  // COMPLETED DELIVERY COUNT
  // ==========================================================

  const completedDeliveriesCount =
    deliveries.filter((delivery) =>
      [
        "received",
        "completed",
      ].includes(
        delivery.deliveryStatus
      )
    ).length;

  // ==========================================================
  // ACCEPT DELIVERY
  // ==========================================================

  const acceptDelivery = async (id) => {
    try {
      const token =
        localStorage.getItem("token");

      await API.put(
        `/requests/${id}/accept-delivery`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      await fetchDeliveries();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to accept delivery."
      );
    }
  };

  // ==========================================================
  // DECLINE DELIVERY
  // ==========================================================

  const declineDelivery = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to decline this delivery?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      await API.put(
        `/requests/${id}/decline-delivery`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      await fetchDeliveries();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to decline delivery."
      );
    }
  };

  // ==========================================================
  // UPDATE DELIVERY STATUS
  // ==========================================================

  const updateStatus = async (
    id,
    status
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      const formData =
        new FormData();

      formData.append(
        "deliveryStatus",
        status
      );

      // ------------------------------------------------------
      // PICKUP PROOF
      // ------------------------------------------------------

      if (
        status === "picked_up" &&
        pickupProof[id]
      ) {
        formData.append(
          "proofImage",
          pickupProof[id]
        );
      }

      // ------------------------------------------------------
      // DELIVERY PROOF
      // ------------------------------------------------------

      if (
        status === "delivered" &&
        deliveryProof[id]
      ) {
        formData.append(
          "proofImage",
          deliveryProof[id]
        );
      }

      await API.put(
        `/requests/${id}/delivery-status`,
        formData,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      // ------------------------------------------------------
      // REMOVE PICKUP FILE
      // ------------------------------------------------------

      if (status === "picked_up") {
        setPickupProof(
          (previous) => {
            const updated = {
              ...previous,
            };

            delete updated[id];

            return updated;
          }
        );
      }

      // ------------------------------------------------------
      // REMOVE DELIVERY FILE
      // ------------------------------------------------------

      if (status === "delivered") {
        setDeliveryProof(
          (previous) => {
            const updated = {
              ...previous,
            };

            delete updated[id];

            return updated;
          }
        );
      }

      await fetchDeliveries();
    } catch (error) {
      console.error(
        "Update Delivery Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update delivery."
      );
    }
  };

  // ==========================================================
  // RENDER CATEGORY
  // ==========================================================

  const renderCategories = (
    categories
  ) => {
    if (
      !Array.isArray(categories) ||
      categories.length === 0
    ) {
      return (
        <span className="delivery-no-data">
          No category information
        </span>
      );
    }

    return (
      <div className="delivery-category-list">

        {categories.map(
          (category, index) => {
            const info =
              CATEGORY_INFO[
                category.category
              ];

            return (
              <div
                className="delivery-category"
                key={
                  category._id ||
                  index
                }
              >

                <span className="delivery-category-icon">
                  {info?.icon || "📦"}
                </span>

                <div className="delivery-category-content">

                  <strong>
                    {category.itemName ||
                      info?.label ||
                      "Donation Item"}
                  </strong>

                  <span>
                    {info?.label ||
                      category.category ||
                      "Other"}
                  </span>

                </div>

                <div className="delivery-category-quantity">

                  <strong>
                    {category.quantity}
                  </strong>

                  <span>
                    {category.unit || ""}
                  </span>

                </div>

              </div>
            );
          }
        )}

      </div>
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <DashboardLayout>

        <PageHeader
          title="My Deliveries"
          subtitle="View and update your delivery progress."
        />

        <div className="deliveries-loading">

          <div className="delivery-spinner">
            <span></span>
          </div>

          <h5>
            Loading deliveries
          </h5>

          <p>
            Please wait while we load
            your assigned deliveries.
          </p>

        </div>

      </DashboardLayout>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      <PageHeader
        title="My Deliveries"
        subtitle="Manage your assigned donations and delivery progress."
      />

      <div className="my-deliveries-page">

        {/* ==================================================
            SUMMARY
        ================================================== */}

        {deliveries.length > 0 && (

          <div className="delivery-summary">

            <div className="delivery-summary-item">

              <div className="delivery-summary-icon delivery-summary-icon--active">
                <i className="bi bi-truck"></i>
              </div>

              <div>
                <strong>
                  {activeDeliveriesCount}
                </strong>

                <span>
                  Active Deliveries
                </span>
              </div>

            </div>

            <div className="delivery-summary-divider"></div>

            <div className="delivery-summary-item">

              <div className="delivery-summary-icon delivery-summary-icon--completed">
                <i className="bi bi-check-circle"></i>
              </div>

              <div>
                <strong>
                  {completedDeliveriesCount}
                </strong>

                <span>
                  Completed
                </span>
              </div>

            </div>

            <div className="delivery-summary-divider"></div>

            <div className="delivery-summary-item">

              <div className="delivery-summary-icon delivery-summary-icon--total">
                <i className="bi bi-box-seam"></i>
              </div>

              <div>
                <strong>
                  {deliveries.length}
                </strong>

                <span>
                  Total Deliveries
                </span>
              </div>

            </div>

          </div>

        )}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {deliveries.length === 0 ? (

          <div className="deliveries-empty">

            <div className="deliveries-empty-icon">
              <i className="bi bi-truck"></i>
            </div>

            <h3>
              No deliveries yet
            </h3>

            <p>
              You don't have any deliveries
              assigned to you at the moment.
            </p>

          </div>

        ) : (

          <div className="deliveries-list">

            {/* ==================================================
                SECTION LABEL
            ================================================== */}

            {activeDeliveriesCount > 0 && (

              <div className="delivery-section-heading">

                <div>

                  <span className="delivery-section-dot"></span>

                  <h2>
                    Current Deliveries
                  </h2>

                </div>

                <span>
                  {activeDeliveriesCount} active
                </span>

              </div>

            )}

            {sortedDeliveries.map(
              (delivery, deliveryIndex) => {

                // =================================================
                // STATUS
                // =================================================

                const status =
                  Array.isArray(
                    delivery.deliveryStatus
                  )
                    ? delivery.deliveryStatus[0]
                    : delivery.deliveryStatus;

                // =================================================
                // DONATION
                // =================================================

                const donation =
                  delivery.donation ||
                  {};

                // =================================================
                // CAMPAIGN
                // =================================================

                const campaign =
                  typeof donation.campaign ===
                  "object"
                    ? donation.campaign
                    : null;

                const isCampaignDonation =
                  Boolean(
                    donation.campaign
                  );

                // =================================================
                // DONOR
                // =================================================

                const donor =
                  donation.donor ||
                  {};

                // =================================================
                // NGO
                // =================================================

                const ngo =
                  delivery.ngo ||
                  {};

                // =================================================
                // CATEGORIES
                // =================================================

                const categories =
                  Array.isArray(
                    donation.categories
                  )
                    ? donation.categories
                    : [];

                // =================================================
                // IMAGES
                // =================================================

                const images =
                  Array.isArray(
                    donation.itemImages
                  )
                    ? donation.itemImages
                    : [];

                // =================================================
                // PROGRESS
                // =================================================

                const progressIndex =
                  getProgressIndex(
                    status
                  );

                // =================================================
                // OLD DELIVERY
                // =================================================

                const isOldDelivery =
                  [
                    "received",
                    "completed",
                  ].includes(status);

                // =================================================
                // INSERT OLD SECTION HEADER
                // =================================================

                const previousDelivery =
                  sortedDeliveries[
                    deliveryIndex - 1
                  ];

                const previousStatus =
                  previousDelivery
                    ?.deliveryStatus;

                const shouldShowOldHeading =
                  isOldDelivery &&
                  ![
                    "received",
                    "completed",
                  ].includes(
                    previousStatus
                  );

                return (
                  <div
                    key={
                      delivery._id
                    }
                    className={
                      isOldDelivery
                        ? "delivery-wrapper delivery-wrapper--old"
                        : "delivery-wrapper"
                    }
                  >

                    {shouldShowOldHeading && (

                      <div className="delivery-section-heading delivery-section-heading--old">

                        <div>

                          <span className="delivery-section-dot"></span>

                          <h2>
                            Delivery History
                          </h2>

                        </div>

                        <span>
                          Completed deliveries
                        </span>

                      </div>

                    )}

                    {/* ==================================================
                        DELIVERY CARD
                    ================================================== */}

                    <article className="delivery-card">

                      {/* ==================================================
                          CARD TOP ACCENT
                      ================================================== */}

                      <div
                        className={`delivery-card-accent ${
                          isOldDelivery
                            ? "delivery-card-accent--old"
                            : ""
                        }`}
                      ></div>

                      {/* ==================================================
                          HEADER
                      ================================================== */}

                      <div className="delivery-header">

                        <div className="delivery-title-area">

                          <div className="delivery-type">

                            <span>
                              {isCampaignDonation
                                ? "🎯"
                                : "📦"}
                            </span>

                            <span>
                              {isCampaignDonation
                                ? "Campaign Donation"
                                : "Donation"}
                            </span>

                          </div>

                          <h2>
                            {donation.donationName ||
                              "Donation"}
                          </h2>

                          {isCampaignDonation &&
                            campaign?.title && (

                              <div className="delivery-campaign-name">

                                <i className="bi bi-bullseye"></i>

                                {campaign.title}

                              </div>

                            )}

                        </div>

                        <div className="delivery-header-status">

                          <span
                            className={getStatusClass(
                              status
                            )}
                          >

                            <i
                              className={`bi ${getStatusIcon(
                                status
                              )}`}
                            ></i>

                            {getStatusLabel(
                              status
                            )}

                          </span>

                        </div>

                      </div>

                      {/* ==================================================
                          QUICK ROUTE
                      ================================================== */}

                      <div className="delivery-route">

                        <div className="delivery-route-point">

                          <span className="delivery-route-icon delivery-route-icon--pickup">
                            <i className="bi bi-house"></i>
                          </span>

                          <div>

                            <small>
                              PICKUP FROM
                            </small>

                            <strong>
                              {donor.name ||
                                donor.organizationName ||
                                "Donor"}
                            </strong>

                            <span>
                              {donor.city ||
                                donor.address ||
                                "Address unavailable"}
                            </span>

                          </div>

                        </div>

                        <div className="delivery-route-line">

                          <i className="bi bi-arrow-right"></i>

                        </div>

                        <div className="delivery-route-point">

                          <span className="delivery-route-icon delivery-route-icon--ngo">
                            <i className="bi bi-building"></i>
                          </span>

                          <div>

                            <small>
                              DELIVER TO
                            </small>

                            <strong>
                              {ngo.organizationName ||
                                ngo.name ||
                                "NGO"}
                            </strong>

                            <span>
                              {ngo.city ||
                                ngo.address ||
                                "Address unavailable"}
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* ==================================================
                          IMAGES
                      ================================================== */}

                      {images.length > 0 && (

                        <div className="delivery-images">

                          {images
                            .slice(0, 3)
                            .map(
                              (
                                image,
                                index
                              ) => (

                                <img
                                  key={`${delivery._id}-image-${index}`}
                                  src={getImageUrl(
                                    image
                                  )}
                                  alt="Donation"
                                  onError={(
                                    event
                                  ) => {
                                    event.currentTarget.style.display =
                                      "none";
                                  }}
                                />

                              )
                            )}

                        </div>

                      )}

                      {/* ==================================================
                          DETAILS
                      ================================================== */}

                      <div className="delivery-details-grid">

                        {/* =================================================
                            DONATION ITEMS
                        ================================================= */}

                        <div className="delivery-detail-panel">

                          <div className="delivery-panel-title">

                            <i className="bi bi-box-seam"></i>

                            <span>
                              Donation Items
                            </span>

                          </div>

                          {renderCategories(
                            categories
                          )}

                        </div>

                        {/* =================================================
                            DONOR
                        ================================================= */}

                        <div className="delivery-detail-panel">

                          <div className="delivery-panel-title">

                            <i className="bi bi-person"></i>

                            <span>
                              Pickup Contact
                            </span>

                          </div>

                          <div className="delivery-contact">

                            <strong>
                              {donor.name ||
                                donor.organizationName ||
                                "Donor"}
                            </strong>

                            {donor.phone && (

                              <span>
                                <i className="bi bi-telephone"></i>
                                {donor.phone}
                              </span>

                            )}

                            {donor.email && (

                              <span>
                                <i className="bi bi-envelope"></i>
                                {donor.email}
                              </span>

                            )}

                            <span>
                              <i className="bi bi-geo-alt"></i>

                              {donor.address ||
                                "Address unavailable"}

                            </span>

                            {(donor.city ||
                              donor.state ||
                              donor.pincode) && (

                              <span className="delivery-location-secondary">

                                {donor.city || ""}

                                {donor.city &&
                                donor.state
                                  ? ", "
                                  : ""}

                                {donor.state || ""}

                                {donor.pincode
                                  ? ` · ${donor.pincode}`
                                  : ""}

                              </span>

                            )}

                          </div>

                        </div>

                        {/* =================================================
                            NGO
                        ================================================= */}

                        <div className="delivery-detail-panel">

                          <div className="delivery-panel-title">

                            <i className="bi bi-building"></i>

                            <span>
                              Destination
                            </span>

                          </div>

                          <div className="delivery-contact">

                            <strong>
                              {ngo.organizationName ||
                                ngo.name ||
                                "NGO"}
                            </strong>

                            {ngo.phone && (

                              <span>
                                <i className="bi bi-telephone"></i>
                                {ngo.phone}
                              </span>

                            )}

                            {ngo.email && (

                              <span>
                                <i className="bi bi-envelope"></i>
                                {ngo.email}
                              </span>

                            )}

                            <span>
                              <i className="bi bi-geo-alt"></i>

                              {ngo.address ||
                                "Address unavailable"}

                            </span>

                            {(ngo.city ||
                              ngo.state ||
                              ngo.pincode) && (

                              <span className="delivery-location-secondary">

                                {ngo.city || ""}

                                {ngo.city &&
                                ngo.state
                                  ? ", "
                                  : ""}

                                {ngo.state || ""}

                                {ngo.pincode
                                  ? ` · ${ngo.pincode}`
                                  : ""}

                              </span>

                            )}

                          </div>

                        </div>

                      </div>

                      {/* ==================================================
                          CAMPAIGN
                      ================================================== */}

                      {isCampaignDonation &&
                        campaign && (

                          <div className="delivery-campaign">

                            <div className="delivery-campaign-icon">
                              🎯
                            </div>

                            <div className="delivery-campaign-content">

                              <span>
                                CAMPAIGN
                              </span>

                              <strong>
                                {campaign.title ||
                                  "Campaign"}
                              </strong>

                              {campaign.status && (

                                <small>
                                  Campaign status:{" "}
                                  {getStatusLabel(
                                    campaign.status
                                  )}
                                </small>

                              )}

                            </div>

                          </div>

                        )}

                      {/* ==================================================
                          ACTION AREA
                      ================================================== */}

                      {status ===
                        "volunteer_assigned" && (

                        <div className="delivery-action-box delivery-action-box--assigned">

                          <div className="delivery-action-message">

                            <div className="delivery-action-icon">
                              <i className="bi bi-bell"></i>
                            </div>

                            <div>

                              <strong>
                                New delivery assigned
                              </strong>

                              <span>
                                Review the pickup and destination details before accepting.
                              </span>

                            </div>

                          </div>

                          <div className="delivery-action-buttons">

                            <button
                              type="button"
                              className="delivery-btn delivery-btn--accept"
                              onClick={() =>
                                acceptDelivery(
                                  delivery._id
                                )
                              }
                            >

                              <i className="bi bi-check-lg"></i>

                              Accept Delivery

                            </button>

                            <button
                              type="button"
                              className="delivery-btn delivery-btn--decline"
                              onClick={() =>
                                declineDelivery(
                                  delivery._id
                                )
                              }
                            >

                              <i className="bi bi-x-lg"></i>

                              Decline

                            </button>

                          </div>

                        </div>

                      )}

                      {/* ==================================================
                          ACCEPTED → PICKUP
                      ================================================== */}

                      {status ===
                        "volunteer_accepted" && (

                        <div className="delivery-action-box">

                          <div className="delivery-action-message">

                            <div className="delivery-action-icon">
                              <i className="bi bi-box-seam"></i>
                            </div>

                            <div>

                              <strong>
                                Ready for pickup
                              </strong>

                              <span>
                                Upload a photo as proof after collecting the donation.
                              </span>

                            </div>

                          </div>

                          <div className="delivery-upload">

                            <label>
                              <i className="bi bi-camera"></i>

                              <span>
                                {pickupProof[
                                  delivery._id
                                ]
                                  ? pickupProof[
                                      delivery._id
                                    ].name
                                  : "Choose pickup proof photo"}
                              </span>

                              <input
                                type="file"
                                accept="image/*"
                                onChange={(
                                  event
                                ) => {

                                  const file =
                                    event.target.files?.[0];

                                  if (!file) {
                                    return;
                                  }

                                  setPickupProof(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,

                                      [delivery._id]:
                                        file,
                                    })
                                  );

                                }}
                              />

                            </label>

                            <button
                              type="button"
                              className="delivery-btn delivery-btn--primary"
                              disabled={
                                !pickupProof[
                                  delivery._id
                                ]
                              }
                              onClick={() =>
                                updateStatus(
                                  delivery._id,
                                  "picked_up"
                                )
                              }
                            >

                              <i className="bi bi-box-arrow-up"></i>

                              Mark Picked Up

                            </button>

                          </div>

                        </div>

                      )}

                      {/* ==================================================
                          PICKED UP → DELIVER
                      ================================================== */}

                      {status ===
                        "picked_up" && (

                        <div className="delivery-action-box">

                          <div className="delivery-action-message">

                            <div className="delivery-action-icon">
                              <i className="bi bi-truck"></i>
                            </div>

                            <div>

                              <strong>
                                Donation is with you
                              </strong>

                              <span>
                                Deliver it to the NGO and upload delivery proof.
                              </span>

                            </div>

                          </div>

                          <div className="delivery-upload">

                            <label>
                              <i className="bi bi-camera"></i>

                              <span>
                                {deliveryProof[
                                  delivery._id
                                ]
                                  ? deliveryProof[
                                      delivery._id
                                    ].name
                                  : "Choose delivery proof photo"}
                              </span>

                              <input
                                type="file"
                                accept="image/*"
                                onChange={(
                                  event
                                ) => {

                                  const file =
                                    event.target.files?.[0];

                                  if (!file) {
                                    return;
                                  }

                                  setDeliveryProof(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,

                                      [delivery._id]:
                                        file,
                                    })
                                  );

                                }}
                              />

                            </label>

                            <button
                              type="button"
                              className="delivery-btn delivery-btn--success"
                              disabled={
                                !deliveryProof[
                                  delivery._id
                                ]
                              }
                              onClick={() =>
                                updateStatus(
                                  delivery._id,
                                  "delivered"
                                )
                              }
                            >

                              <i className="bi bi-truck"></i>

                              Mark Delivered

                            </button>

                          </div>

                        </div>

                      )}

                      {/* ==================================================
                          DELIVERED
                      ================================================== */}

                      {status ===
                        "delivered" && (

                        <div className="delivery-complete-message">

                          <div className="delivery-complete-icon">
                            <i className="bi bi-hourglass-split"></i>
                          </div>

                          <div>

                            <strong>
                              Delivery completed
                            </strong>

                            <span>
                              The donation has been delivered. Waiting for the NGO to confirm receipt.
                            </span>

                          </div>

                        </div>

                      )}

                      {/* ==================================================
                          RECEIVED / COMPLETED
                      ================================================== */}

                      {[
                        "received",
                        "completed",
                      ].includes(status) && (

                        <div className="delivery-complete-message delivery-complete-message--finished">

                          <div className="delivery-complete-icon">
                            <i className="bi bi-check-circle-fill"></i>
                          </div>

                          <div>

                            <strong>
                              Delivery completed
                            </strong>

                            <span>
                              The NGO has confirmed receipt of this donation.
                            </span>

                          </div>

                        </div>

                      )}

                      {/* ==================================================
                          PROGRESS
                      ================================================== */}

                      <div className="delivery-progress">

                        <div className="delivery-progress-header">

                          <div>

                            <i className="bi bi-route"></i>

                            Delivery Progress

                          </div>

                          <span>
                            {status ===
                              "received" ||
                            status ===
                              "completed"
                              ? "Completed"
                              : getStatusLabel(
                                  status
                                )}
                          </span>

                        </div>

                        <div className="delivery-timeline">

                          {DELIVERY_STEPS.map(
                            (
                              step,
                              stepIndex
                            ) => {

                              const completed =
                                progressIndex >=
                                stepIndex;

                              const current =
                                progressIndex ===
                                stepIndex;

                              return (
                                <div
                                  className={`delivery-timeline-step ${
                                    completed
                                      ? "is-completed"
                                      : ""
                                  } ${
                                    current
                                      ? "is-current"
                                      : ""
                                  }`}
                                  key={
                                    step.key
                                  }
                                >

                                  <div className="delivery-timeline-marker">

                                    <i
                                      className={`bi ${
                                        completed
                                          ? "bi-check-lg"
                                          : step.icon
                                      }`}
                                    ></i>

                                  </div>

                                  <span>
                                    {step.label}
                                  </span>

                                  {stepIndex <
                                    DELIVERY_STEPS.length -
                                      1 && (

                                    <div className="delivery-timeline-connector">

                                      <span
                                        className={
                                          progressIndex >
                                          stepIndex
                                            ? "is-filled"
                                            : ""
                                        }
                                      ></span>

                                    </div>

                                  )}

                                </div>
                              );
                            }
                          )}

                        </div>

                      </div>

                    </article>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

    </DashboardLayout>
  );
}

export default MyDeliveries;