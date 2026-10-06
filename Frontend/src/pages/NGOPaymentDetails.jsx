import { useEffect, useState } from "react";

import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";

import "../styles/NGOPaymentDetails.css";

// ============================================================
// INITIAL STATE
// ============================================================

const INITIAL_FORM = {
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  accountType: "",
  upiId: "",
};

// ============================================================
// STATUS INFORMATION
// ============================================================

const STATUS_INFO = {
  not_submitted: {
    label: "Not Submitted",
    className: "status-not-submitted",
    icon: "bi-info-circle",
    description:
      "Add your payment details so donors can support your NGO financially.",
  },

  pending: {
    label: "Pending Verification",
    className: "status-pending",
    icon: "bi-hourglass-split",
    description:
      "Your payment details have been submitted and are waiting for admin verification.",
  },

  verified: {
    label: "Verified",
    className: "status-verified",
    icon: "bi-patch-check-fill",
    description:
      "Your payment details have been verified and are eligible for donations.",
  },

  rejected: {
    label: "Rejected",
    className: "status-rejected",
    icon: "bi-exclamation-triangle-fill",
    description:
      "Your payment details were rejected. Update the information and submit again.",
  },
};

// ============================================================
// COMPONENT
// ============================================================

function NGOPaymentDetails() {
  const [formData, setFormData] =
    useState(INITIAL_FORM);

  const [verificationStatus, setVerificationStatus] =
    useState("not_submitted");

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [verifiedAt, setVerifiedAt] =
    useState(null);

  const [organizationName, setOrganizationName] =
    useState("");

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
      Authorization: `Bearer ${localStorage.getItem(
        "token"
      )}`,
    },
  });

  // ==========================================================
  // FETCH PAYMENT DETAILS
  // ==========================================================

  useEffect(() => {
    fetchPaymentDetails();
  }, []);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response =
        await API.get(
          "/users/ngo/payment-details",
          getAuthHeaders()
        );

      console.log(
        "NGO PAYMENT DETAILS:",
        response.data
      );

      const details =
        response.data?.paymentDetails || {};

      setOrganizationName(
        response.data?.organizationName ||
          ""
      );

      setFormData({
        accountHolderName:
          details.accountHolderName ||
          "",

        bankName:
          details.bankName || "",

        accountNumber:
          details.accountNumber ||
          "",

        ifscCode:
          details.ifscCode || "",

        accountType:
          details.accountType || "",

        upiId:
          details.upiId || "",
      });

      setVerificationStatus(
        details.verificationStatus ||
          "not_submitted"
      );

      setRejectionReason(
        details.rejectionReason ||
          ""
      );

      setVerifiedAt(
        details.verifiedAt ||
          null
      );

    } catch (err) {
      console.error(
        "Fetch NGO Payment Details Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load payment details."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // HANDLE CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    let nextValue = value;

    if (name === "ifscCode") {
      nextValue =
        value
          .toUpperCase()
          .replace(/\s/g, "");
    }

    if (
      name === "accountNumber"
    ) {
      nextValue =
        value.replace(/\D/g, "");
    }

    setFormData((previous) => ({
      ...previous,
      [name]: nextValue,
    }));

    setMessage("");
    setError("");
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    if (
      !formData.accountHolderName.trim()
    ) {
      setError(
        "Account holder name is required."
      );
      return false;
    }

    if (!formData.bankName.trim()) {
      setError(
        "Bank name is required."
      );
      return false;
    }

    if (
      !/^\d{8,20}$/.test(
        formData.accountNumber
      )
    ) {
      setError(
        "Enter a valid bank account number."
      );
      return false;
    }

    if (
      !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
        formData.ifscCode
      )
    ) {
      setError(
        "Enter a valid IFSC code."
      );
      return false;
    }

    if (
      !["savings", "current"].includes(
        formData.accountType
      )
    ) {
      setError(
        "Select an account type."
      );
      return false;
    }

    if (formData.upiId.trim()) {
      if (
        !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/.test(
          formData.upiId.trim()
        )
      ) {
        setError(
          "Enter a valid UPI ID."
        );
        return false;
      }
    }

    return true;
  };

  // ==========================================================
  // SUBMIT
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

      const response =
        await API.put(
          "/users/ngo/payment-details",
          {
            accountHolderName:
              formData.accountHolderName.trim(),

            bankName:
              formData.bankName.trim(),

            accountNumber:
              formData.accountNumber.trim(),

            ifscCode:
              formData.ifscCode.trim().toUpperCase(),

            accountType:
              formData.accountType,

            upiId:
              formData.upiId.trim(),
          },
          getAuthHeaders()
        );

      console.log(
        "UPDATED NGO PAYMENT DETAILS:",
        response.data
      );

      const details =
        response.data?.paymentDetails;

      if (details) {
        setVerificationStatus(
          details.verificationStatus ||
            "pending"
        );

        setRejectionReason(
          details.rejectionReason ||
            ""
        );

        setVerifiedAt(
          details.verifiedAt ||
            null
        );
      }

      setMessage(
        response.data?.message ||
          "Payment details submitted successfully."
      );

    } catch (err) {
      console.error(
        "Update NGO Payment Details Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update payment details."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // STATUS
  // ==========================================================

  const status =
    STATUS_INFO[
      verificationStatus
    ] ||
    STATUS_INFO.not_submitted;

  // ==========================================================
  // FORMAT VERIFIED DATE
  // ==========================================================

  const formattedVerifiedAt =
    verifiedAt
      ? new Date(
          verifiedAt
        ).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        )
      : "";

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <DashboardLayout>

        <div className="ngo-payment-loading">

          <div className="spinner-border">
          </div>

          <h5>
            Loading payment details...
          </h5>

          <p>
            Please wait while we load
            your payment information.
          </p>

        </div>

      </DashboardLayout>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      <div className="ngo-payment-page">

        <PageHeader
          title="Payment Details"
          subtitle={
            organizationName
              ? `Manage payment information for ${organizationName}.`
              : "Manage the payment information for your NGO."
          }
        />

        {/* ==================================================
            STATUS CARD
        ================================================== */}

        <section
          className={`ngo-payment-status ${status.className}`}
        >

          <div className="ngo-payment-status-icon">
            <i
              className={`bi ${status.icon}`}
            ></i>
          </div>

          <div className="ngo-payment-status-content">

            <div className="ngo-payment-status-label">
              Payment Account
            </div>

            <h4>
              {status.label}
            </h4>

            <p>
              {status.description}
            </p>

            {verificationStatus ===
              "verified" &&
              formattedVerifiedAt && (
                <small>
                  Verified on{" "}
                  {formattedVerifiedAt}
                </small>
              )}

            {verificationStatus ===
              "rejected" &&
              rejectionReason && (
                <div className="ngo-payment-rejection">
                  <strong>
                    Admin response:
                  </strong>

                  <span>
                    {rejectionReason}
                  </span>
                </div>
              )}

          </div>

        </section>

        {/* ==================================================
            SECURITY NOTICE
        ================================================== */}

        <div className="alert alert-info ngo-payment-security">

          <i className="bi bi-shield-lock-fill me-2"></i>

          <strong>
            Your payment information is private.
          </strong>

          <span>
            {" "}
            Bank details are used only for
            payment processing and verification.
            They are not displayed on your public
            NGO profile.
          </span>

        </div>

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {message && (
          <div className="alert alert-success">

            <i className="bi bi-check-circle-fill me-2"></i>

            {message}

          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="alert alert-danger">

            <i className="bi bi-exclamation-triangle-fill me-2"></i>

            {error}

          </div>
        )}

        {/* ==================================================
            PAYMENT FORM
        ================================================== */}

        <form
          className="ngo-payment-form"
          onSubmit={handleSubmit}
        >

          {/* ==================================================
              BANK ACCOUNT
          ================================================== */}

          <section className="ngo-payment-section">

            <div className="ngo-payment-section-heading">

              <div className="ngo-payment-section-icon">
                <i className="bi bi-bank2"></i>
              </div>

              <div>
                <h4>
                  Bank Account
                </h4>

                <p>
                  Add the bank account where
                  your organization's payments
                  will be directed.
                </p>
              </div>

            </div>

            <div className="row">

              {/* ACCOUNT HOLDER */}

              <div className="col-md-6 mb-4">

                <label className="form-label">
                  Account Holder Name
                  <span className="text-danger">
                    {" "}*
                  </span>
                </label>

                <input
                  type="text"
                  name="accountHolderName"
                  className="form-control"
                  placeholder="Name as registered with the bank"
                  value={
                    formData.accountHolderName
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* BANK NAME */}

              <div className="col-md-6 mb-4">

                <label className="form-label">
                  Bank Name
                  <span className="text-danger">
                    {" "}*
                  </span>
                </label>

                <input
                  type="text"
                  name="bankName"
                  className="form-control"
                  placeholder="e.g. State Bank of India"
                  value={
                    formData.bankName
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* ACCOUNT NUMBER */}

              <div className="col-md-6 mb-4">

                <label className="form-label">
                  Account Number
                  <span className="text-danger">
                    {" "}*
                  </span>
                </label>

                <input
                  type="password"
                  name="accountNumber"
                  className="form-control"
                  placeholder="Enter bank account number"
                  inputMode="numeric"
                  value={
                    formData.accountNumber
                  }
                  onChange={
                    handleChange
                  }
                />

                <small className="text-muted">
                  Your account number is kept
                  private.
                </small>

              </div>

              {/* IFSC */}

              <div className="col-md-6 mb-4">

                <label className="form-label">
                  IFSC Code
                  <span className="text-danger">
                    {" "}*
                  </span>
                </label>

                <input
                  type="text"
                  name="ifscCode"
                  className="form-control"
                  placeholder="e.g. SBIN0001234"
                  maxLength={11}
                  value={
                    formData.ifscCode
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* ACCOUNT TYPE */}

              <div className="col-md-6 mb-4">

                <label className="form-label">
                  Account Type
                  <span className="text-danger">
                    {" "}*
                  </span>
                </label>

                <select
                  name="accountType"
                  className="form-select"
                  value={
                    formData.accountType
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="">
                    Select account type
                  </option>

                  <option value="savings">
                    Savings
                  </option>

                  <option value="current">
                    Current
                  </option>

                </select>

              </div>

            </div>

          </section>

          {/* ==================================================
              UPI
          ================================================== */}

          <section className="ngo-payment-section">

            <div className="ngo-payment-section-heading">

              <div className="ngo-payment-section-icon">
                <i className="bi bi-phone"></i>
              </div>

              <div>
                <h4>
                  UPI
                </h4>

                <p>
                  Add an optional UPI ID for
                  your organization.
                </p>
              </div>

            </div>

            <div className="row">

              <div className="col-md-6">

                <label className="form-label">
                  UPI ID
                  <span className="text-muted">
                    {" "}(Optional)
                  </span>
                </label>

                <input
                  type="text"
                  name="upiId"
                  className="form-control"
                  placeholder="e.g. ngo@upi"
                  value={
                    formData.upiId
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </div>

          </section>

          {/* ==================================================
              VERIFICATION NOTICE
          ================================================== */}

          <section className="ngo-payment-review-notice">

            <div className="ngo-payment-review-icon">
              <i className="bi bi-person-check-fill"></i>
            </div>

            <div>

              <h5>
                Admin Verification
              </h5>

              <p>
                After you submit or change your
                payment information, an administrator
                will review the details before your
                NGO can receive online payments.
              </p>

            </div>

          </section>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="ngo-payment-actions">

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={saving}
            >

              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-2"></i>
                  Submit Payment Details
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </DashboardLayout>
  );
}

export default NGOPaymentDetails;