import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";

import "../styles/adminPaymentVerification.css";

function AdminPaymentVerification() {

  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const [showRejectModal, setShowRejectModal] =
    useState(false);

  const [selectedNgo, setSelectedNgo] =
    useState(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  // =====================================================
  // FETCH PENDING NGO PAYMENTS
  // =====================================================

  const fetchNGOs = async () => {

    try {

      setLoading(true);

      const token =
        localStorage.getItem("token");

      const res = await API.get(
        "/users/admin/payment-verifications",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setNgos(res.data);

    } catch (error) {

      console.error(
        "Payment verification fetch error:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Failed to load NGO payment verifications."
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    fetchNGOs();

  }, []);

  // =====================================================
  // VERIFY
  // =====================================================

  const handleVerify = async (ngoId) => {

    if (
      !window.confirm(
        "Are you sure you want to verify these payment details?"
      )
    ) {
      return;
    }

    try {

      setProcessing(ngoId);

      const token =
        localStorage.getItem("token");

      await API.put(
        `/users/admin/payment-verifications/${ngoId}/verify`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      alert(
        "NGO payment details verified successfully."
      );

      fetchNGOs();

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Failed to verify payment details."
      );

    } finally {

      setProcessing(null);

    }

  };

  // =====================================================
  // OPEN REJECT MODAL
  // =====================================================

  const openRejectModal = (ngo) => {

    setSelectedNgo(ngo);
    setRejectionReason("");
    setShowRejectModal(true);

  };

  // =====================================================
  // REJECT
  // =====================================================

  const handleReject = async () => {

    if (!rejectionReason.trim()) {

      alert(
        "Please enter a rejection reason."
      );

      return;

    }

    try {

      setProcessing(selectedNgo._id);

      const token =
        localStorage.getItem("token");

      await API.put(
        `/users/admin/payment-verifications/${selectedNgo._id}/reject`,
        {
          rejectionReason:
            rejectionReason.trim(),
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      alert(
        "NGO payment details rejected."
      );

      setShowRejectModal(false);
      setSelectedNgo(null);
      setRejectionReason("");

      fetchNGOs();

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Failed to reject payment details."
      );

    } finally {

      setProcessing(null);

    }

  };

  // =====================================================
  // FORMAT ACCOUNT NUMBER
  // =====================================================

  const maskAccountNumber = (accountNumber) => {

    if (!accountNumber) {
      return "Not provided";
    }

    const value =
      String(accountNumber);

    if (value.length <= 4) {
      return value;
    }

    return (
      "•••• •••• " +
      value.slice(-4)
    );

  };

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <DashboardLayout>

      <PageHeader
        title="NGO Payment Verification"
        subtitle="Review and verify NGO payment details submitted for donations."
      />

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="payment-summary">

        <div className="payment-summary-card">

          <div className="payment-summary-icon pending">
            <i className="bi bi-clock-history"></i>
          </div>

          <div>
            <span>Pending Verification</span>
            <strong>{ngos.length}</strong>
          </div>

        </div>

        <div className="payment-summary-card">

          <div className="payment-summary-icon security">
            <i className="bi bi-shield-check"></i>
          </div>

          <div>
            <span>Verification System</span>
            <strong>Active</strong>
          </div>

        </div>

      </div>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <div className="payment-loading">

          <div
            className="spinner-border"
            role="status"
          ></div>

          <p>
            Loading payment verification requests...
          </p>

        </div>

      ) : ngos.length === 0 ? (

        /* =================================================
           EMPTY
        ================================================= */

        <div className="payment-empty">

          <div className="payment-empty-icon">

            <i className="bi bi-check2-circle"></i>

          </div>

          <h3>
            All caught up!
          </h3>

          <p>
            There are no NGO payment details
            waiting for verification.
          </p>

        </div>

      ) : (

        /* =================================================
           NGO LIST
        ================================================= */

        <div className="payment-verification-list">

          {ngos.map((ngo) => (

            <div
              className="ngo-payment-card"
              key={ngo._id}
            >

              {/* CARD HEADER */}

              <div className="ngo-payment-header">

                <div className="ngo-identity">

                  <div className="ngo-avatar">

                    {ngo.name
                      ?.substring(0, 2)
                      .toUpperCase() || "NG"}

                  </div>

                  <div>

                    <h3>
                      {ngo.organizationName ||
                        ngo.name ||
                        "NGO"}
                    </h3>

                    <p>
                      {ngo.email}
                    </p>

                  </div>

                </div>

                <span className="payment-status pending">
                  <i className="bi bi-clock"></i>
                  Pending Verification
                </span>

              </div>

              {/* PAYMENT INFORMATION */}

              <div className="payment-details-grid">

                <div className="payment-detail">

                  <span>
                    Account Holder
                  </span>

                  <strong>
                    {ngo.paymentDetails
                      ?.accountHolderName ||
                      "Not provided"}
                  </strong>

                </div>

                <div className="payment-detail">

                  <span>
                    Bank Name
                  </span>

                  <strong>
                    {ngo.paymentDetails
                      ?.bankName ||
                      "Not provided"}
                  </strong>

                </div>

                <div className="payment-detail">

                  <span>
                    Account Number
                  </span>

                  <strong>
                    {maskAccountNumber(
                      ngo.paymentDetails
                        ?.accountNumber
                    )}
                  </strong>

                </div>

                <div className="payment-detail">

                  <span>
                    IFSC Code
                  </span>

                  <strong>
                    {ngo.paymentDetails
                      ?.ifscCode ||
                      "Not provided"}
                  </strong>

                </div>

                <div className="payment-detail">

                  <span>
                    Account Type
                  </span>

                  <strong>
                    {ngo.paymentDetails
                      ?.accountType ||
                      "Not provided"}
                  </strong>

                </div>

                <div className="payment-detail">

                  <span>
                    UPI ID
                  </span>

                  <strong>
                    {ngo.paymentDetails
                      ?.upiId ||
                      "Not provided"}
                  </strong>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="ngo-payment-actions">

                <button
                  className="payment-btn reject"
                  disabled={
                    processing === ngo._id
                  }
                  onClick={() =>
                    openRejectModal(ngo)
                  }
                >

                  <i className="bi bi-x-circle"></i>

                  Reject

                </button>

                <button
                  className="payment-btn verify"
                  disabled={
                    processing === ngo._id
                  }
                  onClick={() =>
                    handleVerify(ngo._id)
                  }
                >

                  {processing === ngo._id ? (

                    <>

                      <span
                        className="spinner-border spinner-border-sm"
                      ></span>

                      Processing...

                    </>

                  ) : (

                    <>

                      <i className="bi bi-check-circle"></i>

                      Verify Payment

                    </>

                  )}

                </button>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* =================================================
          REJECTION MODAL
      ================================================= */}

      {showRejectModal && (

        <div className="payment-modal-overlay">

          <div className="payment-modal">

            <div className="payment-modal-header">

              <div>

                <span className="modal-label">
                  PAYMENT VERIFICATION
                </span>

                <h3>
                  Reject Payment Details
                </h3>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowRejectModal(false)
                }
              >
                <i className="bi bi-x-lg"></i>
              </button>

            </div>

            <div className="payment-modal-body">

              <p>

                You are rejecting payment details
                submitted by{" "}

                <strong>
                  {selectedNgo?.organizationName ||
                    selectedNgo?.name}
                </strong>.

              </p>

              <label>
                Rejection Reason
              </label>

              <textarea
                value={rejectionReason}
                onChange={(e) =>
                  setRejectionReason(
                    e.target.value
                  )
                }
                placeholder="Explain why the payment details need to be corrected..."
                rows="4"
              />

            </div>

            <div className="payment-modal-actions">

              <button
                className="modal-cancel"
                onClick={() =>
                  setShowRejectModal(false)
                }
              >
                Cancel
              </button>

              <button
                className="modal-reject"
                onClick={handleReject}
                disabled={
                  processing ===
                  selectedNgo?._id
                }
              >
                <i className="bi bi-x-circle"></i>
                Reject Payment
              </button>

            </div>

          </div>

        </div>

      )}

    </DashboardLayout>

  );

}

export default AdminPaymentVerification;