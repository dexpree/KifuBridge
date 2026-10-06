import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";

import "../styles/MakePayment.css";

function MakePayment() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ============================================================
  // STATE
  // ============================================================

  const [ngo, setNgo] = useState(null);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [payment, setPayment] = useState(null);

  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "upi",

    // ----------------------------------------------------------
    // DEMO UPI
    // ----------------------------------------------------------
    donorUpiId: "",

    // ----------------------------------------------------------
    // DEMO BANK TRANSFER
    // ----------------------------------------------------------
    donorAccountNumber: "",
    donorIfscCode: "",

    // ----------------------------------------------------------
    // DEMO CARD
    // ----------------------------------------------------------
    cardNumber: "",
    cardHolderName: "",
    cardExpiry: "",
    cardCvv: "",
  });

  // ============================================================
  // FETCH NGO
  // ============================================================

  useEffect(() => {
    fetchNGO();
  }, [id]);

  const fetchNGO = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setNgo(null);
      setPayment(null);

      const token = localStorage.getItem("token");

      // ========================================================
      // NGO ID CHECK
      // ========================================================

      if (!id) {
        setError("NGO information is missing.");
        return;
      }

      // ========================================================
      // TOKEN CHECK
      // ========================================================

      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      // ========================================================
      // GET PUBLIC NGO
      // ========================================================

      const response = await API.get(
        `/users/public-ngos/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "PAYMENT NGO RESPONSE:",
        response.data
      );

      // ========================================================
      // GET NGO OBJECT
      // ========================================================

      const selectedNGO =
        response.data?.ngo ||
        response.data ||
        null;

      if (!selectedNGO) {
        setError("NGO could not be found.");
        return;
      }

      // ========================================================
      // PAYMENT DETAILS
      // ========================================================

      const paymentDetails =
        selectedNGO.paymentDetails || {};

      console.log(
        "NGO PAYMENT DETAILS:",
        paymentDetails
      );

      // ========================================================
      // VERIFICATION CHECK
      // ========================================================

      const verificationStatus =
        paymentDetails.verificationStatus;

      console.log(
        "PAYMENT VERIFICATION STATUS:",
        verificationStatus
      );

      if (
        verificationStatus !==
        "verified"
      ) {
        setError(
          "This NGO is not currently verified for receiving payments."
        );
        return;
      }

      // ========================================================
      // NGO IS VERIFIED
      // ========================================================

      setNgo(selectedNGO);
    } catch (err) {
      console.error(
        "FETCH PAYMENT NGO ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load NGO payment details."
      );

      setNgo(null);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    let newValue = value;

    // ==========================================================
    // CARD NUMBER
    // ==========================================================

    if (name === "cardNumber") {
      const digits = value
        .replace(/\D/g, "")
        .slice(0, 16);

      newValue = digits
        .replace(/(.{4})/g, "$1 ")
        .trim();
    }

    // ==========================================================
    // CARD EXPIRY
    // ==========================================================

    if (name === "cardExpiry") {
      const digits = value
        .replace(/\D/g, "")
        .slice(0, 4);

      if (digits.length >= 3) {
        newValue =
          digits.slice(0, 2) +
          "/" +
          digits.slice(2);
      } else {
        newValue = digits;
      }
    }

    // ==========================================================
    // CARD CVV
    // ==========================================================

    if (name === "cardCvv") {
      newValue = value
        .replace(/\D/g, "")
        .slice(0, 4);
    }

    // ==========================================================
    // BANK ACCOUNT NUMBER
    // ==========================================================

    if (
      name ===
      "donorAccountNumber"
    ) {
      newValue = value
        .replace(/\D/g, "")
        .slice(0, 18);
    }

    // ==========================================================
    // IFSC CODE
    // ==========================================================

    if (
      name ===
      "donorIfscCode"
    ) {
      newValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 11);
    }

    // ==========================================================
    // UPDATE
    // ==========================================================

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setError("");
    setSuccess("");
  };

  // ============================================================
  // SELECT PAYMENT METHOD
  // ============================================================

  const selectPaymentMethod = (
    method
  ) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
    }));

    setError("");
    setSuccess("");
  };

  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  const formatAmount = (
    amount
  ) => {
    return Number(
      amount || 0
    ).toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    );
  };

  // ============================================================
  // GET USER INFORMATION
  // ============================================================

  const getStoredUserInfo = () => {
    let user = null;

    try {
      const storedUser =
        localStorage.getItem(
          "user"
        );

      if (storedUser) {
        user =
          JSON.parse(
            storedUser
          );
      }
    } catch (error) {
      console.error(
        "USER PARSE ERROR:",
        error
      );
    }

    return {
      name:
        user?.name ||
        localStorage.getItem(
          "userName"
        ) ||
        "",

      email:
        user?.email ||
        localStorage.getItem(
          "userEmail"
        ) ||
        "",

      phone:
        user?.phone ||
        localStorage.getItem(
          "userPhone"
        ) ||
        "",
    };
  };

  // ============================================================
  // VALIDATE PAYMENT DETAILS
  // ============================================================

  const validatePaymentDetails = () => {
    // ==========================================================
    // UPI
    // ==========================================================

    if (
      formData.paymentMethod ===
      "upi"
    ) {
      const upi =
        formData.donorUpiId.trim();

      if (!upi) {
        return "Please enter your UPI ID.";
      }

      if (
        !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/.test(
          upi
        )
      ) {
        return (
          "Please enter a valid UPI ID. Example: name@upi"
        );
      }
    }

    // ==========================================================
    // BANK TRANSFER
    // ==========================================================

    if (
      formData.paymentMethod ===
      "bank_transfer"
    ) {
      const account =
        formData.donorAccountNumber.trim();

      const ifsc =
        formData.donorIfscCode
          .trim()
          .toUpperCase();

      if (!account) {
        return "Please enter your account number.";
      }

      if (
        account.length < 8
      ) {
        return "Please enter a valid account number.";
      }

      if (!ifsc) {
        return "Please enter your IFSC code.";
      }

      if (
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
          ifsc
        )
      ) {
        return "Please enter a valid IFSC code.";
      }
    }

    // ==========================================================
    // CARD
    // ==========================================================

    if (
      formData.paymentMethod ===
      "card"
    ) {
      const cardNumber =
        formData.cardNumber.replace(
          /\s/g,
          ""
        );

      const cardHolder =
        formData.cardHolderName.trim();

      const expiry =
        formData.cardExpiry.trim();

      const cvv =
        formData.cardCvv.trim();

      if (!cardNumber) {
        return "Please enter your card number.";
      }

      if (
        !/^\d{16}$/.test(
          cardNumber
        )
      ) {
        return "Please enter a valid 16-digit card number.";
      }

      if (!cardHolder) {
        return "Please enter the card holder name.";
      }

      if (!expiry) {
        return "Please enter the card expiry date.";
      }

      if (
        !/^\d{2}\/\d{2}$/.test(
          expiry
        )
      ) {
        return "Expiry must be in MM/YY format.";
      }

      if (!cvv) {
        return "Please enter the CVV.";
      }

      if (
        !/^\d{3,4}$/.test(
          cvv
        )
      ) {
        return "Please enter a valid CVV.";
      }
    }

    return null;
  };

  // ============================================================
  // CREATE DOWNLOADABLE RECEIPT
  // ============================================================

  const downloadReceipt = () => {
    if (
      !payment ||
      !ngo
    ) {
      return;
    }

    const organizationName =
      ngo.organizationName ||
      ngo.name ||
      "NGO";

    const userInfo =
      getStoredUserInfo();

    const paymentDate =
      payment.paidAt
        ? new Date(
            payment.paidAt
          ).toLocaleString(
            "en-IN"
          )
        : new Date().toLocaleString(
            "en-IN"
          );

    const paymentMethod =
      payment.paymentMethod
        ?.replace(
          "_",
          " "
        )
        .toUpperCase() ||
      "PAYMENT";

    const amount =
      formatAmount(
        payment.amount
      );

    const transactionId =
      payment.transactionId ||
      payment._id ||
      "N/A";

    const receiptNumber =
      payment.receiptNumber ||
      payment._id ||
      transactionId;

    // ========================================================
    // RECEIPT HTML
    // ========================================================

    const receiptHTML = `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8" />

<title>
Donation Receipt - ${organizationName}
</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 40px;

  background: #f5f5f5;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  color: #222;
}

