import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import API from "../services/api";

function CampaignImpact() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    impactTitle: "",
    impactDescription: "",
    impactImage: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // SUBMIT IMPACT REPORT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ========================================
    // VALIDATION
    // ========================================

    if (!form.impactTitle.trim()) {
      alert("Please enter an impact title.");
      return;
    }

    if (!form.impactDescription.trim()) {
      alert("Please enter an impact description.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      await API.put(
        `/campaigns/${id}/impact`,
        {
          impactTitle: form.impactTitle.trim(),
          impactDescription:
            form.impactDescription.trim(),
          impactImage:
            form.impactImage.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Impact report published successfully.");

      navigate("/ngo/my-campaigns");
    } catch (error) {
      console.error(
        "Campaign Impact Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to publish impact report."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>

      <PageHeader
        title="Campaign Impact"
        subtitle="Share the outcome and impact of your campaign."
      />

      <div className="card shadow">

        <div className="card-body">

          <form onSubmit={handleSubmit}>

            {/* ==================================
                IMPACT TITLE
            ================================== */}

            <div className="mb-3">

              <label
                className="form-label"
                htmlFor="impactTitle"
              >
                Impact Title
              </label>

              <input
                id="impactTitle"
                name="impactTitle"
                type="text"
                className="form-control"
                placeholder="e.g. 500 Families Received Food"
                value={form.impactTitle}
                onChange={handleChange}
                maxLength={150}
                required
              />

            </div>

            {/* ==================================
                IMPACT DESCRIPTION
            ================================== */}

            <div className="mb-3">

              <label
                className="form-label"
                htmlFor="impactDescription"
              >
                Impact Description
              </label>

              <textarea
                id="impactDescription"
                name="impactDescription"
                rows="7"
                className="form-control"
                placeholder="Describe how the donations were used and the impact they created..."
                value={form.impactDescription}
                onChange={handleChange}
                maxLength={2000}
                required
              />

              <small className="text-muted">
                {form.impactDescription.length}/2000
                characters
              </small>

            </div>

            {/* ==================================
                IMAGE URL
            ================================== */}

            <div className="mb-3">

              <label
                className="form-label"
                htmlFor="impactImage"
              >
                Impact Image URL
              </label>

              <input
                id="impactImage"
                name="impactImage"
                type="url"
                className="form-control"
                placeholder="https://example.com/impact-image.jpg"
                value={form.impactImage}
                onChange={handleChange}
              />

              <small className="text-muted">
                Optional. Add a publicly accessible
                image URL showing the campaign impact.
              </small>

            </div>

            {/* ==================================
                IMAGE PREVIEW
            ================================== */}

            {form.impactImage.trim() && (
              <div className="mb-4">

                <label className="form-label">
                  Image Preview
                </label>

                <div
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid #ddd",
                    maxWidth: "500px",
                  }}
                >

                  <img
                    src={form.impactImage}
                    alt="Impact preview"
                    style={{
                      width: "100%",
                      maxHeight: "280px",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />

                </div>

              </div>
            )}

            {/* ==================================
                ACTIONS
            ================================== */}

            <div className="d-flex gap-2">

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  navigate("/ngo/my-campaigns")
                }
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-success"
                disabled={submitting}
              >
                {submitting
                  ? "Publishing..."
                  : "Publish Report"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default CampaignImpact;