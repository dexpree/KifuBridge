import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";

import PageHeader from "../components/PageHeader";

function CampaignDonations() {
  const { id } = useParams();

  const [donations, setDonations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ============================================================
  // FETCH DONATIONS
  // ============================================================

  useEffect(() => {
    if (id) {
      fetchDonations();
    }
  }, [id]);

  const fetchDonations = async () => {
    try {
      setLoading(true);

      setError("");

      const token =
        localStorage.getItem("token");

      const res = await API.get(
        `/campaigns/${id}/donations`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      console.log(
        "========== CAMPAIGN DONATIONS =========="
      );

      console.log(
        "Campaign ID:",
        id
      );

      console.log(
        "Campaign Donations Response:",
        res.data
      );

      console.log(
        "Donations:",
        res.data?.donations
      );

      // ========================================================
      // DEBUG EACH DONATION
      // ========================================================

      if (
        Array.isArray(
          res.data?.donations
        )
      ) {
        res.data.donations.forEach(
          (
            donation,
            index
          ) => {
            console.log(
              `DONATION ${index + 1}:`,
              donation
            );

            console.log(
              "Donation ID:",
              donation?._id
            );

            console.log(
              "Donor:",
              donation?.donor
            );

            console.log(
              "Categories:",
              donation?.categories
            );

            console.log(
              "Donation Items:",
              donation?.donationItems
            );

            console.log(
              "Delivery Methods:",
              donation?.allowedDeliveryMethods
            );

            console.log(
              "Status:",
              donation?.status
            );
          }
        );
      }

      setDonations(
        Array.isArray(
          res.data?.donations
        )
          ? res.data.donations
          : []
      );

    } catch (error) {

      console.error(
        "Campaign Donations Error:",
        error
      );

      console.error(
        "Backend Response:",
        error.response?.data
      );

      setError(
        error.response?.data?.message ||
          "Failed to load campaign donations."
      );

    } finally {

      setLoading(false);

    }
  };

  // ============================================================
  // GET DONATION ITEMS
  // ============================================================
  //
  // Current Donation schema:
  //
  // categories: [
  //   {
  //     itemName,
  //     category,
  //     quantity,
  //     unit,
  //     condition,
  //     campaignRequirement
  //   }
  // ]
  //
  // Also supports donationItems if returned by another controller.
  //
  // ============================================================

  const getDonationItems = (
    donation
  ) => {

    if (
      Array.isArray(
        donation?.donationItems
      ) &&
      donation.donationItems.length > 0
    ) {
      return donation.donationItems;
    }

    if (
      Array.isArray(
        donation?.categories
      ) &&
      donation.categories.length > 0
    ) {
      return donation.categories;
    }

    return [];
  };

  // ============================================================
  // FORMAT CATEGORY
  // ============================================================

  const formatCategory = (
    category
  ) => {

    if (!category) {
      return "";
    }

    return String(category)
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      );
  };

  // ============================================================
  // FORMAT DELIVERY METHOD
  // ============================================================

  const formatDeliveryMethod = (
    method
  ) => {

    if (!method) {
      return "";
    }

    return String(method)
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      );
  };

  // ============================================================
  // STATUS BADGE
  // ============================================================

  const getBadgeClass = (
    status
  ) => {

    switch (
      (status || "").toLowerCase()
    ) {

      case "completed":
        return "success";

      case "delivered":
        return "success";

      case "received":
        return "success";

      case "approved":
        return "primary";

      case "assigned":
        return "info";

      case "picked_up":
        return "info";

      case "requested":
        return "warning";

      case "available":
        return "secondary";

      case "expired":
        return "danger";

      default:
        return "dark";
    }
  };

  // ============================================================
  // STATUS LABEL
  // ============================================================

  const getStatusLabel = (
    status
  ) => {

    if (!status) {
      return "Unknown";
    }

    return String(status)
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      );
  };

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (
    date
  ) => {

    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <DashboardLayout>

        <PageHeader
          title="Campaign Donation History"
          subtitle="All donations submitted for this campaign."
        />

        <div className="card shadow">

          <div className="card-body text-center py-5">

            <div
              className="spinner-border"
              role="status"
            />

            <p className="mt-3 mb-0 text-muted">
              Loading donations...
            </p>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  // ============================================================
  // MAIN
  // ============================================================

  return (
    <DashboardLayout>

      <PageHeader
        title="Campaign Donation History"
        subtitle="All donations submitted for this campaign."
      />

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (

        <div className="card shadow">

          <div className="card-body text-center py-5">

            <div className="alert alert-danger mb-3">

              {error}

            </div>

            <button
              className="btn btn-primary"
              onClick={
                fetchDonations
              }
            >
              Try Again
            </button>

          </div>

        </div>

      )}

      {/* ========================================================
          DONATIONS
      ======================================================== */}

      {!error && (

        <div className="card shadow">

          <div className="card-body">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

              <div>

                <h5 className="mb-1">
                  Donations
                </h5>

                <small className="text-muted">

                  {donations.length}{" "}
                  donation
                  {donations.length !== 1
                    ? "s"
                    : ""}

                </small>

              </div>

              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={
                  fetchDonations
                }
              >
                ↻ Refresh
              </button>

            </div>

            {/* ==================================================
                EMPTY STATE
            ================================================== */}

            {donations.length === 0 ? (

              <div className="text-center py-5">

                <div
                  style={{
                    fontSize:
                      "42px",
                    marginBottom:
                      "12px",
                  }}
                >
                  📦
                </div>

                <h5>
                  No donations yet
                </h5>

                <p className="text-muted mb-0">

                  Donors have not submitted
                  any donations to this
                  campaign yet.

                </p>

              </div>

            ) : (

              /* ==================================================
                 TABLE
              ================================================== */

              <div className="table-responsive">

                <table className="table table-hover align-middle">

                  <thead>

                    <tr>

                      <th>
                        Donor
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Item
                      </th>

                      <th>
                        Category
                      </th>

                      <th>
                        Quantity
                      </th>

                      <th>
                        Condition
                      </th>

                      <th>
                        Delivery
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Available Until
                      </th>

                      <th>
                        Date
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {donations.map(
                      (
                        donation
                      ) => {

                        // ======================================
                        // GET ITEMS
                        // ======================================

                        const donationItems =
                          getDonationItems(
                            donation
                          );

                        // ======================================
                        // DELIVERY METHODS
                        // ======================================

                        const deliveryMethods =
                          Array.isArray(
                            donation.allowedDeliveryMethods
                          )
                            ? donation.allowedDeliveryMethods
                            : [];

                        return (

                          <tr
                            key={
                              donation._id
                            }
                          >

                            {/* ==================================
                                DONOR
                            ================================== */}

                            <td>

                              <strong>

                                {donation
                                  .donor
                                  ?.name ||

                                  donation
                                    .donor
                                    ?.organizationName ||

                                  "Unknown Donor"}

                              </strong>

                            </td>

                            {/* ==================================
                                EMAIL
                            ================================== */}

                            <td>

                              {donation
                                .donor
                                ?.email ||
                                "-"}

                            </td>

                            {/* ==================================
                                ITEM
                            ================================== */}

                            <td>

                              {donationItems.length ===
                              0 ? (

                                "-"

                              ) : (

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    flexDirection:
                                      "column",
                                    gap:
                                      "8px",
                                  }}
                                >

                                  {donationItems.map(
                                    (
                                      item,
                                      index
                                    ) => (

                                      <div
                                        key={
                                          item._id ||
                                          index
                                        }
                                      >

                                        <strong>

                                          {item.itemName ||
                                            "Unnamed Item"}

                                        </strong>

                                      </div>

                                    )
                                  )}

                                </div>

                              )}

                            </td>

                            {/* ==================================
                                CATEGORY
                            ================================== */}

                            <td>

                              {donationItems.length ===
                              0 ? (

                                "-"

                              ) : (

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    flexDirection:
                                      "column",
                                    gap:
                                      "8px",
                                  }}
                                >

                                  {donationItems.map(
                                    (
                                      item,
                                      index
                                    ) => (

                                      <span
                                        key={
                                          item._id ||
                                          index
                                        }
                                      >

                                        {formatCategory(
                                          item.category
                                        )}

                                      </span>

                                    )
                                  )}

                                </div>

                              )}

                            </td>

                            {/* ==================================
                                QUANTITY
                            ================================== */}

                            <td>

                              {donationItems.length ===
                              0 ? (

                                "-"

                              ) : (

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    flexDirection:
                                      "column",
                                    gap:
                                      "8px",
                                  }}
                                >

                                  {donationItems.map(
                                    (
                                      item,
                                      index
                                    ) => (

                                      <span
                                        key={
                                          item._id ||
                                          index
                                        }
                                      >

                                        <strong>

                                          {Number(
                                            item.quantity ||
                                              0
                                          )}

                                        </strong>{" "}

                                        {item.unit ||
                                          ""}

                                      </span>

                                    )
                                  )}

                                </div>

                              )}

                            </td>

                            {/* ==================================
                                CONDITION
                            ================================== */}

                            <td>

                              {donationItems.length ===
                              0 ? (

                                "-"

                              ) : (

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    flexDirection:
                                      "column",
                                    gap:
                                      "8px",
                                  }}
                                >

                                  {donationItems.map(
                                    (
                                      item,
                                      index
                                    ) => (

                                      <span
                                        key={
                                          item._id ||
                                          index
                                        }
                                      >

                                        {item.condition ||
                                          "Good"}

                                      </span>

                                    )
                                  )}

                                </div>

                              )}

                            </td>

                            {/* ==================================
                                DELIVERY
                            ================================== */}

                            <td>

                              {donation.deliveryMethod ? (

                                <span>

                                  {formatDeliveryMethod(
                                    donation.deliveryMethod
                                  )}

                                </span>

                              ) : deliveryMethods.length >
                                0 ? (

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    flexDirection:
                                      "column",
                                    gap:
                                      "5px",
                                  }}
                                >

                                  {deliveryMethods.map(
                                    (
                                      method,
                                      index
                                    ) => (

                                      <span
                                        key={`${method}-${index}`}
                                      >

                                        {formatDeliveryMethod(
                                          method
                                        )}

                                      </span>

                                    )
                                  )}

                                </div>

                              ) : (

                                "-"

                              )}

                            </td>

                            {/* ==================================
                                STATUS
                            ================================== */}

                            <td>

                              <span
                                className={`badge bg-${getBadgeClass(
                                  donation.status
                                )}`}
                              >

                                {getStatusLabel(
                                  donation.status
                                )}

                              </span>

                            </td>

                            {/* ==================================
                                AVAILABLE UNTIL
                            ================================== */}

                            <td>

                              {formatDate(
                                donation.availableUntil
                              )}

                            </td>

                            {/* ==================================
                                CREATED DATE
                            ================================== */}

                            <td>

                              {formatDate(
                                donation.createdAt
                              )}

                            </td>

                          </tr>

                        );

                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}

export default CampaignDonations;