.receipt {

  width: 800px;

  max-width: 100%;

  margin: 0 auto;

  background: #ffffff;

  border: 1px solid #ddd;

  padding: 40px;

}

.header {

  text-align: center;

  border-bottom:
    2px solid #222;

  padding-bottom: 25px;

  margin-bottom: 30px;

}

.header h1 {

  margin:
    0 0 8px;

  font-size: 28px;

}

.header h2 {

  margin: 0;

  font-size: 20px;

  color: #444;

}

.header p {

  margin:
    8px 0 0;

  color: #777;

}

.status {

  display: inline-block;

  margin-top: 15px;

  padding:
    8px 18px;

  border-radius: 20px;

  background: #e7f8ed;

  color: #198754;

  font-weight: bold;

}

.section {

  margin-bottom: 30px;

}

.section-title {

  font-size: 16px;

  font-weight: bold;

  border-bottom:
    1px solid #ddd;

  padding-bottom: 10px;

  margin-bottom: 15px;

}

.row {

  display: flex;

  justify-content:
    space-between;

  gap: 30px;

  padding:
    10px 0;

  border-bottom:
    1px solid #eee;

}

.row span {

  color: #666;

}

.row strong {

  text-align: right;

}

.amount {

  font-size: 26px;

  color: #111;

}

