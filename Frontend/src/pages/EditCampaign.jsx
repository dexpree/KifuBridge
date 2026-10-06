import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import API from "../services/api";
import "../styles/campaignManagement.css";

const CATEGORY_OPTIONS = [
  "food",
  "clothing",
  "toys",
  "medicine",
  "books",
  "household",
  "electronics",
  "other",
];

const UNIT_OPTIONS = [
  "pieces",
  "kg",
  "liters",
  "boxes",
  "sets",
];

const getImageUrl = (image) => {
  if (!image) {
    return "https://placehold.co/1200x400?text=Campaign";
  }

  if (image.startsWith("http")) {
    return image;
  }

  return `http://localhost:5000${image}`;
};

function EditCampaign() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [campaign, setCampaign] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
  });

  const [requirements, setRequirements] = useState([]);

  const [newImages, setNewImages] = useState([]);

  // ==========================================
  // FETCH CAMPAIGN
  // ==========================================

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const res = await API.get(
        `/campaigns/${id}/management`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "========== EDIT CAMPAIGN =========="
      );

      console.log(
        "Campaign:",
        res.data
      );

      const campaignData =
        res.data.campaign;

      setCampaign(campaignData);

      setForm({
        title:
          campaignData.title || "",

        description:
          campaignData.description || "",

        category:
          campaignData.category || "",

        duration:
          campaignData.duration || "",
      });

      setRequirements(
        (campaignData.requirements || []).map(
          (requirement) => ({
            _id: requirement._id,

            itemName:
              requirement.itemName || "",

            goalQuantity:
              requirement.goalQuantity || "",

            currentQuantity:
              requirement.currentQuantity || 0,

            unit:
              requirement.unit || "pieces",
          })
        )
      );

    } catch (err) {
      console.error(
        "Fetch Campaign Error:",
        err
      );

      console.error(
        "Backend Response:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
          "Unable to load campaign."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // BASIC FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // REQUIREMENT CHANGE
  // ==========================================

  const handleRequirementChange = (
    index,
    field,
    value
  ) => {
    setRequirements((prev) =>
      prev.map((requirement, i) =>
        i === index
          ? {
              ...requirement,
              [field]: value,
            }
          : requirement
      )
    );
  };

  // ==========================================
  // ADD REQUIREMENT
  // ==========================================

  const addRequirement = () => {
    setRequirements((prev) => [
      ...prev,
      {
        _id: null,
        itemName: "",
        goalQuantity: "",
        currentQuantity: 0,
        unit: "pieces",
      },
    ]);
  };

  // ==========================================
  // REMOVE REQUIREMENT
  // ==========================================

  const removeRequirement = (index) => {
    const requirement =
      requirements[index];

    const currentQuantity = Number(
      requirement.currentQuantity || 0
    );

    // Don't allow removing a requirement
    // that already has donations.

    if (currentQuantity > 0) {
      alert(
        `"${requirement.itemName}" cannot be removed because ${currentQuantity} ${requirement.unit} has already been collected.`
      );

      return;
    }

    if (requirements.length === 1) {
      alert(
        "A campaign must have at least one requirement."
      );

      return;
    }

    setRequirements((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  // ==========================================
  // IMAGE CHANGE
  // ==========================================

  const handleImageChange = (e) => {
    const files = Array.from(
      e.target.files || []
    );

    if (files.length > 5) {
      alert(
        "You can upload a maximum of 5 images."
      );

      return;
    }

    setNewImages(files);
  };

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    if (!form.title.trim()) {
      alert("Please enter campaign title.");
      return false;
    }

    if (!form.description.trim()) {
      alert(
        "Please enter campaign description."
      );
      return false;
    }

    if (!form.category) {
      alert(
        "Please select a campaign category."
      );
      return false;
    }

    if (
      !form.duration ||
      Number(form.duration) <= 0
    ) {
      alert(
        "Please enter a valid campaign duration."
      );
      return false;
    }

    if (requirements.length === 0) {
      alert(
        "Please add at least one requirement."
      );

      return false;
    }

    for (
      let i = 0;
      i < requirements.length;
      i++
    ) {
      const requirement =
        requirements[i];

      if (
        !requirement.itemName.trim()
      ) {
        alert(
          `Please enter the item name for Requirement ${
            i + 1
          }.`
        );

        return false;
      }

      if (
        !requirement.goalQuantity ||
        Number(
          requirement.goalQuantity
        ) <= 0
      ) {
        alert(
          `Please enter a valid quantity for Requirement ${
            i + 1
          }.`
        );

        return false;
      }

      const goal =
        Number(
          requirement.goalQuantity
        );

      const collected =
        Number(
          requirement.currentQuantity ||
            0
        );

      // VERY IMPORTANT:
      // Goal cannot be lower than
      // already collected amount.

      if (goal < collected) {
        alert(
          `${requirement.itemName}: goal quantity cannot be less than the already collected quantity (${collected}).`
        );

        return false;
      }

      if (!requirement.unit) {
        alert(
          `Please select a unit for Requirement ${
            i + 1
          }.`
        );

        return false;
      }
    }

    return true;
  };

  // ==========================================
  // SUBMIT UPDATE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token =
        localStorage.getItem("token");

      const formData =
        new FormData();

      // ======================================
      // BASIC INFORMATION
      // ======================================

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "category",
        form.category
      );

      formData.append(
        "duration",
        Number(form.duration)
      );

      // ======================================
      // REQUIREMENTS
      // ======================================

      const requirementsToSend =
        requirements.map(
          (requirement) => ({
            ...(requirement._id
              ? {
                  _id: requirement._id,
                }
              : {}),

            itemName:
              requirement.itemName.trim(),

            goalQuantity:
              Number(
                requirement.goalQuantity
              ),

            // Send current quantity too.
            // Backend will preserve the
            // database value.

            currentQuantity:
              Number(
                requirement.currentQuantity ||
                  0
              ),

            unit:
              requirement.unit,
          })
        );

      formData.append(
        "requirements",
        JSON.stringify(
          requirementsToSend
        )
      );

      // ======================================
      // NEW IMAGES
      // ======================================

      newImages.forEach((file) => {
        formData.append(
          "campaignImages",
          file
        );
      });

      console.log(
        "========== UPDATE CAMPAIGN =========="
      );

      console.log(
        "Campaign ID:",
        id
      );

      console.log(
        "Requirements:",
        requirementsToSend
      );

      // ======================================
      // API REQUEST
      // ======================================

      const res = await API.put(
        `/campaigns/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      console.log(
        "Update Response:",
        res.data
      );

      alert(
        "Campaign updated successfully."
      );

      // Go back to management page

      navigate(
        `/ngo/campaigns/${id}`
      );

    } catch (err) {
      console.error(
        "Update Campaign Error:",
        err
      );

      console.error(
        "Backend Response:",
        err.response?.data
      );

      alert(
        err.response?.data?.message ||
          "Unable to update campaign."
      );

      setError(
        err.response?.data?.message ||
          "Unable to update campaign."
      );

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="cm-status">
          Loading campaign...
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !campaign) {
    return (
      <DashboardLayout>
        <div className="cm-status cm-status-error">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================
  // REJECTED CAMPAIGN
  // ==========================================

  if (
    campaign?.status ===
    "rejected"
  ) {
    return (
      <DashboardLayout>

        <PageHeader
          title="Edit Campaign"
          subtitle="Campaign editing"
        />

        <div className="cm-card">
          <div className="cm-empty">

            <h4>
              This campaign cannot be edited.
            </h4>

            <p>
              Rejected campaigns cannot be
              edited.
            </p>

            <button
              type="button"
              className="cm-action-btn cm-edit-btn"
              onClick={() =>
                navigate(
                  `/ngo/campaigns/${id}`
                )
              }
            >
              ← Back to Campaign
            </button>

          </div>
        </div>

      </DashboardLayout>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <DashboardLayout>

      <PageHeader
        title="Edit Campaign"
        subtitle="Update your campaign information and requirements."
      />

      <div className="cm-card edit-campaign-card">

        <form
          onSubmit={handleSubmit}
        >

          {/* ====================================
              CAMPAIGN IMAGE
          ==================================== */}

          <div className="edit-section">

            <div className="edit-section-header">

              <h4>
                Campaign Image
              </h4>

              <p>
                Upload new images if you
                want to replace the current
                campaign images.
              </p>

            </div>

            {/* CURRENT IMAGE */}

            <div className="edit-current-image">

              <img
                src={getImageUrl(
                  campaign
                    ?.campaignImages?.[0]
                )}
                alt={
                  campaign?.title ||
                  "Campaign"
                }
              />

            </div>

            <div className="edit-field">

              <label>
                Replace Campaign Images
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={
                  handleImageChange
                }
              />

              <small>
                Select up to 5 images.
                Existing images will be
                replaced if new images are
                uploaded.
              </small>

            </div>

          </div>

          {/* ====================================
              BASIC INFORMATION
          ==================================== */}

          <div className="edit-section">

            <div className="edit-section-header">

              <h4>
                Campaign Information
              </h4>

              <p>
                Update the basic details
                of your campaign.
              </p>

            </div>

            {/* TITLE */}

            <div className="edit-field">

              <label>
                Campaign Title
              </label>

              <input
                type="text"
                name="title"
                className="edit-input"
                value={form.title}
                onChange={
                  handleChange
                }
                maxLength={150}
                required
              />

            </div>

            {/* DESCRIPTION */}

            <div className="edit-field">

              <label>
                Description
              </label>

              <textarea
                name="description"
                className="edit-input edit-textarea"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                rows={6}
                required
              />

            </div>

            {/* CATEGORY + DURATION */}

            <div className="edit-two-column">

              <div className="edit-field">

                <label>
                  Category
                </label>

                <select
                  name="category"
                  className="edit-input"
                  value={
                    form.category
                  }
                  onChange={
                    handleChange
                  }
                  required
                >

                  <option value="">
                    Select category
                  </option>

                  {CATEGORY_OPTIONS.map(
                    (category) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {category
                          .charAt(0)
                          .toUpperCase() +
                          category.slice(
                            1
                          )}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="edit-field">

                <label>
                  Duration
                  <span>
                    {" "}
                    (days)
                  </span>
                </label>

                <input
                  type="number"
                  name="duration"
                  className="edit-input"
                  min="1"
                  value={
                    form.duration
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>

          </div>

          {/* ====================================
              REQUIREMENTS
          ==================================== */}

          <div className="edit-section">

            <div className="edit-section-header">

              <div>

                <h4>
                  Campaign Requirements
                </h4>

                <p>
                  Update what your campaign
                  needs.
                </p>

              </div>

              <button
                type="button"
                className="cm-action-btn cm-edit-btn"
                onClick={
                  addRequirement
                }
              >
                + Add Requirement
              </button>

            </div>

            {/* REQUIREMENTS */}

            <div className="edit-requirements">

              {requirements.map(
                (
                  requirement,
                  index
                ) => {

                  const collected =
                    Number(
                      requirement.currentQuantity ||
                        0
                    );

                  const goal =
                    Number(
                      requirement.goalQuantity ||
                        0
                    );

                  const remaining =
                    Math.max(
                      0,
                      goal -
                        collected
                    );

                  return (
                    <div
                      className="edit-requirement-card"
                      key={
                        requirement._id ||
                        `new-${index}`
                      }
                    >

                      {/* HEADER */}

                      <div className="edit-requirement-header">

                        <strong>
                          Requirement{" "}
                          {index + 1}
                        </strong>

                        {collected >
                          0 && (
                          <span className="edit-collected-badge">
                            {collected}{" "}
                            {
                              requirement.unit
                            }{" "}
                            collected
                          </span>
                        )}

                      </div>

                      {/* ITEM */}

                      <div className="edit-field">

                        <label>
                          Item Name
                        </label>

                        <input
                          type="text"
                          className="edit-input"
                          value={
                            requirement.itemName
                          }
                          onChange={(e) =>
                            handleRequirementChange(
                              index,
                              "itemName",
                              e.target
                                .value
                            )
                          }
                          required
                        />

                      </div>

                      {/* QUANTITY + UNIT */}

                      <div className="edit-two-column">

                        <div className="edit-field">

                          <label>
                            Goal Quantity
                          </label>

                          <input
                            type="number"
                            min={
                              collected ||
                              1
                            }
                            className="edit-input"
                            value={
                              requirement.goalQuantity
                            }
                            onChange={(e) =>
                              handleRequirementChange(
                                index,
                                "goalQuantity",
                                e.target
                                  .value
                              )
                            }
                            required
                          />

                          {collected >
                            0 && (
                            <small>
                              Minimum:
                              {" "}
                              {collected}{" "}
                              {
                                requirement.unit
                              }{" "}
                              already
                              collected
                            </small>
                          )}

                        </div>

                        <div className="edit-field">

                          <label>
                            Unit
                          </label>

                          <select
                            className="edit-input"
                            value={
                              requirement.unit
                            }
                            onChange={(e) =>
                              handleRequirementChange(
                                index,
                                "unit",
                                e.target
                                  .value
                              )
                            }
                            required
                          >

                            {UNIT_OPTIONS.map(
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

                      {/* CURRENT STATUS */}

                      <div className="edit-requirement-info">

                        <div>

                          <span>
                            Already Collected
                          </span>

                          <strong>
                            {collected}{" "}
                            {
                              requirement.unit
                            }
                          </strong>

                        </div>

                        <div>

                          <span>
                            Remaining
                          </span>

                          <strong>
                            {remaining}{" "}
                            {
                              requirement.unit
                            }
                          </strong>

                        </div>

                      </div>

                      {/* REMOVE */}

                      <button
                        type="button"
                        className="edit-remove-btn"
                        onClick={() =>
                          removeRequirement(
                            index
                          )
                        }
                      >
                        🗑️ Remove Requirement
                      </button>

                    </div>
                  );
                }
              )}

            </div>

          </div>

          {/* ====================================
              ERROR
          ==================================== */}

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {/* ====================================
              ACTIONS
          ==================================== */}

          <div className="edit-form-actions">

            <button
              type="button"
              className="cm-action-btn cm-delete-btn"
              disabled={saving}
              onClick={() =>
                navigate(
                  `/ngo/campaigns/${id}`
                )
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="cm-action-btn cm-edit-btn"
              disabled={saving}
            >
              {saving
                ? "Saving Changes..."
                : "💾 Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </DashboardLayout>
  );
}

export default EditCampaign;