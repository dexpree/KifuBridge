import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";

import "../styles/PublicNGOs.css";

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
    image.startsWith("/") ? image : `/${image}`
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
    .map((word) => word[0]?.toUpperCase())
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

function PublicNGOs() {
  const navigate = useNavigate();

  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  // ==========================================================
  // FETCH NGOs
  // ==========================================================

  useEffect(() => {
    fetchNGOs();
  }, []);

  const fetchNGOs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await API.get(
        "/users/public-ngos",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("PUBLIC NGOs:", response.data);

      setNgos(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "Fetch Public NGOs Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load NGOs."
      );

      setNgos([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // AVAILABLE CATEGORIES
  // ==========================================================

  const availableCategories = useMemo(() => {
    const categories = new Set();

    ngos.forEach((ngo) => {
      if (ngo?.ngoCategory) {
        categories.add(ngo.ngoCategory);
      }
    });

    return [
      "all",
      ...Array.from(categories).sort(),
    ];
  }, [ngos]);

  // ==========================================================
  // FILTER NGOs
  // ==========================================================

  const visibleNGOs = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return ngos.filter((ngo) => {
      const organizationName = (
        ngo.organizationName || ""
      ).toLowerCase();

      const ngoName = (
        ngo.name || ""
      ).toLowerCase();

      const ngoCategory = (
        ngo.ngoCategory || ""
      ).toLowerCase();

      const city = (
        ngo.city || ""
      ).toLowerCase();

      const state = (
        ngo.state || ""
      ).toLowerCase();

      const searchMatch =
        !normalizedSearch ||
        organizationName.includes(
          normalizedSearch
        ) ||
        ngoName.includes(normalizedSearch) ||
        ngoCategory.includes(
          normalizedSearch
        ) ||
        city.includes(normalizedSearch) ||
        state.includes(normalizedSearch);

      const categoryMatch =
        category === "all" ||
        ngo.ngoCategory === category;

      return searchMatch && categoryMatch;
    });
  }, [ngos, search, category]);

  // ==========================================================
  // VIEW NGO PROFILE
  // ==========================================================

  const handleViewProfile = (ngo) => {
    if (!ngo?._id) {
      console.error(
        "Cannot open NGO profile: NGO ID is missing.",
        ngo
      );

      setError(
        "Unable to open NGO profile because the NGO ID is missing."
      );

      return;
    }

    navigate(`/ngo-public-view/${ngo._id}`);
  };

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      <div className="public-ngos-page">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <PageHeader
          title="NGOs"
          subtitle="Discover verified NGOs and learn about the work they are doing in society."
        />

        {/* =====================================================
            SEARCH + FILTER
        ===================================================== */}

        <div className="ngo-directory-toolbar">

          {/* SEARCH */}

          <div className="ngo-search-wrap">

            <i className="bi bi-search"></i>

            <input
              type="text"
              className="ngo-search"
              placeholder="Search NGO, category or location..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="ngo-search-clear"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            )}

          </div>

          {/* CATEGORY */}

          <select
            className="ngo-category-filter"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >

            <option value="all">
              All Categories
            </option>

            {availableCategories
              .filter(
                (item) => item !== "all"
              )
              .map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}

          </select>

        </div>

        {/* =====================================================
            RESULTS SUMMARY
        ===================================================== */}

        {!loading && !error && (
          <div className="ngo-results-bar">

            <span>
              Showing{" "}
              <strong>
                {visibleNGOs.length}
              </strong>{" "}
              NGO
              {visibleNGOs.length !== 1
                ? "s"
                : ""}
            </span>

            {(search ||
              category !== "all") && (
              <button
                type="button"
                className="ngo-reset-btn"
                onClick={resetFilters}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                Reset filters
              </button>
            )}

          </div>
        )}

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <div className="ngo-state">

            <div className="ngo-spinner"></div>

            <h5>
              Loading NGOs...
            </h5>

            <p>
              Finding verified
              organizations on the
              platform.
            </p>

          </div>
        )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {!loading && error && (
          <div className="ngo-state ngo-state-error">

            <div className="ngo-state-icon">
              <i className="bi bi-exclamation-triangle"></i>
            </div>

            <h5>
              Unable to load NGOs
            </h5>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={fetchNGOs}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Try Again
            </button>

          </div>
        )}

        {/* =====================================================
            EMPTY DATABASE
        ===================================================== */}

        {!loading &&
          !error &&
          ngos.length === 0 && (
            <div className="ngo-state">

              <div className="ngo-state-icon">
                <i className="bi bi-building"></i>
              </div>

              <h5>
                No NGOs available
              </h5>

              <p>
                There are currently no
                approved NGOs available
                on the platform.
              </p>

            </div>
          )}

        {/* =====================================================
            NO FILTER RESULTS
        ===================================================== */}

        {!loading &&
          !error &&
          ngos.length > 0 &&
          visibleNGOs.length === 0 && (
            <div className="ngo-state">

              <div className="ngo-state-icon">
                <i className="bi bi-search"></i>
              </div>

              <h5>
                No matching NGOs
              </h5>

              <p>
                Try changing your
                search or category
                filter.
              </p>

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={resetFilters}
              >
                Clear Filters
              </button>

            </div>
          )}

        {/* =====================================================
            NGO GRID
        ===================================================== */}

        {!loading &&
          !error &&
          visibleNGOs.length > 0 && (

            <div className="ngo-grid">

              {visibleNGOs.map((ngo) => {

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

                return (

                  <article
                    className="ngo-card"
                    key={ngo._id}
                  >

                    {/* =================================================
                        PROFILE IMAGE
                    ================================================= */}

                    <div className="ngo-card-media">

                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={organizationName}
                          className="ngo-profile-image"
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
                        className="ngo-profile-placeholder"
                        style={{
                          display:
                            imageUrl
                              ? "none"
                              : "flex",
                        }}
                      >
                        {initials || "NG"}
                      </div>

                      {/* VERIFIED */}

                      <span className="ngo-verified-badge">

                        <i className="bi bi-patch-check-fill"></i>

                        Verified NGO

                      </span>

                    </div>

                    {/* =================================================
                        CARD BODY
                    ================================================= */}

                    <div className="ngo-card-body">

                      {/* TITLE */}

                      <div className="ngo-card-title-row">

                        <div>

                          <h3 className="ngo-card-title">
                            {organizationName}
                          </h3>

                          {ngo.name &&
                            ngo.organizationName &&
                            ngo.name !==
                              ngo.organizationName && (

                              <p className="ngo-contact-name">
                                Contact:{" "}
                                {ngo.name}
                              </p>

                            )}

                        </div>

                      </div>

                      {/* CATEGORY */}

                      {ngo.ngoCategory && (
                        <span className="ngo-category-badge">

                          <i className="bi bi-building"></i>

                          {ngo.ngoCategory}

                        </span>
                      )}

                      {/* LOCATION + BIO */}

                      <div className="ngo-card-info">

                        <div className="ngo-info-row">

                          <span className="ngo-info-icon">
                            <i className="bi bi-geo-alt"></i>
                          </span>

                          <span>
                            {location}
                          </span>

                        </div>

                        {ngo.bio && (
                          <p className="ngo-bio">
                            {ngo.bio}
                          </p>
                        )}

                      </div>

                      {/* DIVIDER */}

                      <div className="ngo-card-divider"></div>

                      {/* FOOTER */}

                      <div className="ngo-card-footer">

                        <span className="ngo-member-since">

                          <i className="bi bi-calendar3"></i>

                          Member since{" "}

                          {ngo.createdAt
                            ? new Date(
                                ngo.createdAt
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  month:
                                    "short",
                                  year:
                                    "numeric",
                                }
                              )
                            : "—"}

                        </span>

                        <button
                          type="button"
                          className="ngo-donate-btn"
                          onClick={() =>
                            handleViewProfile(
                              ngo
                            )
                          }
                        >

                          View Profile

                          <i className="bi bi-arrow-right"></i>

                        </button>

                      </div>

                    </div>

                  </article>

                );
              })}

            </div>
          )}

      </div>

    </DashboardLayout>
  );
}

export default PublicNGOs;