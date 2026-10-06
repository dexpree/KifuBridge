import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/AdminPayments.css";

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);

  // ============================================================
  // FETCH ALL PAYMENTS
  // ============================================================

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Admin session has expired. Please login again.");
        return;
      }

      const response = await API.get("/payments/admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("ADMIN PAYMENTS:", response.data);

      setPayments(
        Array.isArray(response.data)
          ? response.data
          : response.data?.payments || []
      );
    } catch (err) {
      console.error("GET ADMIN PAYMENTS ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load payment records."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ============================================================
  // PAYMENT METHOD
  // ============================================================

  const formatPaymentMethod = (method) => {
    if (!method) return "N/A";

    if (method === "bank_transfer") {
      return "Bank Transfer";
    }

    return method
      .replace("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "successful":
        return "payment-status successful";

      case "pending":
        return "payment-status pending";

      case "failed":
        return "payment-status failed";

      case "cancelled":
        return "payment-status cancelled";

      default:
        return "payment-status";
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredPayments = payments.filter((payment) => {
    const donor = payment.donor || {};
    const ngo = payment.ngo || {};

    const searchText = search.toLowerCase();

    return (
      donor.name?.toLowerCase().includes(searchText) ||
      donor.email?.toLowerCase().includes(searchText) ||
      donor.phone?.toLowerCase().includes(searchText) ||
      ngo.name?.toLowerCase().includes(searchText) ||
      ngo.organizationName
        ?.toLowerCase()
        .includes(searchText) ||
      ngo.email?.toLowerCase().includes(searchText) ||
      payment.transactionId
        ?.toLowerCase()
        .includes(searchText) ||
      payment.razorpayPaymentId
        ?.toLowerCase()
        .includes(searchText)
    );
  });

  // ============================================================
  // TOTALS
  // ============================================================

  const successfulPayments = payments.filter(
    (payment) => payment.status === "successful"
  );

  const totalAmount = successfulPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="admin-payments-page">
          <PageHeader
            title="All Payments"
            subtitle="View and monitor all payments made to NGOs."
          />

          <div className="admin-payment-state">
            <div className="spinner-border" />
            <h5>Loading payment records...</h5>
            <p>
              Please wait while we retrieve all payment details.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="admin-payments-page">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <PageHeader
          title="All Payments"
          subtitle="View complete payment information between donors and NGOs."
        />

        {/* ======================================================
            STATISTICS
        ====================================================== */}

        <div className="admin-payment-stats">

          <div className="admin-payment-stat-card">
            <div className="stat-icon">
              <i className="bi bi-receipt" />
            </div>

            <div>
              <span>Total Payments</span>
              <strong>{payments.length}</strong>
            </div>
          </div>

          <div className="admin-payment-stat-card">
            <div className="stat-icon">
              <i className="bi bi-check-circle" />
            </div>

            <div>
              <span>Successful Payments</span>
              <strong>
                {successfulPayments.length}
              </strong>
            </div>
          </div>

          <div className="admin-payment-stat-card">
            <div className="stat-icon">
              <i className="bi bi-currency-rupee" />
            </div>

            <div>
              <span>Total Amount Received</span>
              <strong>
                {formatAmount(totalAmount)}
              </strong>
            </div>
          </div>

        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="admin-payment-alert">
            <i className="bi bi-exclamation-circle-fill" />
            <span>{error}</span>

            <button
              type="button"
              onClick={fetchPayments}
            >
              Retry
            </button>
          </div>
        )}

        {/* ======================================================
            TOOLBAR
        ====================================================== */}

        <div className="admin-payment-toolbar">

          <div className="admin-payment-search">
            <i className="bi bi-search" />

            <input
              type="text"
              placeholder="Search donor, NGO, email or transaction..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={fetchPayments}
          >
            <i className="bi bi-arrow-clockwise" />
            Refresh
          </button>

        </div>

        {/* ======================================================
            EMPTY
        ====================================================== */}

        {filteredPayments.length === 0 ? (
          <div className="admin-payment-state empty">

            <div className="empty-icon">
              <i className="bi bi-wallet2" />
            </div>

            <h5>
              {search
                ? "No matching payments found"
                : "No payments yet"}
            </h5>

            <p>
              {search
                ? "Try searching with a different name, email or transaction ID."
                : "Payment records will appear here once donors make payments."}
            </p>

          </div>
        ) : (

          /* ====================================================
             PAYMENT TABLE
          ==================================================== */

          <div className="admin-payment-table-card">

            <div className="table-responsive">

              <table className="admin-payment-table">

                <thead>
                  <tr>

                    <th>#</th>

                    <th>Donor</th>

                    <th>NGO</th>

                    <th>Amount</th>

                    <th>Method</th>

                    <th>Status</th>

                    <th>Date</th>

                    <th>Details</th>

                  </tr>
                </thead>

                <tbody>

                  {filteredPayments.map(
                    (payment, index) => {

                      const donor =
                        payment.donor || {};

                      const ngo =
                        payment.ngo || {};

                      return (
                        <tr
                          key={
                            payment._id ||
                            index
                          }
                        >

                          <td>
                            {index + 1}
                          </td>

                          {/* DONOR */}

                          <td>

                            <div className="payment-person">

                              <div className="person-avatar donor">
                                <i className="bi bi-person" />
                              </div>

                              <div>
                                <strong>
                                  {donor.name ||
                                    "Unknown Donor"}
                                </strong>

                                <small>
                                  {donor.email ||
                                    "No email"}
                                </small>
                              </div>

                            </div>

                          </td>

                          {/* NGO */}

                          <td>

                            <div className="payment-person">

                              <div className="person-avatar ngo">
                                <i className="bi bi-building" />
                              </div>

                              <div>
                                <strong>
                                  {ngo.organizationName ||
                                    ngo.name ||
                                    "Unknown NGO"}
                                </strong>

                                <small>
                                  {ngo.email ||
                                    "No email"}
                                </small>
                              </div>

                            </div>

                          </td>

                          {/* AMOUNT */}

                          <td>
                            <strong className="payment-amount">
                              {formatAmount(
                                payment.amount
                              )}
                            </strong>
                          </td>

                          {/* METHOD */}

                          <td>
                            <span className="payment-method">
                              <i
                                className={
                                  payment.paymentMethod ===
                                  "upi"
                                    ? "bi bi-phone"
                                    : payment.paymentMethod ===
                                      "card"
                                    ? "bi bi-credit-card"
                                    : "bi bi-bank"
                                }
                              />

                              {formatPaymentMethod(
                                payment.paymentMethod
                              )}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={getStatusClass(
                                payment.status
                              )}
                            >
                              <i className="bi bi-circle-fill" />

                              {payment.status
                                ?.toUpperCase() ||
                                "UNKNOWN"}
                            </span>

                          </td>

                          {/* DATE */}

                          <td>
                            <span className="payment-date">
                              {formatDate(
                                payment.paidAt ||
                                  payment.createdAt
                              )}
                            </span>
                          </td>

                          {/* DETAILS */}

                          <td>

                            <button
                              type="button"
                              className="view-payment-btn"
                              onClick={() =>
                                setSelectedPayment(
                                  payment
                                )
                              }
                            >
                              <i className="bi bi-eye" />
                              View
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

        {/* ======================================================
            PAYMENT DETAILS MODAL
        ====================================================== */}

        {selectedPayment && (

          <div
            className="payment-modal-overlay"
            onClick={() =>
              setSelectedPayment(null)
            }
          >

            <div
              className="payment-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="payment-modal-header">

                <div>
                  <span>
                    PAYMENT DETAILS
                  </span>

                  <h3>
                    Payment Information
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedPayment(null)
                  }
                >
                  <i className="bi bi-x-lg" />
                </button>

              </div>

              {/* PAYMENT SUMMARY */}

              <div className="modal-payment-summary">

                <div>
                  <span>Amount</span>

                  <strong>
                    {formatAmount(
                      selectedPayment.amount
                    )}
                  </strong>
                </div>

                <div>
                  <span>Status</span>

                  <span
                    className={getStatusClass(
                      selectedPayment.status
                    )}
                  >
                    {selectedPayment.status?.toUpperCase()}
                  </span>
                </div>

                <div>
                  <span>Payment Method</span>

                  <strong>
                    {formatPaymentMethod(
                      selectedPayment.paymentMethod
                    )}
                  </strong>
                </div>

              </div>

              {/* ==================================================
                  DONOR DETAILS
              ================================================== */}

              <div className="modal-section">

                <div className="modal-section-title">

                  <div className="modal-section-icon donor">
                    <i className="bi bi-person-fill" />
                  </div>

                  <div>
                    <span>PAYMENT FROM</span>
                    <h4>Donor Details</h4>
                  </div>

                </div>

                <div className="modal-details-grid">

                  <div>
                    <span>Full Name</span>
                    <strong>
                      {selectedPayment.donor?.name ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>
                      {selectedPayment.donor?.email ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>
                      {selectedPayment.donor?.phone ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Donor ID</span>
                    <strong className="id-value">
                      {selectedPayment.donor?._id ||
                        "N/A"}
                    </strong>
                  </div>

                </div>

              </div>

              {/* ==================================================
                  NGO DETAILS
              ================================================== */}

              <div className="modal-section">

                <div className="modal-section-title">

                  <div className="modal-section-icon ngo">
                    <i className="bi bi-building-fill" />
                  </div>

                  <div>
                    <span>PAYMENT TO</span>
                    <h4>NGO Details</h4>
                  </div>

                </div>

                <div className="modal-details-grid">

                  <div>
                    <span>Organization</span>
                    <strong>
                      {selectedPayment.ngo
                        ?.organizationName ||
                        selectedPayment.ngo
                          ?.name ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>NGO Name</span>
                    <strong>
                      {selectedPayment.ngo
                        ?.name ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>
                      {selectedPayment.ngo
                        ?.email ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>
                      {selectedPayment.ngo
                        ?.phone ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>City</span>
                    <strong>
                      {selectedPayment.ngo
                        ?.city ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>State</span>
                    <strong>
                      {selectedPayment.ngo
                        ?.state ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>NGO ID</span>
                    <strong className="id-value">
                      {selectedPayment.ngo
                        ?._id ||
                        "N/A"}
                    </strong>
                  </div>

                </div>

              </div>

              {/* ==================================================
                  TRANSACTION DETAILS
              ================================================== */}

              <div className="modal-section">

                <div className="modal-section-title">

                  <div className="modal-section-icon payment">
                    <i className="bi bi-receipt" />
                  </div>

                  <div>
                    <span>TRANSACTION</span>
                    <h4>Payment Details</h4>
                  </div>

                </div>

                <div className="modal-details-grid">

                  <div>
                    <span>Transaction ID</span>

                    <strong className="id-value">
                      {selectedPayment.transactionId ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Payment ID</span>

                    <strong className="id-value">
                      {selectedPayment.razorpayPaymentId ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Payment Date</span>

                    <strong>
                      {formatDate(
                        selectedPayment.paidAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Record Created</span>

                    <strong>
                      {formatDate(
                        selectedPayment.createdAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Payment Record ID</span>

                    <strong className="id-value">
                      {selectedPayment._id ||
                        "N/A"}
                    </strong>
                  </div>

                </div>

              </div>

              {/* CLOSE */}

              <div className="payment-modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setSelectedPayment(null)
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default AdminPayments;