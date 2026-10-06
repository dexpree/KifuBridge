import { useEffect, useState } from "react";
import {
  useParams,
} from "react-router-dom";

import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";

import PageHeader from "../components/PageHeader";

import "../styles/createDonation.css";

// ============================================================
// BACKEND URL
// ============================================================

const BACKEND_URL = "http://localhost:5000";

// ============================================================
// CATEGORIES
// ============================================================

const CATEGORIES = [
  {
    value: "food",
    label: "Food",
    icon: "bi-egg-fried",
  },
  {
    value: "clothing",
    label: "Clothing",
    icon: "bi-bag-heart",
  },
  {
    value: "toys",
    label: "Toys",
    icon: "bi-controller",
  },
  {
    value: "medicine",
    label: "Medicine",
    icon: "bi-capsule",
  },
  {
    value: "books",
    label: "Books & Stationery",
    icon: "bi-book",
  },
  {
    value: "household",
    label: "Household Items",
    icon: "bi-house-heart",
  },
  {
    value: "electronics",
    label: "Electronics",
    icon: "bi-plug",
  },
  {
    value: "other",
    label: "Other",
    icon: "bi-three-dots",
  },
];

// ============================================================
// UNITS
// ============================================================

const UNITS = [
  {
    value: "pieces",
    label: "Pieces",
  },
  {
    value: "kg",
    label: "Kilograms",
  },
  {
    value: "liters",
    label: "Liters",
  },
  {
    value: "boxes",
    label: "Boxes",
  },
  {
    value: "sets",
    label: "Sets",
  },
];

// ============================================================
// CONDITIONS
// ============================================================

const CONDITIONS = [
  "New",
  "Good",
  "Fair",
];

// ============================================================
// UNTIL PRESETS
// ============================================================

const UNTIL_PRESETS = [
  {
    label: "+1 Day",
    days: 1,
  },
  {
    label: "+3 Days",
    days: 3,
  },
  {
    label: "+1 Week",
    days: 7,
  },
];

// ============================================================
// DELIVERY OPTIONS
// ============================================================

const DELIVERY_OPTIONS = [
  {
    value: "volunteer",
    label: "Volunteer Delivery",
    icon: "bi-bicycle",
  },
  {
    value: "donor_self",
    label: "Donor Delivery",
    icon: "bi-person-walking",
  },
  {
    value: "ngo_pickup",
    label: "NGO Pickup",
    icon: "bi-building",
  },
];

// ============================================================
// EMPTY CATEGORY
// ============================================================

const createEmptyCategory = (
  category = ""
) => ({
  itemName: "",
  category,
  customCategory: "",
  quantity: "",
  unit: "pieces",
  condition: "Good",
});

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
// COMPONENT
// ============================================================

