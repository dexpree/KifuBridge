import { useEffect, useState } from "react";

import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";

import PageHeader from "../components/PageHeader";

import "../styles/AvailableDonations.css";

// ============================================================
// DELIVERY METHODS
// ============================================================
//
// Standard values:
//
// volunteer
// donor_self
// ngo_pickup
//
// Older aliases are also supported.
// ============================================================

const DELIVERY_METHODS = [
  {
    key: "volunteer",
    aliases: ["volunteer", "volunteer_delivery"],
    icon: "🚚",
    label: "Volunteer Delivery",
  },
  {
    key: "donor_self",
    aliases: ["donor_self", "self_pickup"],
    icon: "🚗",
    label: "Donor Delivery",
  },
  {
    key: "ngo_pickup",
    aliases: ["ngo_pickup"],
    icon: "🏢",
    label: "NGO Pickup",
  },
];

// ============================================================
// CATEGORY INFORMATION
// ============================================================

const CATEGORY_INFO = {
  food: {
    label: "Food",
    icon: "bi-egg-fried",
  },

  clothing: {
    label: "Clothing",
    icon: "bi-bag-heart",
  },

  toys: {
    label: "Toys",
    icon: "bi-controller",
  },

  medicine: {
    label: "Medicine",
    icon: "bi-capsule",
  },

  books: {
    label: "Books & Stationery",
    icon: "bi-book",
  },

  household: {
    label: "Household Items",
    icon: "bi-house-heart",
  },

  electronics: {
    label: "Electronics",
    icon: "bi-plug",
  },

  other: {
    label: "Other",
    icon: "bi-three-dots",
  },
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
// DATE HELPERS
// ============================================================

const formatDate = (date) => {
  if (!date) {
    return "Not available";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============================================================
// DAYS LEFT
// ============================================================

const getDaysLeft = (date) => {
  if (!date) {
    return 0;
  }

  const diff =
    new Date(date).getTime() - Date.now();

  return Math.ceil(
    diff / (1000 * 60 * 60 * 24)
  );
};

// ============================================================
// FRESHNESS
// ============================================================

const getFreshnessPct = (
  from,
  until
) => {
  if (!from || !until) {
    return 0;
  }

  const start =
    new Date(from).getTime();

  const end =
    new Date(until).getTime();

  const total = end - start;

  if (total <= 0) {
    return 0;
  }

  const remaining =
    end - Date.now();

  return Math.min(
    100,
    Math.max(
      0,
      (remaining / total) * 100
    )
  );
};

// ============================================================
// URGENCY
// ============================================================

const getUrgency = (daysLeft) => {
  if (daysLeft <= 1) {
    return "urgent";
  }

  if (daysLeft <= 3) {
    return "warn";
  }

  return "fresh";
};

// ============================================================
// INITIALS
// ============================================================

const getInitials = (
  name = ""
) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (word) =>
        word[0]?.toUpperCase()
    )
    .join("");

// ============================================================
// STATUS LABEL
// ============================================================

const getStatusLabel = (status) => {
  if (!status) {
    return "Available";
  }

  return String(status)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
};

// ============================================================
// DONOR DETAILS
// ============================================================

function DonorDetails({ donor }) {
  const [
    copiedField,
    setCopiedField,
  ] = useState(null);

  const copy = (
    field,
    value
  ) => {
    if (!value) {
      return;
    }

    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedField(field);

        setTimeout(() => {
          setCopiedField(null);
        }, 1500);
      })
      .catch((error) => {
        console.error(
          "Copy failed:",
          error
        );
      });
  };

  const displayName =
    donor?.organizationName ||
    donor?.name ||
    "Donor";

  return (
    <details className="ad-donor">
      <summary>
        <span className="ad-donor-avatar">
          {getInitials(
            displayName
          ) || "?"}
        </span>

        <span className="ad-donor-summary-name">
          {displayName}
        </span>
      </summary>

      {/* ORGANIZATION DONOR */}

      {donor?.donorType ===
        "organization" && (
        <div className="ad-donor-row ad-donor-row--static">
          🏢 Organization Donor
        </div>
      )}

      {/* EMAIL */}

      <button
        type="button"
        className="ad-donor-row ad-donor-row--copyable"
        onClick={() =>
          copy(
            "email",
            donor?.email
          )
        }
      >
        <span>
          📧{" "}
          {donor?.email ||
            "Email not available"}
        </span>

        <span
          className={`ad-copy-hint ${
            copiedField === "email"
              ? "is-copied"
              : ""
          }`}
        >
          {copiedField === "email"
            ? "Copied"
            : "Copy"}
        </span>
      </button>

      {/* PHONE */}

      <button
        type="button"
        className="ad-donor-row ad-donor-row--copyable"
        onClick={() =>
          copy(
            "phone",
            donor?.phone
          )
        }
      >
        <span>
          📞{" "}
          {donor?.phone ||
            "Phone not available"}
        </span>

        <span
          className={`ad-copy-hint ${
            copiedField === "phone"
              ? "is-copied"
              : ""
          }`}
        >
          {copiedField === "phone"
            ? "Copied"
            : "Copy"}
        </span>
      </button>

      {/* ADDRESS */}

      <p className="ad-donor-row ad-donor-row--static">
        📍{" "}
        {donor?.address ||
          "Address not available"}

        {donor?.city
          ? `, ${donor.city}`
          : ""}

        {donor?.state
          ? `, ${donor.state}`
          : ""}

        {donor?.pincode
          ? ` ${donor.pincode}`
          : ""}
      </p>
    </details>
  );
}

