import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import indianStates from "../data/indianStates";
import "../styles/UserManagement.css";
import { Link } from "react-router-dom";

const BACKEND_URL = "http://localhost:5000";

function UserManagement() {
  // =====================================================
  // STATE
  // =====================================================

  const [users, setUsers] = useState([]);

  const [role, setRole] = useState("all");

  const [search, setSearch] = useState("");

  // new = newest first
  // old = oldest first
  const [sortOrder, setSortOrder] = useState("new");

  // Additional filter
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);

  const [errors, setErrors] = useState({});

  const [selectedUser, setSelectedUser] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    role: "donor",
    profileImage: "",
    isApproved: false,
    isBlocked: false,
  });

  // =====================================================
  // FETCH USERS
  // =====================================================

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const url =
        role === "all"
          ? "/admin/users"
          : `/admin/users/${role}`;

      const res = await API.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data);
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

  // =====================================================
  // APPROVE USER
  // =====================================================

  const approveUser = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await API.put(
        `/admin/users/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers();
    } catch (error) {
      console.error("Approve user error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to approve user."
      );
    }
  };

  // =====================================================
  // BLOCK USER
  // =====================================================

  const blockUser = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await API.put(
        `/admin/users/${id}/block`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers();
    } catch (error) {
      console.error("Block user error:", error);
    }
  };

  // =====================================================
  // UNBLOCK USER
  // =====================================================

  const unblockUser = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await API.put(
        `/admin/users/${id}/unblock`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers();
    } catch (error) {
      console.error("Unblock user error:", error);
    }
  };

  // =====================================================
  // DELETE USER
  // =====================================================

  const deleteUser = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user?"
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await API.put(
        `/admin/users/${id}/delete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers();
    } catch (error) {
      console.error("Delete user error:", error);
    }
  };

  // =====================================================
  // FILTER + SEARCH + SORT
  // =====================================================

  const filteredUsers = users
    .filter((user) => {
      // ---------------------------------------------
      // SEARCH FILTER
      // ---------------------------------------------

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        user.name
          ?.toLowerCase()
          .includes(searchText) ||
        user.email
          ?.toLowerCase()
          .includes(searchText) ||
        user.organizationName
          ?.toLowerCase()
          .includes(searchText) ||
        user.phone
          ?.toLowerCase()
          .includes(searchText);

      // ---------------------------------------------
      // ROLE FILTER
      // ---------------------------------------------

      const matchesRole =
        role === "all" ||
        user.role === role;

      // ---------------------------------------------
      // STATUS FILTER
      // ---------------------------------------------

      let matchesStatus = true;

      if (statusFilter === "approved") {
        matchesStatus =
          user.isApproved === true &&
          user.isBlocked !== true;
      }

      if (statusFilter === "pending") {
        matchesStatus =
          user.isApproved !== true &&
          user.isBlocked !== true;
      }

      if (statusFilter === "blocked") {
        matchesStatus =
          user.isBlocked === true;
      }

      // ---------------------------------------------
      // FINAL FILTER RESULT
      // ---------------------------------------------

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    })
    .sort((a, b) => {
      // ---------------------------------------------
      // SORT BY CREATED DATE
      // ---------------------------------------------

      const dateA = new Date(
        a.createdAt
      ).getTime();

      const dateB = new Date(
        b.createdAt
      ).getTime();

      // Newest first
      if (sortOrder === "new") {
        return dateB - dateA;
      }

      // Oldest first
      return dateA - dateB;
    });

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get(
        `/admin/users/details/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Backend returns:
      //
      // {
      //   user: {...},
      //   stats: {...},
      //   donations: [...],
      //   requests: [...],
      //   deliveries: [...],
      //   campaigns: [...]
      // }
      //
      // Therefore we need res.data.user

      setSelectedUser(res.data.user);

      setErrors({});

      setShowModal(true);
    } catch (error) {
      console.error(
        "Get user details error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to fetch user details."
      );
    }
  };

  // =====================================================
  // HANDLE FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setSelectedUser((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    // Clear individual field error
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================

  const validateForm = () => {
    const newErrors = {};

    // ---------------------------------------------
    // NAME
    // ---------------------------------------------

    if (!selectedUser.name?.trim()) {
      newErrors.name = "Name is required";
    } else if (
      selectedUser.name.trim().length < 3
    ) {
      newErrors.name =
        "Minimum 3 characters";
    }

    // ---------------------------------------------
    // EMAIL
    // ---------------------------------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!selectedUser.email?.trim()) {
      newErrors.email =
        "Email is required";
    } else if (
      !emailRegex.test(
        selectedUser.email
      )
    ) {
      newErrors.email =
        "Invalid email address";
    }

    // ---------------------------------------------
    // PHONE
    // ---------------------------------------------

    const phoneRegex = /^[0-9]{10}$/;

    if (!selectedUser.phone?.trim()) {
      newErrors.phone =
        "Phone number is required";
    } else if (
      !phoneRegex.test(
        selectedUser.phone
      )
    ) {
      newErrors.phone =
        "Phone must contain exactly 10 digits";
    }

    // ---------------------------------------------
    // ADDRESS
    // ---------------------------------------------

    if (!selectedUser.address?.trim()) {
      newErrors.address =
        "Address is required";
    }

    // ---------------------------------------------
    // CITY
    // ---------------------------------------------

    if (!selectedUser.city?.trim()) {
      newErrors.city =
        "City is required";
    }

    // ---------------------------------------------
    // STATE
    // ---------------------------------------------

    if (!selectedUser.state?.trim()) {
      newErrors.state =
        "State is required";
    }

    // ---------------------------------------------
    // PINCODE
    // ---------------------------------------------

    const pinRegex = /^[0-9]{6}$/;

    if (!selectedUser.pincode?.trim()) {
      newErrors.pincode =
        "Pincode is required";
    } else if (
      !pinRegex.test(
        selectedUser.pincode
      )
    ) {
      newErrors.pincode =
        "Pincode must contain 6 digits";
    }

    // ---------------------------------------------
    // ROLE
    // ---------------------------------------------

    if (!selectedUser.role) {
      newErrors.role =
        "Please select a role";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  // =====================================================
  // UPDATE USER
  // =====================================================

  const updateUser = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      await API.put(
        `/admin/users/${selectedUser._id}`,
        selectedUser,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        "User updated successfully."
      );

      setShowModal(false);

      fetchUsers();
    } catch (error) {
      console.error(
        "Update user error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update user."
      );
    }
  };

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters = () => {
    setSearch("");
    setRole("all");
    setStatusFilter("all");
    setSortOrder("new");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <DashboardLayout>

      <PageHeader
        title="User Management"
        subtitle="Manage all users in the system."
      />

      <div className="um">

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="um-toolbar">

          {/* SEARCH */}

          <div className="um-search-wrapper">

            <span className="um-search-icon">
              🔍
            </span>

            <input
              className="um-search"
              placeholder="Search users, organizations..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="um-search-clear"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>
            )}

          </div>

          {/* SORT */}

          <select
            className="um-sort"
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value)
            }
          >
            <option value="new">
              Newest First
            </option>

            <option value="old">
              Oldest First
            </option>
          </select>

          {/* STATUS FILTER */}

          <select
            className="um-sort"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="blocked">
              Blocked
            </option>
          </select>

          {/* RESET */}

          {(search ||
            role !== "all" ||
            statusFilter !== "all" ||
            sortOrder !== "new") && (
            <button
              type="button"
              className="um-reset-btn"
              onClick={resetFilters}
            >
              ↻ Reset
            </button>
          )}

        </div>

        {/* =================================================
            ROLE FILTERS
        ================================================= */}

        <div className="um-filters">

          <button
            className={`um-filter-btn ${
              role === "all"
                ? "is-active"
                : ""
            }`}
            onClick={() =>
              setRole("all")
            }
          >
            All
          </button>

          <button
            className={`um-filter-btn ${
              role === "donor"
                ? "is-active"
                : ""
            }`}
            onClick={() =>
              setRole("donor")
            }
          >
            Donors
          </button>

          <button
            className={`um-filter-btn ${
              role === "ngo"
                ? "is-active"
                : ""
            }`}
            onClick={() =>
              setRole("ngo")
            }
          >
            NGOs
          </button>

          <button
            className={`um-filter-btn ${
              role === "volunteer"
                ? "is-active"
                : ""
            }`}
            onClick={() =>
              setRole("volunteer")
            }
          >
            Volunteers
          </button>

        </div>

        {/* =================================================
            RESULT COUNT
        ================================================= */}

        <div className="um-result-info">

          <span>
            Showing{" "}
            <strong>
              {filteredUsers.length}
            </strong>{" "}
            of{" "}
            <strong>
              {users.length}
            </strong>{" "}
            users
          </span>

          {sortOrder === "new" && (
            <span className="um-sort-info">
              Newest users first
            </span>
          )}

          {sortOrder === "old" && (
            <span className="um-sort-info">
              Oldest users first
            </span>
          )}

        </div>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {filteredUsers.length === 0 ? (

          <div className="um-empty">

            <div className="um-empty-icon">
              👥
            </div>

            <h4>
              No users found
            </h4>

            <p>
              Try changing your search
              or filter options.
            </p>

            <button
              className="um-reset-btn"
              onClick={resetFilters}
            >
              Clear Filters
            </button>

          </div>

        ) : (

          /* =================================================
             USER GRID
          ================================================= */

          <div className="um-grid">

            {filteredUsers.map((user) => {

              const isOrgDonor =
                user.role === "donor" &&
                user.donorType ===
                  "organization";

              const displayName =
                isOrgDonor
                  ? user.organizationName ||
                    user.name
                  : user.name;

              const displayIcon =
                isOrgDonor
                  ? "🏢"
                  : user.role === "ngo"
                  ? "🏛️"
                  : user.role === "volunteer"
                  ? "🚚"
                  : "👤";

              return (

                <div
                  key={user._id}
                  className="um-card"
                >

                  {/* =================================================
                     PROFILE PHOTO
                  ================================================= */}

                  <div className="um-profile-image">

                    {user.profileImage ? (

                      <a
                        href={`${BACKEND_URL}${user.profileImage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >

                        <img
                          src={`${BACKEND_URL}${user.profileImage}`}
                          alt="Profile"
                          className="um-profile-photo"
                        />

                      </a>

                    ) : (

                      <div className="um-profile-placeholder">
                        👤
                      </div>

                    )}

                  </div>

                  {/* =================================================
                     NAME
                  ================================================= */}

                  <h4 className="um-heading um-card-name">

                    <span className="um-card-icon">
                      {displayIcon}
                    </span>

                    {displayName ||
                      "Unnamed User"}

                  </h4>

                  {/* =================================================
                     NGO INFORMATION
                  ================================================= */}

                  {user.role === "ngo" && (

                    <div className="um-card-orgblock">

                      <p className="um-card-row">

                        <strong>
                          Organization:
                        </strong>{" "}

                        {user.organizationName ||
                          "-"}

                      </p>

                      <p className="um-card-row">

                        <strong>
                          NGO Category:
                        </strong>{" "}

                        <span className="badge bg-primary">
                          {user.ngoCategory ||
                            "-"}
                        </span>

                      </p>

                      <div className="um-card-row">

                        <strong>
                          Registration Certificate:
                        </strong>{" "}

                        {user.registrationCertificate ? (

                          <a
                            href={`${BACKEND_URL}${user.registrationCertificate}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            📄 View Certificate
                          </a>

                        ) : (

                          <span>
                            Not Uploaded
                          </span>

                        )}

                      </div>

                    </div>

                  )}

                  {/* =================================================
                     BASIC INFORMATION
                  ================================================= */}

                  <p className="um-card-row">
                    📧 {user.email || "-"}
                  </p>

                  <p className="um-card-row">
                    📱 {user.phone || "-"}
                  </p>

                  <p className="um-card-row">
                    🏠 {user.address || "No address"}
                  </p>

                  <p className="um-card-row">

                    🏙{" "}
                    {user.city || "-"},{" "}
                    {user.state || "-"}

                  </p>

                  <p className="um-card-row">
                    📮 {user.pincode || "-"}
                  </p>

                  {/* =================================================
                     ROLE / DONOR TYPE
                  ================================================= */}

                  <div className="um-card-meta">

                    <div>

                      <strong>
                        Role:
                      </strong>

                      <span
                        className={`um-badge ${
                          user.role === "donor"
                            ? "um-badge--role-donor"
                            : user.role === "ngo"
                            ? "um-badge--role-ngo"
                            : "um-badge--role-volunteer"
                        }`}
                      >
                        {user.role}
                      </span>

                    </div>

                    {user.role === "donor" && (

                      <div>

                        <strong>
                          Donor Type:
                        </strong>

                        <span className="um-badge um-badge--donortype">

                          {isOrgDonor
                            ? "Organization"
                            : "Individual"}

                        </span>

                      </div>

                    )}

                  </div>

                  {/* =================================================
                     ORGANIZATION DONOR DETAILS
                  ================================================= */}

                  {isOrgDonor && (

                    <div className="um-card-orgblock">

                      <p className="um-card-row">

                        <strong>
                          Organization Category:
                        </strong>{" "}

                        {user.organizationCategory ||
                          "-"}

                      </p>

                      <p className="um-card-row">

                        <strong>
                          GST Number:
                        </strong>{" "}

                        {user.gstNumber ||
                          "Not Provided"}

                      </p>

                      <div className="um-card-row">

                        <strong>
                          GST Certificate:
                        </strong>{" "}

                        {user.gstCertificate ? (

                          <a
                            href={`${BACKEND_URL}${user.gstCertificate}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            📄 View GST
                          </a>

                        ) : (

                          <span>
                            Not Uploaded
                          </span>

                        )}

                      </div>

                    </div>

                  )}

                  {/* =================================================
                     VOLUNTEER VEHICLE INFORMATION
                  ================================================= */}

                  {user.role === "volunteer" && (

                    <div className="um-card-meta um-card-vehicle">

                      <h6 className="text-primary fw-bold">
                        🚗 Vehicle Information
                      </h6>

                      <div className="um-card-row">

                        <strong>
                          Vehicle:
                        </strong>{" "}

                        {user.vehicleType ||
                          "-"}

                      </div>

                      <div className="um-card-row">

                        <strong>
                          Vehicle No:
                        </strong>{" "}

                        {user.vehicleNumber ||
                          "-"}

                      </div>

                      <div className="um-card-row">

                        <strong>
                          Capacity:
                        </strong>{" "}

                        {user.vehicleCapacity ||
                          "-"}

                      </div>

                      <div className="um-card-row">

                        <strong>
                          Availability:
                        </strong>{" "}

                        <span className="badge bg-success ms-2">
                          {user.availability ||
                            "-"}
                        </span>

                      </div>

                      <div className="um-card-row">

                        <strong>
                          License:
                        </strong>{" "}

                        {user.licenseNumber ||
                          "Not Provided"}

                      </div>

                      {/* DRIVING LICENCE */}

                      <div className="um-card-row">

                        <strong>
                          Driving Licence:
                        </strong>{" "}

                        {user.licenseImage ? (

                          <a
                            href={`${BACKEND_URL}${user.licenseImage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            🪪 View
                          </a>

                        ) : (

                          <span>
                            Not Uploaded
                          </span>

                        )}

                      </div>

                      {/* GOVERNMENT ID */}

                      <div className="um-card-row">

                        <strong>
                          Government ID:
                        </strong>{" "}

                        {user.governmentIdImage ? (

                          <a
                            href={`${BACKEND_URL}${user.governmentIdImage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            🆔 View
                          </a>

                        ) : (

                          <span>
                            Not Uploaded
                          </span>

                        )}

                      </div>

                      {/* VEHICLE RC */}

                      <div className="um-card-row">

                        <strong>
                          Vehicle RC:
                        </strong>{" "}

                        {user.vehicleRCImage ? (

                          <a
                            href={`${BACKEND_URL}${user.vehicleRCImage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            🚗 View
                          </a>

                        ) : (

                          <span>
                            Not Uploaded
                          </span>

                        )}

                      </div>

                    </div>

                  )}

                  {/* =================================================
                     STATUS
                  ================================================= */}

                  <p className="um-status-line">

                    <strong>
                      Status:
                    </strong>

                    {user.isApproved ? (

                      <span className="um-badge um-badge--approved">
                        Approved
                      </span>

                    ) : (

                      <span className="um-badge um-badge--pending">
                        Pending Approval
                      </span>

                    )}

                    {user.isBlocked && (

                      <span className="um-badge um-badge--blocked">
                        Blocked
                      </span>

                    )}

                  </p>

                  {/* =================================================
                     ACTIONS
                  ================================================= */}

                  <div className="um-actions">

                    {/* APPROVE */}

                    {!user.isApproved &&
                      (
                        user.role !== "donor" ||
                        (
                          user.role === "donor" &&
                          user.donorType ===
                            "organization"
                        )
                      ) && (

                        <button
                          className="um-btn um-btn--approve"
                          onClick={() =>
                            approveUser(
                              user._id
                            )
                          }
                        >
                          ✅ Approve
                        </button>

                    )}

                    {/* BLOCK / UNBLOCK */}

                    {!user.isBlocked ? (

                      <button
                        className="um-btn um-btn--block"
                        onClick={() =>
                          blockUser(
                            user._id
                          )
                        }
                      >
                        🚫 Block
                      </button>

                    ) : (

                      <button
                        className="um-btn um-btn--unblock"
                        onClick={() =>
                          unblockUser(
                            user._id
                          )
                        }
                      >
                        🔓 Unblock
                      </button>

                    )}

                    {/* DELETE */}

                    <button
                      className="um-btn um-btn--delete"
                      onClick={() =>
                        deleteUser(
                          user._id
                        )
                      }
                    >
                      🗑 Delete
                    </button>

                    {/* EDIT */}

                    <button
                      className="um-btn um-btn--edit"
                      onClick={() =>
                        openEditModal(
                          user._id
                        )
                      }
                    >
                      ✏ Edit
                    </button>

                    {/* VIEW PROFILE */}

                    <Link
                      to={`/admin/users/${user._id}`}
                      className="um-btn um-btn--view"
                    >
                      👤 View Profile
                    </Link>

                  </div>

                </div>

              );
            })}

          </div>

        )}

        {/* =================================================
            EDIT USER MODAL
        ================================================= */}

        {showModal && (

          <div className="um-modal-backdrop">

            <div className="um-modal">

              {/* MODAL HEADER */}

              <div className="um-modal-header">

                <h4 className="um-heading um-modal-title">
                  ✏ Edit User
                </h4>

                <button
                  className="um-modal-close"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  ×
                </button>

              </div>

              {/* MODAL BODY */}

              <div className="um-modal-body">

                {/* PROFILE */}

                <div className="um-profile-image">

                  {selectedUser.profileImage ? (

                    <a
                      href={`${BACKEND_URL}${selectedUser.profileImage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >

                      <img
                        src={`${BACKEND_URL}${selectedUser.profileImage}`}
                        alt="Profile"
                        className="um-profile-photo"
                      />

                    </a>

                  ) : (

                    <div className="um-profile-placeholder">
                      👤
                    </div>

                  )}

                </div>

                {/* FORM */}

                <div className="um-form-grid">

                  {/* NAME */}

                  <div className="um-field">

                    <label className="um-label">
                      Name
                    </label>

                    <input
                      type="text"
                      className="um-input"
                      name="name"
                      value={
                        selectedUser.name ||
                        ""
                      }
                      onChange={handleChange}
                    />

                    {errors.name && (
                      <small className="um-error">
                        {errors.name}
                      </small>
                    )}

                  </div>

                  {/* EMAIL */}

                  <div className="um-field">

                    <label className="um-label">
                      Email
                    </label>

                    <input
                      type="email"
                      className="um-input"
                      name="email"
                      value={
                        selectedUser.email ||
                        ""
                      }
                      onChange={handleChange}
                    />

                    {errors.email && (
                      <small className="um-error">
                        {errors.email}
                      </small>
                    )}

                  </div>

                  {/* PHONE */}

                  <div className="um-field">

                    <label className="um-label">
                      Phone
                    </label>

                    <input
                      type="text"
                      className="um-input"
                      name="phone"
                      value={
                        selectedUser.phone ||
                        ""
                      }
                      onChange={handleChange}
                    />

                    {errors.phone && (
                      <small className="um-error">
                        {errors.phone}
                      </small>
                    )}

                  </div>

                  {/* GENDER */}

                  <div className="um-field">

                    <label
                      className="um-label"
                      htmlFor="gender"
                    >
                      Gender
                    </label>

                    <select
                      id="gender"
                      className="um-select"
                      name="gender"
                      value={
                        selectedUser.gender ||
                        ""
                      }
                      onChange={handleChange}
                    >

                      <option value="">
                        Select Gender
                      </option>

                      <option value="male">
                        Male
                      </option>

                      <option value="female">
                        Female
                      </option>

                      <option value="other">
                        Other
                      </option>

                    </select>

                  </div>

                  {/* ROLE */}

                  <div className="um-field">

                    <label className="um-label">
                      Role
                    </label>

                    <select
                      className="um-select"
                      name="role"
                      value={
                        selectedUser.role ||
                        ""
                      }
                      onChange={handleChange}
                    >

                      <option value="donor">
                        Donor
                      </option>

                      <option value="ngo">
                        NGO
                      </option>

                      <option value="volunteer">
                        Volunteer
                      </option>

                    </select>

                    {errors.role && (
                      <small className="um-error">
                        {errors.role}
                      </small>
                    )}

                  </div>

                  {/* ADDRESS */}

                  <div className="um-field um-field--full">

                    <label className="um-label">
                      Address
                    </label>

                    <textarea
                      className="um-textarea"
                      rows="3"
                      name="address"
                      value={
                        selectedUser.address ||
                        ""
                      }
                      onChange={handleChange}
                    />

                    {errors.address && (
                      <small className="um-error">
                        {errors.address}
                      </small>
                    )}

                  </div>

                  {/* CITY / STATE / PINCODE */}

                  <div className="um-form-grid um-form-grid--thirds um-field--full">

                    {/* CITY */}

                    <div className="um-field">

                      <label className="um-label">
                        City
                      </label>

                      <input
                        className="um-input"
                        name="city"
                        value={
                          selectedUser.city ||
                          ""
                        }
                        onChange={handleChange}
                      />

                      {errors.city && (
                        <small className="um-error">
                          {errors.city}
                        </small>
                      )}

                    </div>

                    {/* STATE */}

                    <div className="um-field">

                      <label className="um-label">
                        State
                      </label>

                      <select
                        className="um-select"
                        name="state"
                        value={
                          selectedUser.state ||
                          ""
                        }
                        onChange={handleChange}
                      >

                        <option value="">
                          Select State
                        </option>

                        {indianStates.map(
                          (state) => (
                            <option
                              key={state}
                              value={state}
                            >
                              {state}
                            </option>
                          )
                        )}

                      </select>

                      {errors.state && (
                        <small className="um-error">
                          {errors.state}
                        </small>
                      )}

                    </div>

                    {/* PINCODE */}

                    <div className="um-field">

                      <label className="um-label">
                        Pincode
                      </label>

                      <input
                        className="um-input"
                        name="pincode"
                        value={
                          selectedUser.pincode ||
                          ""
                        }
                        onChange={handleChange}
                      />

                      {errors.pincode && (
                        <small className="um-error">
                          {errors.pincode}
                        </small>
                      )}

                    </div>

                  </div>

                  {/* APPROVED */}

                  <div className="um-field">

                    <div className="um-checkbox-row">

                      <input
                        type="checkbox"
                        className="um-checkbox"
                        id="isApproved"
                        name="isApproved"
                        checked={
                          !!selectedUser.isApproved
                        }
                        onChange={handleChange}
                      />

                      <label
                        className="um-checkbox-label"
                        htmlFor="isApproved"
                      >
                        Approved
                      </label>

                    </div>

                  </div>

                  {/* BLOCKED */}

                  <div className="um-field">

                    <div className="um-checkbox-row">

                      <input
                        type="checkbox"
                        className="um-checkbox"
                        id="isBlocked"
                        name="isBlocked"
                        checked={
                          !!selectedUser.isBlocked
                        }
                        onChange={handleChange}
                      />

                      <label
                        className="um-checkbox-label"
                        htmlFor="isBlocked"
                      >
                        Blocked
                      </label>

                    </div>

                  </div>

                </div>

              </div>

              {/* MODAL FOOTER */}

              <div className="um-modal-footer">

                <button
                  className="um-btn um-btn--cancel"
                  onClick={() => {
                    setShowModal(false);
                    setErrors({});
                  }}
                >
                  Cancel
                </button>

                <button
                  className="um-btn um-btn--save"
                  onClick={updateUser}
                >
                  💾 Save Changes
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </DashboardLayout>
  );
}

export default UserManagement;