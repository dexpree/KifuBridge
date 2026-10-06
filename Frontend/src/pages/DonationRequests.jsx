import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/DonorRequests.css";

const DELIVERY_METHOD_LABEL = {
  volunteer: {
    label: "Volunteer Delivery",
    icon: "bi-bicycle",
  },

  donor_self: {
    label: "Donor Delivery",
    icon: "bi-car-front",
  },

  ngo_pickup: {
    label: "NGO Pickup",
    icon: "bi-building",
  },
};

function DonorRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchRequests();
  }, []);

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
  // GET DONATION NAME
  // =====================================================
  // Checks the possible fields used by the donation object.
  // This prevents "Donation Item" from appearing when the
  // actual donation name is stored under another property.
  // =====================================================

  const getDonationName = (request) => {
    return (
      request.donation?.itemName ||
      request.donation?.name ||
      request.donation?.title ||
      request.donation?.donationName ||
      request.donation?.item?.name ||
      request.donation?.item?.itemName ||
      request.donationItem?.itemName ||
      request.donationItem?.name ||
      request.itemName ||
      request.donationName ||
      "Donation Item"
    );
  };

  // =====================================================
  // FETCH DONOR REQUESTS
  // =====================================================

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const res = await API.get(
        "/requests/donor-requests",
        authConfig()
      );

      console.log("DONOR REQUESTS:", res.data);

      setRequests(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (error) {
      console.error(
        "Fetch Donor Requests Error:",
        error
      );

      setRequests([]);

      alert(
        error.response?.data?.message ||
          "Failed to load donation requests."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ACCEPT REQUEST
  // =====================================================

  const handleAccept = async (requestId) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [requestId]: true,
      }));

      await API.put(
        `/requests/${requestId}/accept`,
        {},
        authConfig()
      );

      alert("Request approved successfully.");

      await fetchRequests();
    } catch (error) {
      console.error(
        "Accept Request Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to approve request."
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [requestId]: false,
      }));
    }
  };

  // =====================================================
  // REJECT REQUEST
  // =====================================================

  const handleReject = async (requestId) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this request?"
    );

    if (!confirmed) return;

    try {
      setActionLoading((prev) => ({
        ...prev,
        [requestId]: true,
      }));

      await API.put(
        `/requests/${requestId}/reject`,
        {},
        authConfig()
      );

      alert("Request rejected successfully.");

      await fetchRequests();
    } catch (error) {
      console.error(
        "Reject Request Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to reject request."
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [requestId]: false,
      }));
    }
  };

  // =====================================================
  // DONOR SELF DELIVERY
  // =====================================================

  const markDelivered = async (requestId) => {
    const confirmed = window.confirm(
      "Mark this donation as delivered?"
    );

    if (!confirmed) return;

    try {
      setActionLoading((prev) => ({
        ...prev,
        [requestId]: true,
      }));

      await API.put(
        `/requests/${requestId}/donor-delivered`,
        {},
        authConfig()
      );

      alert("Donation marked as delivered.");

      await fetchRequests();
    } catch (error) {
      console.error(
        "Donor Delivery Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to mark donation as delivered."
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [requestId]: false,
      }));
    }
  };

  // =====================================================
  // ASSIGN VOLUNTEER
  // =====================================================

  const handleAssignVolunteer = (requestId) => {
    navigate(
      `/assign-volunteer/${requestId}`
    );
  };

  // =====================================================
  // FORMAT STATUS
  // =====================================================

  const formatStatus = (status) => {
    if (!status) {
      return "NOT AVAILABLE";
    }

    return status
      .replace(/_/g, " ")
      .toUpperCase();
  };

  // =====================================================
  // DELIVERY METHOD
  // =====================================================

  const getDeliveryMethod = (method) => {
    return (
      DELIVERY_METHOD_LABEL[method] ||
      null
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <DashboardLayout>

        <PageHeader
          title="Donation Requests"
          subtitle="Review requests from NGOs."
        />

        <div className="dr-empty">

          <i className="bi bi-hourglass-split"></i>

          <h5>
            Loading donation requests...
          </h5>

          <p>
            Please wait while we load your
            requests.
          </p>

        </div>

      </DashboardLayout>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <DashboardLayout>

      <PageHeader
        title="Donation Requests"
        subtitle="Review requests from NGOs."
      />

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {requests.length === 0 ? (

        <div className="dr-empty">

          <i className="bi bi-inbox"></i>

          <h5>
            No Requests Available
          </h5>

          <p>
            There are currently no donation
            requests from NGOs.
          </p>

        </div>

      ) : (

        <div className="dr-grid">

          {requests.map((request) => {

            const method =
              getDeliveryMethod(
                request.deliveryMethod
              );

            const isActionLoading =
              actionLoading[
                request._id
              ];

            return (

              <div
                key={request._id}
                className="dr-card"
              >

                {/* =================================================
                    DONATION HEADER
                ================================================= */}

                <div className="dr-card-head">

                  <h4 className="dr-item-name">

                    <i className="bi bi-box-seam"></i>

                    {getDonationName(request)}

                  </h4>

                  <div className="dr-head-meta">

                    {request.donation
                      ?.category && (

                      <span className="dr-badge dr-badge--category">

                        {request.donation.category}

                      </span>

                    )}

                    {request.donation
                      ?.quantity != null && (

                      <span className="dr-head-qty">

                        Qty:{" "}

                        {request.donation.quantity}

                        {request.donation?.unit
                          ? ` ${request.donation.unit}`
                          : ""}

                      </span>

                    )}

                  </div>

                </div>

                {/* =================================================
                    REQUEST STATUS
                ================================================= */}

                <div
                  className={`dr-status-banner dr-status-banner--${
                    request.status ||
                    "unknown"
                  }`}
                >

                  <i
                    className={`bi ${
                      request.status ===
                      "pending"
                        ? "bi-hourglass-split"
                        : request.status ===
                          "approved"
                        ? "bi-check-circle-fill"
                        : request.status ===
                          "rejected"
                        ? "bi-x-circle-fill"
                        : "bi-info-circle-fill"
                    }`}
                  ></i>

                  {formatStatus(
                    request.status
                  )}

                </div>

                {/* =================================================
                    NGO DETAILS
                ================================================= */}

                <div className="dr-docket">

                  <div className="dr-docket-title">

                    <i className="bi bi-building"></i>

                    NGO Details

                  </div>

                  <div className="dr-docket-main">

                    <strong>

                      {request.ngo
                        ?.organizationName ||
                        request.ngo
                          ?.name ||
                        "Unknown NGO"}

                    </strong>

                    {request.ngo
                      ?.ngoCategory && (

                      <span className="dr-badge dr-badge--soft">

                        {request.ngo.ngoCategory}

                      </span>

                    )}

                  </div>

                  <div className="dr-docket-rows">

                    <span>

                      <i className="bi bi-person"></i>

                      {request.ngo
                        ?.name ||
                        "Not provided"}

                    </span>

                    <span>

                      <i className="bi bi-envelope"></i>

                      {request.ngo
                        ?.email ||
                        "Not provided"}

                    </span>

                    <span>

                      <i className="bi bi-telephone"></i>

                      {request.ngo
                        ?.phone ||
                        "Not provided"}

                    </span>

                    <span className="dr-docket-row--full">

                      <i className="bi bi-geo-alt"></i>

                      {request.ngo
                        ?.address ||
                        "Address not provided"}

                      {request.ngo?.city
                        ? `, ${request.ngo.city}`
                        : ""}

                      {request.ngo?.state
                        ? `, ${request.ngo.state}`
                        : ""}

                      {request.ngo?.pincode
                        ? ` — ${request.ngo.pincode}`
                        : ""}

                    </span>

                  </div>

                </div>

                {/* =================================================
                    DELIVERY INFORMATION
                ================================================= */}

                <div className="dr-meta-row">

                  <div className="dr-meta-item">

                    <span className="dr-meta-label">
                      Delivery Method
                    </span>

                    <span className="dr-badge dr-badge--method">

                      {method ? (
                        <>
                          <i
                            className={`bi ${method.icon}`}
                          ></i>

                          {method.label}
                        </>
                      ) : (
                        "Not selected"
                      )}

                    </span>

                  </div>

                  <div className="dr-meta-item">

                    <span className="dr-meta-label">
                      Delivery Status
                    </span>

                    <span className="dr-badge dr-badge--neutral">

                      {formatStatus(
                        request.deliveryStatus
                      )}

                    </span>

                  </div>

                </div>

                {/* =================================================
                    ACTION ZONE
                ================================================= */}

                <div className="dr-action-zone">

                  {/* =================================================
                      PENDING REQUEST
                  ================================================= */}

                  {request.status ===
                    "pending" && (

                    <div className="dr-action-row">

                      <button
                        type="button"
                        className="dr-btn dr-btn--accept"
                        disabled={
                          isActionLoading
                        }
                        onClick={() =>
                          handleAccept(
                            request._id
                          )
                        }
                      >

                        <i className="bi bi-check-lg"></i>

                        {isActionLoading
                          ? "Processing..."
                          : "Accept"}

                      </button>

                      <button
                        type="button"
                        className="dr-btn dr-btn--reject"
                        disabled={
                          isActionLoading
                        }
                        onClick={() =>
                          handleReject(
                            request._id
                          )
                        }
                      >

                        <i className="bi bi-x-lg"></i>

                        Reject

                      </button>

                    </div>
                  )}

                  {/* =================================================
                      APPROVED REQUEST
                  ================================================= */}

                  {request.status ===
                    "approved" && (

                    <>

                      {/* =================================================
                          VOLUNTEER DELIVERY
                      ================================================= */}

                      {request.deliveryMethod ===
                        "volunteer" && (

                        <>

                          {/* =================================================
                              ASSIGN VOLUNTEER
                          ================================================= */}

                          {request.deliveryStatus ===
                            "pending" && (

                            <button
                              type="button"
                              className="dr-btn dr-btn--assign"
                              disabled={
                                isActionLoading
                              }
                              onClick={() =>
                                handleAssignVolunteer(
                                  request._id
                                )
                              }
                            >

                              <i className="bi bi-person-plus"></i>

                              Assign Volunteer

                            </button>

                          )}

                          {/* =================================================
                              ASSIGNED VOLUNTEER
                          ================================================= */}

                          {request.deliveryStatus ===
                            "volunteer_assigned" && (

                            <div className="dr-confirm-card">

                              <div className="dr-confirm-title">

                                <i className="bi bi-check-circle-fill"></i>

                                Assigned Volunteer

                              </div>

                              {request.assignedVolunteer ? (

                                <>

                                  <div className="dr-confirm-rows">

                                    <span>

                                      <strong>
                                        Name
                                      </strong>

                                      {request
                                        .assignedVolunteer
                                        ?.name ||
                                        "Not provided"}

                                    </span>

                                    <span>

                                      <strong>
                                        Email
                                      </strong>

                                      {request
                                        .assignedVolunteer
                                        ?.email ||
                                        "Not provided"}

                                    </span>

                                    <span>

                                      <strong>
                                        Phone
                                      </strong>

                                      {request
                                        .assignedVolunteer
                                        ?.phone ||
                                        "Not provided"}

                                    </span>

                                    <span>

                                      <strong>
                                        Address
                                      </strong>

                                      {request
                                        .assignedVolunteer
                                        ?.address ||
                                        "Not provided"}

                                    </span>

                                    <span>

                                      <strong>
                                        Location
                                      </strong>

                                      {request
                                        .assignedVolunteer
                                        ?.city ||
                                        ""}

                                      {request
                                        .assignedVolunteer
                                        ?.state
                                        ? `, ${request.assignedVolunteer.state}`
                                        : ""}

                                      {request
                                        .assignedVolunteer
                                        ?.pincode
                                        ? ` — ${request.assignedVolunteer.pincode}`
                                        : ""}

                                    </span>

                                    <span>

                                      <strong>
                                        Vehicle
                                      </strong>

                                      {request
                                        .assignedVolunteer
                                        ?.vehicleType ||
                                        "Not provided"}

                                      {request
                                        .assignedVolunteer
                                        ?.vehicleNumber
                                        ? ` (${request.assignedVolunteer.vehicleNumber})`
                                        : ""}

                                    </span>

                                    <span>

                                      <strong>
                                        Capacity
                                      </strong>

                                      {request
                                        .assignedVolunteer
                                        ?.vehicleCapacity ||
                                        "Not provided"}

                                    </span>

                                    <span>

                                      <strong>
                                        License
                                      </strong>

                                      {request
                                        .assignedVolunteer
                                        ?.licenseNumber ||
                                        "Not provided"}

                                    </span>

                                  </div>

                                  <span className="dr-badge dr-badge--success">

                                    <i className="bi bi-circle-fill"></i>

                                    {request
                                      .assignedVolunteer
                                      ?.availability ||
                                      "Assigned"}

                                  </span>

                                </>

                              ) : (

                                <div className="dr-notice dr-notice--warning">

                                  <i className="bi bi-exclamation-triangle"></i>

                                  Volunteer has been
                                  assigned, but
                                  volunteer details
                                  could not be loaded.

                                </div>

                              )}

                            </div>
                          )}

                          {/* =================================================
                              VOLUNTEER ACCEPTED
                          ================================================= */}

                          {request.deliveryStatus ===
                            "volunteer_accepted" && (

                            <div className="dr-notice dr-notice--info">

                              <i className="bi bi-check-circle"></i>

                              Volunteer has accepted
                              the delivery.

                            </div>

                          )}

                          {/* =================================================
                              PICKED UP
                          ================================================= */}

                          {request.deliveryStatus ===
                            "picked_up" && (

                            <div className="dr-notice dr-notice--info">

                              <i className="bi bi-box-seam"></i>

                              Donation has been
                              picked up by the
                              volunteer.

                            </div>

                          )}

                          {/* =================================================
                              DELIVERED
                          ================================================= */}

                          {request.deliveryStatus ===
                            "delivered" && (

                            <div className="dr-notice dr-notice--success">

                              <i className="bi bi-check-circle-fill"></i>

                              Donation has been
                              delivered to the NGO.

                            </div>

                          )}

                          {/* =================================================
                              COMPLETED
                          ================================================= */}

                          {request.deliveryStatus ===
                            "completed" && (

                            <div className="dr-notice dr-notice--success">

                              <i className="bi bi-check2-all"></i>

                              Delivery has been
                              completed successfully.

                            </div>

                          )}

                        </>
                      )}

                      {/* =================================================
                          DONOR SELF DELIVERY
                      ================================================= */}

                      {request.deliveryMethod ===
                        "donor_self" &&
                        request.deliveryStatus ===
                          "pending" && (

                        <button
                          type="button"
                          className="dr-btn dr-btn--assign"
                          disabled={
                            isActionLoading
                          }
                          onClick={() =>
                            markDelivered(
                              request._id
                            )
                          }
                        >

                          <i className="bi bi-car-front"></i>

                          {isActionLoading
                            ? "Updating..."
                            : "Mark as Delivered"}

                        </button>

                      )}

                      {/* =================================================
                          DONOR SELF DELIVERY WAITING
                      ================================================= */}

                      {request.deliveryMethod ===
                        "donor_self" &&
                        request.deliveryStatus ===
                          "delivered" && (

                        <div className="dr-notice dr-notice--info">

                          <i className="bi bi-hourglass-split"></i>

                          Waiting for NGO to
                          confirm receipt.

                        </div>

                      )}

                      {/* =================================================
                          NGO PICKUP
                      ================================================= */}

                      {request.deliveryMethod ===
                        "ngo_pickup" && (

                        <div className="dr-notice dr-notice--warning">

                          <i className="bi bi-building"></i>

                          Waiting for NGO to
                          collect the donation.

                        </div>

                      )}

                    </>
                  )}

                  {/* =================================================
                      REJECTED
                  ================================================= */}

                  {request.status ===
                    "rejected" && (

                    <div className="dr-notice dr-notice--danger">

                      <i className="bi bi-x-circle"></i>

                      This request has been
                      rejected.

                    </div>

                  )}

                </div>

              </div>
            );
          })}

        </div>
      )}

    </DashboardLayout>
  );
}

export default DonorRequests;