// ============================================================
// DONATION CATEGORIES
// ============================================================

function DonationCategories({
  categories,
}) {
  if (
    !Array.isArray(categories) ||
    categories.length === 0
  ) {
    return (
      <div className="ad-no-items">
        No donation categories
        available.
      </div>
    );
  }

  return (
    <div className="ad-items">
      {categories.map(
        (
          categoryItem,
          index
        ) => {
          const category =
            CATEGORY_INFO[
              categoryItem.category
            ] || {
              label:
                categoryItem.category ||
                "Other",
              icon: "bi-box",
            };

          const displayCategory =
            categoryItem.category ===
            "other"
              ? categoryItem.customCategory ||
                "Other"
              : category.label;

          return (
            <div
              key={
                categoryItem._id ||
                index
              }
              className="ad-item"
            >
              {/* ICON */}

              <div className="ad-item-icon">
                <i
                  className={`bi ${category.icon}`}
                ></i>
              </div>

              {/* CONTENT */}

              <div className="ad-item-content">
                {/* ITEM NAME + NUMBER */}

                <div className="ad-item-header">
                  <h6 className="ad-item-name">
                    {categoryItem.itemName ||
                      "Unnamed Item"}
                  </h6>

                  <span className="ad-item-number">
                    #{index + 1}
                  </span>
                </div>

                {/* CATEGORY */}

                <div className="ad-item-category">
                  {displayCategory}
                </div>

                {/* QUANTITY + CONDITION */}

                <div className="ad-item-meta">
                  <span className="ad-item-quantity">
                    {categoryItem.quantity}{" "}
                    {categoryItem.unit}
                  </span>

                  <span className="ad-item-condition">
                    {categoryItem.condition ||
                      "Good"}
                  </span>
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

// ============================================================
// CAMPAIGN DONATION LABEL
// ============================================================

function CampaignDonationLabel({
  donation,
}) {
  const isCampaignDonation =
    Boolean(donation?.campaign);

  if (!isCampaignDonation) {
    return null;
  }

  const campaignTitle =
    typeof donation.campaign ===
    "object"
      ? donation.campaign?.title
      : null;

  return (
    <div className="ad-campaign-banner">
      <span className="ad-campaign-icon">
        🎯
      </span>

      <div>
        <strong>
          Campaign Donation
        </strong>

        {campaignTitle && (
          <span>
            {campaignTitle}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CAMPAIGN INFORMATION PANEL
// ============================================================
//
// IMPORTANT:
//
// Campaign donations do NOT use an image.
//
// Instead, this panel occupies the media area and displays
// campaign information similar to the Admin Campaign Details
// page.
// ============================================================

function CampaignInformation({
  donation,
}) {
  if (!donation?.campaign) {
    return null;
  }

  const campaign =
    typeof donation.campaign ===
    "object"
      ? donation.campaign
      : null;

  const campaignTitle =
    campaign?.title ||
    donation.donationName ||
    "Campaign Donation";

  const campaignDescription =
    campaign?.description ||
    donation.description ||
    "Donation submitted towards a campaign.";

  const campaignStatus =
    campaign?.status ||
    donation.status ||
    "active";

  const campaignCategory =
    campaign?.categories?.length > 0
      ? campaign.categories
          .map(
            (category) =>
              CATEGORY_INFO[
                category
              ]?.label ||
              category
          )
          .join(" · ")
      : donation.categories
          ?.map(
            (item) =>
              CATEGORY_INFO[
                item.category
              ]?.label ||
              item.category
          )
          .filter(Boolean)
          .join(" · ") ||
        "Campaign";

  const campaignRequirements =
    Array.isArray(
      campaign?.requirements
    )
      ? campaign.requirements
      : [];

  const progress =
    typeof campaign?.progress ===
    "number"
      ? campaign.progress
      : 0;

  return (
    <div className="ad-campaign-media">
      {/* TOP LABEL */}

      <div className="ad-campaign-media-top">
        <span className="ad-campaign-media-label">
          🎯 CAMPAIGN DONATION
        </span>

        <span className="ad-campaign-media-status">
          {getStatusLabel(
            campaignStatus
          )}
        </span>
      </div>

      {/* ICON */}

      <div className="ad-campaign-media-icon">
        🎯
      </div>

      {/* TITLE */}

      <h3 className="ad-campaign-media-title">
        {campaignTitle}
      </h3>

      {/* CATEGORY */}

      <div className="ad-campaign-media-category">
        {campaignCategory}
      </div>

      {/* DESCRIPTION */}

      <p className="ad-campaign-media-description">
        {campaignDescription}
      </p>

      {/* PROGRESS */}

      {campaign && (
        <div className="ad-campaign-progress">
          <div className="ad-campaign-progress-header">
            <span>
              Campaign Progress
            </span>

            <strong>
              {progress}%
            </strong>
          </div>

          <div className="ad-campaign-progress-track">
            <div
              className="ad-campaign-progress-fill"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    progress
                  )
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* REQUIREMENTS */}

      {campaignRequirements.length >
        0 && (
        <div className="ad-campaign-requirements">
          <span className="ad-campaign-requirements-title">
            📦 Campaign Requirements
          </span>

          <div className="ad-campaign-requirement-list">
            {campaignRequirements
              .slice(0, 3)
              .map(
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
                      goal -
                        current
                    );

                  return (
                    <div
                      key={
                        requirement._id ||
                        index
                      }
                      className="ad-campaign-requirement"
                    >
                      <span>
                        {
                          requirement.itemName
                        }
                      </span>

                      <strong>
                        {remaining}{" "}
                        {
                          requirement.unit
                        }{" "}
                        left
                      </strong>
                    </div>
                  );
                }
              )}
          </div>
        </div>
      )}

      {/* NO CAMPAIGN OBJECT FALLBACK */}

      {!campaign && (
        <div className="ad-campaign-media-note">
          This donation is linked to a
          campaign.
        </div>
      )}
    </div>
  );
}

// ============================================================
// IMAGE LIGHTBOX
// ============================================================

function ImageLightbox({
  src,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (
      e
    ) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [onClose]);

  return (
    <div
      className="ad-lightbox-backdrop"
      onClick={onClose}
    >

      <div
        className="ad-lightbox-content"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <button
          type="button"
          className="ad-lightbox-close"
          onClick={onClose}
          aria-label="Close image preview"
        >
          <i className="bi bi-x-lg"></i>
        </button>

        <img
          src={src}
          alt="Donation full view"
        />

      </div>

    </div>
  );
}

// ============================================================
// AVAILABLE DONATIONS
// ============================================================

function AvailableDonations() {
  const [
    donations,
    setDonations,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    selectedDeliveryMethods,
    setSelectedDeliveryMethods,
  ] = useState({});

  const [
    lightboxImage,
    setLightboxImage,
  ] = useState(null);

  // ==========================================================
  // FETCH DONATIONS
  // ==========================================================

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations =
    async () => {
      setLoading(true);

      try {
        const token =
          localStorage.getItem(
            "token"
          );

        const res =
          await API.get(
            "/donations",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        console.log(
          "AVAILABLE DONATIONS:",
          res.data
        );

        if (
          Array.isArray(
            res.data
          )
        ) {
          res.data.forEach(
            (donation) => {
              console.log(
                "DONATION ID:",
                donation._id
              );

              console.log(
                "DONATION NAME:",
                donation.donationName
              );

              console.log(
                "DONATION CATEGORIES:",
                donation.categories
              );

              console.log(
                "ITEM IMAGES:",
                donation.itemImages
              );

              console.log(
                "CAMPAIGN:",
                donation.campaign
              );

              console.log(
                "DELIVERY METHODS:",
                donation.allowedDeliveryMethods
              );
            }
          );
        }

        setDonations(
          Array.isArray(
            res.data
          )
            ? res.data
            : []
        );
      } catch (error) {
        console.error(
          "Fetch Donations Error:",
          error
        );

        setDonations([]);
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // REQUEST DONATION
  // ==========================================================

  const handleRequest =
    async (
      donationId
    ) => {
      const deliveryMethod =
        selectedDeliveryMethods[
          donationId
        ];

      if (!deliveryMethod) {
        alert(
          "Please select a delivery method."
        );

        return;
      }

      try {
        const token =
          localStorage.getItem(
            "token"
          );

        console.log(
          "REQUEST DONATION:",
          {
            donationId,
            deliveryMethod,
          }
        );

        await API.post(
          "/requests",
          {
            donationId,
            deliveryMethod,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        alert(
          "Request submitted successfully."
        );

        await fetchDonations();

        setSelectedDeliveryMethods(
          (previous) => {
            const updated = {
              ...previous,
            };

            delete updated[
              donationId
            ];

            return updated;
          }
        );
      } catch (error) {
        console.error(
          "Request Donation Error:",
          error
        );

        console.error(
          "Backend Response:",
          error.response?.data
        );

        alert(
          error.response?.data
            ?.message ||
            "Request failed."
        );
      }
    };

  // ==========================================================
  // DELIVERY METHOD
  // ==========================================================

  const handleDeliveryMethodChange =
    (
      donationId,
      method
    ) => {
      setSelectedDeliveryMethods(
        (previous) => ({
          ...previous,
          [donationId]:
            method,
        })
      );
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      <PageHeader
        title="Available Donations"
        subtitle="Browse donations available for your organization."
      />

      <div className="ad-page">

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (
          <div className="ad-empty">
            Loading donations…
          </div>
        ) : donations.length ===
          0 ? (

          /* ==================================================
             EMPTY
          ================================================== */

          <div className="ad-empty">

            <div className="ad-empty-icon">
              <i className="bi bi-box-seam"></i>
            </div>

            <h5>
              No donations available
            </h5>

            <p>
              Check back soon for
              new donations.
            </p>

          </div>

        ) : (

          /* ==================================================
             DONATION GRID
          ================================================== */

          <div className="ad-grid">

            {donations.map(
              (donation) => {

                // ==========================================
                // DONATION INFORMATION
                // ==========================================

                const daysLeft =
                  getDaysLeft(
                    donation.availableUntil
                  );

                const urgency =
                  getUrgency(
                    daysLeft
                  );

                const freshnessPct =
                  getFreshnessPct(
                    donation.availableFrom,
                    donation.availableUntil
                  );

                const selectedMethod =
                  selectedDeliveryMethods[
                    donation._id
                  ];

                const categories =
                  Array.isArray(
                    donation.categories
                  )
                    ? donation.categories
                    : [];

                // ==========================================
                // CAMPAIGN DETECTION
                // ==========================================

                const isCampaignDonation =
                  Boolean(
                    donation.campaign
                  );

                const campaignTitle =
                  typeof donation.campaign ===
                  "object"
                    ? donation.campaign?.title
                    : null;

                // ==========================================
                // NORMAL DONATION IMAGES ONLY
                // ==========================================

                const hasImages =
                  !isCampaignDonation &&
                  Array.isArray(
                    donation.itemImages
                  ) &&
                  donation.itemImages
                    .length > 0;

                // ==========================================
                // DELIVERY METHODS AVAILABLE
                // ==========================================

                const availableDeliveryMethods =
                  Array.isArray(
                    donation.allowedDeliveryMethods
                  )
                    ? donation.allowedDeliveryMethods
                    : [];

                const hasDeliveryMethods =
                  DELIVERY_METHODS.some(
                    (method) =>
                      method.aliases.some(
                        (alias) =>
                          availableDeliveryMethods.includes(
                            alias
                          )
                      )
                  );

                return (

                  <div
                    key={
                      donation._id
                    }
                    className={`ad-card ${
                      urgency !==
                      "fresh"
                        ? `is-${urgency}`
                        : ""
                    } ${
                      isCampaignDonation
                        ? "ad-card--campaign"
                        : ""
                    }`}
                  >

                    {/* ========================================
                        MEDIA / CAMPAIGN INFORMATION
                    ======================================== */}

                    <div
                      className={`ad-media ${
                        isCampaignDonation
                          ? "ad-media--campaign"
                          : ""
                      }`}
                    >

                      {/* ====================================
                          CAMPAIGN DONATION
                      ==================================== */}

                      {isCampaignDonation ? (

                        <CampaignInformation
                          donation={
                            donation
                          }
                        />

                      ) : hasImages ? (

                        /* ====================================
                           NORMAL DONATION WITH IMAGE
                        ==================================== */

                        <div
                          id={`carousel-${donation._id}`}
                          className="carousel slide"
                          data-bs-ride="carousel"
                        >

                          <div className="carousel-inner">

                            {donation.itemImages.map(
                              (
                                image,
                                index
                              ) => {

                                const imageUrl =
                                  getImageUrl(
                                    image
                                  );

                                return (

                                  <div
                                    key={`${donation._id}-${index}`}
                                    className={`carousel-item ${
                                      index ===
                                      0
                                        ? "active"
                                        : ""
                                    }`}
                                  >

                                    <img
                                      src={
                                        imageUrl
                                      }
                                      className="d-block w-100 ad-donation-image"
                                      alt={
                                        donation.donationName ||
                                        "Donation"
                                      }
                                      onClick={() =>
                                        setLightboxImage(
                                          imageUrl
                                        )
                                      }
                                      onError={(
                                        event
                                      ) => {

                                        console.error(
                                          "IMAGE FAILED:",
                                          imageUrl
                                        );

                                        event
                                          .currentTarget
                                          .style
                                          .display =
                                          "none";
                                      }}
                                    />

                                  </div>

                                );
                              }
                            )}

                          </div>

                          {donation
                            .itemImages
                            .length > 1 && (

                            <>

                              <button
                                className="carousel-control-prev"
                                type="button"
                                data-bs-target={`#carousel-${donation._id}`}
                                data-bs-slide="prev"
                              >

                                <span className="carousel-control-prev-icon"></span>

                              </button>

                              <button
                                className="carousel-control-next"
                                type="button"
                                data-bs-target={`#carousel-${donation._id}`}
                                data-bs-slide="next"
                              >

                                <span className="carousel-control-next-icon"></span>

                              </button>

                            </>

                          )}

                        </div>

                      ) : (

                        /* ====================================
                           NORMAL DONATION WITHOUT IMAGE
                        ==================================== */

                        <div className="ad-media--placeholder">

                          <span className="ad-media-icon">
                            📦
                          </span>

                          <span>
                            No image available
                          </span>

                        </div>

                      )}

                      {/* STATUS */}

                      <span className="ad-status-chip">
                        {getStatusLabel(
                          donation.status
                        )}
                      </span>

                    </div>

                    {/* ========================================
                        BODY
                    ======================================== */}

                    <div className="ad-body">

                      {/* ======================================
                          CAMPAIGN LABEL
                      ====================================== */}

                      <CampaignDonationLabel
                        donation={
                          donation
                        }
                      />

                      {/* ======================================
                          TITLE
                      ====================================== */}

                      <div className="ad-top">

                        <div className="ad-title-wrap">

                          <span className="ad-item-count">

                            {categories.length}{" "}

                            categor
                            {categories.length ===
                            1
                              ? "y"
                              : "ies"}

                          </span>

                          <h5 className="ad-title">

                            {isCampaignDonation
                              ? campaignTitle ||
                                donation.donationName ||
                                "Campaign Donation"
                              : donation.donationName ||
                                "Untitled Donation"}

                          </h5>

                          <p className="ad-category">

                            {categories
                              .map(
                                (
                                  categoryItem
                                ) =>
                                  CATEGORY_INFO[
                                    categoryItem.category
                                  ]?.label ||
                                  categoryItem.category
                              )
                              .filter(
                                Boolean
                              )
                              .join(
                                " · "
                              )}

                          </p>

                        </div>

                        {/* FRESHNESS RING */}

                        <div
                          className="ad-ring"
                          style={{
                            "--pct": `${freshnessPct}%`,
                          }}
                        >

                          <span className="ad-ring-num">

                            {Math.max(
                              daysLeft,
                              0
                            )}

                          </span>

                          <span className="ad-ring-unit">

                            {daysLeft ===
                            1
                              ? "day"
                              : "days"}

                          </span>

                        </div>

                      </div>

                      {/* ======================================
                          DONATION CATEGORIES
                      ====================================== */}

                      <h6 className="ad-section-label">

                        📦{" "}

                        {isCampaignDonation
                          ? "Campaign Donation Items"
                          : "Donation Categories"}

                      </h6>

                      <DonationCategories
                        categories={
                          categories
                        }
                      />

                      {/* ======================================
                          AVAILABILITY
                      ====================================== */}

                      <div className="ad-availability">

                        <div className="ad-availability-row">

                          <span>
                            <i className="bi bi-calendar3"></i>
                            Available from
                          </span>

                          <strong>
                            {formatDate(
                              donation.availableFrom
                            )}
                          </strong>

                        </div>

                        <div className="ad-availability-row">

                          <span>
                            <i className="bi bi-calendar-x"></i>
                            Available until
                          </span>

                          <strong>
                            {formatDate(
                              donation.availableUntil
                            )}
                          </strong>

                        </div>

                      </div>

                      {/* ======================================
                          DESCRIPTION
                      ====================================== */}

                      {donation.description && (
                        <>

                          <h6 className="ad-section-label">
                            📝 Description
                          </h6>

                          <p className="ad-description">
                            {
                              donation.description
                            }
                          </p>

                        </>
                      )}

                      {/* ======================================
                          DELIVERY
                      ====================================== */}

                      <h6 className="ad-section-label">
                        🚚 Delivery Method
                      </h6>

                      <div
                        className="ad-route-group"
                        role="radiogroup"
                        aria-label="Delivery method"
                      >

                        {DELIVERY_METHODS
                          .filter(
                            (method) =>
                              method.aliases.some(
                                (alias) =>
                                  availableDeliveryMethods.includes(
                                    alias
                                  )
                              )
                          )
                          .map(
                            (method) => (

                              <label
                                key={
                                  method.key
                                }
                                className={`ad-route-chip ${
                                  selectedMethod ===
                                  method.key
                                    ? "is-selected"
                                    : ""
                                }`}
                              >

                                <input
                                  className="ad-route-chip-input"
                                  type="radio"
                                  name={`delivery-${donation._id}`}
                                  value={
                                    method.key
                                  }
                                  checked={
                                    selectedMethod ===
                                    method.key
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleDeliveryMethodChange(
                                      donation._id,
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                />

                                <span aria-hidden="true">
                                  {
                                    method.icon
                                  }
                                </span>

                                {
                                  method.label
                                }

                              </label>

                            )
                          )}

                      </div>

                      {/* ======================================
                          NO DELIVERY METHODS
                      ====================================== */}

                      {!hasDeliveryMethods && (

                        <p className="ad-no-items">
                          No delivery method
                          specified.
                        </p>

                      )}

                      {/* ======================================
                          REQUEST DONATION
                      ====================================== */}

                      <button
                        type="button"
                        className="ad-request-btn"
                        onClick={() =>
                          handleRequest(
                            donation._id
                          )
                        }
                        disabled={
                          !hasDeliveryMethods
                        }
                      >
                        🤝 Request Donation
                      </button>

                      {/* ======================================
                          DONOR
                      ====================================== */}

                      <DonorDetails
                        donor={
                          donation.donor
                        }
                      />

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

        {lightboxImage && (
          <ImageLightbox
            src={lightboxImage}
            onClose={() =>
              setLightboxImage(null)
            }
          />
        )}

      </div>

    </DashboardLayout>
  );
}

export default AvailableDonations;