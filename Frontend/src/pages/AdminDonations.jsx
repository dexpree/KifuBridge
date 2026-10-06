import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import "../styles/AdminDonations.css";


const BACKEND_URL = "http://localhost:5000";

// ============================================================
// STATUS LANES
// ============================================================

const STATUS_LANES = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "picked_up", label: "Picked Up" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
];

// ============================================================
// CATEGORY INFO
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
// DELIVERY LABELS
// ============================================================

const DELIVERY_LABELS = {
  volunteer: "Volunteer Delivery",
  donor_self: "Donor Delivery",
  ngo_pickup: "NGO Pickup",
};

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

  return `${BACKEND_URL}${
    image.startsWith("/") ? image : `/${image}`
  }`;
};

// ============================================================
// CATEGORY HELPER
// ============================================================

const getCategoryInfo = (category) => {
  return (
    CATEGORY_INFO[category] || {
      label: category || "Other",
      icon: "bi-box",
    }
  );
};

// ============================================================
// STATUS FORMAT
// ============================================================

const formatStatus = (value) => {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ============================================================
// ADMIN DONATIONS
// ============================================================

function AdminDonations() {
  const [donations, setDonations] = useState([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [sortOrder, setSortOrder] = useState("newest");

  const [category, setCategory] = useState("all");

  // ==========================================================
  // FETCH
  // ==========================================================

  useEffect(() => {
    fetchDonations();
  }, [status]);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("token");

      const url =
        status === "all"
          ? "/admin/donations"
          : `/admin/donations/${status}`;

      const res = await API.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("ADMIN DONATIONS:", res.data);

      if (Array.isArray(res.data)) {
        res.data.forEach((donation) => {
          console.log("DONATION:", donation._id);
          console.log("DONATION NAME:", donation.donationName);
          console.log("CATEGORIES:", donation.categories);
          console.log("NGO:", donation.ngo);
          console.log("VOLUNTEER:", donation.volunteer);
        });
      }

      setDonations(
        Array.isArray(res.data) ? res.data : []
      );
    } catch (error) {
      console.error("Admin Donations Error:", error);

      setDonations([]);
    }
  };

  // ==========================================================
  // CATEGORY OPTIONS
  // ==========================================================

  const categoryOptions = useMemo(() => {
    const categories = new Set();

    donations.forEach((donation) => {
      if (Array.isArray(donation.categories)) {
        donation.categories.forEach((item) => {
          if (item?.category) {
            categories.add(item.category);
          }
        });
      }
    });

    return [
      "all",
      ...Array.from(categories).sort(),
    ];
  }, [donations]);

  // ==========================================================
  // SEARCH + FILTER + SORT
  // ==========================================================

  const visibleDonations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = donations.filter((donation) => {
      // ------------------------------------------------------
      // DONATION TITLE
      // ------------------------------------------------------

      const donationName =
        donation.donationName || "";

      const donationNameMatch = donationName
        .toLowerCase()
        .includes(normalizedSearch);

      // ------------------------------------------------------
      // ITEM NAME SEARCH
      // ------------------------------------------------------

      const itemNameMatch =
        Array.isArray(donation.categories) &&
        donation.categories.some((item) =>
          item?.itemName
            ?.toLowerCase()
            .includes(normalizedSearch)
        );

      // ------------------------------------------------------
      // CATEGORY SEARCH
      // ------------------------------------------------------

      const categoryMatchSearch =
        Array.isArray(donation.categories) &&
        donation.categories.some((item) => {
          const categoryName =
            item?.category?.toLowerCase() || "";

          const customCategory =
            item?.customCategory?.toLowerCase() || "";

          return (
            categoryName.includes(normalizedSearch) ||
            customCategory.includes(normalizedSearch)
          );
        });

      // ------------------------------------------------------
      // DONOR
      // ------------------------------------------------------

      const donorName =
        donation.donor?.name || "";

      const organizationName =
        donation.donor?.organizationName || "";

      const donorMatch =
        donorName
          .toLowerCase()
          .includes(normalizedSearch) ||
        organizationName
          .toLowerCase()
          .includes(normalizedSearch);

      // ------------------------------------------------------
      // SEARCH MATCH
      // ------------------------------------------------------

      const matchesSearch =
        !normalizedSearch ||
        donationNameMatch ||
        itemNameMatch ||
        categoryMatchSearch ||
        donorMatch;

      // ------------------------------------------------------
      // CATEGORY FILTER
      // ------------------------------------------------------

      const matchesCategory =
        category === "all" ||
        donation.categories?.some(
          (item) =>
            item.category === category
        );

      return (
        matchesSearch &&
        matchesCategory
      );
    });

    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    return [...filtered].sort((a, b) => {
      const dateA = new Date(
        a.createdAt ||
          a.availableFrom ||
          0
      ).getTime();

      const dateB = new Date(
        b.createdAt ||
          b.availableFrom ||
          0
      ).getTime();

      return sortOrder === "newest"
        ? dateB - dateA
        : dateA - dateB;
    });
  }, [
    donations,
    search,
    category,
    sortOrder,
  ]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>
  
      <div className="adn-page">
   
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="adn-eyebrow">
          Donations Registry
        </div>

        {/* ====================================================
            TOOLBAR
        ==================================================== */}

        <div className="adn-toolbar">

          {/* SEARCH */}

          <input
            className="adn-search"
            placeholder="Search by donation, item, category, donor or organization..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {/* STATUS */}

          <div className="adn-lanes">

            {STATUS_LANES.map((lane) => (
              <button
                key={lane.value}
                type="button"
                className={`adn-lane ${
                  status === lane.value
                    ? "is-active"
                    : ""
                }`}
                onClick={() =>
                  setStatus(lane.value)
                }
              >
                {lane.label}
              </button>
            ))}

          </div>

          <div className="adn-toolbar-right">

            {/* CATEGORY */}

            {categoryOptions.length > 1 && (
              <select
                className="adn-category-select"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
              >
                <option value="all">
                  All categories
                </option>

                {categoryOptions
                  .filter(
                    (item) => item !== "all"
                  )
                  .map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {
                        getCategoryInfo(item)
                          .label
                      }
                    </option>
                  ))}
              </select>
            )}

            {/* SORT */}

            <div className="adn-sort">

              <button
                type="button"
                className={`adn-sort-btn ${
                  sortOrder === "newest"
                    ? "is-active"
                    : ""
                }`}
                onClick={() =>
                  setSortOrder("newest")
                }
              >
                <i className="bi bi-sort-down"></i>
                Newest
              </button>

              <button
                type="button"
                className={`adn-sort-btn ${
                  sortOrder === "oldest"
                    ? "is-active"
                    : ""
                }`}
                onClick={() =>
                  setSortOrder("oldest")
                }
              >
                <i className="bi bi-sort-up"></i>
                Oldest
              </button>

            </div>

          </div>
        </div>

        {/* ====================================================
            RESULTS
        ==================================================== */}

        {visibleDonations.length === 0 ? (

          <div className="adn-empty">
            No donations found.
          </div>

        ) : (

          <div className="adn-grid">

            {visibleDonations.map(
              (donation) => (
                <DonationAdminCard
                  key={donation._id}
                  donation={donation}
                />
              )
            )}

          </div>

        )}

      </div>

    </DashboardLayout>
  );
}

