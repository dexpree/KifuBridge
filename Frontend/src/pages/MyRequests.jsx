import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/MyRequests.css";

const BACKEND_URL = "http://localhost:5000";

// ============================================================
// REQUEST STATUS
// ============================================================

const REQUEST_STATUS_BADGES = {
  pending: "badge-pending",
  approved: "badge-success",
  rejected: "badge-danger",
  completed: "badge-success",
};

// ============================================================
// DELIVERY STATUS
// ============================================================

const DELIVERY_STATUS_BADGES = {
  pending: "badge-pending",
  volunteer_assigned: "badge-pending",
  volunteer_accepted: "badge-info",
  picked_up: "badge-primary",
  delivered: "badge-secondary",
  received: "badge-success",
  completed: "badge-success",
};

// ============================================================
// DELIVERY METHODS
// ============================================================

const DELIVERY_METHOD_LABELS = {
  volunteer: {
    icon: "🚚",
    label: "Volunteer Delivery",
  },

  donor_self: {
    icon: "🚗",
    label: "Donor Delivery",
  },

  ngo_pickup: {
    icon: "🏢",
    label: "NGO Pickup",
  },
};

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
    icon: "bi-box",
  },
};

// ============================================================
// VOLUNTEER DELIVERY STEPS
// ============================================================

const VOLUNTEER_STEPS = [
  {
    key: "volunteer_assigned",
    label: "Volunteer Assigned",

    completedWhen: [
      "volunteer_assigned",
      "volunteer_accepted",
      "picked_up",
      "delivered",
      "received",
      "completed",
    ],
  },

  {
    key: "volunteer_accepted",
    label: "Volunteer Accepted",

    completedWhen: [
      "volunteer_accepted",
      "picked_up",
      "delivered",
      "received",
      "completed",
    ],
  },

  {
    key: "picked_up",
    label: "Picked Up",

    completedWhen: [
      "picked_up",
      "delivered",
      "received",
      "completed",
    ],
  },

  {
    key: "delivered",
    label: "Delivered",

    completedWhen: [
      "delivered",
      "received",
      "completed",
    ],
  },

  {
    key: "received",
    label: "NGO Confirmed",

    completedWhen: [
      "received",
      "completed",
    ],
  },
];

// ============================================================
// SORT OPTIONS
// ============================================================

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest first",
  },

  {
    value: "oldest",
    label: "Oldest first",
  },
];

// ============================================================
// HELPERS
// ============================================================

const getRequestBadgeClass = (status) =>
  REQUEST_STATUS_BADGES[status] ??
  "badge-pending";

const getDeliveryBadgeClass = (status) =>
  DELIVERY_STATUS_BADGES[status] ??
  "badge-pending";

const formatDeliveryStatus = (status) =>
  status
    ? status
        .replace(/_/g, " ")
        .toUpperCase()
    : "PENDING";

const formatRequestDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem(
      "token"
    )}`,
  },
});

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

  return `${BACKEND_URL}${
    image.startsWith("/")
      ? image
      : `/${image}`
  }`;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

function MyRequests() {
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [sortOrder, setSortOrder] =
    useState("newest");

  // ==========================================================
  // FETCH REQUESTS
  // ==========================================================

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const res = await API.get(
        "/requests/my-requests",
        getAuthHeaders()
      );

      console.log(
        "MY REQUESTS:",
        res.data
      );

      if (Array.isArray(res.data)) {
        res.data.forEach((request) => {
          console.log(
            "REQUEST:",
            request._id
          );

          console.log(
            "DONATION:",
            request.donation
          );

          console.log(
            "DONATION NAME:",
            request.donation?.donationName
          );

          console.log(
            "CATEGORIES:",
            request.donation?.categories
          );
        });
      }

      setRequests(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load requests:",
        error
      );

      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // MARK RECEIVED
  // ==========================================================

  const markReceived = async (
    requestId
  ) => {
    try {
      await API.put(
        `/requests/${requestId}/received`,
        {},
        getAuthHeaders()
      );

      alert(
        "Donation received successfully."
      );

      fetchRequests();
    } catch (error) {
      console.error(
        "Failed to confirm receipt:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Couldn't confirm receipt. Please try again."
      );
    }
  };

  // ==========================================================
  // SORT
  // ==========================================================

  const sortedRequests = useMemo(() => {
    const withTime = requests.map(
      (request) => {
        const time = new Date(
          request.createdAt
        ).getTime();

        return {
          request,
          time: Number.isNaN(time)
            ? 0
            : time,
        };
      }
    );

    withTime.sort((a, b) => {
      if (a.time !== b.time) {
        return sortOrder === "newest"
          ? b.time - a.time
          : a.time - b.time;
      }

      const idA =
        a.request._id ?? "";

      const idB =
        b.request._id ?? "";

      return sortOrder === "newest"
        ? idB.localeCompare(idA)
        : idA.localeCompare(idB);
    });

    return withTime.map(
      (entry) => entry.request
    );
  }, [
    requests,
    sortOrder,
  ]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mrq-loading">
          Loading your requests…
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <DashboardLayout>
      <PageHeader
        title="My Requests"
        subtitle="View and manage your donation requests."
      />
      {requests.length === 0 ? (
        <div className="alert alert-info">
          No requests found.
        </div>
      ) : (
        <>
          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div className="mrq-toolbar">
            <span className="mrq-toolbar-count">
              {requests.length} request
              {requests.length !== 1
                ? "s"
                : ""}
            </span>

            <label className="mrq-sort">
              <span className="mrq-sort-label">
                Sort
              </span>

              <select
                className="mrq-sort-select"
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(
                    e.target.value
                  )
                }
              >
                {SORT_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          {/* =================================================
              REQUEST GRID
          ================================================= */}

          <div className="row">
            {sortedRequests.map(
              (
                request,
                index
              ) => (
                <RequestCard
                  key={
                    request._id
                  }
                  request={
                    request
                  }
                  index={
                    index
                  }
                  onMarkReceived={
                    markReceived
                  }
                />
              )
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

// ============================================================
// REQUEST CARD
// ============================================================

function RequestCard({
  request,
  index,
  onMarkReceived,
}) {
  const method =
    DELIVERY_METHOD_LABELS[
      request.deliveryMethod
    ];

  const donation =
    request.donation;

  const donor =
    donation?.donor;

  const volunteer =
    request.assignedVolunteer;

  const requestedOn =
    formatRequestDate(
      request.createdAt
    );

  const isOrganization =
    donor?.donorType ===
    "organization";

  // ==========================================================
  // NEW DONATION STRUCTURE
  // ==========================================================

  const categories =
    Array.isArray(
      donation?.categories
    )
      ? donation.categories
      : [];

  return (
    <div className="col-md-6 mb-4">
      <div
        className="card request-card h-100"
        style={{
          "--mrq-card-index": index,
        }}
      >
        <div className="card-body">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="request-card-header">
            <div>

              <h4 className="request-title">
                {donation?.donationName ||
                  "Donation"}
              </h4>

              {categories.length >
                0 && (
                <small className="text-muted">
                  {categories.length} categor
                  {categories.length ===
                  1
                    ? "y"
                    : "ies"}
                </small>
              )}

            </div>

            {requestedOn && (
              <span
                className="request-date-chip"
                title="Date requested"
              >
                {requestedOn}
              </span>
            )}

          </div>

          {/* =================================================
              DONATION CATEGORIES
          ================================================= */}

          <DonationCategories
            categories={
              categories
            }
          />

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          {donation?.description && (
            <div className="request-description">

              <strong>
                Description:
              </strong>

              <p>
                {
                  donation.description
                }
              </p>

            </div>
          )}

          {/* =================================================
              DONATION IMAGES
          ================================================= */}

          <DonationGallery
            images={
              donation?.itemImages
            }
          />

          {/* =================================================
              DONOR DETAILS
          ================================================= */}

          <DonorDetails
            donor={donor}
            isOrganization={
              isOrganization
            }
          />

          {/* =================================================
              PROOF IMAGES
          ================================================= */}

          <ProofImage
            label="Pickup Proof"
            src={
              request.pickupProofImage ||
              donation?.pickupProofImage
            }
          />

          <ProofImage
            label="Delivery Proof"
            src={
              request.deliveryProofImage ||
              donation?.deliveryProofImage
            }
          />

          <hr />

          {/* =================================================
              REQUEST STATUS
          ================================================= */}

          <StatusRow label="Request Status">
            <span
              className={`badge status-badge ${getRequestBadgeClass(
                request.status
              )}`}
            >
              {(
                request.status ||
                "unknown"
              ).toUpperCase()}
            </span>
          </StatusRow>

          {/* =================================================
              DELIVERY METHOD
          ================================================= */}

          <StatusRow label="Delivery Method">
            <span className="badge status-badge badge-primary">
              {method
                ? `${method.icon} ${method.label}`
                : "Not Selected"}
            </span>
          </StatusRow>

          {/* =================================================
              DELIVERY STATUS
          ================================================= */}

          <StatusRow label="Delivery Status">
            <span
              className={`badge status-badge ${getDeliveryBadgeClass(
                request.deliveryStatus
              )}`}
            >
              {formatDeliveryStatus(
                request.deliveryStatus
              )}
            </span>
          </StatusRow>

          {/* =================================================
              VOLUNTEER
          ================================================= */}

          {request.deliveryMethod ===
            "volunteer" &&
            volunteer && (
              <VolunteerDetails
                volunteer={
                  volunteer
                }
              />
            )}

          {/* =================================================
              WAITING FOR VOLUNTEER
          ================================================= */}

          {request.deliveryMethod ===
            "volunteer" &&
            !volunteer &&
            request.status ===
              "approved" && (
              <div className="alert alert-warning mt-3">
                ⏳ Waiting for a volunteer
                to be assigned.
              </div>
            )}

          {/* =================================================
              VOLUNTEER PROGRESS
          ================================================= */}

          {request.deliveryMethod ===
            "volunteer" && (
            <VolunteerProgress
              deliveryStatus={
                request.deliveryStatus
              }
            />
          )}

          {/* =================================================
              DONOR SELF DELIVERY
          ================================================= */}

          {request.deliveryMethod ===
            "donor_self" &&
            request.status ===
              "approved" && (
            <div className="alert alert-info mt-3">
              🚗 The donor will deliver
              this donation directly to
              your NGO.
            </div>
          )}

          {/* =================================================
              NGO PICKUP
          ================================================= */}

          {request.deliveryMethod ===
            "ngo_pickup" &&
            request.status ===
              "approved" && (
            <NgoPickupSection
              request={
                request
              }
              onMarkReceived={
                onMarkReceived
              }
            />
          )}

          {/* =================================================
              DELIVERED
          ================================================= */}

          {request.deliveryStatus ===
            "delivered" && (
            <div className="mt-3">

              <div className="alert alert-info">
                📦 This donation has
                been delivered.

                <br />

                Please confirm that your
                NGO has received it.
              </div>

              <button
                type="button"
                className="btn btn-success w-100"
                onClick={() =>
                  onMarkReceived(
                    request._id
                  )
                }
              >
                ✅ Confirm Received
              </button>

            </div>
          )}

          {/* =================================================
              COMPLETED
          ================================================= */}

          {(request.deliveryStatus ===
            "received" ||
            request.deliveryStatus ===
              "completed" ||
            request.status ===
              "completed") && (
            <div className="alert alert-success mt-3">

              🎉 Donation Completed
              Successfully.

              <hr />

              Thank you for confirming
              the delivery.

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ============================================================
// DONATION CATEGORIES
// ============================================================

function DonationCategories({
  categories,
}) {
  if (
    !Array.isArray(
      categories
    ) ||
    categories.length === 0
  ) {
    return (
      <div className="alert alert-warning">
        Donation category information
        is unavailable.
      </div>
    );
  }

  return (
    <div className="mrq-items-section">

      <div className="mrq-items-header">

        <span>
          📦 Donation Categories
        </span>

        <span className="mrq-items-count">
          {categories.length}
        </span>

      </div>

      <div className="mrq-items-list">

        {categories.map(
          (
            category,
            index
          ) => {

            const info =
              CATEGORY_INFO[
                category.category
              ] || {
                label:
                  category.category ||
                  "Other",
                icon:
                  "bi-box",
              };

            const displayCategory =
              category.category ===
                "other" &&
              category.customCategory
                ? category.customCategory
                : info.label;

            return (
              <div
                key={
                  category._id ||
                  `${category.category}-${index}`
                }
                className="mrq-item"
              >

                {/* NUMBER */}

                <div className="mrq-item-number">
                  {index + 1}
                </div>

                {/* ICON */}

                <div className="mrq-item-icon">
                  <i
                    className={`bi ${info.icon}`}
                  ></i>
                </div>

                {/* CONTENT */}

                <div className="mrq-item-main">

                  {/* ITEM NAME */}

                  <div className="mrq-item-name">
                    {category.itemName ||
                      "Item name unavailable"}
                  </div>

                  {/* CATEGORY */}

                  <div className="mrq-item-category">
                    {displayCategory}
                  </div>

                  {/* QUANTITY + CONDITION */}

                  <div className="mrq-item-meta">

                    <span>
                      {
                        category.quantity
                      }{" "}
                      {
                        category.unit
                      }
                    </span>

                    {category.condition && (
                      <span>
                        {
                          category.condition
                        }
                      </span>
                    )}

                  </div>

                </div>

              </div>
            );
          }
        )}

      </div>

    </div>
  );
}

// ============================================================
// DONOR DETAILS
// ============================================================

function DonorDetails({
  donor,
  isOrganization,
}) {
  if (!donor) {
    return (
      <div className="info-section donor-section">

        <div className="info-section-header">
          <span>
            👤 Donor Details
          </span>
        </div>

        <div className="alert alert-warning">
          Donor information is
          unavailable.
        </div>

      </div>
    );
  }

  return (
    <>
      <hr />

      <div className="info-section donor-section">

        <div className="info-section-header">

          <h6 className="info-section-title">
            {isOrganization
              ? "🏢 Organization Donor"
              : "👤 Donor Details"}
          </h6>

        </div>

        <div className="info-grid">

          <InfoRow
            label={
              isOrganization
                ? "Contact Person"
                : "Name"
            }
            value={
              donor.name
            }
          />

          {isOrganization && (
            <>
              <InfoRow
                label="Organization"
                value={
                  donor.organizationName
                }
              />

              <InfoRow
                label="Organization Category"
                value={
                  donor.organizationCategory
                }
              />

              <InfoRow
                label="GST Number"
                value={
                  donor.gstNumber
                }
              />
            </>
          )}

          <InfoRow
            label="Email"
            value={
              donor.email
            }
          />

          <InfoRow
            label="Phone"
            value={
              donor.phone
            }
            isPhone
          />

          <InfoRow
            label="Address"
            value={
              donor.address
            }
          />

          <InfoRow
            label="City"
            value={
              donor.city
            }
          />

          <InfoRow
            label="State"
            value={
              donor.state
            }
          />

          <InfoRow
            label="Pincode"
            value={
              donor.pincode
            }
          />

        </div>

      </div>
    </>
  );
}

// ============================================================
// VOLUNTEER DETAILS
// ============================================================

function VolunteerDetails({
  volunteer,
}) {
  return (
    <>
      <hr />

      <div className="info-section volunteer-section">

        <div className="info-section-header">

          <h6 className="info-section-title">
            🚚 Assigned Volunteer
          </h6>

          <span className="badge badge-success">
            Assigned
          </span>

        </div>

        <div className="info-grid">

          <InfoRow
            label="Name"
            value={
              volunteer.name
            }
          />

          <InfoRow
            label="Email"
            value={
              volunteer.email
            }
          />

          <InfoRow
            label="Phone"
            value={
              volunteer.phone
            }
            isPhone
          />

          <InfoRow
            label="Vehicle"
            value={
              volunteer.vehicleType
            }
          />

          <InfoRow
            label="Vehicle Number"
            value={
              volunteer.vehicleNumber
            }
          />

          <InfoRow
            label="Capacity"
            value={
              volunteer.vehicleCapacity
            }
          />

          <InfoRow
            label="Availability"
            value={
              volunteer.availability
            }
          />

          <InfoRow
            label="License Number"
            value={
              volunteer.licenseNumber
            }
          />

          <InfoRow
            label="Address"
            value={
              volunteer.address
            }
          />

          <InfoRow
            label="City"
            value={
              volunteer.city
            }
          />

          <InfoRow
            label="State"
            value={
              volunteer.state
            }
          />

          <InfoRow
            label="Pincode"
            value={
              volunteer.pincode
            }
          />

        </div>

        {(volunteer.licenseImage ||
          volunteer.governmentIdImage ||
          volunteer.vehicleRCImage) && (
          <div className="volunteer-documents">

            <h6>
              📄 Verification
              Documents
            </h6>

            <div className="document-links">

              {volunteer.licenseImage && (
                <a
                  href={getImageUrl(
                    volunteer.licenseImage
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  🪪 Driving Licence
                </a>
              )}

              {volunteer.governmentIdImage && (
                <a
                  href={getImageUrl(
                    volunteer.governmentIdImage
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  🆔 Government ID
                </a>
              )}

              {volunteer.vehicleRCImage && (
                <a
                  href={getImageUrl(
                    volunteer.vehicleRCImage
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  🚗 Vehicle RC
                </a>
              )}

            </div>

          </div>
        )}

      </div>
    </>
  );
}

// ============================================================
// INFO ROW
// ============================================================

function InfoRow({
  label,
  value,
  isPhone = false,
}) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return (
    <div className="info-row">

      <span className="info-label">
        {label}
      </span>

      {isPhone ? (
        <a
          href={`tel:${value}`}
          className="info-value info-phone"
        >
          📞 {value}
        </a>
      ) : (
        <span className="info-value">
          {value}
        </span>
      )}

    </div>
  );
}

// ============================================================
// DONATION GALLERY
// ============================================================

function DonationGallery({
  images,
}) {
  if (!images?.length) {
    return null;
  }

  return (
    <div className="donation-gallery">

      {images.map(
        (img, index) => (
          <div
            className="donation-thumb"
            key={`${img}-${index}`}
          >
            <img
              src={getImageUrl(
                img
              )}
              alt="Donation"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          </div>
        )
      )}

    </div>
  );
}

// ============================================================
// PROOF IMAGE
// ============================================================

function ProofImage({
  label,
  src,
}) {
  if (!src) {
    return null;
  }

  return (
    <div className="proof-block">

      <h6 className="proof-label">
        📸 {label}
      </h6>

      <img
        src={getImageUrl(src)}
        alt={label}
        className="proof-img"
        loading="lazy"
      />

    </div>
  );
}

// ============================================================
// STATUS ROW
// ============================================================

function StatusRow({
  label,
  children,
}) {
  return (
    <p className="status-row">

      <strong>
        {label}:
      </strong>

      {children}

    </p>
  );
}

// ============================================================
// VOLUNTEER PROGRESS
// ============================================================

function VolunteerProgress({
  deliveryStatus,
}) {
  return (
    <>
      <hr />

      <h6 className="fw-bold progress-title">
        Volunteer Delivery Progress
      </h6>

      <div className="progress-stepper">

        {VOLUNTEER_STEPS.map(
          (step) => {

            const isComplete =
              step.completedWhen.includes(
                deliveryStatus
              );

            return (
              <div
                key={
                  step.key
                }
                className={`stepper-item ${
                  isComplete
                    ? "is-complete"
                    : ""
                }`}
              >

                <span className="stepper-dot">
                  {isComplete
                    ? "✓"
                    : ""}
                </span>

                <span className="stepper-label">
                  {
                    step.label
                  }
                </span>

              </div>
            );
          }
        )}

      </div>
    </>
  );
}

// ============================================================
// NGO PICKUP
// ============================================================

function NgoPickupSection({
  request,
  onMarkReceived,
}) {
  if (
    request.deliveryStatus ===
      "received" ||
    request.deliveryStatus ===
      "completed"
  ) {
    return (
      <div className="alert alert-success mt-3">
        🎉 Donation Collected
        Successfully.
      </div>
    );
  }

  if (
    request.deliveryStatus ===
    "pending"
  ) {
    return (
      <div className="mt-3">

        <div className="alert alert-warning">
          🏢 Your NGO can now
          collect this donation
          from the donor.
        </div>

        <button
          type="button"
          className="btn btn-success w-100"
          onClick={() =>
            onMarkReceived(
              request._id
            )
          }
        >
          📦 Confirm Collection
        </button>

      </div>
    );
  }

  return null;
}

export default MyRequests;