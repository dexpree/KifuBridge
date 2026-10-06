import { useEffect, useMemo, useState } from "react";
import API from "../services/api";

import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/MyDonations.css";

// ============================================================
// CONFIG
// ============================================================

const AVAILABILITY_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "expired", label: "Expired" },
  { key: "completed", label: "Completed" },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "endingSoon", label: "Ending soon" },
];

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
// HELPERS
// ============================================================

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// ============================================================
// EMPTY CATEGORY
// ============================================================

const createEmptyCategory = () => ({
  _id: "",
  itemName: "",
  category: "",
  customCategory: "",
  quantity: "",
  unit: "pieces",
  condition: "Good",
});

// ============================================================
// FORMAT DURATION
// ============================================================

const formatDuration = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0h 0m";
  }

  const hours = Math.floor(
    ms / (1000 * 60 * 60)
  );

  const minutes = Math.floor(
    (ms % (1000 * 60 * 60)) /
      (1000 * 60)
  );

  return `${hours}h ${minutes}m`;
};

// ============================================================
// WORKFLOW STATUS
// ============================================================

const getDonationWorkflowStatus = (
  donation
) => {
  const status = String(
    donation?.status || ""
  ).toLowerCase();

  if (
    status === "completed" ||
    status === "complete" ||
    status === "fulfilled" ||
    status === "fully_donated"
  ) {
    return {
      key: "completed",
      color: "success",
      label: "Completed",
    };
  }

  if (
    status === "requested" ||
    status === "request_pending"
  ) {
    return {
      key: "requested",
      color: "warning",
      label: "Requested",
    };
  }

  if (
    status === "approved" ||
    status === "reserved"
  ) {
    return {
      key: "requested",
      color: "warning",
      label: "Reserved",
    };
  }

  return null;
};

// ============================================================
// AVAILABILITY
// ============================================================

const getAvailability = (donation) => {
  const workflowStatus =
    getDonationWorkflowStatus(
      donation
    );

  if (workflowStatus) {
    return workflowStatus;
  }

  const now = new Date();

  const from = new Date(
    donation.availableFrom
  );

  const until = new Date(
    donation.availableUntil
  );

  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(until.getTime())
  ) {
    return {
      key: "active",
      color: "success",
      label: "Available",
    };
  }

  if (now < from) {
    return {
      key: "upcoming",
      color: "warning",
      label: `Starts in ${formatDuration(
        from - now
      )}`,
    };
  }

  if (now > until) {
    return {
      key: "expired",
      color: "danger",
      label: "Expired",
    };
  }

  return {
    key: "active",
    color: "success",
    label: `${formatDuration(
      until - now
    )} left`,
  };
};

// ============================================================
// CREATED TIMESTAMP
// ============================================================

const getCreatedTimestamp = (
  donation
) => {
  return new Date(
    donation?.createdAt ||
      donation?.availableFrom ||
      0
  ).getTime();
};

// ============================================================
// SORT
// ============================================================

const sortDonations = (
  donations,
  sortKey
) => {
  const list = [...donations];

  switch (sortKey) {
    case "oldest":
      return list.sort(
        (a, b) =>
          getCreatedTimestamp(a) -
          getCreatedTimestamp(b)
      );

    case "endingSoon":
      return list.sort(
        (a, b) =>
          new Date(
            a.availableUntil
          ) -
          new Date(
            b.availableUntil
          )
      );

    case "newest":
    default:
      return list.sort(
        (a, b) =>
          getCreatedTimestamp(b) -
          getCreatedTimestamp(a)
      );
  }
};

// ============================================================
// CATEGORY INFO
// ============================================================

const getCategoryInfo = (
  category
) => {
  return (
    CATEGORIES.find(
      (item) =>
        item.value === category
    ) || {
      value: category,
      label:
        category || "Other",
      icon: "bi-box",
    }
  );
};

// ============================================================
// IMAGE URL
// ============================================================

const resolveImageUrl = (image) =>
  image.startsWith("http")
    ? image
    : `http://localhost:5000${
        image.startsWith("/")
          ? image
          : `/${image}`
      }`;

// ============================================================
// COMPONENT
// ============================================================

