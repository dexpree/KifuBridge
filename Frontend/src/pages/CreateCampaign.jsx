import { useState } from "react";

import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";

import PageHeader from "../components/PageHeader";

import "../styles/CreateCampaign.css";

// ======================================================
// CONSTANTS
// ======================================================

const CATEGORIES = [
  { value: "food", icon: "🍚" },
  { value: "clothing", icon: "👕" },
  { value: "medicine", icon: "💊" },
  { value: "books", icon: "📚" },
  { value: "toys", icon: "🧸" },
  { value: "household", icon: "🏠" },
  { value: "electronics", icon: "🔌" },
  { value: "other", icon: "📦" },
];

const UNITS = [
  "kg",
  "pieces",
  "boxes",
  "liters",
  "sets",
];

const DURATIONS = [
  5,
  7,
  14,
  30,
];

// ======================================================
// DEFAULT REQUIREMENT
// ======================================================

const createDefaultRequirement = (
  category = "food"
) => ({
  itemName: "",
  category,
  goalQuantity: "",
  unit: "pieces",
});

// ======================================================
// COMPONENT
// ======================================================

function CreateCampaign() {
  // ====================================================
  // FORM STATE
  // ====================================================

  const [form, setForm] = useState({
    title: "",
    description: "",

    // Campaign categories
    categories: ["food"],

    // Campaign requirements
    requirements: [
      createDefaultRequirement("food"),
    ],

    // Campaign duration
    duration: 7,

    // Campaign image files
    campaignImages: [],
  });

  const [submitting, setSubmitting] =
    useState(false);

  const [imagePreviews, setImagePreviews] =
    useState([]);

  // ====================================================
  // BASIC INPUT CHANGE
  // ====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ====================================================
  // CATEGORY TOGGLE
  // ====================================================

  const toggleCategory = (value) => {
    setForm((prev) => {
      const alreadySelected =
        prev.categories.includes(value);

      // -----------------------------------------------
      // DO NOT ALLOW ZERO CATEGORIES
      // -----------------------------------------------

      if (
        alreadySelected &&
        prev.categories.length === 1
      ) {
        alert(
          "At least one campaign category must be selected."
        );

        return prev;
      }

      // -----------------------------------------------
      // REMOVE CATEGORY
      // -----------------------------------------------

      if (alreadySelected) {
        const updatedCategories =
          prev.categories.filter(
            (category) =>
              category !== value
          );

        const fallbackCategory =
          updatedCategories[0] || "food";

        // ---------------------------------------------
        // MOVE REQUIREMENTS USING REMOVED CATEGORY
        // TO THE FIRST REMAINING CATEGORY
        // ---------------------------------------------

        const updatedRequirements =
          prev.requirements.map(
            (requirement) => {
              if (
                updatedCategories.includes(
                  requirement.category
                )
              ) {
                return requirement;
              }

              return {
                ...requirement,
                category:
                  fallbackCategory,
              };
            }
          );

        return {
          ...prev,
          categories:
            updatedCategories,
          requirements:
            updatedRequirements,
        };
      }

      // -----------------------------------------------
      // ADD CATEGORY
      // -----------------------------------------------

      return {
        ...prev,
        categories: [
          ...prev.categories,
          value,
        ],
      };
    });
  };

  // ====================================================
  // DURATION
  // ====================================================

  const selectDuration = (value) => {
    setForm((prev) => ({
      ...prev,
      duration: value,
    }));
  };

  // ====================================================
  // IMAGE CHANGE
  // ====================================================

  const handleImageChange = (e) => {
    const files = Array.from(
      e.target.files || []
    );

    // -----------------------------------------------
    // AT LEAST ONE IMAGE
    // -----------------------------------------------

    if (files.length === 0) {
      return;
    }

    // -----------------------------------------------
    // MAXIMUM 5 IMAGES
    // -----------------------------------------------

    if (files.length > 5) {
      alert(
        "You can upload a maximum of 5 images."
      );

      e.target.value = "";

      return;
    }

    // -----------------------------------------------
    // IMAGE TYPE VALIDATION
    // -----------------------------------------------

    const validFiles =
      files.filter((file) =>
        file.type.startsWith("image/")
      );

    if (
      validFiles.length !==
      files.length
    ) {
      alert(
        "Only image files are allowed."
      );

      e.target.value = "";

      return;
    }

    // -----------------------------------------------
    // FILE SIZE VALIDATION
    // -----------------------------------------------

    const tooLarge =
      validFiles.some(
        (file) =>
          file.size >
          5 * 1024 * 1024
      );

    if (tooLarge) {
      alert(
        "Each image must be 5 MB or smaller."
      );

      e.target.value = "";

      return;
    }

    // -----------------------------------------------
    // CLEAN OLD PREVIEW URLS
    // -----------------------------------------------

    imagePreviews.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    // -----------------------------------------------
    // SAVE FILES
    // -----------------------------------------------

    setForm((prev) => ({
      ...prev,
      campaignImages:
        validFiles,
    }));

    // -----------------------------------------------
    // CREATE PREVIEWS
    // -----------------------------------------------

    const previews =
      validFiles.map((file) =>
        URL.createObjectURL(file)
      );

    setImagePreviews(previews);
  };

  // ====================================================
  // ADD REQUIREMENT
  // ====================================================

  const addRequirement = () => {
    if (
      form.requirements.length >= 10
    ) {
      alert(
        "You can add a maximum of 10 requirements."
      );

      return;
    }

    const defaultCategory =
      form.categories[0] ||
      "food";

    setForm((prev) => ({
      ...prev,

      requirements: [
        ...prev.requirements,

        createDefaultRequirement(
          defaultCategory
        ),
      ],
    }));
  };

  // ====================================================
  // REMOVE REQUIREMENT
  // ====================================================

  const removeRequirement = (
    index
  ) => {
    if (
      form.requirements.length === 1
    ) {
      alert(
        "A campaign must have at least one requirement."
      );

      return;
    }

    setForm((prev) => ({
      ...prev,

      requirements:
        prev.requirements.filter(
          (_, i) => i !== index
        ),
    }));
  };

  // ====================================================
  // REQUIREMENT CHANGE
  // ====================================================

  const handleRequirementChange = (
    index,
    field,
    value
  ) => {
    setForm((prev) => {
      const updatedRequirements =
        [...prev.requirements];

      updatedRequirements[index] = {
        ...updatedRequirements[index],
        [field]: value,
      };

      return {
        ...prev,
        requirements:
          updatedRequirements,
      };
    });
  };

  // ====================================================
  // VALIDATE FORM
  // ====================================================

  const validateForm = () => {
    // -----------------------------------------------
    // TITLE
    // -----------------------------------------------

    if (!form.title.trim()) {
      alert(
        "Please enter a campaign title."
      );

      return false;
    }

    if (
      form.title.trim().length < 3
    ) {
      alert(
        "Campaign title must contain at least 3 characters."
      );

      return false;
    }

    // -----------------------------------------------
    // DESCRIPTION
    // -----------------------------------------------

    if (
      !form.description.trim()
    ) {
      alert(
        "Please enter a campaign description."
      );

      return false;
    }

    // -----------------------------------------------
    // CATEGORIES
    // -----------------------------------------------

    if (
      !Array.isArray(
        form.categories
      ) ||
      form.categories.length === 0
    ) {
      alert(
        "Please select at least one campaign category."
      );

      return false;
    }

    // -----------------------------------------------
    // REQUIREMENTS
    // -----------------------------------------------

    if (
      !Array.isArray(
        form.requirements
      ) ||
      form.requirements.length === 0
    ) {
      alert(
        "Please add at least one campaign requirement."
      );

      return false;
    }

    // -----------------------------------------------
    // EACH REQUIREMENT
    // -----------------------------------------------

    for (
      let index = 0;
      index <
      form.requirements.length;
      index++
    ) {
      const requirement =
        form.requirements[index];

      // ITEM NAME

      if (
        !requirement.itemName.trim()
      ) {
        alert(
          `Please enter the item name for Requirement ${
            index + 1
          }.`
        );

        return false;
      }

      // CATEGORY

      if (
        !requirement.category
      ) {
        alert(
          `Please select a category for Requirement ${
            index + 1
          }.`
        );

        return false;
      }

      // CATEGORY MUST EXIST IN CAMPAIGN

      if (
        !form.categories.includes(
          requirement.category
        )
      ) {
        alert(
          `Requirement ${
            index + 1
          } uses a category that is not selected for this campaign.`
        );

        return false;
      }

      // GOAL QUANTITY

      if (
        !requirement.goalQuantity ||
        Number(
          requirement.goalQuantity
        ) <= 0
      ) {
        alert(
          `Please enter a valid goal quantity for Requirement ${
            index + 1
          }.`
        );

        return false;
      }

      // UNIT

      if (!requirement.unit) {
        alert(
          `Please select a unit for Requirement ${
            index + 1
          }.`
        );

        return false;
      }
    }

    // -----------------------------------------------
    // DURATION
    // -----------------------------------------------

    if (
      !form.duration ||
      Number(form.duration) <= 0
    ) {
      alert(
        "Please select a valid campaign duration."
      );

      return false;
    }

    // -----------------------------------------------
    // IMAGES
    // -----------------------------------------------

    if (
      !Array.isArray(
        form.campaignImages
      ) ||
      form.campaignImages.length === 0
    ) {
      alert(
        "Please upload at least one campaign image."
      );

      return false;
    }

    if (
      form.campaignImages.length > 5
    ) {
      alert(
        "You can upload a maximum of 5 images."
      );

      return false;
    }

    return true;
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token =
        localStorage.getItem(
          "token"
        );

      // ==============================================
      // CREATE FORM DATA
      // ==============================================

      const data =
        new FormData();

      // ==============================================
      // BASIC INFORMATION
      // ==============================================

      data.append(
        "title",
        form.title.trim()
      );

      data.append(
        "description",
        form.description.trim()
      );

      // ==============================================
      // CAMPAIGN CATEGORIES
      // ==============================================

      data.append(
        "categories",
        JSON.stringify(
          form.categories
        )
      );

      // ==============================================
      // CAMPAIGN REQUIREMENTS
      // ==============================================

      const cleanedRequirements =
        form.requirements.map(
          (requirement) => ({
            itemName:
              requirement.itemName.trim(),

            category:
              requirement.category,

            goalQuantity:
              Number(
                requirement.goalQuantity
              ),

            currentQuantity: 0,

            unit:
              requirement.unit,
          })
        );

      data.append(
        "requirements",
        JSON.stringify(
          cleanedRequirements
        )
      );

      // ==============================================
      // DURATION
      // ==============================================

      data.append(
        "duration",
        String(
          Number(form.duration)
        )
      );

      // ==============================================
      // CAMPAIGN IMAGES
      // ==============================================

      form.campaignImages.forEach(
        (file) => {
          data.append(
            "campaignImages",
            file
          );
        }
      );

      // ==============================================
      // DEBUG
      // ==============================================

      console.log(
        "===================================="
      );

      console.log(
        "CREATING CAMPAIGN"
      );

      console.log(
        "TITLE:",
        form.title
      );

      console.log(
        "CATEGORIES:",
        form.categories
      );

      console.log(
        "REQUIREMENTS:",
        cleanedRequirements
      );

      console.log(
        "DURATION:",
        form.duration
      );

      console.log(
        "IMAGES:",
        form.campaignImages.length
      );

      console.log(
        "===================================="
      );

      // ==============================================
      // API REQUEST
      // ==============================================

      const response =
        await API.post(
          "/campaigns",
          data,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "CAMPAIGN CREATED:",
        response.data
      );

      alert(
        "Campaign submitted for admin approval."
      );

      // ==============================================
      // CLEAN PREVIEW URLS
      // ==============================================

      imagePreviews.forEach(
        (url) => {
          URL.revokeObjectURL(url);
        }
      );

      // ==============================================
      // RESET FORM
      // ==============================================

      setForm({
        title: "",
        description: "",

        categories: [
          "food",
        ],

        requirements: [
          createDefaultRequirement(
            "food"
          ),
        ],

        duration: 7,

        campaignImages: [],
      });

      setImagePreviews([]);

      // Reset file input

      const fileInput =
        document.getElementById(
          "campaignImages"
        );

      if (fileInput) {
        fileInput.value = "";
      }

    } catch (error) {
      console.error(
        "Create Campaign Error:",
        error
      );

      console.error(
        "SERVER RESPONSE:",
        error.response?.data
      );

      alert(
        error.response?.data
          ?.message ||
          "Failed to create campaign."
      );

    } finally {
      setSubmitting(false);
    }
  };

  // ====================================================
  // FILLED REQUIREMENTS
  // ====================================================

  const filledRequirements =
    form.requirements.filter(
      (requirement) =>
        requirement.itemName.trim() !== ""
    );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <DashboardLayout>
      <div className="create-campaign-page">

        <PageHeader
          title="Create Campaign"
          subtitle="Launch a donation campaign and rally your community."
        />

        <div className="cc-layout">

          {/* =================================================
              FORM
          ================================================= */}

          <form
            className="cc-form"
            onSubmit={handleSubmit}
          >

            {/* =================================================
                BASICS
            ================================================= */}

            <div className="cc-card">

              <span className="cc-eyebrow">
                Basics
              </span>

              <div className="cc-field">

                <label
                  className="cc-label"
                  htmlFor="title"
                >
                  Campaign title
                </label>

                <input
                  id="title"
                  className="cc-input"
                  name="title"
                  type="text"
                  placeholder="e.g. Monsoon Relief Drive for Koramangala"
                  value={form.title}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="cc-field">

                <label
                  className="cc-label"
                  htmlFor="description"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  className="cc-input cc-textarea"
                  rows="5"
                  name="description"
                  placeholder="Tell donors what this campaign is for, who it helps, and why it matters."
                  value={form.description}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>

            {/* =================================================
                CATEGORIES
            ================================================= */}

            <div className="cc-card">

              <span className="cc-eyebrow">
                Categories
              </span>

              <p className="cc-section-description">
                Select every category that
                this campaign accepts donations
                for.
              </p>

              <div className="cc-chip-grid">

                {CATEGORIES.map(
                  (category) => {

                    const selected =
                      form.categories.includes(
                        category.value
                      );

                    return (
                      <button
                        type="button"
                        key={
                          category.value
                        }
                        className={`cc-chip ${
                          selected
                            ? "cc-chip-active"
                            : ""
                        }`}
                        onClick={() =>
                          toggleCategory(
                            category.value
                          )
                        }
                        aria-pressed={
                          selected
                        }
                      >

                        <span className="cc-chip-icon">
                          {
                            category.icon
                          }
                        </span>

                        <span className="cc-chip-label">
                          {
                            category.value
                          }
                        </span>

                        {selected && (
                          <span className="cc-chip-check">
                            ✓
                          </span>
                        )}

                      </button>
                    );
                  }
                )}

              </div>

            </div>

            {/* =================================================
                REQUIREMENTS
            ================================================= */}

            <div className="cc-card">

              <div className="cc-section-header">

                <div>

                  <span className="cc-eyebrow">
                    Donation Requirements
                  </span>

                  <p className="cc-section-description">
                    Add the items your NGO
                    needs for this campaign.
                    Each requirement belongs
                    to one selected campaign
                    category.
                  </p>

                </div>

                <button
                  type="button"
                  className="cc-add-btn"
                  onClick={
                    addRequirement
                  }
                >
                  + Add Item
                </button>

              </div>

              <div className="cc-requirements">

                {form.requirements.map(
                  (
                    requirement,
                    index
                  ) => (

                    <div
                      className="cc-requirement-card"
                      key={
                        requirement._id ||
                        index
                      }
                    >

                      <div className="cc-requirement-header">

                        <strong>
                          Requirement{" "}
                          {index + 1}
                        </strong>

                        {form
                          .requirements
                          .length >
                          1 && (

                          <button
                            type="button"
                            className="cc-remove-btn"
                            onClick={() =>
                              removeRequirement(
                                index
                              )
                            }
                          >
                            Remove
                          </button>

                        )}

                      </div>

                      {/* ITEM */}

                      <div className="cc-field">

                        <label className="cc-label">
                          Needed Item
                        </label>

                        <input
                          className="cc-input"
                          type="text"
                          placeholder="Rice, blankets, books..."
                          value={
                            requirement.itemName
                          }
                          onChange={(e) =>
                            handleRequirementChange(
                              index,
                              "itemName",
                              e.target.value
                            )
                          }
                          required
                        />

                      </div>

                      {/* CATEGORY */}

                      <div className="cc-field">

                        <label className="cc-label">
                          Category
                        </label>

                        <select
                          className="cc-input cc-select"
                          value={
                            requirement.category
                          }
                          onChange={(e) =>
                            handleRequirementChange(
                              index,
                              "category",
                              e.target.value
                            )
                          }
                          required
                        >

                          {form.categories.map(
                            (category) => (

                              <option
                                key={
                                  category
                                }
                                value={
                                  category
                                }
                              >
                                {category}
                              </option>

                            )
                          )}

                        </select>

                      </div>

                      {/* QUANTITY + UNIT */}

                      <div className="cc-row">

                        <div className="cc-field cc-grow">

                          <label className="cc-label">
                            Goal Quantity
                          </label>

                          <input
                            className="cc-input"
                            type="number"
                            min="1"
                            placeholder="100"
                            value={
                              requirement.goalQuantity
                            }
                            onChange={(e) =>
                              handleRequirementChange(
                                index,
                                "goalQuantity",
                                e.target.value
                              )
                            }
                            required
                          />

                        </div>

                        <div className="cc-field">

                          <label className="cc-label">
                            Unit
                          </label>

                          <select
                            className="cc-input cc-select"
                            value={
                              requirement.unit
                            }
                            onChange={(e) =>
                              handleRequirementChange(
                                index,
                                "unit",
                                e.target.value
                              )
                            }
                            required
                          >

                            {UNITS.map(
                              (unit) => (

                                <option
                                  key={
                                    unit
                                  }
                                  value={
                                    unit
                                  }
                                >
                                  {unit}
                                </option>

                              )
                            )}

                          </select>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

            {/* =================================================
                DURATION
            ================================================= */}

            <div className="cc-card">

              <span className="cc-eyebrow">
                Campaign Duration
              </span>

              <div className="cc-duration-row">

                {DURATIONS.map(
                  (duration) => (

                    <button
                      type="button"
                      key={
                        duration
                      }
                      className={`cc-duration-pill ${
                        form.duration ===
                        duration
                          ? "cc-duration-active"
                          : ""
                      }`}
                      onClick={() =>
                        selectDuration(
                          duration
                        )
                      }
                    >
                      {duration} days
                    </button>

                  )
                )}

              </div>

            </div>

            {/* =================================================
                IMAGES
            ================================================= */}

            <div className="cc-card">

              <span className="cc-eyebrow">
                Campaign Images
              </span>

              <div className="cc-field cc-image-upload">

                <label
                  className="cc-label"
                  htmlFor="campaignImages"
                >
                  Upload campaign images
                </label>

                <input
                  id="campaignImages"
                  type="file"
                  className="cc-input"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={
                    handleImageChange
                  }
                />

                <small className="text-muted">
                  Upload 1–5 images.
                  JPG, PNG or WebP.
                  Maximum 5 MB per image.
                </small>

              </div>

              {imagePreviews.length >
                0 && (

                <div className="cc-image-grid">

                  {imagePreviews.map(
                    (
                      preview,
                      index
                    ) => (

                      <div
                        className="cc-image-preview"
                        key={index}
                      >

                        <img
                          src={preview}
                          alt={`Campaign preview ${
                            index + 1
                          }`}
                        />

                        <span className="cc-image-number">
                          {index + 1}
                        </span>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <div className="cc-submit-row">

              <p className="cc-submit-note">
                Campaigns are reviewed by
                an admin before they go live.
              </p>

              <button
                type="submit"
                className="cc-submit-btn"
                disabled={submitting}
              >
                {submitting
                  ? "Submitting…"
                  : "Submit campaign"}
              </button>

            </div>

          </form>

          {/* =================================================
              LIVE MANIFEST
          ================================================= */}

          <aside className="cc-manifest">

            <div className="cc-manifest-perf" />

            <div className="cc-manifest-body">

              <div className="cc-manifest-head">

                <div>

                  <div className="cc-manifest-title">
                    Campaign Preview
                  </div>

                  <div className="cc-manifest-sub">
                    Live draft
                  </div>

                </div>

                <div className="cc-manifest-seal">
                  {
                    filledRequirements.length
                  }
                </div>

              </div>

              <div className="cc-manifest-campaign">

                {
                  form.title ||
                  "Untitled campaign"
                }

              </div>

              <div className="cc-manifest-meta">

                <span>
                  {form.categories.join(
                    ", "
                  )}
                </span>

                <span>·</span>

                <span>
                  {form.duration} days
                </span>

              </div>

              <div className="cc-manifest-list">

                {filledRequirements.length >
                0 ? (

                  filledRequirements.map(
                    (
                      requirement,
                      index
                    ) => (

                      <div
                        className="cc-manifest-item"
                        key={
                          requirement._id ||
                          index
                        }
                      >

                        <div>

                          <span className="cc-manifest-item-name">
                            {
                              requirement.itemName
                            }
                          </span>

                          <div className="cc-manifest-item-category">
                            {
                              requirement.category
                            }
                          </div>

                        </div>

                        <span className="cc-manifest-item-qty">

                          {
                            requirement.goalQuantity ||
                            "—"
                          }{" "}

                          {
                            requirement.unit
                          }

                        </span>

                      </div>

                    )
                  )

                ) : (

                  <div className="cc-manifest-empty">
                    No items listed yet
                  </div>

                )}

              </div>

              <div className="cc-manifest-stamp">
                Pending Review
              </div>

            </div>

          </aside>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default CreateCampaign;