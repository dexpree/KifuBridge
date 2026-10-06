import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";

import "../styles/campaign-donation.css";

// ======================================================
// QUICK AVAILABILITY DURATIONS
// ======================================================

const QUICK_DURATIONS = [
  { label: "1 Day", days: 1 },
  { label: "2 Days", days: 2 },
  { label: "3 Days", days: 3 },
  { label: "7 Days", days: 7 },
];

// ======================================================
// CONVERT DATE TO DATETIME-LOCAL VALUE
// ======================================================

const toLocalInputValue = (date) => {
  const pad = (n) => String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-${pad(
      date.getMonth() + 1
    )}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(
      date.getMinutes()
    )}`
  );
};

// ======================================================
// OPEN NATIVE DATE PICKER
// ======================================================

const openPicker = (e) => {
  if (typeof e.target.showPicker === "function") {
    try {
      e.target.showPicker();
    } catch {
      // Native picker will work normally.
    }
  }
};

// ======================================================
// COMPONENT
// ======================================================

function CampaignDonation() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ====================================================
  // STATE
  // ====================================================

  const [campaign, setCampaign] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    requirementId: "",
    itemName: "",
    category: "",
    quantity: "",
    unit: "",
    condition: "Good",
    availableFrom: "",
    availableUntil: "",
    allowedDeliveryMethods: ["volunteer_delivery"],
  });

  // ====================================================
  // CURRENT LOCAL TIME
  // ====================================================

  const nowLocal = toLocalInputValue(new Date());

  // ====================================================
  // FETCH CAMPAIGN
  // ====================================================

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    setLoadError(null);

    try {
      const token = localStorage.getItem("token");

      const response = await API.get(`/campaigns/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const campaignData = response.data;

      // --------------------------------------------------
      // Make sure campaign exists
      // --------------------------------------------------

      if (!campaignData) {
        throw new Error("Campaign not found.");
      }

      setCampaign(campaignData);

      // ==================================================
      // FIND FIRST INCOMPLETE REQUIREMENT
      // ==================================================

      const firstRequirement =
        campaignData.requirements?.find((requirement) => {
          const current = Number(
            requirement.currentQuantity || 0
          );

          const goal = Number(
            requirement.goalQuantity || 0
          );

          return current < goal;
        });

      if (firstRequirement) {
        setForm((prev) => ({
          ...prev,
          requirementId: firstRequirement._id,
          itemName: firstRequirement.itemName,
          category: firstRequirement.category || "",
          unit: firstRequirement.unit,
        }));
      }
    } catch (error) {
      console.error(
        "Fetch Campaign Error:",
        error
      );

      setLoadError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load this campaign."
      );
    }
  };

  // ====================================================
  // REQUIREMENT CHANGE
  // ====================================================

  const handleRequirementChange = (e) => {
    const requirementId = e.target.value;

    const selectedRequirement =
      campaign.requirements?.find(
        (requirement) =>
          requirement._id === requirementId
      );

    if (!selectedRequirement) {
      setForm((prev) => ({
        ...prev,
        requirementId: "",
        itemName: "",
        category: "",
        unit: "",
        quantity: "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      requirementId: selectedRequirement._id,
      itemName: selectedRequirement.itemName,
      category: selectedRequirement.category || "",
      unit: selectedRequirement.unit,
      quantity: "",
    }));
  };

  // ====================================================
  // AVAILABLE FROM
  // ====================================================

  const handleAvailableFromChange = (value) => {
    setForm((prev) => {
      const untilInvalid =
        prev.availableUntil &&
        prev.availableUntil < value;

      return {
        ...prev,
        availableFrom: value,
        availableUntil: untilInvalid
          ? ""
          : prev.availableUntil,
      };
    });
  };

  // ====================================================
  // QUICK DURATION
  // ====================================================

  const applyQuickDuration = (days) => {
    const base = form.availableFrom
      ? new Date(form.availableFrom)
      : new Date();

    const until = new Date(
      base.getTime() +
        days *
          24 *
          60 *
          60 *
          1000
    );

    setForm((prev) => ({
      ...prev,
      availableFrom:
        prev.availableFrom ||
        toLocalInputValue(base),

      availableUntil:
        toLocalInputValue(until),
    }));
  };

  // ====================================================
  // DELIVERY METHOD
  // ====================================================

  const toggleDeliveryMethod = (method) => {
    setForm((prev) => {
      const exists =
        prev.allowedDeliveryMethods.includes(
          method
        );

      return {
        ...prev,

        allowedDeliveryMethods: exists
          ? prev.allowedDeliveryMethods.filter(
              (item) => item !== method
            )
          : [
              ...prev.allowedDeliveryMethods,
              method,
            ],
      };
    });
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ==================================================
    // REQUIREMENT
    // ==================================================

    if (!form.requirementId) {
      alert(
        "Please select an item to donate."
      );
      return;
    }

    // ==================================================
    // QUANTITY
    // ==================================================

    if (
      !form.quantity ||
      Number(form.quantity) <= 0
    ) {
      alert(
        "Please enter a valid quantity."
      );
      return;
    }

    // ==================================================
    // AVAILABLE FROM
    // ==================================================

    if (!form.availableFrom) {
      alert(
        "Please select Available From."
      );
      return;
    }

    // ==================================================
    // AVAILABLE UNTIL
    // ==================================================

    if (!form.availableUntil) {
      alert(
        "Please select Available Until."
      );
      return;
    }

    // ==================================================
    // DELIVERY METHOD
    // ==================================================

    if (
      !Array.isArray(
        form.allowedDeliveryMethods
      ) ||
      form.allowedDeliveryMethods.length === 0
    ) {
      alert(
        "Please select at least one delivery method."
      );
      return;
    }

    // ==================================================
    // FIND SELECTED REQUIREMENT
    // ==================================================

    const selectedRequirement =
      campaign.requirements?.find(
        (requirement) =>
          requirement._id ===
          form.requirementId
      );

    if (!selectedRequirement) {
      alert(
        "Selected campaign requirement not found."
      );
      return;
    }

    // ==================================================
    // CALCULATE REMAINING
    // ==================================================

    const goalQuantity = Number(
      selectedRequirement.goalQuantity || 0
    );

    const currentQuantity = Number(
      selectedRequirement.currentQuantity || 0
    );

    const remaining =
      goalQuantity - currentQuantity;

    // ==================================================
    // CHECK COMPLETED
    // ==================================================

    if (remaining <= 0) {
      alert(
        "This campaign requirement has already been fulfilled."
      );
      return;
    }

    // ==================================================
    // DONATION QUANTITY
    // ==================================================

    const donationQuantity = Number(
      form.quantity
    );

    if (
      !Number.isFinite(
        donationQuantity
      ) ||
      donationQuantity <= 0
    ) {
      alert(
        "Please enter a valid quantity."
      );
      return;
    }

    // ==================================================
    // PREVENT OVER-DONATION
    // ==================================================

    if (
      donationQuantity > remaining
    ) {
      alert(
        `Only ${remaining} ${selectedRequirement.unit} is still required.`
      );
      return;
    }

    // ==================================================
    // DATE VALIDATION
    // ==================================================

    const fromDate = new Date(
      form.availableFrom
    );

    const untilDate = new Date(
      form.availableUntil
    );

    if (
      Number.isNaN(
        fromDate.getTime()
      ) ||
      Number.isNaN(
        untilDate.getTime()
      )
    ) {
      alert(
        "Please enter valid availability dates."
      );
      return;
    }

    if (untilDate <= fromDate) {
      alert(
        "Available Until must be after Available From."
      );
      return;
    }

    // ==================================================
    // CHECK AVAILABLE FROM AGAINST CURRENT TIME
    // ==================================================

    const now = new Date();

    if (fromDate < now) {
      alert(
        "Available From cannot be in the past."
      );
      return;
    }

    // ==================================================
    // START SUBMITTING
    // ==================================================

    setSubmitting(true);

    try {
      const token =
        localStorage.getItem("token");

      // ==================================================
      // BUILD CAMPAIGN DONATION ITEM
      // ==================================================

      const donationItems = [
        {
          itemName:
            selectedRequirement.itemName,

          category:
            selectedRequirement.category,

          quantity:
            donationQuantity,

          unit:
            selectedRequirement.unit,

          condition:
            form.condition,

          campaignRequirement:
            selectedRequirement._id,
        },
      ];

      // ==================================================
      // CAMPAIGN DONATION PAYLOAD
      //
      // IMPORTANT:
      //
      // This is JSON, NOT FormData.
      //
      // Endpoint:
      // POST /campaigns/donate
      //
      // Controller:
      // donateToCampaign
      // ==================================================

      const campaignDonationData = {
        campaignId: id,

        items: donationItems,

        description:
          `Campaign Donation - ${campaign.title}`,

        availableFrom:
          form.availableFrom,

        availableUntil:
          form.availableUntil,

        allowedDeliveryMethods:
          form.allowedDeliveryMethods,
      };

      // ==================================================
      // DEBUG
      // ==================================================

      console.log(
        "===================================="
      );

      console.log(
        "CAMPAIGN DONATION"
      );

      console.log(
        "Endpoint:",
        "/campaigns/donate"
      );

      console.log(
        "Campaign ID:",
        id
      );

      console.log(
        "Campaign:",
        campaign.title
      );

      console.log(
        "Requirement ID:",
        selectedRequirement._id
      );

      console.log(
        "Item:",
        selectedRequirement.itemName
      );

      console.log(
        "Category:",
        selectedRequirement.category
      );

      console.log(
        "Quantity:",
        donationQuantity
      );

      console.log(
        "Unit:",
        selectedRequirement.unit
      );

      console.log(
        "Condition:",
        form.condition
      );

      console.log(
        "Available From:",
        form.availableFrom
      );

      console.log(
        "Available Until:",
        form.availableUntil
      );

      console.log(
        "Delivery Methods:",
        form.allowedDeliveryMethods
      );

      console.log(
        "Donation Items:",
        donationItems
      );

      console.log(
        "Complete Payload:",
        campaignDonationData
      );

      console.log(
        "===================================="
      );

      // ==================================================
      // API REQUEST
      //
      // IMPORTANT:
      // DO NOT USE /donations HERE.
      //
      // /donations -> normal donation controller
      //
      // /campaigns/donate -> campaign controller
      // ==================================================

      const response = await API.post(
        "/campaigns/donate",
        campaignDonationData,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      console.log(
        "Campaign Donation Created:",
        response.data
      );

      // ==================================================
      // SUCCESS
      // ==================================================

      alert(
        "Campaign donation submitted successfully."
      );

      navigate(
        `/campaigns/${id}`
      );
    } catch (error) {
      console.error(
        "Campaign Donation Error:",
        error
      );

      console.error(
        "Backend Response:",
        error.response?.data
      );

      console.error(
        "Backend Status:",
        error.response?.status
      );

      alert(
        error.response?.data?.message ||
          "Failed to submit campaign donation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ====================================================
  // LOADING ERROR
  // ====================================================

  if (loadError) {
    return (
      <DashboardLayout>
        <div className="donation-state donation-state-error">
          <p>{loadError}</p>

          <button
            className="donation-btn-retry"
            onClick={fetchCampaign}
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ====================================================
  // LOADING
  // ====================================================

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="donation-state">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  // ====================================================
  // AVAILABLE REQUIREMENTS
  // ====================================================

  const availableRequirements =
    campaign.requirements?.filter(
      (requirement) => {
        const current = Number(
          requirement.currentQuantity || 0
        );

        const goal = Number(
          requirement.goalQuantity || 0
        );

        return current < goal;
      }
    ) || [];

  // ====================================================
  // SELECTED REQUIREMENT
  // ====================================================

  const selectedRequirement =
    availableRequirements.find(
      (requirement) =>
        requirement._id ===
        form.requirementId
    );

  // ====================================================
  // REMAINING QUANTITY
  // ====================================================

  const remaining =
    selectedRequirement
      ? Math.max(
          0,
          Number(
            selectedRequirement.goalQuantity ||
              0
          ) -
            Number(
              selectedRequirement.currentQuantity ||
                0
            )
        )
      : 0;

  // ====================================================
  // MIN AVAILABLE UNTIL
  // ====================================================

  const minAvailableUntil =
    form.availableFrom ||
    nowLocal;

  // ====================================================
  // UI
  // ====================================================

  return (
    <DashboardLayout>
      <PageHeader
        title="Donate To Campaign"
        subtitle={campaign.title}
      />

      <div className="donation-card">
        <form
          className="donation-form"
          onSubmit={handleSubmit}
        >
          {/* ==========================================
              CAMPAIGN INFORMATION
          ========================================== */}

          <div className="donation-campaign-info">
            <h3>
              {campaign.title}
            </h3>

            <p>
              Select an item below to
              support this campaign.
            </p>
          </div>

          {/* ==========================================
              REQUIREMENT
          ========================================== */}

          <div className="donation-field">
            <label>
              What would you like to
              donate?
            </label>

            <select
              className="donation-input"
              value={
                form.requirementId
              }
              onChange={
                handleRequirementChange
              }
              required
            >
              <option value="">
                Select an item
              </option>

              {availableRequirements.map(
                (requirement) => {
                  const requirementRemaining =
                    Math.max(
                      0,
                      Number(
                        requirement.goalQuantity ||
                          0
                      ) -
                        Number(
                          requirement.currentQuantity ||
                            0
                        )
                    );

                  return (
                    <option
                      key={
                        requirement._id
                      }
                      value={
                        requirement._id
                      }
                    >
                      {
                        requirement.itemName
                      }{" "}
                      — Need{" "}
                      {
                        requirementRemaining
                      }{" "}
                      {
                        requirement.unit
                      }
                    </option>
                  );
                }
              )}
            </select>

            {availableRequirements.length ===
              0 && (
              <small className="text-muted">
                All campaign requirements
                have been fulfilled.
              </small>
            )}
          </div>

          {/* ==========================================
              SELECTED ITEM
          ========================================== */}

          <div className="donation-row">
            <div className="donation-field">
              <label>
                Item
              </label>

              <input
                className="donation-input"
                value={
                  form.itemName
                }
                readOnly
              />
            </div>

            <div className="donation-field">
              <label>
                Category
              </label>

              <input
                className="donation-input"
                value={
                  form.category
                }
                readOnly
              />
            </div>

            <div className="donation-field donation-field-narrow">
              <label>
                Unit
              </label>

              <input
                className="donation-input"
                value={
                  form.unit
                }
                readOnly
              />
            </div>
          </div>

          {/* ==========================================
              QUANTITY
          ========================================== */}

          <div className="donation-field">
            <label>
              Quantity
            </label>

            <input
              type="number"
              min="1"
              max={
                remaining ||
                undefined
              }
              step="any"
              className="donation-input"
              value={
                form.quantity
              }
              onChange={(e) => {
                const value =
                  e.target.value;

                if (
                  value !== "" &&
                  Number(value) >
                    remaining
                ) {
                  setForm((prev) => ({
                    ...prev,
                    quantity:
                      String(
                        remaining
                      ),
                  }));

                  return;
                }

                setForm((prev) => ({
                  ...prev,
                  quantity:
                    value,
                }));
              }}
              required
            />

            {form.requirementId &&
              selectedRequirement && (
                <small className="text-muted">
                  Maximum you can
                  donate:{" "}
                  <strong>
                    {remaining}{" "}
                    {
                      selectedRequirement.unit
                    }
                  </strong>
                </small>
              )}
          </div>

          {/* ==========================================
              CONDITION
          ========================================== */}

          <div className="donation-field">
            <label>
              Condition
            </label>

            <select
              className="donation-input"
              value={
                form.condition
              }
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  condition:
                    e.target.value,
                }))
              }
            >
              <option value="New">
                New
              </option>

              <option value="Good">
                Good
              </option>

              <option value="Fair">
                Fair
              </option>
            </select>
          </div>

          {/* ==========================================
              AVAILABLE FROM
          ========================================== */}

          <div className="donation-field">
            <label>
              Available From
            </label>

            <input
              type="datetime-local"
              className="donation-input"
              min={nowLocal}
              value={
                form.availableFrom
              }
              onClick={openPicker}
              onFocus={openPicker}
              onChange={(e) =>
                handleAvailableFromChange(
                  e.target.value
                )
              }
              required
            />
          </div>

          {/* ==========================================
              AVAILABLE UNTIL
          ========================================== */}

          <div className="donation-field">
            <label>
              Available Until
            </label>

            <div className="donation-quick-durations">
              {QUICK_DURATIONS.map(
                ({
                  label,
                  days,
                }) => (
                  <button
                    key={days}
                    type="button"
                    className="donation-chip"
                    onClick={() =>
                      applyQuickDuration(
                        days
                      )
                    }
                  >
                    {label}
                  </button>
                )
              )}
            </div>

            <input
              type="datetime-local"
              className="donation-input"
              min={
                minAvailableUntil
              }
              value={
                form.availableUntil
              }
              onClick={openPicker}
              onFocus={openPicker}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  availableUntil:
                    e.target.value,
                }))
              }
              required
            />
          </div>

          {/* ==========================================
              DELIVERY METHODS
          ========================================== */}

          <div className="donation-field">
            <label>
              Allowed Delivery Methods
            </label>

            <div className="delivery-method-options">
              {/* VOLUNTEER DELIVERY */}

              <label>
                <input
                  type="checkbox"
                  checked={form.allowedDeliveryMethods.includes(
                    "volunteer_delivery"
                  )}
                  onChange={() =>
                    toggleDeliveryMethod(
                      "volunteer_delivery"
                    )
                  }
                />

                <span>
                  Volunteer Delivery
                </span>
              </label>

              {/* SELF PICKUP */}

              <label>
                <input
                  type="checkbox"
                  checked={form.allowedDeliveryMethods.includes(
                    "self_pickup"
                  )}
                  onChange={() =>
                    toggleDeliveryMethod(
                      "self_pickup"
                    )
                  }
                />

                <span>
                  I will deliver
                  myself
                </span>
              </label>
            </div>
          </div>

          {/* ==========================================
              SUBMIT
          ========================================== */}

          <button
            type="submit"
            className="donation-submit"
            disabled={
              submitting ||
              availableRequirements.length ===
                0 ||
              !form.requirementId ||
              remaining <= 0
            }
          >
            {submitting
              ? "Submitting..."
              : "Donate"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default CampaignDonation;