.footer {

  margin-top: 40px;

  padding-top: 20px;

  border-top:
    1px solid #ddd;

  text-align: center;

  color: #777;

  font-size: 13px;

}

.thank-you {

  margin-top: 25px;

  text-align: center;

  font-size: 16px;

  font-weight: bold;

}

</style>

</head>

<body>

<div class="receipt">

  <div class="header">

    <h1>
      DONATION RECEIPT
    </h1>

    <h2>
      ${organizationName}
    </h2>

    <p>
      Verified NGO Donation
    </p>

    <div class="status">
      PAYMENT SUCCESSFUL
    </div>

  </div>

  <div class="section">

    <div class="section-title">
      Donation Information
    </div>

    <div class="row">

      <span>
        Donor
      </span>

      <strong>
        ${userInfo.name || "Donor"}
      </strong>

    </div>

    <div class="row">

      <span>
        Email
      </span>

      <strong>
        ${userInfo.email || "N/A"}
      </strong>

    </div>

    <div class="row">

      <span>
        NGO
      </span>

      <strong>
        ${organizationName}
      </strong>

    </div>

    <div class="row">

      <span>
        Amount
      </span>

      <strong class="amount">
        ${amount}
      </strong>

    </div>

    <div class="row">

      <span>
        Payment Method
      </span>

      <strong>
        ${paymentMethod}
      </strong>

    </div>

  </div>

  <div class="section">

    <div class="section-title">
      Payment Information
    </div>

    <div class="row">

      <span>
        Transaction ID
      </span>

      <strong>
        ${transactionId}
      </strong>

    </div>

    <div class="row">

      <span>
        Receipt Number
      </span>

      <strong>
        ${receiptNumber}
      </strong>

    </div>

    <div class="row">

      <span>
        Payment Date
      </span>

      <strong>
        ${paymentDate}
      </strong>

    </div>

    <div class="row">

      <span>
        Status
      </span>

      <strong>
        PAID
      </strong>

    </div>

  </div>

  <div class="thank-you">

    Thank you for supporting
    ${organizationName}.

  </div>

  <div class="footer">

    This receipt confirms that the
    payment was successfully recorded.

    <br />
    <br />

    Generated electronically by the
    Donation Management System.

  </div>

</div>

</body>