function CreateDonation() {

  // ==========================================================
  // URL PARAMETER
  // ==========================================================

  /*
    Normal donation:
      /create-donation

    Direct NGO donation:
      /create-donation/:ngoId
  */

  const { ngoId } = useParams();

  // ==========================================================
  // TARGET NGO
  // ==========================================================

  const [targetNGO, setTargetNGO] =
    useState(null);

  const [
    targetNGOLoading,
    setTargetNGOLoading,
  ] = useState(false);

  const [
    targetNGOError,
    setTargetNGOError,
  ] = useState("");

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [formData, setFormData] =
    useState({
      donationName: "",
      categories: [],
      description: "",
      itemImages: [],
      availableFromDate: "",
      availableFromTime: "",
      availableUntilDate: "",
      availableUntilTime: "",
      allowedDeliveryMethods: [
        "volunteer",
      ],
    });

  // ==========================================================
  // OTHER STATE
  // ==========================================================

  const [immediate, setImmediate] =
    useState(false);

  const [errors, setErrors] =
    useState({});

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // ==========================================================
  // FETCH TARGET NGO
  // ==========================================================

  useEffect(() => {

    if (!ngoId) {
      setTargetNGO(null);
      setTargetNGOError("");
      return;
    }

    fetchTargetNGO();

  }, [ngoId]);

  const fetchTargetNGO =
    async () => {
      try {
        setTargetNGOLoading(true);
        setTargetNGOError("");

        const token =
          localStorage.getItem(
            "token"
          );

        const response =
          await API.get(
            `/users/public-ngos/${ngoId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        console.log(
          "TARGET NGO FOR DONATION:",
          response.data
        );

        const ngo =
          response.data?.ngo ||
          response.data ||
          null;

        if (!ngo) {
          setTargetNGOError(
            "Selected NGO could not be found."
          );

          setTargetNGO(null);

          return;
        }

        setTargetNGO(ngo);

      } catch (error) {
        console.error(
          "Fetch Target NGO Error:",
          error
        );

        setTargetNGOError(
          error.response?.data?.message ||
            "Unable to load selected NGO."
        );

        setTargetNGO(null);

      } finally {
        setTargetNGOLoading(
          false
        );
      }
    };

  // ==========================================================
  // DATE
  // ==========================================================

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const getCurrentTime = () => {
    const now = new Date();

    return now
      .toTimeString()
      .slice(0, 5);
  };

  // ==========================================================
  // CATEGORY SELECTION
  // ==========================================================

  const toggleCategory = (
    categoryValue
  ) => {
    setFormData((previous) => {

      const exists =
        previous.categories.some(
          (item) =>
            item.category ===
            categoryValue
        );

      if (exists) {
        return {
          ...previous,

          categories:
            previous.categories.filter(
              (item) =>
                item.category !==
                categoryValue
            ),
        };
      }

      return {
        ...previous,

        categories: [
          ...previous.categories,

          createEmptyCategory(
            categoryValue
          ),
        ],
      };
    });

    setErrors((previous) => ({
      ...previous,
      categories: "",
    }));
  };

  // ==========================================================
  // UPDATE CATEGORY / ITEM
  // ==========================================================

  const updateCategory = (
    index,
    field,
    value
  ) => {

    setFormData((previous) => {

      const updated = [
        ...previous.categories,
      ];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      if (
        field === "category" &&
        value !== "other"
      ) {
        updated[index].customCategory =
          "";
      }

      return {
        ...previous,
        categories: updated,
      };
    });

    setErrors((previous) => ({
      ...previous,
      [`category-${index}`]: "",
    }));
  };

  // ==========================================================
  // COMMON CHANGE
  // ==========================================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  // ==========================================================
  // FROM DATE / TIME
  // ==========================================================

  const handleFromChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setFormData((previous) => {

      const next = {
        ...previous,
        [name]: value,
      };

      const from =
        new Date(
          `${next.availableFromDate || today}T${
            next.availableFromTime ||
            "00:00"
          }`
        );

      const until =
        next.availableUntilDate
          ? new Date(
              `${next.availableUntilDate}T${
                next.availableUntilTime ||
                "00:00"
              }`
            )
          : null;

      if (
        until &&
        until <= from
      ) {
        next.availableUntilDate =
          "";

        next.availableUntilTime =
          "";
      }

      return next;
    });

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      availability: "",
    }));
  };

  // ==========================================================
  // AVAILABLE NOW
  // ==========================================================

  const toggleImmediate = () => {

    const next =
      !immediate;

    setImmediate(next);

    if (next) {
      setFormData((previous) => ({
        ...previous,

        availableFromDate:
          today,

        availableFromTime:
          getCurrentTime(),
      }));

      setErrors((previous) => ({
        ...previous,
        availability: "",
      }));
    }
  };

  // ==========================================================
  // UNTIL PRESET
  // ==========================================================

  const applyUntilPreset = (
    days
  ) => {

    if (
      !formData.availableFromDate ||
      !formData.availableFromTime
    ) {
      setErrors((previous) => ({
        ...previous,

        availability:
          "Set an Available From date and time first.",
      }));

      return;
    }

    const from =
      new Date(
        `${formData.availableFromDate}T${formData.availableFromTime}`
      );

    const until =
      new Date(from);

    until.setDate(
      until.getDate() + days
    );

    setFormData((previous) => ({
      ...previous,

      availableUntilDate:
        until
          .toISOString()
          .split("T")[0],

      availableUntilTime:
        until
          .toTimeString()
          .slice(0, 5),
    }));

    setErrors((previous) => ({
      ...previous,
      availability: "",
    }));
  };

  // ==========================================================
  // DELIVERY METHODS
  // ==========================================================

  const toggleDeliveryMethod = (
    method
  ) => {

    setFormData((previous) => {

      const methods =
        previous.allowedDeliveryMethods ||
        [];

      const updatedMethods =
        methods.includes(method)
          ? methods.filter(
              (item) =>
                item !== method
            )
          : [
              ...methods,
              method,
            ];

      return {
        ...previous,

        allowedDeliveryMethods:
          updatedMethods,
      };
    });

    setErrors((previous) => ({
      ...previous,
      deliveryMethods: "",
    }));
  };

  // ==========================================================
  // IMAGE SELECTION
  // ==========================================================

  const handleImageChange = (
    e
  ) => {

    const files = Array.from(
      e.target.files || []
    );

    setFormData((previous) => ({
      ...previous,
      itemImages: files,
    }));
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validate = () => {

    const newErrors = {};

    // --------------------------------------------------------
    // TARGET NGO
    // --------------------------------------------------------

    if (
      ngoId &&
      !targetNGO
    ) {
      newErrors.targetNGO =
        targetNGOError ||
        "Selected NGO could not be loaded.";
    }

    // --------------------------------------------------------
    // DONATION TITLE
    // --------------------------------------------------------

    if (
      !formData.donationName.trim()
    ) {
      newErrors.donationName =
        "Donation title is required.";
    }

    // --------------------------------------------------------
    // CATEGORIES
    // --------------------------------------------------------

    if (
      !Array.isArray(
        formData.categories
      ) ||
      formData.categories
        .length === 0
    ) {
      newErrors.categories =
        "Select at least one category.";
    }

    // --------------------------------------------------------
    // CATEGORY DETAILS
    // --------------------------------------------------------

    formData.categories.forEach(
      (item, index) => {

        if (
          !item.itemName?.trim()
        ) {
          newErrors[
            `category-${index}`
          ] =
            "Enter the item name.";

          return;
        }

        if (
          item.category ===
            "other" &&
          !item.customCategory?.trim()
        ) {
          newErrors[
            `category-${index}`
          ] =
            "Specify the category.";

          return;
        }

        if (
          !item.quantity ||
          Number(item.quantity) <= 0
        ) {
          newErrors[
            `category-${index}`
          ] =
            "Enter a valid quantity.";

          return;
        }

        if (!item.unit) {
          newErrors[
            `category-${index}`
          ] =
            "Select a unit.";
        }
      }
    );

    // --------------------------------------------------------
    // AVAILABILITY
    // --------------------------------------------------------

    if (
      !formData.availableFromDate ||
      !formData.availableFromTime ||
      !formData.availableUntilDate ||
      !formData.availableUntilTime
    ) {
      newErrors.availability =
        "Please select the full availability period.";
    } else {

      const from =
        new Date(
          `${formData.availableFromDate}T${formData.availableFromTime}`
        );

      const until =
        new Date(
          `${formData.availableUntilDate}T${formData.availableUntilTime}`
        );

      if (
        Number.isNaN(
          from.getTime()
        ) ||
        Number.isNaN(
          until.getTime()
        )
      ) {
        newErrors.availability =
          "Please select valid availability dates.";
      } else {

        if (
          until <= from
        ) {
          newErrors.availability =
            "Available Until must be later than Available From.";
        }

        if (
          from < new Date()
        ) {
          newErrors.availability =
            "Available From cannot be in the past.";
        }
      }
    }

    // --------------------------------------------------------
    // DELIVERY METHODS
    // --------------------------------------------------------

    if (
      !formData
        .allowedDeliveryMethods
        ?.length
    ) {
      newErrors.deliveryMethods =
        "Select at least one delivery method.";
    }

    setErrors(newErrors);

    return (
      Object.keys(
        newErrors
      ).length === 0
    );
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setMessage("");

      if (!validate()) {
        return;
      }

      setLoading(true);

      const availableFrom =
        new Date(
          `${formData.availableFromDate}T${formData.availableFromTime}`
        );

      const availableUntil =
        new Date(
          `${formData.availableUntilDate}T${formData.availableUntilTime}`
        );

      try {

        const token =
          localStorage.getItem(
            "token"
          );

        // ====================================================
        // NORMALIZE CATEGORIES
        // ====================================================

        const normalizedCategories =
          formData.categories.map(
            (item) => ({
              itemName:
                item.itemName.trim(),

              category:
                item.category,

              customCategory:
                item.category ===
                "other"
                  ? item.customCategory.trim()
                  : "",

              quantity:
                Number(
                  item.quantity
                ),

              unit:
                item.unit,

              condition:
                item.condition ||
                "Good",
            })
          );

        // ====================================================
        // FORM DATA
        // ====================================================

        const data =
          new FormData();

        // ----------------------------------------------------
        // DONATION TITLE
        // ----------------------------------------------------

        data.append(
          "donationName",
          formData.donationName.trim()
        );

        // ----------------------------------------------------
        // CATEGORIES
        // ----------------------------------------------------

        data.append(
          "categories",
          JSON.stringify(
            normalizedCategories
          )
        );

        // ----------------------------------------------------
        // DESCRIPTION
        // ----------------------------------------------------

        data.append(
          "description",
          formData.description
        );

        // ----------------------------------------------------
        // AVAILABILITY
        // ----------------------------------------------------

        data.append(
          "availableFrom",
          availableFrom.toISOString()
        );

        data.append(
          "availableUntil",
          availableUntil.toISOString()
        );

        // ----------------------------------------------------
        // DELIVERY METHODS
        // ----------------------------------------------------

        data.append(
          "allowedDeliveryMethods",
          JSON.stringify(
            formData.allowedDeliveryMethods
          )
        );

        // ====================================================
        // DIRECT NGO
        // ====================================================

        /*
          This is the important new field.

          Normal donation:

            no ngoId
            → targetNGO is not sent

          Direct NGO donation:

            /create-donation/:ngoId
            → targetNGO = ngoId
        */

        if (ngoId) {

          data.append(
            "targetNGO",
            ngoId
          );

          console.log(
            "DIRECT NGO DONATION"
          );

          console.log(
            "TARGET NGO ID:",
            ngoId
          );

          console.log(
            "TARGET NGO NAME:",
            targetNGO?.organizationName ||
              targetNGO?.name
          );
        }

        // ====================================================
        // IMAGES
        // ====================================================

        formData.itemImages.forEach(
          (image) => {
            data.append(
              "itemImages",
              image
            );
          }
        );

        // ====================================================
        // DEBUG
        // ====================================================

        console.log(
          "DONATION TITLE:",
          formData.donationName
        );

        console.log(
          "DONATION CATEGORIES:",
          normalizedCategories
        );

        console.log(
          "AVAILABLE FROM:",
          availableFrom
        );

        console.log(
          "AVAILABLE UNTIL:",
          availableUntil
        );

        console.log(
          "DELIVERY METHODS:",
          formData.allowedDeliveryMethods
        );

        console.log(
          "TARGET NGO:",
          ngoId || "NORMAL DONATION"
        );

        // ====================================================
        // API
        // ====================================================

        const response =
          await API.post(
            "/donations",
            data,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        console.log(
          "DONATION CREATED:",
          response.data
        );

        setMessage(
          ngoId
            ? "Donation created successfully for the selected NGO!"
            : "Donation created successfully!"
        );

        // ====================================================
        // RESET
        // ====================================================

        setFormData({
          donationName: "",
          categories: [],
          description: "",
          itemImages: [],
          availableFromDate: "",
          availableFromTime: "",
          availableUntilDate: "",
          availableUntilTime: "",
          allowedDeliveryMethods: [
            "volunteer",
          ],
        });

        setImmediate(false);

        setErrors({});

        // Reset file input

        const fileInput =
          document.getElementById(
            "itemImages"
          );

        if (fileInput) {
          fileInput.value = "";
        }

      } catch (error) {

        console.error(
          "Create Donation Error:",
          error
        );

        setMessage(
          error.response?.data?.message ||
            "Failed to create donation."
        );

      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // PREVIEW HELPERS
  // ==========================================================

  const selectedDeliveryLabels =
    DELIVERY_OPTIONS.filter(
      (option) =>
        (
          formData
            .allowedDeliveryMethods ||
          []
        ).includes(
          option.value
        )
    );

  const formatWindow = (
    date,
    time
  ) => {

    if (
      !date ||
      !time
    ) {
      return null;
    }

    const value =
      new Date(
        `${date}T${time}`
      );

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return null;
    }

    return value.toLocaleString(
      undefined,
      {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const fromLabel =
    formatWindow(
      formData.availableFromDate,
      formData.availableFromTime
    );

  const untilLabel =
    formatWindow(
      formData.availableUntilDate,
      formData.availableUntilTime
    );

  const isSuccessMessage =
    message
      .toLowerCase()
      .includes(
        "success"
      );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      <PageHeader
        title={
          ngoId
            ? "Donate Items to NGO"
            : "Create Donation"
        }

        subtitle={
          ngoId
            ? "Create a physical donation specifically for the selected NGO."
            : "Create one donation with multiple categories and items."
        }
      />

      {/* ====================================================
          TARGET NGO BANNER
      ==================================================== */}

      {ngoId && (
        <div
          className={`direct-ngo-banner ${
            targetNGOError
              ? "error"
              : ""
          }`}
        >

          {targetNGOLoading ? (

            <div className="direct-ngo-banner-loading">

              <span className="spinner-border spinner-border-sm me-2"></span>

              Loading selected NGO...

            </div>

          ) : targetNGO ? (

            <>

              <div className="direct-ngo-banner-icon">
                <i className="bi bi-building-check"></i>
              </div>

              <div className="direct-ngo-banner-content">

                <span>
                  Direct donation for
                </span>

                <strong>
                  {targetNGO.organizationName ||
                    targetNGO.name}
                </strong>

                {targetNGO.ngoCategory && (
                  <small>
                    {targetNGO.ngoCategory}
                  </small>
                )}

              </div>

              <div className="direct-ngo-banner-lock">
                <i className="bi bi-lock-fill me-1"></i>
                Reserved for this NGO
              </div>

            </>

          ) : (

            <div className="direct-ngo-banner-error">

              <i className="bi bi-exclamation-triangle-fill me-2"></i>

              {targetNGOError ||
                "Selected NGO could not be loaded."}

            </div>

          )}

        </div>
      )}

      <div className="don-layout">

        {/* ==================================================
            FORM
        ================================================== */}

        <form
          className="don-form"
          onSubmit={
            handleSubmit
          }
        >

          {/* ==================================================
              SUBMIT FEEDBACK
          ================================================== */}

          {message && (
            <div
              className="don-message-overlay"
              role="status"
            >

              <div
                className={`don-message-box ${
                  isSuccessMessage
                    ? "success"
                    : "error"
                }`}
              >

                <div className="don-message-icon">

                  <i
                    className={`bi ${
                      isSuccessMessage
                        ? "bi-check-lg"
                        : "bi-exclamation-lg"
                    }`}
                  ></i>

                </div>

                <h4 className="don-message-title">

                  {isSuccessMessage
                    ? "Thank You!"
                    : "Something Went Wrong"}

                </h4>

                <p className="don-message-text">

                  {isSuccessMessage
                    ? message
                    : message}

                </p>

                <button
                  type="button"
                  className="don-message-close"
                  onClick={() =>
                    setMessage("")
                  }
                >
                  {isSuccessMessage
                    ? "Done"
                    : "Try Again"}
                </button>

              </div>

            </div>
          )}

          {/* ==================================================
              STEPS
          ================================================== */}

          <nav
            className="don-steps"
            aria-label="Form sections"
          >

            <a
              href="#don-sec-details"
              className="don-step"
            >
              <span className="don-step-num">
                1
              </span>
              Donation
            </a>

            <a
              href="#don-sec-availability"
              className="don-step"
            >
              <span className="don-step-num">
                2
              </span>
              Availability
            </a>

            <a
              href="#don-sec-delivery"
              className="don-step"
            >
              <span className="don-step-num">
                3
              </span>
              Delivery
            </a>

          </nav>

          {/* ==================================================
              1. DONATION DETAILS
          ================================================== */}

          <section
            id="don-sec-details"
            className="don-section"
          >

            <div className="don-section-head">

              <span className="don-section-icon">
                <i className="bi bi-box-seam"></i>
              </span>

              <div>

                <h3>
                  What are you donating?
                </h3>

                <p>
                  Give your donation a title,
                  select multiple categories,
                  and specify the item and
                  quantity for each category.
                </p>

              </div>

            </div>

            {/* DONATION TITLE */}

            <div className="donation-field">

              <label>
                Donation Title
                <span className="req">
                  *
                </span>
              </label>

              <input
                type="text"
                name="donationName"
                placeholder="e.g. Winter Relief Package"
                value={
                  formData.donationName
                }
                onChange={
                  handleChange
                }
                className={
                  errors.donationName
                    ? "invalid"
                    : ""
                }
              />

              {errors.donationName && (
                <span className="field-error">
                  {
                    errors.donationName
                  }
                </span>
              )}

            </div>

            {/* CATEGORIES */}

            <div className="donation-field">

              <label>
                Categories
                <span className="req">
                  *
                </span>
              </label>

              <p className="category-help">
                Select one or more categories
                included in this donation.
              </p>

              <div className="category-grid">

                {CATEGORIES.map(
                  (category) => {

                    const selected =
                      formData.categories.some(
                        (item) =>
                          item.category ===
                          category.value
                      );

                    return (
                      <button
                        key={
                          category.value
                        }
                        type="button"
                        className={`category-option ${
                          selected
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          toggleCategory(
                            category.value
                          )
                        }
                      >

                        <i
                          className={`bi ${category.icon}`}
                        ></i>

                        <span>
                          {
                            category.label
                          }
                        </span>

                        {selected && (
                          <i className="bi bi-check-circle-fill category-check"></i>
                        )}

                      </button>
                    );
                  }
                )}

              </div>

              {errors.categories && (
                <span className="field-error">
                  {
                    errors.categories
                  }
                </span>
              )}

            </div>

            {/* SELECTED CATEGORY DETAILS */}

            {formData.categories.length >
              0 && (
              <div className="selected-category-list">

                <div className="selected-category-heading">

                  <h4>
                    Category Details
                  </h4>

                  <span>
                    Add an item name,
                    quantity, unit and
                    condition for each
                    selected category.
                  </span>

                </div>

                {formData.categories.map(
                  (
                    item,
                    index
                  ) => {

                    const category =
                      CATEGORIES.find(
                        (value) =>
                          value.value ===
                          item.category
                      );

                    return (
                      <div
                        key={
                          item.category
                        }
                        className="selected-category-card"
                      >

                        {/* HEADER */}

                        <div className="selected-category-header">

                          <div className="selected-category-title">

                            <span className="selected-category-icon">

                              <i
                                className={`bi ${
                                  category?.icon ||
                                  "bi-tag"
                                }`}
                              ></i>

                            </span>

                            <div>

                              <strong>
                                {
                                  category?.label ||
                                  item.category
                                }
                              </strong>

                              <small>
                                Category{" "}
                                {index + 1}
                              </small>

                            </div>

                          </div>

                          <button
                            type="button"
                            className="remove-category-btn"
                            onClick={() =>
                              toggleCategory(
                                item.category
                              )
                            }
                          >
                            <i className="bi bi-x-circle"></i>
                            Remove
                          </button>

                        </div>

                        {/* ITEM NAME */}

                        <div className="donation-field">

                          <label>
                            Item Name
                            <span className="req">
                              *
                            </span>
                          </label>

                          <input
                            type="text"
                            placeholder={
                              item.category ===
                              "food"
                                ? "e.g. Rice"
                                : item.category ===
                                  "clothing"
                                ? "e.g. Blankets"
                                : item.category ===
                                  "toys"
                                ? "e.g. Toy Cars"
                                : item.category ===
                                  "medicine"
                                ? "e.g. First Aid Kits"
                                : item.category ===
                                  "books"
                                ? "e.g. School Books"
                                : item.category ===
                                  "household"
                                ? "e.g. Bedsheets"
                                : item.category ===
                                  "electronics"
                                ? "e.g. Tablets"
                                : "e.g. Furniture"
                            }
                            value={
                              item.itemName
                            }
                            onChange={(e) =>
                              updateCategory(
                                index,
                                "itemName",
                                e.target.value
                              )
                            }
                            className={
                              errors[
                                `category-${index}`
                              ]
                                ? "invalid"
                                : ""
                            }
                          />

                        </div>

                        {/* QUANTITY / UNIT / CONDITION */}

                        <div className="donation-row">

                          <div className="donation-field">

                            <label>
                              Quantity
                              <span className="req">
                                *
                              </span>
                            </label>

                            <input
                              type="number"
                              min="1"
                              placeholder="e.g. 20"
                              value={
                                item.quantity
                              }
                              onChange={(e) =>
                                updateCategory(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                            />

                          </div>

                          <div className="donation-field">

                            <label>
                              Unit
                            </label>

                            <select
                              value={
                                item.unit
                              }
                              onChange={(e) =>
                                updateCategory(
                                  index,
                                  "unit",
                                  e.target.value
                                )
                              }
                            >

                              {UNITS.map(
                                (unit) => (
                                  <option
                                    key={
                                      unit.value
                                    }
                                    value={
                                      unit.value
                                    }
                                  >
                                    {
                                      unit.label
                                    }
                                  </option>
                                )
                              )}

                            </select>

                          </div>

                          <div className="donation-field">

                            <label>
                              Condition
                            </label>

                            <select
                              value={
                                item.condition
                              }
                              onChange={(e) =>
                                updateCategory(
                                  index,
                                  "condition",
                                  e.target.value
                                )
                              }
                            >

                              {CONDITIONS.map(
                                (
                                  condition
                                ) => (
                                  <option
                                    key={
                                      condition
                                    }
                                    value={
                                      condition
                                    }
                                  >
                                    {
                                      condition
                                    }
                                  </option>
                                )
                              )}

                            </select>

                          </div>

                        </div>

                        {/* OTHER CATEGORY */}

                        {item.category ===
                          "other" && (
                          <div className="donation-field">

                            <label>
                              Specify Category
                              <span className="req">
                                *
                              </span>
                            </label>

                            <input
                              type="text"
                              placeholder="e.g. Furniture"
                              value={
                                item.customCategory
                              }
                              onChange={(e) =>
                                updateCategory(
                                  index,
                                  "customCategory",
                                  e.target.value
                                )
                              }
                            />

                          </div>
                        )}

                        {/* ERROR */}

                        {errors[
                          `category-${index}`
                        ] && (
                          <span className="field-error">
                            {
                              errors[
                                `category-${index}`
                              ]
                            }
                          </span>
                        )}

                        {/* LIVE SUMMARY */}

                        <div className="don-item-summary">

                          <i
                            className={`bi ${
                              category?.icon ||
                              "bi-box"
                            }`}
                          ></i>

                          <strong>
                            {
                              item.itemName ||
                              "Item name not set"
                            }
                          </strong>

                          <span>
                            {item.category ===
                            "other"
                              ? item.customCategory ||
                                "Other"
                              : category?.label ||
                                "No category"}
                          </span>

                          <span>
                            {item.quantity
                              ? `${item.quantity} ${item.unit}`
                              : "Quantity not set"}
                          </span>

                          <span>
                            {
                              item.condition
                            }
                          </span>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

            {/* DESCRIPTION */}

            <div className="donation-field">

              <label>
                Description
                <span className="opt">
                  Optional
                </span>
              </label>

              <textarea
                name="description"
                rows="4"
                placeholder="Describe what is included in this donation..."
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
              />

            </div>

            {/* IMAGES */}

            <div className="donation-field">

              <label>
                Donation Photos
                <span className="opt">
                  Optional
                </span>
              </label>

              <input
                id="itemImages"
                type="file"
                multiple
                accept="image/*"
                className="don-file-input"
                onChange={
                  handleImageChange
                }
              />

              {formData.itemImages.length >
                0 && (
                <span className="don-file-count">
                  {
                    formData.itemImages.length
                  }{" "}
                  photo
                  {formData.itemImages
                    .length >
                  1
                    ? "s"
                    : ""}{" "}
                  selected
                </span>
              )}

            </div>

          </section>

          {/* ==================================================
              2. AVAILABILITY
          ================================================== */}

          <section
            id="don-sec-availability"
            className="don-section"
          >

            <div className="don-section-head">

              <span className="don-section-icon">

                <i className="bi bi-clock-history"></i>

              </span>

              <div>

                <h3>
                  When is it available?
                </h3>

                <p>
                  Set a pickup window or
                  make it available right now.
                </p>

              </div>

              <button
                type="button"
                className={`don-toggle ${
                  immediate
                    ? "is-on"
                    : ""
                }`}
                onClick={
                  toggleImmediate
                }
                aria-pressed={
                  immediate
                }
              >

                <span className="don-toggle-track">
                  <span className="don-toggle-thumb" />
                </span>

                Available now

              </button>

            </div>

            {/* FROM */}

            <div className="availability-card from">

              <div className="availability-header">

                <span className="dot green"></span>

                Available From

              </div>

              <div className="donation-row">

                <div className="donation-field">

                  <label>
                    Date
                  </label>

                  <input
                    type="date"
                    name="availableFromDate"
                    value={
                      formData.availableFromDate
                    }
                    min={
                      today
                    }
                    disabled={
                      immediate
                    }
                    onChange={
                      handleFromChange
                    }
                  />

                </div>

                <div className="donation-field">

                  <label>
                    Time
                  </label>

                  <input
                    type="time"
                    name="availableFromTime"
                    value={
                      formData.availableFromTime
                    }
                    min={
                      formData.availableFromDate ===
                      today
                        ? getCurrentTime()
                        : undefined
                    }
                    disabled={
                      immediate
                    }
                    onChange={
                      handleFromChange
                    }
                  />

                </div>

              </div>

            </div>

            {/* UNTIL */}

            <div className="availability-card until">

              <div className="availability-header">

                <span className="dot red"></span>

                Available Until

              </div>

              <div className="preset-row">

                {UNTIL_PRESETS.map(
                  (preset) => (
                    <button
                      key={
                        preset.label
                      }
                      type="button"
                      className="preset-btn"
                      onClick={() =>
                        applyUntilPreset(
                          preset.days
                        )
                      }
                    >
                      {preset.label}
                    </button>
                  )
                )}

              </div>

              <div className="donation-row">

                <div className="donation-field">

                  <label>
                    Date
                  </label>

                  <input
                    type="date"
                    name="availableUntilDate"
                    value={
                      formData.availableUntilDate
                    }
                    min={
                      formData.availableFromDate ||
                      today
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div className="donation-field">

                  <label>
                    Time
                  </label>

                  <input
                    type="time"
                    name="availableUntilTime"
                    value={
                      formData.availableUntilTime
                    }
                    min={
                      formData.availableUntilDate ===
                      formData.availableFromDate
                        ? formData.availableFromTime
                        : undefined
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

              {errors.availability && (
                <span className="field-error">
                  {
                    errors.availability
                  }
                </span>
              )}

            </div>

          </section>

          {/* ==================================================
              3. DELIVERY
          ================================================== */}

          <section
            id="don-sec-delivery"
            className="don-section"
          >

            <div className="don-section-head">

              <span className="don-section-icon">

                <i className="bi bi-truck"></i>

              </span>

              <div>

                <h3>
                  How can it be delivered?
                </h3>

                <p>
                  Select every method you
                  are willing to use.
                </p>

              </div>

            </div>

            <div className="delivery-grid">

              {DELIVERY_OPTIONS.map(
                (option) => {

                  const active =
                    formData
                      .allowedDeliveryMethods
                      .includes(
                        option.value
                      );

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      className={`delivery-option ${
                        active
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        toggleDeliveryMethod(
                          option.value
                        )
                      }
                      aria-pressed={
                        active
                      }
                    >

                      <i
                        className={`bi ${option.icon}`}
                      ></i>

                      {
                        option.label
                      }

                      {active && (
                        <i className="bi bi-check-circle-fill delivery-check"></i>
                      )}

                    </button>
                  );
                }
              )}

            </div>

            {errors.deliveryMethods && (
              <span className="field-error">
                {
                  errors.deliveryMethods
                }
              </span>
            )}

          </section>

          {/* ==================================================
              SUBMIT
          ================================================== */}

          <button
            type="submit"
            className="donation-submit"
            disabled={
              loading ||
              targetNGOLoading ||
              Boolean(
                ngoId &&
                !targetNGO
              )
            }
          >
            {loading
              ? "Creating Donation..."
              : ngoId
              ? "Create Donation for NGO"
              : "Create Donation"}
          </button>

        </form>

        {/* ==================================================
            LIVE SUMMARY
        ================================================== */}

        <aside className="don-summary">

          <div className="don-summary-card">

            {/* DIRECT NGO */}

            {ngoId &&
              targetNGO && (
                <>
                  <span className="don-summary-eyebrow">
                    Direct NGO Donation
                  </span>

                  <div className="don-summary-target">

                    <div className="don-summary-target-icon">
                      <i className="bi bi-building-check"></i>
                    </div>

                    <div>

                      <strong>
                        {
                          targetNGO.organizationName ||
                          targetNGO.name
                        }
                      </strong>

                      <small>
                        Reserved for this NGO
                      </small>

                    </div>

                  </div>
                </>
              )}

            {!ngoId && (
              <span className="don-summary-eyebrow">
                Donation Preview
              </span>
            )}

            <h4 className="don-summary-title">
              {
                formData.donationName ||
                "Untitled donation"
              }
            </h4>

            {/* ==================================================
                CATEGORIES
            ================================================== */}

            <div className="don-summary-divider" />

            <div className="don-summary-items">

              {formData.categories.length >
              0 ? (
                formData.categories.map(
                  (
                    item,
                    index
                  ) => {

                    const category =
                      CATEGORIES.find(
                        (value) =>
                          value.value ===
                          item.category
                      );

                    return (
                      <div
                        key={
                          item.category
                        }
                        className="don-summary-item"
                      >

                        <div className="don-summary-item-title">

                          <span>
                            {index + 1}.
                          </span>

                          <strong>
                            {
                              item.itemName ||
                              "Item name not set"
                            }
                          </strong>

                        </div>

                        <div className="don-summary-row">

                          <i
                            className={`bi ${
                              category?.icon ||
                              "bi-tag"
                            }`}
                          ></i>

                          {item.category ===
                          "other"
                            ? item.customCategory ||
                              "Other"
                            : category?.label ||
                              "No category"}

                        </div>

                        <div className="don-summary-row">

                          <i className="bi bi-stack"></i>

                          {item.quantity
                            ? `${item.quantity} ${item.unit}`
                            : "Quantity not set"}

                          <span className="don-summary-dot">
                            •
                          </span>

                          {
                            item.condition
                          }

                        </div>

                      </div>
                    );
                  }
                )
              ) : (
                <span className="don-summary-empty">
                  No categories selected
                </span>
              )}

            </div>

            {/* ==================================================
                AVAILABILITY
            ================================================== */}

            <div className="don-summary-divider" />

            <div className="don-summary-row">

              <i className="bi bi-clock"></i>

              {fromLabel &&
              untilLabel ? (
                <span>

                  {fromLabel}

                  <span className="don-summary-arrow">
                    →
                  </span>

                  {untilLabel}

                </span>
              ) : (
                "Availability window not set"
              )}

            </div>

            {/* ==================================================
                DELIVERY
            ================================================== */}

            <div className="don-summary-divider" />

            <div className="don-summary-chips">

              {selectedDeliveryLabels.length >
              0 ? (
                selectedDeliveryLabels.map(
                  (option) => (
                    <span
                      key={
                        option.value
                      }
                      className="don-summary-chip"
                    >

                      <i
                        className={`bi ${option.icon}`}
                      ></i>

                      {
                        option.label
                      }

                    </span>
                  )
                )
              ) : (
                <span className="don-summary-empty">
                  No delivery method selected
                </span>
              )}

            </div>

            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            {formData.description && (
              <>
                <div className="don-summary-divider" />

                <p className="don-summary-desc">
                  {
                    formData.description
                  }
                </p>
              </>
            )}

          </div>

        </aside>

      </div>

    </DashboardLayout>
  );
}

export default CreateDonation;