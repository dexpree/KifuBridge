import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/AssignVolunteer.css";

// =====================================================
// BACKEND SERVER URL
// =====================================================

const API_BASE_URL = "http://localhost:5000";

function AssignVolunteer() {
  const navigate = useNavigate();
  const { requestId } = useParams();

  const [request, setRequest] = useState(null);
  const [volunteers, setVolunteers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [volunteersLoading, setVolunteersLoading] =
    useState(true);

  const [selectedVolunteer, setSelectedVolunteer] =
    useState("");

  const [assigning, setAssigning] = useState(false);

  // =====================================================
  // IMAGE PREVIEW
  // =====================================================

  const [previewImage, setPreviewImage] =
    useState(null);

  const [previewTitle, setPreviewTitle] =
    useState("");

  // =====================================================
  // DONATION REQUEST PAGE
  // =====================================================

  const DONATION_REQUESTS_ROUTE =
    "/donation-requests";

  // =====================================================
  // IMAGE URL HELPER
  // =====================================================

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "";
    }

    // Already a complete URL
    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    // Backend returns paths such as:
    // /uploads/profile.jpg
    return `${API_BASE_URL}${imagePath}`;
  };

  // =====================================================
  // AUTH CONFIG
  // =====================================================

  const authConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!requestId) {
      alert("Invalid donation request.");
      navigate(DONATION_REQUESTS_ROUTE);
      return;
    }

    fetchRequest();
    fetchVolunteers();
  }, [requestId]);

  // =====================================================
  // FETCH DONATION REQUEST
  // =====================================================

  const fetchRequest = async () => {
    try {
      setLoading(true);

      const res = await API.get(
        "/requests/donor-requests",
        authConfig()
      );

      const requests = Array.isArray(res.data)
        ? res.data
        : [];

      const foundRequest = requests.find(
        (item) => item._id === requestId
      );

      // ---------------------------------------------------
      // REQUEST NOT FOUND
      // ---------------------------------------------------

      if (!foundRequest) {
        alert("Donation request not found.");
        navigate(DONATION_REQUESTS_ROUTE);
        return;
      }

      // ---------------------------------------------------
      // CHECK REQUEST STATUS
      // ---------------------------------------------------

      if (foundRequest.status !== "approved") {
        alert(
          "This donation request is not available for volunteer assignment."
        );

        navigate(DONATION_REQUESTS_ROUTE);
        return;
      }

      // ---------------------------------------------------
      // CHECK DELIVERY METHOD
      // ---------------------------------------------------

      if (
        foundRequest.deliveryMethod !==
        "volunteer"
      ) {
        alert(
          "Volunteer assignment is not required for this donation."
        );

        navigate(DONATION_REQUESTS_ROUTE);
        return;
      }

      // ---------------------------------------------------
      // CHECK IF ALREADY ASSIGNED
      // ---------------------------------------------------

      if (
        foundRequest.deliveryStatus ===
        "volunteer_assigned"
      ) {
        alert(
          "A volunteer has already been assigned to this donation."
        );

        navigate(DONATION_REQUESTS_ROUTE);
        return;
      }

      console.log(
        "========== ASSIGN VOLUNTEER REQUEST =========="
      );

      console.log(
        "REQUEST:",
        foundRequest
      );

      console.log(
        "DONATION:",
        foundRequest.donation
      );

      console.log(
        "DONATION NAME:",
        foundRequest.donation
          ?.donationName
      );

      console.log(
        "DONATION CATEGORIES:",
        foundRequest.donation
          ?.categories
      );

      setRequest(foundRequest);
    } catch (error) {
      console.error(
        "Fetch Donation Request Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to load donation request."
      );

      navigate(DONATION_REQUESTS_ROUTE);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH VOLUNTEERS
  // =====================================================

  const fetchVolunteers = async () => {
    try {
      setVolunteersLoading(true);

      const res = await API.get(
        "/users/volunteers",
        authConfig()
      );

      console.log(
        "AVAILABLE VOLUNTEERS:",
        res.data
      );

      setVolunteers(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (error) {
      console.error(
        "Fetch Volunteers Error:",
        error
      );

      setVolunteers([]);

      alert(
        error.response?.data?.message ||
          "Failed to load volunteers."
      );
    } finally {
      setVolunteersLoading(false);
    }
  };

  // =====================================================
  // SELECT VOLUNTEER
  // =====================================================

  const handleSelectVolunteer = (
    volunteerId
  ) => {
    if (assigning) {
      return;
    }

    setSelectedVolunteer(volunteerId);
  };

  // =====================================================
  // OPEN IMAGE PREVIEW
  // =====================================================

  const openImagePreview = (
    image,
    title
  ) => {
    if (!image) {
      return;
    }

    setPreviewImage(
      getImageUrl(image)
    );

    setPreviewTitle(title);
  };

  // =====================================================
  // CLOSE IMAGE PREVIEW
  // =====================================================

  const closeImagePreview = () => {
    setPreviewImage(null);
    setPreviewTitle("");
  };

  // =====================================================
  // ASSIGN VOLUNTEER
  // =====================================================

  const assignVolunteer = async () => {
    if (!selectedVolunteer) {
      alert("Please select a volunteer.");
      return;
    }

    if (!requestId) {
      alert("Invalid donation request.");
      return;
    }

    const selectedVolunteerData =
      volunteers.find(
        (volunteer) =>
          volunteer._id === selectedVolunteer
      );

    const volunteerName =
      selectedVolunteerData?.name ||
      "this volunteer";

    const confirmed = window.confirm(
      `Are you sure you want to assign ${volunteerName} to this donation?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setAssigning(true);

      const res = await API.put(
        `/requests/${requestId}/assign-volunteer`,
        {
          volunteerId: selectedVolunteer,
        },
        authConfig()
      );

      console.log(
        "ASSIGN VOLUNTEER RESPONSE:",
        res.data
      );

      alert(
        "Volunteer assigned successfully."
      );

      navigate(
        DONATION_REQUESTS_ROUTE
      );
    } catch (error) {
      console.error(
        "Assign Volunteer Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to assign volunteer."
      );
    } finally {
      setAssigning(false);
    }
  };

  // =====================================================
  // LOADING REQUEST
  // =====================================================

  if (loading) {
    return (
      <DashboardLayout>

        <PageHeader
          title="Assign Volunteer"
          subtitle="Select a volunteer for this donation."
        />

        <div className="av-empty">

          <i className="bi bi-hourglass-split"></i>

          <h5>
            Loading donation request...
          </h5>

          <p>
            Please wait while we load the
            donation details.
          </p>

        </div>

      </DashboardLayout>
    );
  }

  // =====================================================
  // GET DONATION DATA
  // =====================================================

  const donation =
    request?.donation || null;

  const donationName =
    donation?.donationName ||
    "Donation Item";

  const donationCategories =
    Array.isArray(donation?.categories)
      ? donation.categories
      : [];

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <DashboardLayout>

      <PageHeader
        title="Assign Volunteer"
        subtitle="Review volunteer details before assigning the delivery."
      />

      <div className="av-page">

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <button
          type="button"
          className="av-back"
          disabled={assigning}
          onClick={() =>
            navigate(
              DONATION_REQUESTS_ROUTE
            )
          }
        >

          <i className="bi bi-arrow-left"></i>

          Back to Donation Requests

        </button>

        {/* =================================================
            DONATION INFORMATION
        ================================================= */}

        {request && (

          <div className="av-request-card">

            <div className="av-section-title">

              <i className="bi bi-box-seam"></i>

              Donation Details

            </div>

            <div className="av-request-main">

              <div>

                <span className="av-label">
                  Donation Name
                </span>

                <h3>
                  {donationName}
                </h3>

              </div>

              {/* =================================================
                  DONATION CATEGORY / QUANTITY
              ================================================= */}

              <div className="av-request-badges">

                {donationCategories.length >
                  0 ? (

                  donationCategories.map(
                    (categoryItem, index) => (

                      <span
                        className="av-badge"
                        key={
                          categoryItem._id ||
                          `${categoryItem.category}-${index}`
                        }
                      >

                        {categoryItem.category ||
                          "Category"}

                        {categoryItem.quantity !=
                          null && (
                          <>
                            {" "}
                            · Qty:{" "}
                            {
                              categoryItem.quantity
                            }

                            {categoryItem.unit
                              ? ` ${categoryItem.unit}`
                              : ""}
                          </>
                        )}

                      </span>

                    )
                  )

                ) : (

                  <span className="av-badge">
                    No category information
                  </span>

                )}

              </div>

            </div>

            {/* =================================================
                DONATION DESCRIPTION
            ================================================= */}

            {donation?.description && (

              <div className="av-donation-description">

                <span className="av-label">
                  Description
                </span>

                <p>
                  {donation.description}
                </p>

              </div>

            )}

            {/* =================================================
                NGO DETAILS
            ================================================= */}

            <div className="av-ngo">

              <div className="av-ngo-title">

                <i className="bi bi-building"></i>

                NGO

              </div>

              <strong>

                {request.ngo
                  ?.organizationName ||
                  request.ngo?.name ||
                  "Unknown NGO"}

              </strong>

              <span>

                {request.ngo
                  ?.city || ""}

                {request.ngo?.state
                  ? `, ${request.ngo.state}`
                  : ""}

              </span>

            </div>

          </div>

        )}

        {/* =================================================
            VOLUNTEER SECTION
        ================================================= */}

        <div className="av-volunteer-section">

          <div className="av-section-header">

            <div>

              <div className="av-section-title">

                <i className="bi bi-bicycle"></i>

                Available Volunteers

              </div>

              <p>
                Review the volunteer profile and
                vehicle information before assigning.
              </p>

            </div>

            <span className="av-count">

              {volunteers.length}

              {" "}

              {volunteers.length === 1
                ? "Volunteer"
                : "Volunteers"}

            </span>

          </div>

          {/* =================================================
              LOADING VOLUNTEERS
          ================================================= */}

          {volunteersLoading ? (

            <div className="av-notice av-notice--info">

              <i className="bi bi-hourglass-split"></i>

              Loading available volunteers...

            </div>

          ) : volunteers.length === 0 ? (

            <div className="av-notice av-notice--warning">

              <i className="bi bi-exclamation-triangle"></i>

              <div>

                <strong>
                  No volunteers available
                </strong>

                <p>
                  There are currently no
                  volunteers available for
                  assignment.
                </p>

              </div>

            </div>

          ) : (

            <div className="av-volunteer-grid">

              {volunteers.map(
                (volunteer) => {

                  const isSelected =
                    selectedVolunteer ===
                    volunteer._id;

                  const profileImageUrl =
                    getImageUrl(
                      volunteer.profileImage
                    );

                  const vehicleImageUrl =
                    getImageUrl(
                      volunteer.vehicleImage
                    );

                  return (

                    <div
                      key={volunteer._id}
                      className={`av-volunteer-card ${
                        isSelected
                          ? "is-selected"
                          : ""
                      }`}
                    >

                      {/* =================================================
                          SELECTED INDICATOR
                      ================================================= */}

                      {isSelected && (

                        <span className="av-selected">

                          <i className="bi bi-check-circle-fill"></i>

                        </span>

                      )}

                      {/* =================================================
                          PROFILE IMAGE
                      ================================================= */}

                      <div className="av-profile-section">

                        {profileImageUrl ? (

                          <button
                            type="button"
                            className="av-profile-image-button"
                            disabled={assigning}
                            onClick={() =>
                              openImagePreview(
                                volunteer.profileImage,
                                `${
                                  volunteer.name ||
                                  "Volunteer"
                                } - Profile`
                              )
                            }
                          >

                            <img
                              src={
                                profileImageUrl
                              }
                              alt={
                                volunteer.name ||
                                "Volunteer profile"
                              }
                              className="av-profile-image"
                            />

                            <span className="av-image-overlay">

                              <i className="bi bi-zoom-in"></i>

                            </span>

                          </button>

                        ) : (

                          <div className="av-profile-placeholder">

                            <i className="bi bi-person-fill"></i>

                          </div>

                        )}

                      </div>

                      {/* =================================================
                          NAME
                      ================================================= */}

                      <div className="av-volunteer-name">

                        <div>

                          <strong>

                            {volunteer.name ||
                              "Unknown Volunteer"}

                          </strong>

                          <span>
                            Volunteer
                          </span>

                        </div>

                      </div>

                      {/* =================================================
                          CONTACT
                      ================================================= */}

                      <div className="av-contact">

                        <span>

                          <i className="bi bi-envelope"></i>

                          {volunteer.email ||
                            "Email not provided"}

                        </span>

                        <span>

                          <i className="bi bi-telephone"></i>

                          {volunteer.phone ||
                            "Phone not provided"}

                        </span>

                      </div>

                      {/* =================================================
                          LOCATION
                      ================================================= */}

                      {(volunteer.address ||
                        volunteer.city ||
                        volunteer.state ||
                        volunteer.pincode) && (

                        <div className="av-location">

                          <i className="bi bi-geo-alt"></i>

                          <span>

                            {volunteer.address
                              ? volunteer.address
                              : ""}

                            {volunteer.city
                              ? `${
                                  volunteer.address
                                    ? ", "
                                    : ""
                                }${volunteer.city}`
                              : ""}

                            {volunteer.state
                              ? `, ${volunteer.state}`
                              : ""}

                            {volunteer.pincode
                              ? ` · ${volunteer.pincode}`
                              : ""}

                          </span>

                        </div>

                      )}

                      {/* =================================================
                          VEHICLE DETAILS
                      ================================================= */}

                      <div className="av-vehicle">

                        <div>

                          <span className="av-mini-label">
                            Vehicle
                          </span>

                          <strong>

                            <i className="bi bi-scooter"></i>

                            {" "}

                            {volunteer.vehicleType ||
                              "Not provided"}

                          </strong>

                        </div>

                        <div>

                          <span className="av-mini-label">
                            Number
                          </span>

                          <strong>

                            {volunteer.vehicleNumber ||
                              "Not provided"}

                          </strong>

                        </div>

                        <div>

                          <span className="av-mini-label">
                            Capacity
                          </span>

                          <strong>

                            {volunteer.vehicleCapacity ||
                              "Not provided"}

                          </strong>

                        </div>

                      </div>

                      {/* =================================================
                          VEHICLE IMAGE
                      ================================================= */}

                      <div className="av-vehicle-image-section">

                        <span className="av-mini-label">
                          Vehicle Image
                        </span>

                        {vehicleImageUrl ? (

                          <button
                            type="button"
                            className="av-vehicle-image-button"
                            disabled={assigning}
                            onClick={() =>
                              openImagePreview(
                                volunteer.vehicleImage,
                                `${
                                  volunteer.name ||
                                  "Volunteer"
                                } - Vehicle`
                              )
                            }
                          >

                            <img
                              src={
                                vehicleImageUrl
                              }
                              alt={
                                volunteer.vehicleType ||
                                "Volunteer vehicle"
                              }
                              className="av-vehicle-image"
                            />

                            <span className="av-image-overlay">

                              <i className="bi bi-zoom-in"></i>

                            </span>

                          </button>

                        ) : (

                          <div className="av-no-image">

                            <i className="bi bi-image"></i>

                            Vehicle image not provided

                          </div>

                        )}

                      </div>

                      {/* =================================================
                          AVAILABILITY
                      ================================================= */}

                      <span className="av-availability">

                        <i className="bi bi-circle-fill"></i>

                        {volunteer.availability ||
                          "Availability unknown"}

                      </span>

                      {/* =================================================
                          SELECT BUTTON
                      ================================================= */}

                      <button
                        type="button"
                        className={`av-select-button ${
                          isSelected
                            ? "is-selected"
                            : ""
                        }`}
                        disabled={assigning}
                        onClick={() =>
                          handleSelectVolunteer(
                            volunteer._id
                          )
                        }
                      >

                        <i
                          className={
                            isSelected
                              ? "bi bi-check-circle-fill"
                              : "bi bi-circle"
                          }
                        ></i>

                        {isSelected
                          ? "Volunteer Selected"
                          : "Select Volunteer"}

                      </button>

                    </div>
                  );
                }
              )}

            </div>

          )}

          {/* =================================================
              ASSIGN BUTTON
          ================================================= */}

          {volunteers.length > 0 && (

            <div className="av-action">

              <div className="av-selection-summary">

                {selectedVolunteer ? (

                  <>
                    <i className="bi bi-person-check-fill"></i>

                    <span>
                      Volunteer selected. Review the
                      information above before assigning.
                    </span>
                  </>

                ) : (

                  <>
                    <i className="bi bi-info-circle"></i>

                    <span>
                      Select a volunteer to continue.
                    </span>
                  </>

                )}

              </div>

              <button
                type="button"
                className="av-assign-button"
                disabled={
                  !selectedVolunteer ||
                  assigning
                }
                onClick={assignVolunteer}
              >

                <i
                  className={
                    assigning
                      ? "bi bi-hourglass-split"
                      : "bi bi-person-check"
                  }
                ></i>

                {assigning
                  ? "Assigning Volunteer..."
                  : selectedVolunteer
                  ? "Assign Selected Volunteer"
                  : "Select a Volunteer First"}

              </button>

            </div>

          )}

        </div>

      </div>

      {/* =====================================================
          IMAGE PREVIEW MODAL
      ===================================================== */}

      {previewImage && (

        <div
          className="av-image-modal"
          onClick={closeImagePreview}
        >

          <div
            className="av-image-modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="av-image-modal-header">

              <strong>
                {previewTitle}
              </strong>

              <button
                type="button"
                className="av-image-modal-close"
                onClick={closeImagePreview}
              >

                <i className="bi bi-x-lg"></i>

              </button>

            </div>

            <div className="av-image-modal-body">

              <img
                src={previewImage}
                alt={previewTitle}
              />

            </div>

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}

export default AssignVolunteer;