// ============================================================
// ADMIN DONATION CARD
// ============================================================

function DonationAdminCard({
  donation,
}) {

  const categories =
    Array.isArray(
      donation.categories
    )
      ? donation.categories
      : [];

  return (
    <div className="adn-card">

      {/* ======================================================
          IMAGES
      ====================================================== */}

      {donation.itemImages?.length > 0 && (

        <div
          id={`carousel-${donation._id}`}
          className="carousel slide adn-carousel"
          data-bs-ride="carousel"
        >

          <div className="carousel-inner">

            {donation.itemImages.map(
              (image, index) => (

                <div
                  key={`${donation._id}-${index}`}
                  className={`carousel-item ${
                    index === 0
                      ? "active"
                      : ""
                  }`}
                >

                  <img
                    src={getImageUrl(image)}
                    className="d-block w-100"
                    style={{
                      height: "220px",
                      objectFit: "cover",
                    }}
                    alt={
                      donation.donationName ||
                      "Donation"
                    }
                  />

                </div>

              )
            )}

          </div>

          {donation.itemImages.length > 1 && (
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

      )}

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="adn-card-eyebrow">

        <span>
          Donation File
        </span>

        <span className="adn-refno">
          #
          {donation._id
            ?.slice(-6)
            .toUpperCase()}
        </span>

      </div>

      {/* ======================================================
          DONATION TITLE
      ====================================================== */}

      <div className="adn-card-head">

        <div>

          <h3 className="adn-item-name">

            <i className="bi bi-box-seam"></i>

            {donation.donationName ||
              "Untitled Donation"}

          </h3>

          <span className="adn-item-count">

            {categories.length}{" "}
            categor
            {categories.length === 1
              ? "y"
              : "ies"}

          </span>

        </div>

      </div>

      {/* ======================================================
          DESCRIPTION
      ====================================================== */}

      {donation.description && (

        <p className="adn-desc">
          {donation.description}
        </p>

      )}

      {/* ======================================================
          CATEGORY MANIFEST
      ====================================================== */}

      <div className="adn-manifest">

        <div className="adn-manifest-title">

          <i className="bi bi-boxes"></i>

          Donation Categories

        </div>

        {categories.length === 0 ? (

          <div className="adn-empty-inline">
            No category information
            available.
          </div>

        ) : (

          <div className="adn-items-list">

            {categories.map(
              (item, index) => {

                const category =
                  getCategoryInfo(
                    item.category
                  );

                const displayCategory =
                  item.category === "other"
                    ? item.customCategory ||
                      "Other"
                    : category.label;

                return (
                  <div
                    className="adn-admin-item"
                    key={
                      item._id ||
                      index
                    }
                  >

                    {/* NUMBER */}

                    <div className="adn-admin-item-number">
                      {index + 1}
                    </div>

                    {/* ICON */}

                    <div className="adn-admin-item-icon">

                      <i
                        className={`bi ${category.icon}`}
                      ></i>

                    </div>

                    {/* DETAILS */}

                    <div className="adn-admin-item-main">

                      {/* ITEM NAME */}

                      <div className="adn-admin-item-name">

                        {item.itemName ||
                          "Unnamed Item"}

                      </div>

                      {/* CATEGORY */}

                      <div className="adn-admin-item-category">

                        {displayCategory}

                      </div>

                      {/* META */}

                      <div className="adn-admin-item-meta">

                        <span>
                          Quantity:
                          {" "}
                          {item.quantity ||
                            "—"}
                          {" "}
                          {item.unit ||
                            ""}
                        </span>

                        <span>
                          Condition:
                          {" "}
                          {item.condition ||
                            "—"}
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

      {/* ======================================================
          AVAILABILITY
      ====================================================== */}

      <div className="adn-manifest">

        <div className="adn-manifest-row">

          <span className="m-label">
            From
          </span>

          <span className="m-leader"></span>

          <span className="m-value">

            {donation.availableFrom
              ? new Date(
                  donation.availableFrom
                ).toLocaleString()
              : "—"}

          </span>

        </div>

        <div className="adn-manifest-row">

          <span className="m-label">
            Until
          </span>

          <span className="m-leader"></span>

          <span className="m-value">

            {donation.availableUntil
              ? new Date(
                  donation.availableUntil
                ).toLocaleString()
              : "—"}

          </span>

        </div>

        <div className="adn-manifest-row">

          <span className="m-label">
            Status
          </span>

          <span className="m-leader"></span>

          <span className="m-value">

            {formatStatus(
              donation.status
            )}

          </span>

        </div>

      </div>

      {/* ======================================================
          DONOR
      ====================================================== */}

      <div className="adn-docket">

        <div className="adn-docket-title">

          <i className="bi bi-person-badge"></i>

          Donor

        </div>

        <div className="adn-docket-row">

          <span className="d-label">
            Name
          </span>

          <span>
            {donation.donor?.name ||
              "—"}
          </span>

        </div>

        <div className="adn-docket-row">

          <span className="d-label">
            Email
          </span>

          <span>
            {donation.donor?.email ||
              "—"}
          </span>

        </div>

        <div className="adn-docket-row">

          <span className="d-label">
            Phone
          </span>

          <span>
            {donation.donor?.phone ||
              "—"}
          </span>

        </div>

        <div className="adn-docket-row">

          <span className="d-label">
            Address
          </span>

          <span>
            {donation.donor?.address ||
              "—"}
          </span>

        </div>

        <div className="adn-docket-row">

          <span className="d-label">
            Location
          </span>

          <span>

            {donation.donor?.city ||
              "—"}

            {donation.donor?.state
              ? `, ${donation.donor.state}`
              : ""}

            {donation.donor?.pincode
              ? ` — ${donation.donor.pincode}`
              : ""}

          </span>

        </div>

        {donation.donor
          ?.organizationName && (

          <div className="adn-docket-row">

            <span className="d-label">
              Organization
            </span>

            <span>
              {
                donation.donor
                  .organizationName
              }
            </span>

          </div>

        )}

        {donation.donor
          ?.organizationCategory && (

          <div className="adn-docket-row">

            <span className="d-label">
              Organization Category
            </span>

            <span>
              {
                donation.donor
                  .organizationCategory
              }
            </span>

          </div>

        )}

        {donation.donor
          ?.donorType && (

          <div className="adn-docket-row">

            <span className="d-label">
              Donor Type
            </span>

            <span>
              {
                donation.donor
                  .donorType
              }
            </span>

          </div>

        )}

      </div>

      {/* ======================================================
          NGO + VOLUNTEER
      ====================================================== */}

      <div className="adn-assignment">

        {/* NGO */}

        <AssignmentCard
          title="NGO Details"
          icon="bi-building"
          assigned={donation.ngo}
          emptyMessage={
            "This donation has not been assigned to an NGO yet."
          }
        >

          <DetailRow
            label="Name"
            value={donation.ngo?.name}
          />

          <DetailRow
            label="Organization"
            value={
              donation.ngo
                ?.organizationName
            }
          />

          <DetailRow
            label="NGO Category"
            value={
              donation.ngo
                ?.ngoCategory
            }
          />

          <DetailRow
            label="Email"
            value={
              donation.ngo?.email
            }
          />

          <DetailRow
            label="Phone"
            value={
              donation.ngo?.phone
            }
          />

          <DetailRow
            label="Address"
            value={
              donation.ngo?.address
            }
          />

          <DetailRow
            label="City"
            value={
              donation.ngo?.city
            }
          />

          <DetailRow
            label="State"
            value={
              donation.ngo?.state
            }
          />

          <DetailRow
            label="Pincode"
            value={
              donation.ngo?.pincode
            }
          />

          <DetailRow
            label="Registration"
            value={
              donation.ngo
                ?.registrationCertificate
                ? (
                  <a
                    href={`${BACKEND_URL}${donation.ngo.registrationCertificate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adn-document-link"
                  >
                    <i className="bi bi-file-earmark-text"></i>
                    View Certificate
                  </a>
                )
                : "Not uploaded"
            }
          />

        </AssignmentCard>

        {/* VOLUNTEER */}

        <AssignmentCard
          title="Volunteer Details"
          icon="bi-truck"
          assigned={
            donation.volunteer
          }
          emptyMessage={
            "No volunteer has been assigned to this donation yet."
          }
        >

          <DetailRow
            label="Name"
            value={
              donation.volunteer
                ?.name
            }
          />

          <DetailRow
            label="Email"
            value={
              donation.volunteer
                ?.email
            }
          />

          <DetailRow
            label="Phone"
            value={
              donation.volunteer
                ?.phone
            }
          />

          <DetailRow
            label="Address"
            value={
              donation.volunteer
                ?.address
            }
          />

          <DetailRow
            label="City"
            value={
              donation.volunteer
                ?.city
            }
          />

          <DetailRow
            label="State"
            value={
              donation.volunteer
                ?.state
            }
          />

          <DetailRow
            label="Pincode"
            value={
              donation.volunteer
                ?.pincode
            }
          />

          <DetailRow
            label="Vehicle"
            value={
              donation.volunteer
                ?.vehicleType
            }
          />

          <DetailRow
            label="Vehicle No."
            value={
              donation.volunteer
                ?.vehicleNumber
            }
          />

          <DetailRow
            label="Capacity"
            value={
              donation.volunteer
                ?.vehicleCapacity
            }
          />

          <DetailRow
            label="Availability"
            value={
              donation.volunteer
                ?.availability
            }
          />

          <DetailRow
            label="License"
            value={
              donation.volunteer
                ?.licenseNumber
            }
          />

          <DetailRow
            label="Driving Licence"
            value={
              donation.volunteer
                ?.licenseImage
                ? (
                  <a
                    href={`${BACKEND_URL}${donation.volunteer.licenseImage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adn-document-link"
                  >
                    <i className="bi bi-person-vcard"></i>
                    View Licence
                  </a>
                )
                : "Not uploaded"
            }
          />

          <DetailRow
            label="Government ID"
            value={
              donation.volunteer
                ?.governmentIdImage
                ? (
                  <a
                    href={`${BACKEND_URL}${donation.volunteer.governmentIdImage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adn-document-link"
                  >
                    <i className="bi bi-person-badge"></i>
                    View ID
                  </a>
                )
                : "Not uploaded"
            }
          />

          <DetailRow
            label="Vehicle RC"
            value={
              donation.volunteer
                ?.vehicleRCImage
                ? (
                  <a
                    href={`${BACKEND_URL}${donation.volunteer.vehicleRCImage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adn-document-link"
                  >
                    <i className="bi bi-file-earmark-text"></i>
                    View RC
                  </a>
                )
                : "Not uploaded"
            }
          />

        </AssignmentCard>

      </div>

      {/* ======================================================
          DELIVERY METHODS
      ====================================================== */}

      {donation.allowedDeliveryMethods?.length > 0 && (

        <div className="adn-chip-row">

          {donation.allowedDeliveryMethods.map(
            (method) => (

              <span
                key={method}
                className="adn-chip"
              >
                {DELIVERY_LABELS[method] ||
                  formatStatus(method)}
              </span>

            )
          )}

        </div>

      )}

      {/* ======================================================
          STATUS
      ====================================================== */}

      <div className="adn-stamps">

        <span
          className={`adn-stamp adn-stamp--${
            donation.requestStatus ||
            "default"
          }`}
        >
          Request:{" "}
          {formatStatus(
            donation.requestStatus
          )}
        </span>

        <span
          className={`adn-stamp adn-stamp--${
            donation.deliveryStatus ||
            "default"
          }`}
        >
          Delivery:{" "}
          {formatStatus(
            donation.deliveryStatus
          )}
        </span>

      </div>

      {/* ======================================================
          PROOF
      ====================================================== */}

      {(
        donation.pickupProofImage ||
        donation.deliveryProofImage
      ) && (

        <div className="adn-proof">

          <div className="adn-proof-title">

            <i className="bi bi-camera"></i>

            Volunteer Proof

          </div>

          <div className="adn-proof-grid">

            {donation.pickupProofImage && (

              <div className="adn-proof-item">

                <span className="adn-proof-label">
                  Pickup Proof
                </span>

                <img
                  src={getImageUrl(
                    donation.pickupProofImage
                  )}
                  className="adn-proof-img"
                  alt="Pickup proof"
                />

              </div>

            )}

            {donation.deliveryProofImage && (

              <div className="adn-proof-item">

                <span className="adn-proof-label">
                  Delivery Proof
                </span>

                <img
                  src={getImageUrl(
                    donation.deliveryProofImage
                  )}
                  className="adn-proof-img"
                  alt="Delivery proof"
                />

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

// ============================================================
// ASSIGNMENT CARD
// ============================================================

function AssignmentCard({
  title,
  icon,
  assigned,
  emptyMessage,
  children,
}) {
  return (
    <div
      className={`adn-assignment-card ${
        assigned
          ? "has-assignment"
          : "is-missing"
      }`}
    >

      <div className="adn-assignment-header">

        <div className="adn-assignment-title">

          <i
            className={`bi ${icon}`}
          ></i>

          <span>
            {title}
          </span>

        </div>

        <span
          className={
            assigned
              ? "adn-assignment-status assigned"
              : "adn-assignment-status missing"
          }
        >
          {assigned
            ? "Assigned"
            : "Not Assigned"}
        </span>

      </div>

      {assigned ? (

        <div className="adn-assignment-details">
          {children}
        </div>

      ) : (

        <div className="adn-no-assignment">
          {emptyMessage}
        </div>

      )}

    </div>
  );
}

// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="adn-detail-row">

      <span className="adn-detail-label">
        {label}
      </span>

      <span className="adn-detail-value">
        {value || "—"}
      </span>

    </div>
  );
}

export default AdminDonations;