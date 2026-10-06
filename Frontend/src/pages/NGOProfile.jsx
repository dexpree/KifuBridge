import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";

import "../styles/NGOProfile.css";

// ============================================================
// BACKEND URL
// ============================================================

const BACKEND_URL = "http://localhost:5000";

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
// INITIALS
// ============================================================

const getInitials = (name = "") => {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (word) =>
        word[0]?.toUpperCase()
    )
    .join("");
};

// ============================================================
// LOCATION
// ============================================================

const getLocation = (ngo) => {
  const parts = [
    ngo?.city,
    ngo?.state,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(", ")
    : "Location not available";
};

// ============================================================
// MAIN COMPONENT
// ============================================================

function NGOProfile() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [ngo, setNgo] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================================
  // FETCH NGO
  // ==========================================================

  useEffect(() => {
    fetchNGO();
  }, [id]);

  const fetchNGO = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "token"
        );

      const response =
        await API.get(
          `/users/public-ngos/${id}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "NGO PROFILE:",
        response.data
      );

      setNgo(
        response.data
      );

    } catch (err) {
      console.error(
        "Fetch NGO Profile Error:",
        err
      );

      setNgo(null);

      setError(
        err.response?.data?.message ||
          "Unable to load NGO profile."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <DashboardLayout>

        <div className="ngo-profile-page">

          <div className="ngo-profile-state">

            <div className="ngo-profile-spinner"></div>

            <h5>
              Loading NGO profile...
            </h5>

            <p>
              Please wait while we
              retrieve the organization
              details.
            </p>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !ngo) {
    return (
      <DashboardLayout>

        <div className="ngo-profile-page">

          <div className="ngo-profile-state ngo-profile-error">

            <div className="ngo-profile-state-icon">
              <i className="bi bi-building-x"></i>
            </div>

            <h5>
              NGO unavailable
            </h5>

            <p>
              {error ||
                "This NGO profile could not be found."}
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                navigate("/ngos")
              }
            >
              <i className="bi bi-arrow-left me-1"></i>
              Back to NGOs
            </button>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  // ==========================================================
  // DATA
  // ==========================================================

  const organizationName =
    ngo.organizationName ||
    ngo.name ||
    "NGO";

  const initials =
    getInitials(
      organizationName
    );

  const imageUrl =
    getImageUrl(
      ngo.profileImage
    );

  const location =
    getLocation(ngo);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      <div className="ngo-profile-page">

        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <PageHeader
          title={organizationName}
          subtitle="Learn more about this verified NGO before supporting their work."
        />

        {/* ====================================================
            BACK BUTTON
        ==================================================== */}

        <button
          type="button"
          className="ngo-profile-back"
          onClick={() =>
            navigate("/ngos")
          }
        >
          <i className="bi bi-arrow-left"></i>
          Back to NGOs
        </button>

        {/* ====================================================
            PROFILE HERO
        ==================================================== */}

        <section className="ngo-profile-hero">

          <div className="ngo-profile-hero-media">

            {imageUrl ? (
              <img
                src={imageUrl}
                alt={
                  organizationName
                }
                className="ngo-profile-hero-image"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";

                  const placeholder =
                    event.currentTarget
                      .nextElementSibling;

                  if (
                    placeholder
                  ) {
                    placeholder.style.display =
                      "flex";
                  }
                }}
              />
            ) : null}

            <div
              className="ngo-profile-hero-placeholder"
              style={{
                display:
                  imageUrl
                    ? "none"
                    : "flex",
              }}
            >
              {initials || "NG"}
            </div>

          </div>

          <div className="ngo-profile-hero-content">

            <div className="ngo-profile-verification">

              <span className="ngo-profile-verified">

                <i className="bi bi-patch-check-fill"></i>

                Verified NGO

              </span>

            </div>

            <h1>
              {organizationName}
            </h1>

            {ngo.name &&
              ngo.organizationName &&
              ngo.name !==
                ngo.organizationName && (
                <p className="ngo-profile-contact">
                  <i className="bi bi-person"></i>
                  Contact Person:{" "}
                  {ngo.name}
                </p>
              )}

            {ngo.ngoCategory && (
              <span className="ngo-profile-category">
                <i className="bi bi-building"></i>
                {ngo.ngoCategory}
              </span>
            )}

            <div className="ngo-profile-location">

              <i className="bi bi-geo-alt-fill"></i>

              <span>
                {location}
              </span>

            </div>

          </div>

        </section>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <div className="ngo-profile-grid">

          {/* ==================================================
              ABOUT
          ================================================== */}

          <section className="ngo-profile-card">

            <div className="ngo-profile-card-header">

              <div className="ngo-profile-card-icon">
                <i className="bi bi-heart-pulse"></i>
              </div>

              <div>

                <h3>
                  About the NGO
                </h3>

                <p>
                  Information shared
                  by the organization.
                </p>

              </div>

            </div>

            <div className="ngo-profile-about">

              {ngo.bio ? (
                <p>
                  {ngo.bio}
                </p>
              ) : (
                <div className="ngo-profile-empty-content">

                  <i className="bi bi-info-circle"></i>

                  <span>
                    This NGO has not
                    added an organization
                    description yet.
                  </span>

                </div>
              )}

            </div>

          </section>

          {/* ==================================================
              ORGANIZATION DETAILS
          ================================================== */}

          <section className="ngo-profile-card">

            <div className="ngo-profile-card-header">

              <div className="ngo-profile-card-icon">
                <i className="bi bi-buildings"></i>
              </div>

              <div>

                <h3>
                  Organization Details
                </h3>

                <p>
                  Basic information
                  about the NGO.
                </p>

              </div>

            </div>

            <div className="ngo-profile-details">

              <ProfileDetail
                icon="bi-building"
                label="Organization"
                value={
                  ngo.organizationName
                }
              />

              <ProfileDetail
                icon="bi-grid"
                label="Category"
                value={
                  ngo.ngoCategory
                }
              />

              <ProfileDetail
                icon="bi-geo-alt"
                label="Location"
                value={
                  location
                }
              />

              <ProfileDetail
                icon="bi-calendar3"
                label="Member Since"
                value={
                  ngo.createdAt
                    ? new Date(
                        ngo.createdAt
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          month:
                            "long",
                          year:
                            "numeric",
                        }
                      )
                    : "—"
                }
              />

            </div>

          </section>

          {/* ==================================================
              CONTACT
          ================================================== */}

          <section className="ngo-profile-card">

            <div className="ngo-profile-card-header">

              <div className="ngo-profile-card-icon">
                <i className="bi bi-person-lines-fill"></i>
              </div>

              <div>

                <h3>
                  Contact Information
                </h3>

                <p>
                  Public contact details
                  for the organization.
                </p>

              </div>

            </div>

            <div className="ngo-profile-details">

              <ProfileDetail
                icon="bi-envelope"
                label="Email"
                value={
                  ngo.email
                }
              />

              <ProfileDetail
                icon="bi-telephone"
                label="Phone"
                value={
                  ngo.phone
                }
              />

              <ProfileDetail
                icon="bi-geo-alt"
                label="Address"
                value={
                  ngo.address
                }
              />

              <ProfileDetail
                icon="bi-pin-map"
                label="City"
                value={
                  ngo.city
                }
              />

              <ProfileDetail
                icon="bi-map"
                label="State"
                value={
                  ngo.state
                }
              />

              <ProfileDetail
                icon="bi-mailbox"
                label="Pincode"
                value={
                  ngo.pincode
                }
              />

            </div>

          </section>

          {/* ==================================================
              VERIFICATION
          ================================================== */}

          <section className="ngo-profile-card">

            <div className="ngo-profile-card-header">

              <div className="ngo-profile-card-icon">
                <i className="bi bi-shield-check"></i>
              </div>

              <div>

                <h3>
                  Verification
                </h3>

                <p>
                  Platform verification
                  status.
                </p>

              </div>

            </div>

            <div className="ngo-profile-verification-box">

              <div className="ngo-profile-verification-row">

                <div>
                  <i className="bi bi-patch-check-fill"></i>

                  <div>
                    <strong>
                      Verified NGO
                    </strong>

                    <span>
                      This organization
                      has been approved
                      on KifuBridge.
                    </span>
                  </div>
                </div>

                <span className="ngo-profile-verified-status">
                  Verified
                </span>

              </div>

              {ngo.registrationCertificate && (
                <a
                  href={getImageUrl(
                    ngo.registrationCertificate
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ngo-document-link"
                >
                  <i className="bi bi-file-earmark-text"></i>
                  View Registration Certificate
                  <i className="bi bi-box-arrow-up-right"></i>
                </a>
              )}

            </div>

          </section>

        </div>

        {/* ====================================================
            FUTURE DONATION SECTION
        ==================================================== */}

        <section className="ngo-profile-support-card">

          <div>

            <span className="ngo-profile-support-eyebrow">
              SUPPORT THIS ORGANIZATION
            </span>

            <h2>
              Want to help{" "}
              {organizationName}?
            </h2>

            <p>
              Direct donations and payment
              options will be available here.
            </p>

          </div>

          <button
            type="button"
            className="ngo-profile-support-btn"
            disabled
          >
            Donate to this NGO
            <i className="bi bi-arrow-right"></i>
          </button>

        </section>

      </div>

    </DashboardLayout>
  );
}

// ============================================================
// PROFILE DETAIL
// ============================================================

function ProfileDetail({
  icon,
  label,
  value,
}) {
  return (
    <div className="ngo-profile-detail">

      <div className="ngo-profile-detail-icon">
        <i
          className={`bi ${icon}`}
        ></i>
      </div>

      <div className="ngo-profile-detail-content">

        <span className="ngo-profile-detail-label">
          {label}
        </span>

        <strong>
          {value || "Not available"}
        </strong>

      </div>

    </div>
  );
}

export default NGOProfile;