import { useEffect, useState } from "react";

import {
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import API from "../services/api";

import "../styles/AdminUserProfile.css";

// =========================================================
// BACKEND URL
// =========================================================

const BACKEND_URL = "http://localhost:5000";

// =========================================================
// ROLE BADGE
// =========================================================

const ROLE_BADGE_CLASS = {
  admin: "admin",
  ngo: "ngo",
  donor: "donor",
  volunteer: "volunteer",
};

// =========================================================
// FILE URL HELPER
// =========================================================

const getFileUrl = (value) => {
  if (!value) return null;

  if (
    typeof value === "string" &&
    (value.startsWith("http://") ||
      value.startsWith("https://"))
  ) {
    return value;
  }

  return `${BACKEND_URL}${value}`;
};

// =========================================================
// CHECK IMAGE
// =========================================================

const isImageFile = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }

  return /\.(jpg|jpeg|png|webp|gif)$/i.test(
    value
  );
};

// =========================================================
// CHECK PDF
// =========================================================

const isPdfFile = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }

  return /\.pdf$/i.test(value);
};

// =========================================================
// MAIN COMPONENT
// =========================================================

function AdminUserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({});

  const [donations, setDonations] =
    useState([]);

  const [requests, setRequests] =
    useState([]);

  const [deliveries, setDeliveries] =
    useState([]);

  const [campaigns, setCampaigns] =
    useState([]);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  // =====================================================
  // AUTH HEADERS
  // =====================================================

  const authHeaders = () => ({
    headers: {
      Authorization:
        `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // =====================================================
  // FETCH USER
  // =====================================================

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get(
        `/admin/users/details/${id}`,
        authHeaders()
      );

      console.log(
        "ADMIN USER PROFILE:",
        res.data
      );

      setUser(
        res.data.user
      );

      setStats(
        res.data.stats || {}
      );

      setDonations(
        res.data.donations || []
      );

      setRequests(
        res.data.requests || []
      );

      setDeliveries(
        res.data.deliveries || []
      );

      setCampaigns(
        res.data.campaigns || []
      );

    } catch (err) {

      console.error(
        "Fetch User Error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to load user profile."
      );

    } finally {

      setLoading(false);
    }
  };

  // =====================================================
  // APPROVE
  // =====================================================

  const handleApprove = async () => {
    try {

      setActionLoading(true);

      await API.put(
        `/admin/users/${id}/approve`,
        {},
        authHeaders()
      );

      await fetchUser();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Failed to approve user."
      );

    } finally {

      setActionLoading(false);
    }
  };

  // =====================================================
  // BLOCK
  // =====================================================

  const handleBlock = async () => {

    if (
      !window.confirm(
        "Are you sure you want to block this user?"
      )
    ) {
      return;
    }

    try {

      setActionLoading(true);

      await API.put(
        `/admin/users/${id}/block`,
        {},
        authHeaders()
      );

      await fetchUser();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Failed to block user."
      );

    } finally {

      setActionLoading(false);
    }
  };

  // =====================================================
  // UNBLOCK
  // =====================================================

  const handleUnblock = async () => {

    try {

      setActionLoading(true);

      await API.put(
        `/admin/users/${id}/unblock`,
        {},
        authHeaders()
      );

      await fetchUser();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Failed to unblock user."
      );

    } finally {

      setActionLoading(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async () => {

    if (
      !window.confirm(
        "This will delete this user. Continue?"
      )
    ) {
      return;
    }

    try {

      setActionLoading(true);

      await API.put(
        `/admin/users/${id}/delete`,
        {},
        authHeaders()
      );

      navigate("/admin/users");

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Failed to delete user."
      );

      setActionLoading(false);
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = () => {
    navigate("/admin/users");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <DashboardLayout>

        <div className="aup-loading">

          <div className="aup-spinner"></div>

          <p>
            Loading user profile...
          </p>

        </div>

      </DashboardLayout>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (

      <DashboardLayout>

        <div className="aup-error">

          <div className="aup-error-icon">
            ⚠️
          </div>

          <h3>
            Unable to Load User
          </h3>

          <p>
            {error}
          </p>

          <button
            className="aup-btn aup-btn-primary"
            onClick={fetchUser}
          >
            Try Again
          </button>

        </div>

      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  // =====================================================
  // USER DISPLAY DATA
  // =====================================================

  const roleClass =
    ROLE_BADGE_CLASS[user.role] ||
    "default";

  const displayName =
    user.role === "ngo" &&
    user.organizationName
      ? user.organizationName
      : user.name;

  const profileImage =
    getFileUrl(
      user.profileImage
    );

  // =====================================================
  // JSX
  // =====================================================

  return (

    <DashboardLayout>

      <PageHeader
        title="User Profile"
        subtitle="Complete account information and activity."
      />

      <div className="aup-container">

        {/* =================================================
            PROFILE HEADER
        ================================================= */}

        <section className="aup-profile-card">

          <div className="aup-profile-left">

            {profileImage ? (

              <img
                src={profileImage}
                alt={displayName}
                className="aup-avatar-image"
              />

            ) : (

              <div
                className={`aup-avatar ${roleClass}`}
              >
                {displayName
                  ?.charAt(0)
                  ?.toUpperCase() || "U"}
              </div>

            )}

            <div className="aup-profile-main">

              <div className="aup-name-row">

                <h1>
                  {displayName}
                </h1>

                <span
                  className={`aup-role-badge ${roleClass}`}
                >
                  {user.role}
                </span>

              </div>

              {user.role === "ngo" &&
                user.name && (

                  <p className="aup-sub-name">
                    Contact Person: {user.name}
                  </p>

                )}

              <p className="aup-email">
                ✉ {user.email}
              </p>

              <div className="aup-status-row">

                <span
                  className={
                    user.isApproved
                      ? "aup-status approved"
                      : "aup-status pending"
                  }
                >
                  {user.isApproved
                    ? "✓ Approved"
                    : "⏳ Pending Approval"}
                </span>

                {user.isBlocked && (

                  <span className="aup-status blocked">
                    🚫 Blocked
                  </span>

                )}

              </div>

            </div>

          </div>

          <div className="aup-profile-actions">

            {!user.isApproved &&
              user.role !== "donor" && (

                <button
                  className="aup-btn aup-btn-success"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  ✓ Approve
                </button>

              )}

            {!user.isBlocked ? (

              <button
                className="aup-btn aup-btn-warning"
                onClick={handleBlock}
                disabled={actionLoading}
              >
                🚫 Block
              </button>

            ) : (

              <button
                className="aup-btn aup-btn-success"
                onClick={handleUnblock}
                disabled={actionLoading}
              >
                🔓 Unblock
              </button>

            )}

            <button
              className="aup-btn aup-btn-primary"
              onClick={handleEdit}
              disabled={actionLoading}
            >
              ✏ Edit
            </button>

            <button
              className="aup-btn aup-btn-danger"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              🗑 Delete
            </button>

          </div>

        </section>

        {/* =================================================
            ACCOUNT INFORMATION
        ================================================= */}

        <section className="aup-section">

          <div className="aup-section-header">

            <div>

              <h2>
                Account Information
              </h2>

              <p>
                Basic registered account details
              </p>

            </div>

          </div>

          <div className="aup-info-grid">

            <InfoItem
              label="Full Name"
              value={user.name}
            />

            <InfoItem
              label="Email"
              value={user.email}
            />

            <InfoItem
              label="Phone"
              value={user.phone}
            />

            <InfoItem
              label="Gender"
              value={user.gender}
              capitalize
            />

            <InfoItem
              label="Role"
              value={user.role}
              capitalize
            />

            <InfoItem
              label="Address"
              value={user.address}
              full
            />

            <InfoItem
              label="City"
              value={user.city}
            />

            <InfoItem
              label="State"
              value={user.state}
            />

            <InfoItem
              label="Pincode"
              value={user.pincode}
            />

            <InfoItem
              label="Account Created"
              value={
                user.createdAt
                  ? new Date(
                      user.createdAt
                    ).toLocaleString("en-IN")
                  : "-"
              }
            />

          </div>

        </section>

        {/* =================================================
            NGO INFORMATION
        ================================================= */}

        {user.role === "ngo" && (

          <section className="aup-section">

            <SectionTitle
              title="NGO Information"
              subtitle="Organization registration details"
              color="green"
            />

            <div className="aup-info-grid">

              <InfoItem
                label="Organization Name"
                value={
                  user.organizationName
                }
              />

              <InfoItem
                label="Organization Category"
                value={
                  user.organizationCategory
                }
              />

              <InfoItem
                label="NGO Category"
                value={
                  user.ngoCategory
                }
              />

              <InfoItem
                label="Registration Number"
                value={
                  user.registrationNumber
                }
              />

              <InfoItem
                label="GST Number"
                value={
                  user.gstNumber
                }
              />

            </div>

            {/* NGO DOCUMENTS */}

            <DocumentSection
              documents={[
                {
                  label:
                    "NGO Registration Certificate",
                  value:
                    user.registrationCertificate,
                },
                {
                  label:
                    "GST Certificate",
                  value:
                    user.gstCertificate,
                },
              ]}
            />

          </section>

        )}

        {/* =================================================
            DONOR INFORMATION
        ================================================= */}

        {user.role === "donor" && (

          <section className="aup-section">

            <SectionTitle
              title="Donor Information"
              subtitle="Donor registration details"
              color="blue"
            />

            <div className="aup-info-grid">

              <InfoItem
                label="Donor Type"
                value={
                  user.donorType
                }
                capitalize
              />

              <InfoItem
                label="Organization Name"
                value={
                  user.organizationName
                }
              />

              <InfoItem
                label="Organization Category"
                value={
                  user.organizationCategory
                }
              />

              <InfoItem
                label="GST Number"
                value={
                  user.gstNumber
                }
              />

            </div>

            {/* DONOR DOCUMENTS */}

            <DocumentSection
              documents={[
                {
                  label:
                    "GST Certificate",
                  value:
                    user.gstCertificate,
                },
              ]}
            />

          </section>

        )}

        {/* =================================================
            VOLUNTEER INFORMATION
        ================================================= */}

        {user.role === "volunteer" && (

          <section className="aup-section">

            <SectionTitle
              title="Vehicle & Volunteer Information"
              subtitle="Volunteer transportation and verification details"
              color="cyan"
            />

            <div className="aup-info-grid">

              <InfoItem
                label="Vehicle Type"
                value={
                  user.vehicleType
                }
              />

              <InfoItem
                label="Vehicle Number"
                value={
                  user.vehicleNumber
                }
              />

              <InfoItem
                label="Vehicle Capacity"
                value={
                  user.vehicleCapacity
                }
              />

              <InfoItem
                label="Availability"
                value={
                  user.availability
                }
                capitalize
              />

              <InfoItem
                label="License Number"
                value={
                  user.licenseNumber
                }
              />

              <InfoItem
                label="Skills"
                value={
                  user.skills
                }
              />

            </div>

            {/* VOLUNTEER DOCUMENTS */}

            <DocumentSection
              documents={[
                {
                  label:
                    "Vehicle Photo",
                  value:
                    user.vehicleImage,
                },
                {
                  label:
                    "Driving Licence",
                  value:
                    user.licenseImage,
                },
                {
                  label:
                    "Government ID",
                  value:
                    user.governmentIdImage,
                },
                {
                  label:
                    "Vehicle RC",
                  value:
                    user.vehicleRCImage,
                },
              ]}
            />

          </section>

        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="aup-section">

          <SectionTitle
            title="Activity Statistics"
            subtitle="Overview of this user's activity"
          />

          <div className="aup-stats-grid">

            {/* DONOR */}

            {user.role === "donor" && (
              <>

                <StatCard
                  value={stats.totalDonations}
                  label="Total Donations"
                  icon="📦"
                />

                <StatCard
                  value={stats.available}
                  label="Available"
                  icon="🟢"
                />

                <StatCard
                  value={stats.requested}
                  label="Requested"
                  icon="📨"
                />

                <StatCard
                  value={stats.approved}
                  label="Approved"
                  icon="✓"
                />

                <StatCard
                  value={stats.pickedUp}
                  label="Picked Up"
                  icon="🚚"
                />

                <StatCard
                  value={stats.delivered}
                  label="Delivered"
                  icon="📍"
                />

                <StatCard
                  value={stats.completed}
                  label="Completed"
                  icon="🏆"
                />

                <StatCard
                  value={stats.expired}
                  label="Expired"
                  icon="⌛"
                />

              </>
            )}

            {/* NGO */}

            {user.role === "ngo" && (
              <>

                <StatCard
                  value={stats.totalRequests}
                  label="Total Requests"
                  icon="📨"
                />

                <StatCard
                  value={stats.pending}
                  label="Pending"
                  icon="⏳"
                />

                <StatCard
                  value={stats.approved}
                  label="Approved"
                  icon="✓"
                />

                <StatCard
                  value={stats.rejected}
                  label="Rejected"
                  icon="✕"
                />

                <StatCard
                  value={stats.delivered}
                  label="Delivered"
                  icon="📍"
                />

                <StatCard
                  value={stats.completed}
                  label="Completed"
                  icon="🏆"
                />

                <StatCard
                  value={stats.campaigns}
                  label="Campaigns"
                  icon="📢"
                />

              </>
            )}

            {/* VOLUNTEER */}

            {user.role === "volunteer" && (
              <>

                <StatCard
                  value={stats.assigned}
                  label="Assigned"
                  icon="📋"
                />

                <StatCard
                  value={stats.accepted}
                  label="Accepted"
                  icon="✓"
                />

                <StatCard
                  value={stats.pending}
                  label="Pending"
                  icon="⏳"
                />

                <StatCard
                  value={stats.pickedUp}
                  label="Picked Up"
                  icon="📦"
                />

                <StatCard
                  value={stats.delivered}
                  label="Delivered"
                  icon="📍"
                />

                <StatCard
                  value={stats.completed}
                  label="Completed"
                  icon="🏆"
                />

              </>
            )}

          </div>

        </section>

        {/* =================================================
            DONOR DONATIONS
        ================================================= */}

        {user.role === "donor" && (

          <section className="aup-section">

            <SectionTitle
              title="Donation History"
              subtitle={`${donations.length} donation(s) submitted by this donor`}
              color="blue"
            />

            {donations.length === 0 ? (

              <EmptyState
                icon="📦"
                text="This donor has not submitted any donations."
              />

            ) : (

              <div className="aup-table-wrapper">

                <table className="aup-table">

                  <thead>

                    <tr>
                      <th>Donation</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Condition</th>
                      <th>Status</th>
                      <th>Campaign</th>
                      <th>Date</th>
                    </tr>

                  </thead>

                  <tbody>

                    {donations.map(
                      (donation) => (

                        <tr
                          key={
                            donation._id
                          }
                        >

                          <td>

                            <div className="aup-item-name">
                              {donation.itemName}
                            </div>

                            {donation.description && (

                              <small>
                                {donation.description}
                              </small>

                            )}

                          </td>

                          <td>

                            <span className="aup-category">
                              {donation.category}
                            </span>

                          </td>

                          <td>
                            {donation.quantity}{" "}
                            {donation.unit}
                          </td>

                          <td>
                            {donation.condition ||
                              "-"}
                          </td>

                          <td>

                            <StatusBadge
                              status={
                                donation.status
                              }
                            />

                          </td>

                          <td>

                            {donation.campaign ? (

                              <span className="aup-campaign-name">
                                {
                                  donation.campaign.title
                                }
                              </span>

                            ) : (

                              <span className="aup-muted">
                                General Donation
                              </span>

                            )}

                          </td>

                          <td>
                            {formatDate(
                              donation.createdAt
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        )}

        {/* =================================================
            DONOR REQUESTS
        ================================================= */}

        {user.role === "donor" &&
          requests.length > 0 && (

            <section className="aup-section">

              <SectionTitle
                title="Donation Requests"
                subtitle="NGO requests associated with this donor's donations"
                color="purple"
              />

              <RequestTable
                requests={requests}
              />

            </section>

          )}

        {/* =================================================
            NGO REQUESTS
        ================================================= */}

        {user.role === "ngo" && (

          <section className="aup-section">

            <SectionTitle
              title="Request History"
              subtitle={`${requests.length} request(s) made by this NGO`}
              color="green"
            />

            {requests.length === 0 ? (

              <EmptyState
                icon="🤝"
                text="This NGO has not made any donation requests."
              />

            ) : (

              <div className="aup-table-wrapper">

                <table className="aup-table">

                  <thead>

                    <tr>
                      <th>Donation</th>
                      <th>Donor</th>
                      <th>Quantity</th>
                      <th>Request</th>
                      <th>Delivery</th>
                      <th>Volunteer</th>
                      <th>Date</th>
                    </tr>

                  </thead>

                  <tbody>

                    {requests.map(
                      (request) => {

                        const donation =
                          request.donation;

                        const donor =
                          donation?.donor;

                        const volunteer =
                          request.assignedVolunteer;

                        return (

                          <tr
                            key={
                              request._id
                            }
                          >

                            <td>

                              <strong>
                                {donation?.itemName ||
                                  "Unknown"}
                              </strong>

                              <small className="aup-table-sub">
                                {donation?.category ||
                                  "-"}
                              </small>

                            </td>

                            <td>
                              {donor?.name ||
                                "-"}
                            </td>

                            <td>
                              {donation?.quantity ||
                                "-"}{" "}
                              {donation?.unit ||
                                ""}
                            </td>

                            <td>

                              <StatusBadge
                                status={
                                  request.status
                                }
                              />

                            </td>

                            <td>

                              <StatusBadge
                                status={
                                  request.deliveryStatus
                                }
                              />

                            </td>

                            <td>
                              {volunteer?.name ||
                                "Not Assigned"}
                            </td>

                            <td>
                              {formatDate(
                                request.createdAt
                              )}
                            </td>

                          </tr>

                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        )}

        {/* =================================================
            NGO CAMPAIGNS
        ================================================= */}

        {user.role === "ngo" && (

          <section className="aup-section">

            <SectionTitle
              title="Campaigns Created"
              subtitle={`${campaigns.length} campaign(s) created by this NGO`}
              color="orange"
            />

            {campaigns.length === 0 ? (

              <EmptyState
                icon="📢"
                text="This NGO has not created any campaigns."
              />

            ) : (

              <div className="aup-campaign-grid">

                {campaigns.map(
                  (campaign) => (

                    <div
                      className="aup-campaign-card"
                      key={
                        campaign._id
                      }
                    >

                      <div className="aup-campaign-top">

                        <h3>
                          {campaign.title}
                        </h3>

                        <StatusBadge
                          status={
                            campaign.status
                          }
                        />

                      </div>

                      <p>
                        {campaign.description ||
                          "No description available."}
                      </p>

                      <div className="aup-campaign-footer">

                        <span>
                          📅{" "}
                          {formatDate(
                            campaign.createdAt
                          )}
                        </span>

                        {campaign._id && (

                          <Link
                            to={`/admin/campaigns/${campaign._id}`}
                            className="aup-view-link"
                          >
                            View Campaign →
                          </Link>

                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        )}

        {/* =================================================
            VOLUNTEER DELIVERIES
        ================================================= */}

        {user.role === "volunteer" && (

          <section className="aup-section">

            <SectionTitle
              title="Delivery History"
              subtitle={`${deliveries.length} delivery assignment(s)`}
              color="cyan"
            />

            {deliveries.length === 0 ? (

              <EmptyState
                icon="🚚"
                text="This volunteer has no delivery assignments."
              />

            ) : (

              <div className="aup-table-wrapper">

                <table className="aup-table">

                  <thead>

                    <tr>
                      <th>Donation</th>
                      <th>Donor</th>
                      <th>NGO</th>
                      <th>Quantity</th>
                      <th>Delivery Status</th>
                      <th>Date</th>
                    </tr>

                  </thead>

                  <tbody>

                    {deliveries.map(
                      (delivery) => {

                        const donation =
                          delivery.donation;

                        return (

                          <tr
                            key={
                              delivery._id
                            }
                          >

                            <td>

                              <strong>
                                {donation?.itemName ||
                                  "Unknown"}
                              </strong>

                              <small className="aup-table-sub">
                                {donation?.category ||
                                  "-"}
                              </small>

                            </td>

                            <td>
                              {
                                donation
                                  ?.donor
                                  ?.name ||
                                "-"
                              }
                            </td>

                            <td>

                              {
                                delivery
                                  .ngo
                                  ?.organizationName ||
                                delivery
                                  .ngo
                                  ?.name ||
                                "-"
                              }

                            </td>

                            <td>
                              {donation?.quantity ||
                                "-"}{" "}
                              {donation?.unit ||
                                ""}
                            </td>

                            <td>

                              <StatusBadge
                                status={
                                  delivery.deliveryStatus
                                }
                              />

                            </td>

                            <td>

                              {formatDate(
                                delivery.createdAt
                              )}

                            </td>

                          </tr>

                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        )}

        {/* =================================================
            BACK
        ================================================= */}

        <div className="aup-bottom-actions">

          <Link
            to="/admin/users"
            className="aup-btn aup-btn-secondary"
          >
            ← Back to Users
          </Link>

        </div>

      </div>

    </DashboardLayout>
  );
}

// =========================================================
// DOCUMENT SECTION
// =========================================================

function DocumentSection({
  documents = [],
}) {

  const validDocuments =
    documents.filter(
      (document) =>
        document.value
    );

  return (

    <div className="aup-documents-section">

      <div className="aup-documents-header">

        <div>

          <h3>
            📂 Verification Documents
          </h3>

          <p>
            Documents submitted during registration
          </p>

        </div>

        <span className="aup-document-count">

          {validDocuments.length}

          {" "}

          {validDocuments.length === 1
            ? "Document"
            : "Documents"}

        </span>

      </div>

      {validDocuments.length === 0 ? (

        <div className="aup-no-documents">

          <div className="aup-no-documents-icon">
            📁
          </div>

          <strong>
            No documents uploaded
          </strong>

          <span>
            This user has not uploaded any verification documents.
          </span>

        </div>

      ) : (

        <div className="aup-document-grid">

          {documents.map(
            (document) => (

              <DocumentItem
                key={document.label}
                label={document.label}
                value={document.value}
              />

            )
          )}

        </div>

      )}

    </div>
  );
}

// =========================================================
// DOCUMENT ITEM
// =========================================================

function DocumentItem({
  label,
  value,
}) {

  if (!value) {

    return (

      <div className="aup-document-card aup-document-card-empty">

        <div className="aup-document-card-header">

          <div className="aup-document-icon">
            📄
          </div>

          <div>

            <strong>
              {label}
            </strong>

            <span>
              Not uploaded
            </span>

          </div>

        </div>

        <div className="aup-document-empty-text">
          Document not available
        </div>

      </div>
    );
  }

  const documentUrl =
    getFileUrl(value);

  const image =
    isImageFile(value);

  const pdf =
    isPdfFile(value);

  return (

    <div className="aup-document-card">

      {/* =================================================
          DOCUMENT HEADER
      ================================================= */}

      <div className="aup-document-card-header">

        <div className="aup-document-icon">

          {image
            ? "🖼️"
            : pdf
            ? "📄"
            : "📁"}

        </div>

        <div>

          <strong>
            {label}
          </strong>

          <span>

            {image
              ? "Image Document"
              : pdf
              ? "PDF Document"
              : "Document"}

          </span>

        </div>

      </div>

      {/* =================================================
          IMAGE PREVIEW
      ================================================= */}

      {image && (

        <a
          href={documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="aup-document-preview"
        >

          <img
            src={documentUrl}
            alt={label}
            className="aup-document-image"
          />

          <div className="aup-document-overlay">

            <span>
              🔍
            </span>

            <strong>
              View Full Image
            </strong>

          </div>

        </a>

      )}

      {/* =================================================
          PDF / OTHER DOCUMENT
      ================================================= */}

      {!image && (

        <div className="aup-document-file">

          <div className="aup-document-file-icon">

            {pdf
              ? "📄"
              : "📁"}

          </div>

          <div>

            <strong>
              {pdf
                ? "PDF Verification Document"
                : "Uploaded Document"}
            </strong>

            <span>
              Click below to open the document
            </span>

          </div>

        </div>

      )}

      {/* =================================================
          VIEW BUTTON
      ================================================= */}

      <a
        href={documentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="aup-document-view-button"
      >

        <span>
          {image
            ? "🔍 View Image"
            : pdf
            ? "📄 View PDF"
            : "📂 View Document"}
        </span>

        <span>
          ↗
        </span>

      </a>

    </div>
  );
}

// =========================================================
// INFO ITEM
// =========================================================

function InfoItem({
  label,
  value,
  full,
  capitalize,
}) {

  return (

    <div
      className={`aup-info-item ${
        full ? "full" : ""
      }`}
    >

      <span>
        {label}
      </span>

      <strong
        className={
          capitalize
            ? "aup-capitalize"
            : ""
        }
      >
        {value || "-"}
      </strong>

    </div>
  );
}

// =========================================================
// SECTION TITLE
// =========================================================

function SectionTitle({
  title,
  subtitle,
  color = "",
}) {

  return (

    <div
      className={`aup-section-title ${color}`}
    >

      <div>

        <h2>
          {title}
        </h2>

        {subtitle && (

          <p>
            {subtitle}
          </p>

        )}

      </div>

    </div>
  );
}

// =========================================================
// STAT CARD
// =========================================================

function StatCard({
  value,
  label,
  icon,
}) {

  return (

    <div className="aup-stat-card">

      <div className="aup-stat-icon">
        {icon}
      </div>

      <div>

        <strong>
          {value ?? 0}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </div>
  );
}

// =========================================================
// STATUS BADGE
// =========================================================

function StatusBadge({
  status,
}) {

  if (
    !status ||
    status === "-"
  ) {

    return (

      <span className="aup-status-badge neutral">
        -
      </span>

    );
  }

  const formatted =
    status
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );

  let className =
    "neutral";

  if (
    [
      "completed",
      "approved",
      "delivered",
      "received",
    ].includes(status)
  ) {
    className =
      "success";
  }

  if (
    [
      "pending",
      "requested",
      "available",
      "volunteer_assigned",
      "volunteer_accepted",
    ].includes(status)
  ) {
    className =
      "warning";
  }

  if (
    [
      "rejected",
      "expired",
    ].includes(status)
  ) {
    className =
      "danger";
  }

  if (
    [
      "picked_up",
    ].includes(status)
  ) {
    className =
      "info";
  }

  return (

    <span
      className={`aup-status-badge ${className}`}
    >
      {formatted}
    </span>

  );
}

// =========================================================
// REQUEST TABLE
// =========================================================

function RequestTable({
  requests,
}) {

  return (

    <div className="aup-table-wrapper">

      <table className="aup-table">

        <thead>

          <tr>

            <th>
              Donation
            </th>

            <th>
              NGO
            </th>

            <th>
              Quantity
            </th>

            <th>
              Request
            </th>

            <th>
              Delivery
            </th>

            <th>
              Volunteer
            </th>

            <th>
              Date
            </th>

          </tr>

        </thead>

        <tbody>

          {requests.map(
            (request) => {

              const donation =
                request.donation;

              const ngo =
                request.ngo;

              const volunteer =
                request.assignedVolunteer;

              return (

                <tr
                  key={
                    request._id
                  }
                >

                  <td>

                    <strong>
                      {donation?.itemName ||
                        "Unknown"}
                    </strong>

                    <small className="aup-table-sub">
                      {donation?.category ||
                        "-"}
                    </small>

                  </td>

                  <td>

                    {ngo?.organizationName ||
                      ngo?.name ||
                      "-"}

                  </td>

                  <td>

                    {donation?.quantity ||
                      "-"}{" "}

                    {donation?.unit ||
                      ""}

                  </td>

                  <td>

                    <StatusBadge
                      status={
                        request.status
                      }
                    />

                  </td>

                  <td>

                    <StatusBadge
                      status={
                        request.deliveryStatus
                      }
                    />

                  </td>

                  <td>

                    {volunteer?.name ||
                      "Not Assigned"}

                  </td>

                  <td>

                    {formatDate(
                      request.createdAt
                    )}

                  </td>

                </tr>

              );
            }
          )}

        </tbody>

      </table>

    </div>
  );
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({
  icon,
  text,
}) {

  return (

    <div className="aup-empty">

      <div>
        {icon}
      </div>

      <p>
        {text}
      </p>

    </div>
  );
}

// =========================================================
// DATE
// =========================================================

function formatDate(date) {

  if (!date) {
    return "-";
  }

  return new Date(
    date
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default AdminUserProfile;