function MyDonations() {
  const [
    donations,
    setDonations,
  ] = useState([]);

  const [
    filter,
    setFilter,
  ] = useState("all");

  const [
    sortKey,
    setSortKey,
  ] = useState("newest");

  const [
    showEditModal,
    setShowEditModal,
  ] = useState(false);

  const [
    editDonation,
    setEditDonation,
  ] = useState(null);

  const [
    lightboxImage,
    setLightboxImage,
  ] = useState(null);

  // ==========================================================
  // FETCH
  // ==========================================================

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations =
    async () => {
      try {
        const res =
          await API.get(
            "/donations/my-donations",
            getAuthHeaders()
          );

        console.log(
          "MY DONATIONS:",
          res.data
        );

        setDonations(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (error) {
        console.error(
          "Fetch My Donations Error:",
          error
        );

        setDonations([]);
      }
    };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (
    id
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this donation?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(
        `/donations/${id}`,
        getAuthHeaders()
      );

      alert(
        "Donation deleted successfully."
      );

      fetchDonations();
    } catch (error) {
      console.error(
        "Delete Donation Error:",
        error
      );

      alert(
        error.response?.data
          ?.message ||
          "Failed to delete donation."
      );
    }
  };

  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const handleEdit = (
    donation
  ) => {
    const workflowStatus =
      getDonationWorkflowStatus(
        donation
      );

    if (
      workflowStatus?.key ===
      "completed"
    ) {
      alert(
        "Completed donations cannot be edited."
      );

      return;
    }

    if (
      donation.status !==
      "available"
    ) {
      alert(
        "This donation cannot be edited in its current status."
      );

      return;
    }

    const from = new Date(
      donation.availableFrom
    );

    const until = new Date(
      donation.availableUntil
    );

    const categories =
      Array.isArray(
        donation.categories
      ) &&
      donation.categories.length > 0
        ? donation.categories.map(
            (category) => ({
              _id:
                category._id || "",

              itemName:
                category.itemName ||
                "",

              category:
                category.category ||
                "",

              customCategory:
                category.customCategory ||
                "",

              quantity:
                category.quantity ??
                "",

              unit:
                category.unit ||
                "pieces",

              condition:
                category.condition ||
                "Good",
            })
          )
        : [
            createEmptyCategory(),
          ];

    setEditDonation({
      _id:
        donation._id,

      donationName:
        donation.donationName ||
        "",

      categories,

      description:
        donation.description ||
        "",

      availableFromDate:
        from.toISOString()
          .split("T")[0],

      availableFromTime:
        from.toTimeString()
          .slice(0, 5),

      availableUntilDate:
        until.toISOString()
          .split("T")[0],

      availableUntilTime:
        until.toTimeString()
          .slice(0, 5),
    });

    setShowEditModal(
      true
    );
  };

  // ==========================================================
  // EDIT BASIC FIELD
  // ==========================================================

  const handleEditChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setEditDonation(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  // ==========================================================
  // EDIT CATEGORY
  // ==========================================================

  const handleEditCategoryChange =
    (
      index,
      field,
      value
    ) => {
      setEditDonation(
        (previous) => {
          const updated =
            [
              ...(previous.categories ||
                []),
            ];

          updated[index] = {
            ...updated[index],
            [field]: value,
          };

          if (
            field ===
              "category" &&
            value !== "other"
          ) {
            updated[
              index
            ].customCategory =
              "";
          }

          return {
            ...previous,
            categories:
              updated,
          };
        }
      );
    };

  // ==========================================================
  // ADD CATEGORY
  // ==========================================================

  const addEditCategory =
    () => {
      if (
        editDonation.categories
          .length >= 8
      ) {
        alert(
          "A donation can have a maximum of 8 categories."
        );

        return;
      }

      setEditDonation(
        (previous) => ({
          ...previous,

          categories: [
            ...previous.categories,
            createEmptyCategory(),
          ],
        })
      );
    };

  // ==========================================================
  // REMOVE CATEGORY
  // ==========================================================

  const removeEditCategory =
    (index) => {
      if (
        editDonation.categories
          .length === 1
      ) {
        alert(
          "A donation must contain at least one category."
        );

        return;
      }

      setEditDonation(
        (previous) => ({
          ...previous,

          categories:
            previous.categories.filter(
              (
                _,
                categoryIndex
              ) =>
                categoryIndex !==
                index
            ),
        })
      );
    };

  // ==========================================================
  // UPDATE DONATION
  // ==========================================================

  const handleUpdateDonation =
    async () => {
      if (!editDonation) {
        return;
      }

      // ------------------------------------------------------
      // TITLE
      // ------------------------------------------------------

      if (
        !editDonation.donationName?.trim()
      ) {
        alert(
          "Donation title is required."
        );

        return;
      }

      // ------------------------------------------------------
      // CATEGORIES
      // ------------------------------------------------------

      if (
        !Array.isArray(
          editDonation.categories
        ) ||
        editDonation.categories
          .length === 0
      ) {
        alert(
          "Add at least one donation category."
        );

        return;
      }

      // ------------------------------------------------------
      // VALIDATE CATEGORIES
      // ------------------------------------------------------

      const usedCategories =
        new Set();

      for (
        let i = 0;
        i <
        editDonation.categories
          .length;
        i++
      ) {
        const category =
          editDonation.categories[i];

        // Category
        if (
          !category.category
        ) {
          alert(
            `Select a category for category ${
              i + 1
            }.`
          );

          return;
        }

        // Prevent duplicate categories
        if (
          usedCategories.has(
            category.category
          )
        ) {
          alert(
            `Category "${getCategoryInfo(
              category.category
            ).label}" has been selected more than once.`
          );

          return;
        }

        usedCategories.add(
          category.category
        );

        // Item name
        if (
          !category.itemName?.trim()
        ) {
          alert(
            `Enter the item name for category ${
              i + 1
            }.`
          );

          return;
        }

        // Custom category
        if (
          category.category ===
            "other" &&
          !category.customCategory?.trim()
        ) {
          alert(
            `Specify the custom category for category ${
              i + 1
            }.`
          );

          return;
        }

        // Quantity
        if (
          !category.quantity ||
          Number(
            category.quantity
          ) <= 0
        ) {
          alert(
            `Enter a valid quantity for category ${
              i + 1
            }.`
          );

          return;
        }

        // Unit
        if (!category.unit) {
          alert(
            `Select a unit for category ${
              i + 1
            }.`
          );

          return;
        }

        // Condition
        if (
          !category.condition
        ) {
          alert(
            `Select a condition for category ${
              i + 1
            }.`
          );

          return;
        }
      }

      // ------------------------------------------------------
      // DATES
      // ------------------------------------------------------

      const availableFrom =
        new Date(
          `${editDonation.availableFromDate}T${editDonation.availableFromTime}`
        );

      const availableUntil =
        new Date(
          `${editDonation.availableUntilDate}T${editDonation.availableUntilTime}`
        );

      if (
        Number.isNaN(
          availableFrom.getTime()
        ) ||
        Number.isNaN(
          availableUntil.getTime()
        )
      ) {
        alert(
          "Please enter valid availability dates."
        );

        return;
      }

      if (
        availableUntil <=
        availableFrom
      ) {
        alert(
          "Available Until must be later than Available From."
        );

        return;
      }

      // ------------------------------------------------------
      // NORMALIZE CATEGORIES
      // ------------------------------------------------------

      const categories =
        editDonation.categories.map(
          (category) => ({
            ...(category._id
              ? {
                  _id:
                    category._id,
                }
              : {}),

            itemName:
              category.itemName.trim(),

            category:
              category.category,

            customCategory:
              category.category ===
              "other"
                ? category.customCategory
                    .trim()
                : "",

            quantity:
              Number(
                category.quantity
              ),

            unit:
              category.unit,

            condition:
              category.condition ||
              "Good",
          })
        );

      // ------------------------------------------------------
      // API UPDATE
      // ------------------------------------------------------

      try {
        await API.put(
          `/donations/${editDonation._id}`,
          {
            donationName:
              editDonation.donationName.trim(),

            categories,

            description:
              editDonation.description ||
              "",

            availableFrom,

            availableUntil,
          },
          getAuthHeaders()
        );

        alert(
          "Donation updated successfully."
        );

        setShowEditModal(
          false
        );

        setEditDonation(
          null
        );

        fetchDonations();
      } catch (error) {
        console.error(
          "Update Donation Error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Failed to update donation."
        );
      }
    };

  // ==========================================================
  // FILTER + SORT
  // ==========================================================

  const visibleDonations =
    useMemo(() => {
      const filtered =
        donations.filter(
          (donation) => {
            if (
              filter === "all"
            ) {
              return true;
            }

            return (
              getAvailability(
                donation
              ).key ===
              filter
            );
          }
        );

      return sortDonations(
        filtered,
        sortKey
      );
    }, [
      donations,
      filter,
      sortKey,
    ]);

  // ==========================================================
  // COUNTS
  // ==========================================================

  const counts =
    useMemo(() => {
      return {
        all:
          donations.length,

        active:
          donations.filter(
            (donation) =>
              getAvailability(
                donation
              ).key ===
              "active"
          ).length,

        upcoming:
          donations.filter(
            (donation) =>
              getAvailability(
                donation
              ).key ===
              "upcoming"
          ).length,

        expired:
          donations.filter(
            (donation) =>
              getAvailability(
                donation
              ).key ===
              "expired"
          ).length,

        completed:
          donations.filter(
            (donation) =>
              getAvailability(
                donation
              ).key ===
              "completed"
          ).length,
      };
    }, [donations]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      <div className="my-donations">

        <PageHeader
          title="My Donations"
          description="Manage and track all your donations."
        />

        <DonationControls
          filter={filter}
          onFilterChange={
            setFilter
          }
          sortKey={sortKey}
          onSortChange={
            setSortKey
          }
          counts={counts}
        />

        {visibleDonations.length ===
        0 ? (
          <div className="alert alert-info">
            No donations found.
          </div>
        ) : (
          <div className="row">

            {visibleDonations.map(
              (donation) => (
                <DonationCard
                  key={
                    donation._id
                  }
                  donation={
                    donation
                  }
                  onEdit={
                    handleEdit
                  }
                  onDelete={
                    handleDelete
                  }
                  onImageClick={
                    setLightboxImage
                  }
                />
              )
            )}

          </div>
        )}

        {showEditModal &&
          editDonation && (
            <EditDonationModal
              donation={
                editDonation
              }
              onChange={
                handleEditChange
              }
              onCategoryChange={
                handleEditCategoryChange
              }
              onAddCategory={
                addEditCategory
              }
              onRemoveCategory={
                removeEditCategory
              }
              onClose={() => {
                setShowEditModal(
                  false
                );

                setEditDonation(
                  null
                );
              }}
              onSave={
                handleUpdateDonation
              }
            />
          )}

        {lightboxImage && (
          <ImageLightbox
            src={lightboxImage}
            onClose={() =>
              setLightboxImage(null)
            }
          />
        )}

      </div>

    </DashboardLayout>
  );
}

// ============================================================
// CONTROLS
// ============================================================

function DonationControls({
  filter,
  onFilterChange,
  sortKey,
  onSortChange,
  counts,
}) {
  return (
    <div className="donation-controls">

      <div
        className="filter-tabs"
        role="tablist"
      >

        {AVAILABILITY_FILTERS.map(
          (option) => (
            <button
              key={
                option.key
              }
              type="button"
              role="tab"
              aria-selected={
                filter ===
                option.key
              }
              className={`filter-tab ${
                filter ===
                option.key
                  ? "is-active"
                  : ""
              }`}
              onClick={() =>
                onFilterChange(
                  option.key
                )
              }
            >

              {option.label}

              <span className="filter-tab-count">
                {counts[
                  option.key
                ] ?? 0}
              </span>

            </button>
          )
        )}

      </div>

      <select
        className="form-select sort-select"
        value={
          sortKey
        }
        onChange={(e) =>
          onSortChange(
            e.target.value
          )
        }
        aria-label="Sort donations"
      >

        {SORT_OPTIONS.map(
          (option) => (
            <option
              key={
                option.key
              }
              value={
                option.key
              }
            >
              {
                option.label
              }
            </option>
          )
        )}

      </select>

    </div>
  );
}

// ============================================================
// DONATION CARD
// ============================================================

function DonationCard({
  donation,
  onEdit,
  onDelete,
  onImageClick,
}) {
  const availability =
    getAvailability(
      donation
    );

  const workflowStatus =
    getDonationWorkflowStatus(
      donation
    );

  const isCompleted =
    availability.key ===
    "completed";

  const isExpired =
    availability.key ===
    "expired";

  const canManage =
    !isCompleted &&
    !isExpired &&
    donation.status ===
      "available";

  const categories =
    Array.isArray(
      donation.categories
    )
      ? donation.categories
      : [];

  return (
    <div className="col-lg-6 mb-4">

      <div className="card donation-card h-100">

        <div className="card-body">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="donation-card-header">

            <div>

              <span className="badge bg-dark mb-2">

                {categories.length}{" "}

                categor
                {categories.length ===
                1
                  ? "y"
                  : "ies"}

              </span>

              <h4 className="fw-bold mb-0">

                {donation.donationName ||
                  "Untitled Donation"}

              </h4>

            </div>

            <span
              className={`badge status-badge badge-${availability.color}`}
            >
              {
                availability.label
              }
            </span>

          </div>

          {/* ==================================================
              COMPLETED
          ================================================== */}

          {isCompleted && (
            <div className="alert alert-success mt-3 mb-3">

              <i className="bi bi-check-circle-fill me-2"></i>

              <strong>
                Donation Completed
              </strong>

              <br />

              <small>
                All categories in this
                donation have been
                fulfilled successfully.
              </small>

            </div>
          )}

          {/* ==================================================
              REQUESTED
          ================================================== */}

          {!isCompleted &&
            workflowStatus &&
            workflowStatus.key ===
              "requested" && (
              <div className="alert alert-warning mt-3 mb-3">

                <i className="bi bi-hourglass-split me-2"></i>

                <strong>
                  {
                    workflowStatus.label
                  }
                </strong>

                <br />

                <small>
                  This donation is
                  currently being
                  processed.
                </small>

              </div>
            )}

          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          {donation.description && (
            <p className="donation-meta mt-3">

              <strong>
                Description:
              </strong>

              <br />

              {
                donation.description
              }

            </p>
          )}

          {/* ==================================================
              CATEGORIES
          ================================================== */}

          <div className="donation-items-list">

            {categories.length ===
            0 ? (

              <div className="alert alert-warning">
                No categories found.
              </div>

            ) : (

              categories.map(
                (
                  category,
                  index
                ) => {

                  const info =
                    getCategoryInfo(
                      category.category
                    );

                  const displayedCategory =
                    category.category ===
                      "other" &&
                    category.customCategory
                      ? category.customCategory
                      : info.label;

                  return (
                    <div
                      key={
                        category._id ||
                        index
                      }
                      className="donation-item-display"
                    >

                      <div className="donation-item-display-top">

                        {/* ICON */}

                        <div className="donation-item-icon">

                          <i
                            className={`bi ${info.icon}`}
                          ></i>

                        </div>

                        {/* INFO */}

                        <div className="donation-item-info">

                          {/* ITEM NAME */}

                          <h5>
                            {category.itemName ||
                              "Item name unavailable"}
                          </h5>

                          {/* CATEGORY */}

                          <div className="donation-item-category">
                            {displayedCategory}
                          </div>

                          {/* TAGS */}

                          <div className="donation-item-tags">

                            <span>
                              {
                                category.quantity
                              }{" "}
                              {
                                category.unit
                              }
                            </span>

                            <span>
                              {
                                category.condition
                              }
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

          <hr />

          {/* ==================================================
              AVAILABILITY
          ================================================== */}

          <p className="donation-meta">

            📅{" "}

            <strong>
              Available From
            </strong>

            <br />

            {donation.availableFrom
              ? new Date(
                  donation.availableFrom
                ).toLocaleString()
              : "—"}

          </p>

          <p className="donation-meta">

            📅{" "}

            <strong>
              Available Until
            </strong>

            <br />

            {donation.availableUntil
              ? new Date(
                  donation.availableUntil
                ).toLocaleString()
              : "—"}

          </p>

          {/* ==================================================
              PHOTOS
          ================================================== */}

          {Array.isArray(
            donation.itemImages
          ) &&
            donation.itemImages.length >
              0 && (

              <div className="donation-mini-gallery">

                {donation.itemImages.map(
                  (
                    image,
                    index
                  ) => (

                    <img
                      key={`${image}-${index}`}
                      src={resolveImageUrl(
                        image
                      )}
                      alt={`Donation ${
                        index + 1
                      }`}
                      loading="lazy"
                      onClick={() =>
                        onImageClick(
                          resolveImageUrl(
                            image
                          )
                        )
                      }
                    />

                  )
                )}

              </div>
            )}

          {/* ==================================================
              COMPLETED FOOTER
          ================================================== */}

          {isCompleted && (
            <>
              <hr />

              <div className="donation-completed-status">

                <div>

                  <i className="bi bi-check2-all"></i>

                  <strong>
                    Completed
                  </strong>

                </div>

                <span>
                  Thank you for
                  making this
                  donation.
                </span>

              </div>
            </>
          )}

          {/* ==================================================
              ACTIONS
          ================================================== */}

          {canManage && (
            <>
              <hr />

              <div className="donation-actions">

                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() =>
                    onEdit(
                      donation
                    )
                  }
                >
                  <i className="bi bi-pencil me-1"></i>
                  Edit
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() =>
                    onDelete(
                      donation._id
                    )
                  }
                >
                  <i className="bi bi-trash me-1"></i>
                  Delete
                </button>

              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
}

// ============================================================
// IMAGE LIGHTBOX
// ============================================================

function ImageLightbox({
  src,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (
      e
    ) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [onClose]);

  return (
    <div
      className="image-lightbox-backdrop"
      onClick={onClose}
    >

      <div
        className="image-lightbox-content"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <button
          type="button"
          className="image-lightbox-close"
          onClick={onClose}
          aria-label="Close image preview"
        >
          <i className="bi bi-x-lg"></i>
        </button>

        <img
          src={src}
          alt="Donation full view"
        />

      </div>

    </div>
  );
}

// ============================================================
// EDIT MODAL
// ============================================================

function EditDonationModal({
  donation,
  onChange,
  onCategoryChange,
  onAddCategory,
  onRemoveCategory,
  onClose,
  onSave,
}) {
  return (
    <div
      className="modal fade show edit-modal-backdrop"
      style={{
        display: "block",
      }}
    >

      <div className="modal-dialog modal-xl modal-dialog-scrollable">

        <div className="modal-content edit-modal">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="modal-header">

            <div>

              <h4 className="modal-title">
                Edit Donation
              </h4>

              <small className="text-muted">
                Update the donation
                title, item names,
                categories and
                availability.
              </small>

            </div>

            <button
              type="button"
              className="btn-close"
              onClick={
                onClose
              }
            />

          </div>

          {/* =================================================
              BODY
          ================================================= */}

          <div className="modal-body">

            {/* =================================================
                DONATION TITLE
            ================================================= */}

            <div className="mb-4">

              <label className="form-label">
                Donation Title
              </label>

              <input
                type="text"
                name="donationName"
                className="form-control"
                placeholder="e.g. Winter Relief Package"
                value={
                  donation.donationName
                }
                onChange={
                  onChange
                }
              />

            </div>

            {/* =================================================
                CATEGORIES
            ================================================= */}

            <div className="d-flex justify-content-between align-items-center mb-3">

              <h5 className="fw-bold mb-0">
                Donation Categories
              </h5>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={
                  onAddCategory
                }
              >
                <i className="bi bi-plus-lg me-1"></i>
                Add Category
              </button>

            </div>

            <div className="edit-items-list">

              {donation.categories.map(
                (
                  category,
                  index
                ) => {

                  const info =
                    getCategoryInfo(
                      category.category
                    );

                  return (
                    <div
                      className="edit-item-card"
                      key={
                        category._id ||
                        index
                      }
                    >

                      {/* HEADER */}

                      <div className="d-flex justify-content-between align-items-center mb-3">

                        <strong>
                          Category{" "}
                          {index + 1}
                        </strong>

                        {donation.categories
                          .length >
                          1 && (

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              onRemoveCategory(
                                index
                              )
                            }
                          >
                            <i className="bi bi-trash3 me-1"></i>
                            Remove
                          </button>

                        )}

                      </div>

                      {/* =================================================
                          ITEM NAME
                      ================================================= */}

                      <div className="mb-3">

                        <label className="form-label">
                          Item Name
                        </label>

                        <input
                          type="text"
                          className="form-control"
                          placeholder={
                            category.category ===
                            "food"
                              ? "e.g. Rice"
                              : category.category ===
                                "clothing"
                              ? "e.g. Blankets"
                              : category.category ===
                                "medicine"
                              ? "e.g. First Aid Kits"
                              : category.category ===
                                "books"
                              ? "e.g. School Books"
                              : category.category ===
                                "toys"
                              ? "e.g. Toy Cars"
                              : "e.g. Donation Item"
                          }
                          value={
                            category.itemName ||
                            ""
                          }
                          onChange={(
                            e
                          ) =>
                            onCategoryChange(
                              index,
                              "itemName",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      {/* =================================================
                          CATEGORY
                      ================================================= */}

                      <div className="mb-3">

                        <label className="form-label">
                          Category
                        </label>

                        <select
                          className="form-select"
                          value={
                            category.category
                          }
                          onChange={(
                            e
                          ) =>
                            onCategoryChange(
                              index,
                              "category",
                              e.target.value
                            )
                          }
                        >

                          <option value="">
                            Select Category
                          </option>

                          {CATEGORIES.map(
                            (
                              option
                            ) => (

                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {
                                  option.label
                                }
                              </option>

                            )
                          )}

                        </select>

                      </div>

                      {/* =================================================
                          CUSTOM CATEGORY
                      ================================================= */}

                      {category.category ===
                        "other" && (

                        <div className="mb-3">

                          <label className="form-label">
                            Specify Category
                          </label>

                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Furniture"
                            value={
                              category.customCategory ||
                              ""
                            }
                            onChange={(
                              e
                            ) =>
                              onCategoryChange(
                                index,
                                "customCategory",
                                e.target.value
                              )
                            }
                          />

                        </div>

                      )}

                      {/* =================================================
                          QUANTITY + UNIT
                      ================================================= */}

                      <div className="row">

                        <div className="col-md-6 mb-3">

                          <label className="form-label">
                            Quantity
                          </label>

                          <input
                            type="number"
                            min="1"
                            className="form-control"
                            value={
                              category.quantity
                            }
                            onChange={(
                              e
                            ) =>
                              onCategoryChange(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                          />

                        </div>

                        <div className="col-md-6 mb-3">

                          <label className="form-label">
                            Unit
                          </label>

                          <select
                            className="form-select"
                            value={
                              category.unit
                            }
                            onChange={(
                              e
                            ) =>
                              onCategoryChange(
                                index,
                                "unit",
                                e.target.value
                              )
                            }
                          >

                            {UNITS.map(
                              (
                                unit
                              ) => (

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

                      </div>

                      {/* =================================================
                          CONDITION
                      ================================================= */}

                      <div className="mb-0">

                        <label className="form-label">
                          Condition
                        </label>

                        <select
                          className="form-select"
                          value={
                            category.condition
                          }
                          onChange={(
                            e
                          ) =>
                            onCategoryChange(
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
                  );
                }
              )}

            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div className="mb-4 mt-4">

              <label className="form-label">
                Description
              </label>

              <textarea
                rows="3"
                name="description"
                className="form-control"
                value={
                  donation.description
                }
                onChange={
                  onChange
                }
              />

            </div>

            {/* =================================================
                AVAILABILITY
            ================================================= */}

            <h5 className="fw-bold mb-3">
              Availability
            </h5>

            <div className="row">

              <div className="col-md-6 mb-3">

                <label className="form-label">
                  Available From Date
                </label>

                <input
                  type="date"
                  name="availableFromDate"
                  className="form-control"
                  value={
                    donation.availableFromDate
                  }
                  onChange={
                    onChange
                  }
                />

              </div>

              <div className="col-md-6 mb-3">

                <label className="form-label">
                  Available From Time
                </label>

                <input
                  type="time"
                  name="availableFromTime"
                  className="form-control"
                  value={
                    donation.availableFromTime
                  }
                  onChange={
                    onChange
                  }
                />

              </div>

            </div>

            <div className="row">

              <div className="col-md-6">

                <label className="form-label">
                  Available Until Date
                </label>

                <input
                  type="date"
                  name="availableUntilDate"
                  className="form-control"
                  value={
                    donation.availableUntilDate
                  }
                  min={
                    donation.availableFromDate
                  }
                  onChange={
                    onChange
                  }
                />

              </div>

              <div className="col-md-6">

                <label className="form-label">
                  Available Until Time
                </label>

                <input
                  type="time"
                  name="availableUntilTime"
                  className="form-control"
                  value={
                    donation.availableUntilTime
                  }
                  onChange={
                    onChange
                  }
                />

              </div>

            </div>

          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="modal-footer">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={
                onClose
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={
                onSave
              }
            >
              <i className="bi bi-check-lg me-1"></i>
              Save Changes
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default MyDonations;