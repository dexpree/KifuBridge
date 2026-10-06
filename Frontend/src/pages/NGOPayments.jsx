import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/NGOPayments.css";

function NGOPayments() {
  // ============================================================
  // STATE
  // ============================================================

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  // ============================================================
  // FETCH NGO PAYMENTS
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
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      console.log("====================================");
      console.log("FETCH NGO PAYMENTS");
      console.log("====================================");

      const response = await API.get(
        "/payments/ngo-payments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "NGO PAYMENTS RESPONSE:",
        response.data
      );

      const paymentData = Array.isArray(response.data)
        ? response.data
        : response.data?.payments || [];

      setPayments(paymentData);

    } catch (err) {
      console.error(
        "FETCH NGO PAYMENTS ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load received payments."
      );

      setPayments([]);

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    );
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ============================================================
  // PAYMENT METHOD LABEL
  // ============================================================

  const getPaymentMethod = (method) => {
    if (!method) {
      return "Payment";
    }

    if (method === "bank_transfer") {
      return "Bank Transfer";
    }

    if (method === "upi") {
      return "UPI";
    }

    if (method === "card") {
      return "Card";
    }

    if (method === "cash") {
      return "Cash";
    }

    return method
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // ============================================================
  // PAYMENT ICON
  // ============================================================

  const getPaymentIcon = (method) => {
    switch (method) {
      case "upi":
        return "bi-phone";

      case "bank_transfer":
        return "bi-bank";

      case "card":
        return "bi-credit-card";

      case "cash":
        return "bi-cash";

      default:
        return "bi-wallet2";
    }
  };

  // ============================================================
  // DONOR NAME
  // ============================================================

  const getDonorName = (payment) => {
    return (
      payment?.donor?.name ||
      "Anonymous Donor"
    );
  };

  // ============================================================
  // DONOR EMAIL
  // ============================================================

  const getDonorEmail = (payment) => {
    return (
      payment?.donor?.email ||
      "Email not available"
    );
  };

  // ============================================================
  // TRANSACTION ID
  // ============================================================

  const getTransactionId = (payment) => {
    return (
      payment?.transactionId ||
      payment?.razorpayPaymentId ||
      payment?._id ||
      "N/A"
    );
  };

  // ============================================================
  // FILTER + SORT
  // ============================================================

  const filteredPayments = useMemo(() => {
    let result = [...payments];

    // ----------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------

    if (search.trim()) {
      const searchValue =
        search.toLowerCase().trim();

      result = result.filter((payment) => {
        const donorName =
          getDonorName(payment).toLowerCase();

        const donorEmail =
          getDonorEmail(payment).toLowerCase();

        const transactionId =
          getTransactionId(payment)
            .toLowerCase();

        const method =
          getPaymentMethod(
            payment.paymentMethod
          ).toLowerCase();

        return (
          donorName.includes(searchValue) ||
          donorEmail.includes(searchValue) ||
          transactionId.includes(searchValue) ||
          method.includes(searchValue)
        );
      });
    }

    // ----------------------------------------------------------
    // PAYMENT METHOD
    // ----------------------------------------------------------

    if (paymentMethod !== "all") {
      result = result.filter(
        (payment) =>
          payment.paymentMethod ===
          paymentMethod
      );
    }

    // ----------------------------------------------------------
    // SORT
    // ----------------------------------------------------------

    result.sort((a, b) => {
      const dateA = new Date(
        a.paidAt || a.createdAt || 0
      ).getTime();

      const dateB = new Date(
        b.paidAt || b.createdAt || 0
      ).getTime();

      if (sortOrder === "latest") {
        return dateB - dateA;
      }

      if (sortOrder === "oldest") {
        return dateA - dateB;
      }

      if (sortOrder === "highest") {
        return (
          Number(b.amount || 0) -
          Number(a.amount || 0)
        );
      }

      if (sortOrder === "lowest") {
        return (
          Number(a.amount || 0) -
          Number(b.amount || 0)
        );
      }

      return 0;
    });

    return result;
  }, [
    payments,
    search,
    paymentMethod,
    sortOrder,
  ]);

  // ============================================================
  // TOTAL RECEIVED
  // ============================================================

  const totalReceived = useMemo(() => {
    return payments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );
  }, [payments]);

  // ============================================================
  // TOTAL DONATIONS
  // ============================================================

  const totalDonations = payments.length;

  // ============================================================
  // AVERAGE DONATION
  // ============================================================

  const averageDonation =
    totalDonations > 0
      ? totalReceived / totalDonations
      : 0;

  // ============================================================
  // UPI PAYMENTS
  // ============================================================

  const upiPayments = payments.filter(
    (payment) =>
      payment.paymentMethod === "upi"
  ).length;

  // ============================================================
  // BANK PAYMENTS
  // ============================================================

  const bankPayments = payments.filter(
    (payment) =>
      payment.paymentMethod ===
      "bank_transfer"
  ).length;

  // ============================================================
  // CARD PAYMENTS
  // ============================================================

  const cardPayments = payments.filter(
    (payment) =>
      payment.paymentMethod === "card"
  ).length;

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="ngo-payments-page">

          <PageHeader
            title="Received Payments"
            subtitle="View donations received by your NGO."
          />

          <div className="ngo-payments-state">

            <div className="spinner-border"></div>

            <h5>
              Loading payments...
            </h5>

            <p>
              Fetching your received donations.
            </p>

          </div>

        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (
    <DashboardLayout>

      <div className="ngo-payments-page">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <PageHeader
          title="Received Payments"
          subtitle="Track donations received by your NGO."
        />

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="ngo-payments-alert">

            <i className="bi bi-exclamation-circle-fill"></i>

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={fetchPayments}
            >
              Retry
            </button>

          </div>
        )}

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="ngo-payment-stats">

          {/* TOTAL RECEIVED */}

          <div className="ngo-payment-stat-card">

            <div className="ngo-payment-stat-icon total">
              <i className="bi bi-wallet2"></i>
            </div>

            <div className="ngo-payment-stat-content">

              <span>
                Total Received
              </span>

              <strong>
                {formatAmount(
                  totalReceived
                )}
              </strong>

            </div>

          </div>

          {/* TOTAL DONATIONS */}

          <div className="ngo-payment-stat-card">

            <div className="ngo-payment-stat-icon donations">
              <i className="bi bi-heart-fill"></i>
            </div>

            <div className="ngo-payment-stat-content">

              <span>
                Total Donations
              </span>

              <strong>
                {totalDonations}
              </strong>

            </div>

          </div>

          {/* AVERAGE */}

          <div className="ngo-payment-stat-card">

            <div className="ngo-payment-stat-icon average">
              <i className="bi bi-bar-chart-fill"></i>
            </div>

            <div className="ngo-payment-stat-content">

              <span>
                Average Donation
              </span>

              <strong>
                {formatAmount(
                  averageDonation
                )}
              </strong>

            </div>

          </div>

          {/* SUCCESSFUL */}

          <div className="ngo-payment-stat-card">

            <div className="ngo-payment-stat-icon successful">
              <i className="bi bi-check-circle-fill"></i>
            </div>

            <div className="ngo-payment-stat-content">

              <span>
                Successful
              </span>

              <strong>
                {totalDonations}
              </strong>

            </div>

          </div>

        </div>

        {/* =====================================================
            PAYMENT METHOD SUMMARY
        ===================================================== */}

        <div className="ngo-payment-method-summary">

          <div className="method-summary-title">
            <i className="bi bi-pie-chart"></i>
            Payment Methods
          </div>

          <div className="method-summary-items">

            <div className="method-summary-item">

              <i className="bi bi-phone"></i>

              <div>
                <span>UPI</span>
                <strong>
                  {upiPayments}
                </strong>
              </div>

            </div>

            <div className="method-summary-item">

              <i className="bi bi-bank"></i>

              <div>
                <span>Bank Transfer</span>
                <strong>
                  {bankPayments}
                </strong>
              </div>

            </div>

            <div className="method-summary-item">

              <i className="bi bi-credit-card"></i>

              <div>
                <span>Card</span>
                <strong>
                  {cardPayments}
                </strong>
              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            PAYMENT LIST CARD
        ===================================================== */}

        <div className="ngo-payments-card">

          {/* ---------------------------------------------------
              CARD HEADER
          --------------------------------------------------- */}

          <div className="ngo-payments-card-header">

            <div>

              <span className="ngo-payments-kicker">
                DONATION HISTORY
              </span>

              <h3>
                Payments Received
              </h3>

            </div>

            <button
              type="button"
              className="ngo-refresh-btn"
              onClick={fetchPayments}
              title="Refresh payments"
            >
              <i className="bi bi-arrow-clockwise"></i>
              Refresh
            </button>

          </div>

          {/* ---------------------------------------------------
              FILTERS
          --------------------------------------------------- */}

          <div className="ngo-payment-filters">

            {/* SEARCH */}

            <div className="ngo-payment-search">

              <i className="bi bi-search"></i>

              <input
                type="text"
                placeholder="Search donor, email or transaction..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  <i className="bi bi-x"></i>
                </button>
              )}

            </div>

            {/* METHOD */}

            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value
                )
              }
            >
              <option value="all">
                All Methods
              </option>

              <option value="upi">
                UPI
              </option>

              <option value="bank_transfer">
                Bank Transfer
              </option>

              <option value="card">
                Card
              </option>
            </select>

            {/* SORT */}

            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(
                  e.target.value
                )
              }
            >
              <option value="latest">
                Latest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

              <option value="highest">
                Highest Amount
              </option>

              <option value="lowest">
                Lowest Amount
              </option>
            </select>

          </div>

          {/* ---------------------------------------------------
              RESULTS COUNT
          --------------------------------------------------- */}

          <div className="ngo-payment-results">

            Showing{" "}
            <strong>
              {filteredPayments.length}
            </strong>{" "}
            of{" "}
            <strong>
              {payments.length}
            </strong>{" "}
            payments

          </div>

          {/* ---------------------------------------------------
              EMPTY STATE
          --------------------------------------------------- */}

          {filteredPayments.length === 0 ? (

            <div className="ngo-payments-empty">

              <div className="ngo-payments-empty-icon">
                <i className="bi bi-wallet2"></i>
              </div>

              {payments.length === 0 ? (
                <>
                  <h4>
                    No payments received yet
                  </h4>

                  <p>
                    Donations made to your NGO
                    will appear here.
                  </p>
                </>
              ) : (
                <>
                  <h4>
                    No matching payments
                  </h4>

                  <p>
                    Try changing your search
                    or filter.
                  </p>
                </>
              )}

            </div>

          ) : (

            /* -------------------------------------------------
               PAYMENT TABLE
            ------------------------------------------------- */

            <div className="ngo-payments-table-wrapper">

              <table className="ngo-payments-table">

                <thead>

                  <tr>

                    <th>
                      Donor
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Method
                    </th>

                    <th>
                      Transaction ID
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredPayments.map(
                    (payment) => (

                      <tr
                        key={
                          payment._id
                        }
                      >

                        {/* DONOR */}

                        <td>

                          <div className="ngo-donor-cell">

                            <div className="ngo-donor-avatar">

                              {getDonorName(
                                payment
                              )
                                .charAt(0)
                                .toUpperCase()}

                            </div>

                            <div>

                              <strong>
                                {getDonorName(
                                  payment
                                )}
                              </strong>

                              <span>
                                {getDonorEmail(
                                  payment
                                )}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* AMOUNT */}

                        <td>

                          <strong className="ngo-payment-amount">

                            {formatAmount(
                              payment.amount
                            )}

                          </strong>

                        </td>

                        {/* METHOD */}

                        <td>

                          <div className="ngo-method-badge">

                            <i
                              className={`bi ${getPaymentIcon(
                                payment.paymentMethod
                              )}`}
                            ></i>

                            {getPaymentMethod(
                              payment.paymentMethod
                            )}

                          </div>

                        </td>

                        {/* TRANSACTION */}

                        <td>

                          <span className="ngo-transaction-id">

                            {getTransactionId(
                              payment
                            )}

                          </span>

                        </td>

                        {/* DATE */}

                        <td>

                          <span className="ngo-payment-date">

                            {formatDate(
                              payment.paidAt ||
                                payment.createdAt
                            )}

                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span className="ngo-status-badge">

                            <i className="bi bi-check-circle-fill"></i>

                            Successful

                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </DashboardLayout>
  );
}

export default NGOPayments;