</html>
`;

    // ========================================================
    // DOWNLOAD
    // ========================================================

    const blob =
      new Blob(
        [receiptHTML],
        {
          type: "text/html",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `Donation-Receipt-${organizationName
        .replace(
          /[^a-z0-9]/gi,
          "-"
        )
        .toLowerCase()}-${receiptNumber}.html`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );
  };

  // ============================================================
  // SUBMIT PAYMENT
  // ============================================================

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ==========================================================
    // AMOUNT VALIDATION
    // ==========================================================

    const amount =
      Number(
        formData.amount
      );

    if (
      !amount ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid donation amount."
      );
      return;
    }

    if (
      amount < 1
    ) {
      setError(
        "Donation amount must be at least ₹1."
      );
      return;
    }

    // ==========================================================
    // NGO CHECK
    // ==========================================================

    if (!ngo?._id) {
      setError(
        "NGO information is unavailable."
      );
      return;
    }

    // ==========================================================
    // SECURITY CHECK
    // ==========================================================

    if (
      ngo?.paymentDetails
        ?.verificationStatus !==
      "verified"
    ) {
      setError(
        "This NGO is not currently verified for receiving payments."
      );
      return;
    }

    // ==========================================================
    // PAYMENT DETAIL VALIDATION
    // ==========================================================

    const validationError =
      validatePaymentDetails();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    try {
      setSubmitting(true);

      // ========================================================
      // TOKEN
      // ========================================================

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );

        setSubmitting(false);

        return;
      }

      // ========================================================
      // PAYMENT REFERENCE
      //
      // IMPORTANT:
      // We don't send/store CVV.
      // This is a demo payment system.
      // ========================================================

      let paymentReference =
        "DEMO_PAYMENT";

      if (
        formData.paymentMethod ===
        "upi"
      ) {
        paymentReference =
          formData.donorUpiId.trim();
      }

      if (
        formData.paymentMethod ===
        "bank_transfer"
      ) {
        paymentReference =
          `BANK-${formData.donorAccountNumber
            .slice(-4)}`;
      }

      if (
        formData.paymentMethod ===
        "card"
      ) {
        paymentReference =
          `CARD-${formData.cardNumber
            .replace(/\s/g, "")
            .slice(-4)}`;
      }

      console.log(
        "===================================="
      );

      console.log(
        "CREATING DEMO PAYMENT"
      );

      console.log(
        "DONOR:",
        getStoredUserInfo()
      );

      console.log(
        "NGO:",
        ngo._id
      );

      console.log(
        "AMOUNT:",
        amount
      );

      console.log(
        "METHOD:",
        formData.paymentMethod
      );

      console.log(
        "PAYMENT REFERENCE:",
        paymentReference
      );

      console.log(
        "===================================="
      );

      // ========================================================
      // CREATE NORMAL PAYMENT
      //
      // NO RAZORPAY
      // ========================================================

      const response =
        await API.post(
          "/payments",
          {
            ngoId:
              ngo._id,

            amount,

            paymentMethod:
              formData.paymentMethod,

            paymentReference,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "DEMO PAYMENT RESPONSE:",
        response.data
      );

      // ========================================================
      // GET PAYMENT
      // ========================================================

      const savedPayment =
        response.data?.payment ||
        response.data;

      if (
        !savedPayment
      ) {
        throw new Error(
          "Payment was processed but no payment record was returned."
        );
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      setPayment(
        savedPayment
      );

      setSuccess(
        "Payment completed successfully."
      );

      // ========================================================
      // RESET FORM
      // ========================================================

      setFormData({
        amount: "",
        paymentMethod: "upi",

        donorUpiId: "",

        donorAccountNumber: "",
        donorIfscCode: "",

        cardNumber: "",
        cardHolderName: "",
        cardExpiry: "",
        cardCvv: "",
      });
    } catch (err) {
      console.error(
        "CREATE DEMO PAYMENT ERROR:",
        err
      );

      setError(
        err.response?.data
          ?.message ||
          err.message ||
          "Unable to complete payment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <DashboardLayout>

        <div className="make-payment-page">

          <div className="payment-state">

            <div className="spinner-border">
            </div>

            <h5>
              Loading payment details...
            </h5>

            <p>
              Preparing the secure donation page.
            </p>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  // ============================================================
  // ERROR / NGO NOT FOUND
  // ============================================================

  if (
    error &&
    !ngo &&
    !payment
  ) {
    return (
      <DashboardLayout>

        <div className="make-payment-page">

          <PageHeader
            title="Make a Payment"
            subtitle="Support a verified NGO directly."
          />

          <div className="payment-state payment-error">

            <div className="payment-state-icon">

              <i className="bi bi-shield-exclamation">
              </i>

            </div>

            <h5>
              Payment Unavailable
            </h5>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() =>
                navigate(-1)
              }
            >

              <i className="bi bi-arrow-left me-1">
              </i>

              Go Back

            </button>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  // ============================================================
  // NGO INFORMATION
  // ============================================================

  const organizationName =
    ngo?.organizationName ||
    ngo?.name ||
    "NGO";

  const ngoEmail =
    ngo?.email ||
    "Not available";

  const ngoPhone =
    ngo?.phone ||
    "Not available";

  const location = [
    ngo?.city,
    ngo?.state,
  ]
    .filter(Boolean)
    .join(", ");

  // ============================================================
  // PAYMENT DETAILS
  // ============================================================

  const paymentDetails =
    ngo?.paymentDetails ||
    {};

  const upiId =
    paymentDetails.upiId ||
    "";

  const accountHolderName =
    paymentDetails.accountHolderName ||
    "";

  const accountNumber =
    paymentDetails.accountNumber ||
    "";

  const ifscCode =
    paymentDetails.ifscCode ||
    "";

  const bankName =
    paymentDetails.bankName ||
    "";

  const accountType =
    paymentDetails.accountType ||
    "";

  // ============================================================
  // SUCCESS SCREEN
  // ============================================================

  if (payment) {
    return (
      <DashboardLayout>

        <div className="make-payment-page">

          <PageHeader
            title="Payment Successful"
            subtitle="Thank you for supporting this NGO."
          />

          <div className="payment-success-card">

            <div className="payment-success-icon">

              <i className="bi bi-check-lg">
              </i>

            </div>

            <h2>
              Payment Successful
            </h2>

            <p className="payment-success-message">

              Your contribution has been
              successfully recorded for{" "}

              <strong>
                {organizationName}
              </strong>.

            </p>

            {/* ==================================================
                RECEIPT
            ================================================== */}

            <div className="payment-receipt">

              <div className="receipt-row">

                <span>
                  NGO
                </span>

                <strong>
                  {organizationName}
                </strong>

              </div>

              <div className="receipt-row">

                <span>
                  Amount
                </span>

                <strong>
                  {formatAmount(
                    payment.amount
                  )}
                </strong>

              </div>

              <div className="receipt-row">

                <span>
                  Payment Method
                </span>

                <strong>

                  {payment.paymentMethod
                    ?.replace(
                      "_",
                      " "
                    )
                    .toUpperCase()}

                </strong>

              </div>

              <div className="receipt-row">

                <span>
                  Transaction ID
                </span>

                <strong>

                  {payment.transactionId ||
                    payment._id ||
                    "N/A"}

                </strong>

              </div>

              <div className="receipt-row">

                <span>
                  Status
                </span>

                <strong className="text-success">

                  {payment.status
                    ?.toUpperCase() ||
                    "SUCCESSFUL"}

                </strong>

              </div>

              <div className="receipt-row">

                <span>
                  Payment Time
                </span>

                <strong>

                  {payment.paidAt
                    ? new Date(
                        payment.paidAt
                      ).toLocaleString(
                        "en-IN"
                      )
                    : new Date().toLocaleString(
                        "en-IN"
                      )}

                </strong>

              </div>

            </div>

            {/* ==================================================
                SUCCESS ACTIONS
            ================================================== */}

            <div className="payment-success-actions">

              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  downloadReceipt
                }
              >

                <i className="bi bi-download me-2">
                </i>

                Download Receipt

              </button>
  
            <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  navigate(
                    "/donor"
                  )
                }
              >

                Back to Dashboard

              </button>

            </div>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  // ============================================================
  // MAIN PAYMENT PAGE
  // ============================================================

  return (
    <DashboardLayout>

      <div className="make-payment-page">

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <PageHeader
          title="Make a Payment"
          subtitle="Support a verified NGO directly with a financial contribution."
        />

        {/* ======================================================
            NGO HEADER
        ====================================================== */}

        <div className="payment-ngo-card">

          <div className="payment-ngo-icon">

            <i className="bi bi-building-heart">
            </i>

          </div>

          <div className="payment-ngo-info">

            <div className="payment-verified">

              <i className="bi bi-patch-check-fill">
              </i>

              Verified NGO

            </div>

            <h2>
              {organizationName}
            </h2>

            {location && (
              <p>

                <i className="bi bi-geo-alt me-1">
                </i>

                {location}

              </p>
            )}

          </div>

        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (

          <div className="payment-alert payment-alert-error">

            <i className="bi bi-exclamation-circle-fill">
            </i>

            <span>
              {error}
            </span>

          </div>

        )}

        {/* ======================================================
            SUCCESS
        ====================================================== */}

        {success && (

          <div className="payment-alert payment-alert-success">

            <i className="bi bi-check-circle-fill">
            </i>

            <span>
              {success}
            </span>

          </div>

        )}

        {/* ======================================================
            PAYMENT LAYOUT
        ====================================================== */}

        <div className="payment-layout">

          {/* ====================================================
              LEFT — NGO PAYMENT DETAILS
          ==================================================== */}

          <div className="payment-details-card">

            <div className="payment-card-heading">

              <div>

                <span className="payment-card-kicker">
                  PAYMENT DESTINATION
                </span>

                <h3>
                  NGO Payment Details
                </h3>

              </div>

              <div className="payment-secure-icon">

                <i className="bi bi-shield-check">
                </i>

              </div>

            </div>

            <p className="payment-helper">

              Use the verified NGO information
              below to understand where your
              contribution is being directed.

            </p>

            {/* ==================================================
                NGO UPI
            ================================================== */}

            {upiId && (

              <div className="payment-method-box">

                <div className="payment-method-icon upi">

                  <i className="bi bi-phone">
                  </i>

                </div>

                <div className="payment-method-content">

                  <span>
                    UPI ID
                  </span>

                  <strong>
                    {upiId}
                  </strong>

                </div>

                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(
                        upiId
                      )
                      .then(() => {
                        setSuccess(
                          "NGO UPI ID copied."
                        );

                        setTimeout(
                          () =>
                            setSuccess(
                              ""
                            ),
                          2000
                        );
                      });
                  }}
                  title="Copy UPI ID"
                >

                  <i className="bi bi-copy">
                  </i>

                </button>

              </div>

            )}

            {/* ==================================================
                NGO BANK DETAILS
            ================================================== */}

            {(accountHolderName ||
              accountNumber ||
              ifscCode ||
              bankName ||
              accountType) && (

              <div className="bank-details">

                <div className="bank-heading">

                  <i className="bi bi-bank">
                  </i>

                  Bank Account

                </div>

                {bankName && (

                  <div className="bank-row">

                    <span>
                      Bank Name
                    </span>

                    <strong>
                      {bankName}
                    </strong>

                  </div>

                )}

                {accountHolderName && (

                  <div className="bank-row">

                    <span>
                      Account Holder
                    </span>

                    <strong>
                      {accountHolderName}
                    </strong>

                  </div>

                )}

                {accountNumber && (

                  <div className="bank-row">

                    <span>
                      Account Number
                    </span>

                    <strong>
                      {accountNumber}
                    </strong>

                  </div>

                )}

                {ifscCode && (

                  <div className="bank-row">

                    <span>
                      IFSC Code
                    </span>

                    <strong>
                      {ifscCode}
                    </strong>

                  </div>

                )}

                {accountType && (

                  <div className="bank-row">

                    <span>
                      Account Type
                    </span>

                    <strong>
                      {accountType}
                    </strong>

                  </div>

                )}

              </div>

            )}

            {/* ==================================================
                NO PAYMENT DETAILS
            ================================================== */}

            {!upiId &&
              !accountHolderName &&
              !accountNumber &&
              !ifscCode &&
              !bankName &&
              !accountType && (

                <div className="payment-no-details">

                  <i className="bi bi-info-circle">
                  </i>

                  <p>

                    No payment details are
                    currently available for
                    this NGO.

                  </p>

                </div>

              )}

            {/* ==================================================
                SECURITY NOTE
            ================================================== */}

            <div className="payment-security-note">

              <i className="bi bi-shield-check">
              </i>

              <span>

                This is a demo payment system.
                Payments are recorded securely
                in the Donation Management System.

              </span>

            </div>

            {/* ==================================================
                NGO CONTACT
            ================================================== */}

            <div className="ngo-contact">

              <h5>
                NGO Contact
              </h5>

              <div>

                <i className="bi bi-envelope">
                </i>

                {ngoEmail}

              </div>

              <div>

                <i className="bi bi-telephone">
                </i>

                {ngoPhone}

              </div>

            </div>

          </div>

          {/* ====================================================
              RIGHT — PAYMENT FORM
          ==================================================== */}

          <div className="payment-form-card">

            <div className="payment-card-heading">

              <div>

                <span className="payment-card-kicker">
                  DONATION
                </span>

                <h3>
                  Contribution Details
                </h3>

              </div>

              <i className="bi bi-cash-stack payment-heading-icon">
              </i>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* ==================================================
                  AMOUNT
              ================================================== */}

              <div className="payment-field">

                <label>
                  Donation Amount
                </label>

                <div className="amount-input">

                  <span>
                    ₹
                  </span>

                  <input
                    type="number"
                    name="amount"
                    min="1"
                    step="0.01"
                    placeholder="Enter amount"
                    value={
                      formData.amount
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

              {/* ==================================================
                  QUICK AMOUNTS
              ================================================== */}

              <div className="quick-amounts">

                {[500, 1000, 2500, 5000].map(
                  (amount) => (

                    <button
                      key={amount}
                      type="button"
                      className={
                        Number(
                          formData.amount
                        ) === amount
                          ? "active"
                          : ""
                      }
                      onClick={() => {

                        setFormData(
                          (prev) => ({
                            ...prev,
                            amount:
                              amount.toString(),
                          })
                        );

                        setError("");
                        setSuccess("");

                      }}
                    >

                      ₹
                      {amount.toLocaleString(
                        "en-IN"
                      )}

                    </button>

                  )
                )}

              </div>

              {/* ==================================================
                  PAYMENT METHOD
              ================================================== */}

              <div className="payment-field">

                <label>
                  Payment Method
                </label>

                <div className="payment-method-grid">

                  {/* ============================================
                      UPI
                  ============================================ */}

                  <button
                    type="button"
                    className={`payment-method-select ${
                      formData.paymentMethod ===
                      "upi"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      selectPaymentMethod(
                        "upi"
                      )
                    }
                  >

                    <i className="bi bi-phone">
                    </i>

                    <span>
                      UPI
                    </span>

                  </button>

                  {/* ============================================
                      BANK TRANSFER
                  ============================================ */}

                  <button
                    type="button"
                    className={`payment-method-select ${
                      formData.paymentMethod ===
                      "bank_transfer"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      selectPaymentMethod(
                        "bank_transfer"
                      )
                    }
                  >

                    <i className="bi bi-bank">
                    </i>

                    <span>
                      Bank Transfer
                    </span>

                  </button>

                  {/* ============================================
                      CARD
                  ============================================ */}

                  <button
                    type="button"
                    className={`payment-method-select ${
                      formData.paymentMethod ===
                      "card"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      selectPaymentMethod(
                        "card"
                      )
                    }
                  >

                    <i className="bi bi-credit-card">
                    </i>

                    <span>
                      Card
                    </span>

                  </button>

                </div>

              </div>

              {/* ==================================================
                  DEMO PAYMENT DETAILS
              ================================================== */}

              <div className="demo-payment-details">

                {/* =================================================
                    UPI
                ================================================= */}

                {formData.paymentMethod ===
                  "upi" && (

                  <div className="demo-payment-box">

                    <div className="demo-payment-box-header">

                      <div className="demo-payment-box-icon">

                        <i className="bi bi-phone">
                        </i>

                      </div>

                      <div>

                        <h5>
                          UPI Payment
                        </h5>

                        <p>
                          Enter your UPI ID to continue.
                        </p>

                      </div>

                    </div>

                    <div className="payment-field">

                      <label htmlFor="donorUpiId">
                        Your UPI ID
                      </label>

                      <div className="input-with-icon">

                        <i className="bi bi-at">
                        </i>

                        <input
                          id="donorUpiId"
                          type="text"
                          name="donorUpiId"
                          placeholder="example@upi"
                          value={
                            formData.donorUpiId
                          }
                          onChange={
                            handleChange
                          }
                          autoComplete="off"
                        />

                      </div>

                      <small>
                        Demo payment only.
                        Do not enter your real
                        UPI credentials.
                      </small>

                    </div>

                  </div>

                )}

                {/* =================================================
                    BANK TRANSFER
                ================================================= */}

                {formData.paymentMethod ===
                  "bank_transfer" && (

                  <div className="demo-payment-box">

                    <div className="demo-payment-box-header">

                      <div className="demo-payment-box-icon">

                        <i className="bi bi-bank">
                        </i>

                      </div>

                      <div>

                        <h5>
                          Bank Transfer
                        </h5>

                        <p>
                          Enter your bank details
                          to continue.
                        </p>

                      </div>

                    </div>

                    <div className="payment-field">

                      <label htmlFor="donorAccountNumber">
                        Your Account Number
                      </label>

                      <div className="input-with-icon">

                        <i className="bi bi-credit-card-2-front">
                        </i>

                        <input
                          id="donorAccountNumber"
                          type="text"
                          name="donorAccountNumber"
                          placeholder="Enter account number"
                          value={
                            formData.donorAccountNumber
                          }
                          onChange={
                            handleChange
                          }
                          inputMode="numeric"
                          autoComplete="off"
                        />

                      </div>

                    </div>

                    <div className="payment-field">

                      <label htmlFor="donorIfscCode">
                        Your IFSC Code
                      </label>

                      <div className="input-with-icon">

                        <i className="bi bi-building">
                        </i>

                        <input
                          id="donorIfscCode"
                          type="text"
                          name="donorIfscCode"
                          placeholder="Example: SBIN0001234"
                          value={
                            formData.donorIfscCode
                          }
                          onChange={
                            handleChange
                          }
                          maxLength={11}
                          autoComplete="off"
                        />

                      </div>

                    </div>

                    <small>
                      Demo payment only.
                      Do not enter your real
                      banking credentials.
                    </small>

                  </div>

                )}

                {/* =================================================
                    CARD
                ================================================= */}

                {formData.paymentMethod ===
                  "card" && (

                  <div className="demo-payment-box">

                    <div className="demo-payment-box-header">

                      <div className="demo-payment-box-icon">

                        <i className="bi bi-credit-card">
                        </i>

                      </div>

                      <div>

                        <h5>
                          Card Payment
                        </h5>

                        <p>
                          Enter demo card details
                          to continue.
                        </p>

                      </div>

                    </div>

                    <div className="payment-field">

                      <label htmlFor="cardNumber">
                        Card Number
                      </label>

                      <div className="input-with-icon">

                        <i className="bi bi-credit-card">
                        </i>

                        <input
                          id="cardNumber"
                          type="text"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={
                            formData.cardNumber
                          }
                          onChange={
                            handleChange
                          }
                          inputMode="numeric"
                          autoComplete="off"
                        />

                      </div>

                    </div>

                    <div className="payment-field">

                      <label htmlFor="cardHolderName">
                        Card Holder Name
                      </label>

                      <div className="input-with-icon">

                        <i className="bi bi-person">
                        </i>

                        <input
                          id="cardHolderName"
                          type="text"
                          name="cardHolderName"
                          placeholder="Enter card holder name"
                          value={
                            formData.cardHolderName
                          }
                          onChange={
                            handleChange
                          }
                          autoComplete="off"
                        />

                      </div>

                    </div>

                    <div className="card-small-fields">

                      <div className="payment-field">

                        <label htmlFor="cardExpiry">
                          Expiry
                        </label>

                        <input
                          id="cardExpiry"
                          type="text"
                          name="cardExpiry"
                          placeholder="MM/YY"
                          value={
                            formData.cardExpiry
                          }
                          onChange={
                            handleChange
                          }
                          maxLength={5}
                          inputMode="numeric"
                          autoComplete="off"
                        />

                      </div>

                      <div className="payment-field">

                        <label htmlFor="cardCvv">
                          CVV
                        </label>

                        <input
                          id="cardCvv"
                          type="password"
                          name="cardCvv"
                          placeholder="CVV"
                          value={
                            formData.cardCvv
                          }
                          onChange={
                            handleChange
                          }
                          maxLength={4}
                          inputMode="numeric"
                          autoComplete="off"
                        />

                      </div>

                    </div>

                    <small>
                      Demo payment only.
                      Do not enter your real
                      card details.
                    </small>

                  </div>

                )}

              </div>

              {/* ==================================================
                  PAYMENT SUMMARY
              ================================================== */}

              <div className="payment-summary">

                <div className="summary-heading">

                  <i className="bi bi-receipt">
                  </i>

                  Payment Summary

                </div>

                <div className="summary-row">

                  <span>
                    NGO
                  </span>

                  <strong>
                    {organizationName}
                  </strong>

                </div>

                <div className="summary-row">

                  <span>
                    Amount
                  </span>

                  <strong>

                    {formData.amount
                      ? formatAmount(
                          formData.amount
                        )
                      : "₹0.00"}

                  </strong>

                </div>

                <div className="summary-row">

                  <span>
                    Method
                  </span>

                  <strong>

                    {formData.paymentMethod ===
                    "bank_transfer"
                      ? "BANK TRANSFER"
                      : formData.paymentMethod
                          ?.replace(
                            "_",
                            " "
                          )
                          .toUpperCase()}

                  </strong>

                </div>

              </div>

              {/* ==================================================
                  DEMO INFORMATION
              ================================================== */}

              <div className="payment-security-note">

                <i className="bi bi-info-circle">
                </i>

                <span>

                  This is a demonstration payment.
                  Your payment will be recorded in
                  the Donation Management System.

                </span>

              </div>

              {/* ==================================================
                  SUBMIT
              ================================================== */}

              <button
                type="submit"
                className="payment-submit"
                disabled={
                  submitting
                }
              >

                {submitting ? (

                  <>

                    <span className="spinner-border spinner-border-sm me-2">
                    </span>

                    Processing Payment...

                  </>

                ) : (

                  <>

                    <i className="bi bi-check-circle me-2">
                    </i>

                    Pay{" "}

                    {formData.amount
                      ? formatAmount(
                          formData.amount
                        )
                      : ""}

                    <i className="bi bi-arrow-right ms-2">
                    </i>

                  </>

                )}

              </button>

              <p className="payment-disclaimer">

                <i className="bi bi-info-circle-fill">
                </i>

                Demo payment only.
                No real money is transferred.

              </p>

            </form>

          </div>

        </div>


      </div>

    </DashboardLayout>
  );
}

export default MakePayment;