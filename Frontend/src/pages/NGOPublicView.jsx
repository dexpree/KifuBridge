import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";

import "../styles/NGOPublicView.css";

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
// FORMAT NUMBER
// ============================================================

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
};

// ============================================================
// MAIN COMPONENT
// ============================================================

function NGOPublicView() {
  const navigate = useNavigate();

  const { id } = useParams();

  const [ngo, setNgo] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================================
  // FETCH NGO PUBLIC PROFILE
  // ==========================================================

  useEffect(() => {
    fetchNGO();
  }, [id]);

  const fetchNGO = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      /*
        TWO FLOWS:

        NGO viewing its own public profile:
        /ngo-public-view
        -> /users/my-public-profile

        Donor viewing a specific NGO:
        /ngo-public-view/:id
        -> /users/public-ngos/:id
      */

      const endpoint = id
        ? `/users/public-ngos/${id}`
        : "/users/my-public-profile";

      console.log(
        "===================================="
      );

      console.log(
        "NGO PUBLIC VIEW"
      );

      console.log(
        "NGO ID:",
        id || "OWN NGO PROFILE"
      );

      console.log(
        "REQUEST ENDPOINT:",
        endpoint
      );

      console.log(
        "===================================="
      );

      const response =
        await API.get(
          endpoint,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "NGO PUBLIC PROFILE RESPONSE:",
        response.data
      );

      const profile =
        response.data?.ngo ||
        response.data ||
        null;

      if (!profile) {
        setNgo(null);

        setError(
          "NGO profile was not found."
        );

        return;
      }

      setNgo(profile);

    } catch (error) {
      console.error(
        "Fetch NGO Public Profile Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load NGO profile."
      );

      setNgo(null);

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
        <div className="ngo-public-view-page">
          <div className="ngo-public-state">
            <div className="ngo-public-spinner"></div>

            <h5>
              Loading NGO profile...
            </h5>

            <p>
              Please wait while we load
              the public profile.
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
        <div className="ngo-public-view-page">
          <div className="ngo-public-state ngo-public-state-error">

            <div className="ngo-public-state-icon">
              <i className="bi bi-building-x"></i>
            </div>

            <h5>
              Unable to load NGO profile
            </h5>

            <p>
              {error ||
                "NGO profile was not found."}
            </p>

            <div className="ngo-public-state-actions">

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  navigate(-1)
                }
              >
                <i className="bi bi-arrow-left me-1"></i>
                Go Back
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={fetchNGO}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Try Again
              </button>

            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================================
  // NGO BASIC DATA
  // ==========================================================

  const organizationName =
    ngo.organizationName ||
    ngo.name ||
    "NGO";

  const initials =
    getInitials(
      organizationName
    ) || "NG";

  const profileImage =
    getImageUrl(
      ngo.profileImage
    );

  const location =
    getLocation(ngo);

  const achievements =
    Array.isArray(
      ngo.achievements
    )
      ? ngo.achievements
      : [];

  const impactImages =
    Array.isArray(
      ngo.impactImages
    )
      ? ngo.impactImages
      : [];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      <div className="ngo-public-view-page">

        <PageHeader
          title="NGO Public Profile"
          subtitle="Preview how this NGO's public profile appears to supporters."
        />

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="ngo-public-hero">

          <div className="ngo-public-hero-media">

            {profileImage ? (
              <img
                src={profileImage}
                alt={organizationName}
                className="ngo-public-profile-image"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";

                  const placeholder =
                    event.currentTarget
                      .nextElementSibling;

                  if (placeholder) {
                    placeholder.style.display =
                      "flex";
                  }
                }}
              />
            ) : null}

            <div
              className="ngo-public-profile-placeholder"
              style={{
                display:
                  profileImage
                    ? "none"
                    : "flex",
              }}
            >
              {initials}
            </div>

          </div>

          <div className="ngo-public-hero-content">

            <div className="ngo-public-verified">
              <i className="bi bi-patch-check-fill"></i>
              Verified NGO
            </div>

            <h1>
              {organizationName}
            </h1>

            {ngo.name &&
              ngo.organizationName &&
              ngo.name !==
                ngo.organizationName && (
                <p className="ngo-public-contact">
                  Contact Person:{" "}
                  <strong>
                    {ngo.name}
                  </strong>
                </p>
              )}

            {ngo.ngoCategory && (
              <div className="ngo-public-category">
                <i className="bi bi-building"></i>

                {ngo.ngoCategory}
              </div>
            )}

            <div className="ngo-public-location">
              <i className="bi bi-geo-alt-fill"></i>

              <span>
                {location}
              </span>
            </div>

            {ngo.createdAt && (
              <div className="ngo-public-member">

                <i className="bi bi-calendar3"></i>

                Member since{" "}
                {new Date(
                  ngo.createdAt
                ).toLocaleDateString(
                  "en-IN",
                  {
                    month: "long",
                    year: "numeric",
                  }
                )}

              </div>
            )}

          </div>

        </section>

        {/* =====================================================
            QUICK IMPACT STATS
        ===================================================== */}

        <section className="ngo-public-stats">

          <div className="ngo-public-stat-card">

            <div className="ngo-public-stat-icon">
              <i className="bi bi-people-fill"></i>
            </div>

            <div className="ngo-public-stat-content">

              <span className="ngo-public-stat-number">
                {formatNumber(
                  ngo.peopleHelped
                )}
              </span>

              <span className="ngo-public-stat-label">
                People Helped
              </span>

            </div>

          </div>

          <div className="ngo-public-stat-card">

            <div className="ngo-public-stat-icon">
              <i className="bi bi-check2-circle"></i>
            </div>

            <div className="ngo-public-stat-content">

              <span className="ngo-public-stat-number">
                {formatNumber(
                  ngo.projectsCompleted
                )}
              </span>

              <span className="ngo-public-stat-label">
                Projects Completed
              </span>

            </div>

          </div>

          <div className="ngo-public-stat-card">

            <div className="ngo-public-stat-icon">
              <i className="bi bi-calendar-heart"></i>
            </div>

            <div className="ngo-public-stat-content">

              <span className="ngo-public-stat-number">
                {formatNumber(
                  ngo.yearsOfService
                )}
              </span>

              <span className="ngo-public-stat-label">
                Years of Service
              </span>

            </div>

          </div>

        </section>

        {/* =====================================================
            ABOUT
        ===================================================== */}

        {ngo.ngoAbout && (
          <section className="ngo-public-section">

            <div className="ngo-public-section-heading">

              <div className="ngo-public-section-icon">
                <i className="bi bi-info-circle-fill"></i>
              </div>

              <div>
                <h2>
                  About Us
                </h2>

                <p>
                  Learn more about the organization.
                </p>
              </div>

            </div>

            <div className="ngo-public-text">
              {ngo.ngoAbout}
            </div>

          </section>
        )}

        {/* =====================================================
            MISSION + VISION
        ===================================================== */}

        {(ngo.ngoMission ||
          ngo.ngoVision) && (
          <section className="ngo-public-mission-grid">

            {ngo.ngoMission && (
              <article className="ngo-public-info-card">

                <div className="ngo-public-info-icon">
                  <i className="bi bi-bullseye"></i>
                </div>

                <h3>
                  Our Mission
                </h3>

                <p>
                  {ngo.ngoMission}
                </p>

              </article>
            )}

            {ngo.ngoVision && (
              <article className="ngo-public-info-card">

                <div className="ngo-public-info-icon">
                  <i className="bi bi-eye-fill"></i>
                </div>

                <h3>
                  Our Vision
                </h3>

                <p>
                  {ngo.ngoVision}
                </p>

              </article>
            )}

          </section>
        )}

        {/* =====================================================
            IMPACT
        ===================================================== */}

        {ngo.ngoImpact && (
          <section className="ngo-public-section">

            <div className="ngo-public-section-heading">

              <div className="ngo-public-section-icon">
                <i className="bi bi-bar-chart-fill"></i>
              </div>

              <div>
                <h2>
                  Our Impact
                </h2>

                <p>
                  The difference this organization
                  is making in society.
                </p>
              </div>

            </div>

            <div className="ngo-public-impact-content">

              <p className="ngo-public-text">
                {ngo.ngoImpact}
              </p>

            </div>

          </section>
        )}

        {/* =====================================================
            ACHIEVEMENTS
        ===================================================== */}

        {achievements.length > 0 && (
          <section className="ngo-public-section">

            <div className="ngo-public-section-heading">

              <div className="ngo-public-section-icon">
                <i className="bi bi-trophy-fill"></i>
              </div>

              <div>
                <h2>
                  Achievements
                </h2>

                <p>
                  Milestones and accomplishments.
                </p>
              </div>

            </div>

            <div className="ngo-public-achievements">

              {achievements.map(
                (achievement, index) => (
                  <div
                    key={`${achievement}-${index}`}
                    className="ngo-public-achievement"
                  >

                    <div className="ngo-public-achievement-number">
                      {index + 1}
                    </div>

                    <div className="ngo-public-achievement-content">
                      <span>
                        {achievement}
                      </span>
                    </div>

                  </div>
                )
              )}

            </div>

          </section>
        )}

        {/* =====================================================
            IMPACT GALLERY
        ===================================================== */}

        {impactImages.length > 0 && (
          <section className="ngo-public-section">

            <div className="ngo-public-section-heading">

              <div className="ngo-public-section-icon">
                <i className="bi bi-images"></i>
              </div>

              <div>
                <h2>
                  Our Work in Action
                </h2>

                <p>
                  Highlights from our work in the community.
                </p>
              </div>

            </div>

            <div className="ngo-public-gallery">

              {impactImages.map(
                (image, index) => {

                  const imageUrl =
                    getImageUrl(image);

                  return (
                    <div
                      key={`${image}-${index}`}
                      className="ngo-public-gallery-item"
                    >

                      <img
                        src={imageUrl}
                        alt={`${organizationName} impact ${index + 1}`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />

                    </div>
                  );
                }
              )}

            </div>

          </section>
        )}

        {/* =====================================================
            ORGANIZATION DETAILS
        ===================================================== */}

        <section className="ngo-public-section">

          <div className="ngo-public-section-heading">

            <div className="ngo-public-section-icon">
              <i className="bi bi-building-check"></i>
            </div>

            <div>
              <h2>
                Organization Details
              </h2>

              <p>
                Public information about this NGO.
              </p>
            </div>

          </div>

          <div className="ngo-public-details-grid">

            <PublicDetail
              icon="bi-building"
              label="Organization"
              value={
                ngo.organizationName
              }
            />

            <PublicDetail
              icon="bi-diagram-3"
              label="NGO Category"
              value={
                ngo.ngoCategory
              }
            />

            <PublicDetail
              icon="bi-geo-alt"
              label="Location"
              value={location}
            />

            <PublicDetail
              icon="bi-pin-map"
              label="Pincode"
              value={
                ngo.pincode
              }
            />

            <PublicDetail
              icon="bi-calendar3"
              label="Years of Service"
              value={
                ngo.yearsOfService !==
                undefined
                  ? `${formatNumber(
                      ngo.yearsOfService
                    )} years`
                  : null
              }
            />

          </div>

        </section>

        {/* =====================================================
            CONTACT + LINKS
        ===================================================== */}

        {(ngo.website ||
          ngo.facebookUrl ||
          ngo.instagramUrl ||
          ngo.linkedinUrl) && (
          <section className="ngo-public-section">

            <div className="ngo-public-section-heading">

              <div className="ngo-public-section-icon">
                <i className="bi bi-link-45deg"></i>
              </div>

              <div>
                <h2>
                  Connect With Us
                </h2>

                <p>
                  Follow or learn more about this organization.
                </p>
              </div>

            </div>

            <div className="ngo-public-links">

              {ngo.website && (
                <a
                  href={ngo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ngo-public-link"
                >
                  <i className="bi bi-globe2"></i>
                  <span>
                    Website
                  </span>
                  <i className="bi bi-arrow-up-right"></i>
                </a>
              )}

              {ngo.facebookUrl && (
                <a
                  href={ngo.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ngo-public-link"
                >
                  <i className="bi bi-facebook"></i>
                  <span>
                    Facebook
                  </span>
                  <i className="bi bi-arrow-up-right"></i>
                </a>
              )}

              {ngo.instagramUrl && (
                <a
                  href={ngo.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ngo-public-link"
                >
                  <i className="bi bi-instagram"></i>
                  <span>
                    Instagram
                  </span>
                  <i className="bi bi-arrow-up-right"></i>
                </a>
              )}

              {ngo.linkedinUrl && (
                <a
                  href={ngo.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ngo-public-link"
                >
                  <i className="bi bi-linkedin"></i>
                  <span>
                    LinkedIn
                  </span>
                  <i className="bi bi-arrow-up-right"></i>
                </a>
              )}

            </div>

          </section>
        )}
        {/* =====================================================
    DONATE TO THIS NGO
===================================================== */}

{/* =====================================================
    DONATE TO THIS NGO
    DONOR ONLY
===================================================== */}

{id && (
  <div className="ngo-public-donate-section">

    <div className="ngo-public-donate-content">

      <div className="ngo-public-donate-icon">
        <i className="bi bi-heart-fill"></i>
      </div>

      <div>
        <h3>
          Support {organizationName}
        </h3>

        <p>
          Choose how you would like to support
          this NGO and contribute directly to
          its work.
        </p>
      </div>

    </div>

    <button
      type="button"
      className="ngo-public-donate-btn"
      onClick={() =>
        navigate(
          `/direct-donation/${ngo._id}`
        )
      }
    >
      <i className="bi bi-heart-fill"></i>

      Donate to this NGO

      <i className="bi bi-arrow-right"></i>
    </button>

  </div>
)}
      </div>

    </DashboardLayout>
  );
}

// ============================================================
// PUBLIC DETAIL
// ============================================================

function PublicDetail({
  icon,
  label,
  value,
}) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return (
    <div className="ngo-public-detail">

      <div className="ngo-public-detail-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <div className="ngo-public-detail-content">

        <span className="ngo-public-detail-label">
          {label}
        </span>

        <strong className="ngo-public-detail-value">
          {value}
        </strong>

      </div>

    </div>
  );
}

export default NGOPublicView;