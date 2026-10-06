import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";

import "../styles/DirectNGODonation.css";

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
// COMPONENT
// ============================================================

function DirectNGODonation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ngo, setNgo] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================================
  // FETCH SELECTED NGO
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

      if (!id) {
        setError(
          "NGO information is missing."
        );

        return;
      }

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
        "SELECTED NGO:",
        response.data
      );

      const selectedNGO =
        response.data?.ngo ||
        response.data ||
        null;

      if (!selectedNGO) {
        setError(
          "The selected NGO could not be found."
        );

        setNgo(null);
        return;
      }

      setNgo(selectedNGO);

    } catch (err) {
      console.error(
        "Fetch Selected NGO Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load NGO."
      );

      setNgo(null);

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // GO TO ITEM DONATION
  // ==========================================================

  const handleDonateItems = () => {
    if (!ngo?._id) {
      alert(
        "NGO information is unavailable."
      );

      return;
    }

    console.log(
      "START DIRECT ITEM DONATION"
    );

    console.log(
      "TARGET NGO ID:",
      ngo._id
    );

    console.log(
      "TARGET NGO:",
      ngo.organizationName ||
        ngo.name
    );

    /*
      Important:

      The NGO ID is passed through the URL.

      Example:

      /create-donation/64f8....

      CreateDonation.jsx will read this
      ID using useParams() and send it
      to the backend as targetNGO.
    */

    navigate(
      `/create-donation/${ngo._id}`
    );
  };

  // ==========================================================
  // PAYMENT
  // ==========================================================

  const handlePayment = () => {
    if (!ngo?._id) {
      alert(
        "NGO information is unavailable."
      );

      return;
    }

    console.log(
      "START DIRECT PAYMENT"
    );

    console.log(
      "TARGET NGO ID:",
      ngo._id
    );

    /*
      Payment flow will be created
      separately.
    */

     navigate(`/make-payment/${ngo._id}`);
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <DashboardLayout>

        <div className="direct-ngo-page">

          <div className="direct-ngo-state">

            <div className="spinner-border"></div>

            <h5>
              Loading NGO...
            </h5>

            <p>
              Preparing your donation options.
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

        <div className="direct-ngo-page">

          <div className="direct-ngo-state direct-ngo-state-error">

            <div className="direct-ngo-state-icon">
              <i className="bi bi-building-x"></i>
            </div>

            <h5>
              NGO not available
            </h5>

            <p>
              {error ||
                "The selected NGO could not be found."}
            </p>

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

          </div>

        </div>

      </DashboardLayout>
    );
  }

  // ==========================================================
  // NGO DATA
  // ==========================================================

  const organizationName =
    ngo.organizationName ||
    ngo.name ||
    "NGO";

  const location = [
    ngo.city,
    ngo.state,
  ]
    .filter(Boolean)
    .join(", ");

  const imageUrl =
    getImageUrl(
      ngo.profileImage
    );

  const initials =
    getInitials(
      organizationName
    ) || "NG";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      <div className="direct-ngo-page">

        <PageHeader
          title="Support an NGO"
          subtitle="Choose how you would like to support this organization."
        />

        {/* ==================================================
            SELECTED NGO
        ================================================== */}

        <div className="direct-ngo-selected">

          <div className="direct-ngo-avatar">

            {imageUrl ? (
              <img
                src={imageUrl}
                alt={organizationName}
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
              className="direct-ngo-avatar-placeholder"
              style={{
                display:
                  imageUrl
                    ? "none"
                    : "flex",
              }}
            >
              {initials}
            </div>

          </div>

          <div className="direct-ngo-selected-info">

            <span className="direct-ngo-verified">
              <i className="bi bi-patch-check-fill"></i>
              Verified NGO
            </span>

            <h2>
              {organizationName}
            </h2>

            {ngo.ngoCategory && (
              <span>
                <i className="bi bi-building me-1"></i>
                {ngo.ngoCategory}
              </span>
            )}

            {location && (
              <span>
                <i className="bi bi-geo-alt me-1"></i>
                {location}
              </span>
            )}

          </div>

        </div>

        {/* ==================================================
            SUPPORT OPTIONS
        ================================================== */}

        <div className="direct-ngo-options">

          {/* =================================================
              ITEM DONATION
          ================================================= */}

          <article className="direct-ngo-option">

            <div className="direct-ngo-option-icon">
              <i className="bi bi-box-seam"></i>
            </div>

            <div className="direct-ngo-option-content">

              <span className="direct-ngo-option-label">
                Option 1
              </span>

              <h3>
                Donate Items
              </h3>

              <p>
                Donate physical items directly
                to{" "}
                <strong>
                  {organizationName}
                </strong>
                . This donation will be reserved
                specifically for this NGO and
                will not be visible to other NGOs.
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  handleDonateItems
                }
              >
                <i className="bi bi-box-seam me-2"></i>
                Donate Items
                <i className="bi bi-arrow-right ms-2"></i>
              </button>

            </div>

          </article>

          {/* =================================================
              PAYMENT
          ================================================= */}

          <article className="direct-ngo-option">

            <div className="direct-ngo-option-icon">
              <i className="bi bi-credit-card"></i>
            </div>

            <div className="direct-ngo-option-content">

              <span className="direct-ngo-option-label">
                Option 2
              </span>

              <h3>
                Make a Payment
              </h3>

              <p>
                Support{" "}
                <strong>
                  {organizationName}
                </strong>{" "}
                financially. You will be able to
                choose an amount, complete the
                payment and download a receipt.
              </p>

            <button
  type="button"
  className="btn btn-success"
  onClick={handlePayment}
>
  <i className="bi bi-credit-card me-2"></i>
  Make Payment
  <i className="bi bi-arrow-right ms-2"></i>
</button>
            </div>

          </article>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default DirectNGODonation;