import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/NGOPublicProfile.css";

// ============================================================
// BACKEND URL
// ============================================================

const BACKEND_URL = "http://localhost:5000";

// ============================================================
// HELPERS
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
// EMPTY FORM
// ============================================================

const INITIAL_FORM = {
  ngoMission: "",
  ngoVision: "",
  ngoAbout: "",
  ngoImpact: "",

  peopleHelped: "",
  projectsCompleted: "",
  yearsOfService: "",

  achievements: [],

  website: "",
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
};

// ============================================================
// COMPONENT
// ============================================================

function NGOPublicProfile() {
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] =
    useState(INITIAL_FORM);

  const [achievementInput, setAchievementInput] =
    useState("");

  const [impactImages, setImpactImages] =
    useState([]);

  const [existingImages, setExistingImages] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ==========================================================
  // AUTH HEADERS
  // ==========================================================

  const getAuthHeaders = () => ({
    headers: {
      Authorization:
        `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // ==========================================================
  // FETCH PROFILE
  // ==========================================================

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await API.get(
        "/users/my-public-profile",
        getAuthHeaders()
      );

      console.log(
        "MY NGO PUBLIC PROFILE:",
        response.data
      );

      const ngo =
        response.data?.ngo ||
        response.data ||
        null;

      if (!ngo) {
        throw new Error(
          "NGO public profile was not returned."
        );
      }

      setProfile(ngo);

      setFormData({
        ngoMission:
          ngo.ngoMission || "",

        ngoVision:
          ngo.ngoVision || "",

        ngoAbout:
          ngo.ngoAbout || "",

        ngoImpact:
          ngo.ngoImpact || "",

        peopleHelped:
          ngo.peopleHelped ?? "",

        projectsCompleted:
          ngo.projectsCompleted ?? "",

        yearsOfService:
          ngo.yearsOfService ?? "",

        achievements:
          Array.isArray(
            ngo.achievements
          )
            ? ngo.achievements
            : [],

        website:
          ngo.website || "",

        facebookUrl:
          ngo.facebookUrl || "",

        instagramUrl:
          ngo.instagramUrl || "",

        linkedinUrl:
          ngo.linkedinUrl || "",
      });

      setExistingImages(
        Array.isArray(
          ngo.impactImages
        )
          ? ngo.impactImages
          : []
      );

    } catch (err) {
      console.error(
        "Fetch NGO Public Profile Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load NGO public profile."
      );

      setProfile(null);

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // COMMON CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // ==========================================================
  // ACHIEVEMENT INPUT
  // ==========================================================

  const addAchievement = () => {
    const value =
      achievementInput.trim();

    if (!value) {
      return;
    }

    if (
      formData.achievements.length >=
      20
    ) {
      setError(
        "You can add a maximum of 20 achievements."
      );

      return;
    }

    if (
      formData.achievements.some(
        (achievement) =>
          achievement.toLowerCase() ===
          value.toLowerCase()
      )
    ) {
      setError(
        "This achievement has already been added."
      );

      return;
    }

    setFormData((previous) => ({
      ...previous,

      achievements: [
        ...previous.achievements,
        value,
      ],
    }));

    setAchievementInput("");
    setError("");
  };

  // ==========================================================
  // ENTER TO ADD ACHIEVEMENT
  // ==========================================================

  const handleAchievementKeyDown = (
    event
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addAchievement();
    }
  };

  // ==========================================================
  // REMOVE ACHIEVEMENT
  // ==========================================================

  const removeAchievement = (
    index
  ) => {
    setFormData((previous) => ({
      ...previous,

      achievements:
        previous.achievements.filter(
          (_, achievementIndex) =>
            achievementIndex !== index
        ),
    }));
  };

  // ==========================================================
  // IMAGE SELECTION
  // ==========================================================

  const handleImageChange = (
    event
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    if (
      existingImages.length +
        files.length >
      20
    ) {
      setError(
        "You can have a maximum of 20 impact images."
      );

      return;
    }

    setImpactImages(files);
    setError("");
  };

  // ==========================================================
  // REMOVE EXISTING IMAGE
  // ==========================================================

  const removeExistingImage = (
    image
  ) => {
    setExistingImages(
      (previous) =>
        previous.filter(
          (item) => item !== image
        )
    );
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    if (
      formData.ngoAbout.length >
      2000
    ) {
      setError(
        "About section cannot exceed 2000 characters."
      );

      return false;
    }

    if (
      formData.ngoMission.length >
      1000
    ) {
      setError(
        "Mission cannot exceed 1000 characters."
      );

      return false;
    }

    if (
      formData.ngoVision.length >
      1000
    ) {
      setError(
        "Vision cannot exceed 1000 characters."
      );

      return false;
    }

    if (
      formData.ngoImpact.length >
      2000
    ) {
      setError(
        "Impact description cannot exceed 2000 characters."
      );

      return false;
    }

    const numbers = [
      {
        value:
          formData.peopleHelped,
        label:
          "People helped",
      },
      {
        value:
          formData.projectsCompleted,
        label:
          "Projects completed",
      },
      {
        value:
          formData.yearsOfService,
        label:
          "Years of service",
      },
    ];

    for (const item of numbers) {
      if (
        item.value !== "" &&
        (
          !Number.isFinite(
            Number(item.value)
          ) ||
          Number(item.value) < 0
        )
      ) {
        setError(
          `${item.label} must be a valid number.`
        );

        return false;
      }
    }

    return true;
  };

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const data =
        new FormData();

      // ======================================================
      // TEXT
      // ======================================================

      data.append(
        "ngoMission",
        formData.ngoMission.trim()
      );

      data.append(
        "ngoVision",
        formData.ngoVision.trim()
      );

      data.append(
        "ngoAbout",
        formData.ngoAbout.trim()
      );

      data.append(
        "ngoImpact",
        formData.ngoImpact.trim()
      );

      data.append(
        "peopleHelped",
        formData.peopleHelped === ""
          ? "0"
          : formData.peopleHelped
      );

      data.append(
        "projectsCompleted",
        formData.projectsCompleted === ""
          ? "0"
          : formData.projectsCompleted
      );

      data.append(
        "yearsOfService",
        formData.yearsOfService === ""
          ? "0"
          : formData.yearsOfService
      );

      data.append(
        "achievements",
        JSON.stringify(
          formData.achievements
        )
      );

      data.append(
        "website",
        formData.website.trim()
      );

      data.append(
        "facebookUrl",
        formData.facebookUrl.trim()
      );

      data.append(
        "instagramUrl",
        formData.instagramUrl.trim()
      );

      data.append(
        "linkedinUrl",
        formData.linkedinUrl.trim()
      );

      // ======================================================
      // EXISTING IMAGES
      // ======================================================

      data.append(
        "existingImpactImages",
        JSON.stringify(
          existingImages
        )
      );

      // ======================================================
      // NEW IMAGES
      // ======================================================

      impactImages.forEach(
        (image) => {
          data.append(
            "impactImages",
            image
          );
        }
      );

      // ======================================================
      // UPDATE API
      // ======================================================

      const response =
        await API.put(
          "/users/ngo/public-profile",
          data,
          {
            headers: {
              Authorization:
                `Bearer ${localStorage.getItem(
                  "token"
                )}`,
            },
          }
        );

      console.log(
        "UPDATED NGO PROFILE:",
        response.data
      );

      setMessage(
        "NGO public profile updated successfully."
      );

      // ======================================================
      // REFRESH PROFILE
      // ======================================================

      await fetchProfile();

      setImpactImages([]);

      const fileInput =
        document.getElementById(
          "impactImages"
        );

      if (fileInput) {
        fileInput.value = "";
      }

    } catch (err) {
      console.error(
        "Update NGO Public Profile Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update NGO public profile."
      );

    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="ngo-public-loading">
          <div className="spinner-border" />

          <p>
            Loading NGO public profile...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================================
  // ERROR WITHOUT PROFILE
  // ==========================================================

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="ngo-public-profile-page">

          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-2" />
              {error}
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchProfile}
          >
            <i className="bi bi-arrow-clockwise me-1" />
            Try Again
          </button>

        </div>
      </DashboardLayout>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      <div className="ngo-public-profile-page">

        <PageHeader
          title="NGO Public Profile"
          subtitle="Tell donors about your organization, your mission and the impact you have created."
        />

        {/* ====================================================
            MESSAGES
        ==================================================== */}

        {message && (
          <div className="alert alert-success">
            <i className="bi bi-check-circle-fill me-2" />
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle-fill me-2" />
            {error}
          </div>
        )}

        {/* ====================================================
            PROFILE PREVIEW HEADER
        ==================================================== */}

        <div className="ngo-public-identity">

          <div className="ngo-public-avatar">

            {profile.profileImage ? (

              <img
                src={getImageUrl(
                  profile.profileImage
                )}
                alt={
                  profile.organizationName ||
                  profile.name
                }
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />

            ) : (

              <span>
                {(
                  profile.organizationName ||
                  profile.name ||
                  "NG"
                )
                  .slice(0, 2)
                  .toUpperCase()}
              </span>

            )}

          </div>

          <div className="ngo-public-identity-info">

            <span className="ngo-public-verified">
              <i className="bi bi-patch-check-fill" />
              Verified NGO
            </span>

            <h3>
              {profile.organizationName ||
                profile.name}
            </h3>

            {profile.ngoCategory && (
              <p>
                <i className="bi bi-building me-2" />
                {profile.ngoCategory}
              </p>
            )}

            <p>
              <i className="bi bi-geo-alt me-2" />

              {profile.city ||
                "Location not available"}

              {profile.state
                ? `, ${profile.state}`
                : ""}
            </p>

          </div>

        </div>

        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          className="ngo-public-form"
          onSubmit={handleSubmit}
        >

          {/* ==================================================
              ABOUT
          ================================================== */}

          <section className="ngo-profile-section">

            <div className="ngo-section-heading">

              <div className="ngo-section-icon">
                <i className="bi bi-building" />
              </div>

              <div>
                <h4>
                  About the NGO
                </h4>

                <p>
                  Explain what your organization
                  does and who you serve.
                </p>
              </div>

            </div>

            <div className="mb-4">

              <label className="form-label">
                About Organization
              </label>

              <textarea
                name="ngoAbout"
                rows="6"
                className="form-control"
                placeholder="Tell donors about your organization, the communities you serve and the problems you work to solve..."
                value={
                  formData.ngoAbout
                }
                onChange={
                  handleChange
                }
              />

              <small className="text-muted">
                {
                  formData.ngoAbout.length
                }{" "}
                / 2000 characters
              </small>

            </div>

            <div className="row">

              <div className="col-md-6 mb-4">

                <label className="form-label">
                  Mission
                </label>

                <textarea
                  name="ngoMission"
                  rows="5"
                  className="form-control"
                  placeholder="What is your NGO's mission?"
                  value={
                    formData.ngoMission
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              <div className="col-md-6 mb-4">

                <label className="form-label">
                  Vision
                </label>

                <textarea
                  name="ngoVision"
                  rows="5"
                  className="form-control"
                  placeholder="What future are you working towards?"
                  value={
                    formData.ngoVision
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </div>

          </section>

          {/* ==================================================
              IMPACT
          ================================================== */}

          <section className="ngo-profile-section">

            <div className="ngo-section-heading">

              <div className="ngo-section-icon">
                <i className="bi bi-bar-chart-line" />
              </div>

              <div>
                <h4>
                  Social Impact
                </h4>

                <p>
                  Show donors the difference your
                  organization has made.
                </p>
              </div>

            </div>

            <div className="row">

              <div className="col-md-4 mb-4">

                <label className="form-label">
                  People Helped
                </label>

                <input
                  type="number"
                  min="0"
                  name="peopleHelped"
                  className="form-control"
                  placeholder="e.g. 1500"
                  value={
                    formData.peopleHelped
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              <div className="col-md-4 mb-4">

                <label className="form-label">
                  Projects Completed
                </label>

                <input
                  type="number"
                  min="0"
                  name="projectsCompleted"
                  className="form-control"
                  placeholder="e.g. 35"
                  value={
                    formData.projectsCompleted
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              <div className="col-md-4 mb-4">

                <label className="form-label">
                  Years of Service
                </label>

                <input
                  type="number"
                  min="0"
                  name="yearsOfService"
                  className="form-control"
                  placeholder="e.g. 8"
                  value={
                    formData.yearsOfService
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </div>

            <div className="mb-4">

              <label className="form-label">
                Impact Story
              </label>

              <textarea
                name="ngoImpact"
                rows="7"
                className="form-control"
                placeholder="Describe the real-world impact your organization has achieved..."
                value={
                  formData.ngoImpact
                }
                onChange={
                  handleChange
                }
              />

              <small className="text-muted">
                {
                  formData.ngoImpact.length
                }{" "}
                / 2000 characters
              </small>

            </div>

          </section>

          {/* ==================================================
              ACHIEVEMENTS
          ================================================== */}

          <section className="ngo-profile-section">

            <div className="ngo-section-heading">

              <div className="ngo-section-icon">
                <i className="bi bi-award" />
              </div>

              <div>
                <h4>
                  Achievements
                </h4>

                <p>
                  Add milestones, awards or notable
                  achievements.
                </p>
              </div>

            </div>

            <div className="achievement-input-row">

              <input
                type="text"
                className="form-control"
                placeholder="e.g. Supported 500 families during flood relief"
                value={
                  achievementInput
                }
                onChange={(event) =>
                  setAchievementInput(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleAchievementKeyDown
                }
              />

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={
                  addAchievement
                }
              >
                <i className="bi bi-plus-lg me-1" />
                Add
              </button>

            </div>

            <div className="achievement-list">

              {formData.achievements.length ===
              0 ? (

                <div className="achievement-empty">
                  No achievements added yet.
                </div>

              ) : (

                formData.achievements.map(
                  (
                    achievement,
                    index
                  ) => (

                    <div
                      key={`${achievement}-${index}`}
                      className="achievement-item"
                    >

                      <i className="bi bi-check-circle-fill" />

                      <span>
                        {achievement}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeAchievement(
                            index
                          )
                        }
                        aria-label="Remove achievement"
                      >
                        <i className="bi bi-x-lg" />
                      </button>

                    </div>

                  )
                )

              )}

            </div>

          </section>

          {/* ==================================================
              IMPACT IMAGES
          ================================================== */}

          <section className="ngo-profile-section">

            <div className="ngo-section-heading">

              <div className="ngo-section-icon">
                <i className="bi bi-images" />
              </div>

              <div>
                <h4>
                  Impact Gallery
                </h4>

                <p>
                  Upload photos that show your NGO's
                  work in the community.
                </p>
              </div>

            </div>

            <input
              id="impactImages"
              type="file"
              multiple
              accept="image/*"
              className="form-control"
              onChange={
                handleImageChange
              }
            />

            {impactImages.length > 0 && (
              <p className="text-muted mt-2">
                {impactImages.length} new image
                {impactImages.length !== 1
                  ? "s"
                  : ""}{" "}
                selected.
              </p>
            )}

            {existingImages.length > 0 && (
              <div className="impact-gallery">

                {existingImages.map(
                  (image) => (

                    <div
                      className="impact-image-card"
                      key={image}
                    >

                      <img
                        src={getImageUrl(
                          image
                        )}
                        alt="NGO impact"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />

                      <button
                        type="button"
                        className="impact-image-remove"
                        onClick={() =>
                          removeExistingImage(
                            image
                          )
                        }
                      >
                        <i className="bi bi-x-lg" />
                      </button>

                    </div>

                  )
                )}

              </div>
            )}

          </section>

          {/* ==================================================
              SOCIAL LINKS
          ================================================== */}

          <section className="ngo-profile-section">

            <div className="ngo-section-heading">

              <div className="ngo-section-icon">
                <i className="bi bi-link-45deg" />
              </div>

              <div>
                <h4>
                  Online Presence
                </h4>

                <p>
                  Give donors additional ways to
                  learn about your organization.
                </p>
              </div>

            </div>

            <div className="row">

              <div className="col-md-6 mb-3">

                <label className="form-label">
                  Website
                </label>

                <input
                  type="url"
                  name="website"
                  className="form-control"
                  placeholder="https://example.org"
                  value={
                    formData.website
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              <div className="col-md-6 mb-3">

                <label className="form-label">
                  Instagram
                </label>

                <input
                  type="url"
                  name="instagramUrl"
                  className="form-control"
                  placeholder="https://instagram.com/..."
                  value={
                    formData.instagramUrl
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              <div className="col-md-6 mb-3">

                <label className="form-label">
                  Facebook
                </label>

                <input
                  type="url"
                  name="facebookUrl"
                  className="form-control"
                  placeholder="https://facebook.com/..."
                  value={
                    formData.facebookUrl
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              <div className="col-md-6 mb-3">

                <label className="form-label">
                  LinkedIn
                </label>

                <input
                  type="url"
                  name="linkedinUrl"
                  className="form-control"
                  placeholder="https://linkedin.com/..."
                  value={
                    formData.linkedinUrl
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </div>

          </section>

          {/* ==================================================
              SAVE
          ================================================== */}

          <div className="ngo-public-save">

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={saving}
            >

              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-2" />
                  Save Public Profile
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </DashboardLayout>
  );
}

export default NGOPublicProfile;