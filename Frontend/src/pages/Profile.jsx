import { useEffect, useState } from "react";

import DashboardLayout from "../components/DashboardLayout";

import PageHeader from "../components/PageHeader";

import API from "../services/api";

import "../styles/profile.css";

const BACKEND_URL = "http://localhost:5000";

// =====================================================
// FILE URL HELPER
// =====================================================

const getFileUrl = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }

    return `${BACKEND_URL}${value}`;
  }

  return URL.createObjectURL(value);
};

// =====================================================
// PDF CHECK
// =====================================================

const isPdfValue = (value) =>
  typeof value === "string" &&
  value.toLowerCase().endsWith(".pdf");

// =====================================================
// DOCUMENT SLOT
// =====================================================

function DocSlot({
  label,
  value,
  accept = "image/*,.pdf",
  onChange,
}) {
  const url = getFileUrl(value);
  const pdf = isPdfValue(value);

  return (
    <div className="profile-doc-slot">

      <label className="profile-doc-label">
        {label}
      </label>

      {/* Existing document */}
      {url && (
        <div className="profile-doc-preview-area">

          {pdf ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-doc-pdf-link"
            >
              📄 View PDF
            </a>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={url}
                alt={label}
                className="profile-doc-preview"
              />
            </a>
          )}

        </div>
      )}

      {/* Upload / Replace */}
      {onChange && (
        <label className="profile-doc-upload">

          {value
            ? "Replace File"
            : "Upload File"}

          <input
            type="file"
            accept={accept}
            onChange={onChange}
            hidden
          />

        </label>
      )}

    </div>
  );
}

// =====================================================
// PROFILE COMPONENT
// =====================================================

function Profile() {

  const [profile, setProfile] = useState(null);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState({});

  const token = localStorage.getItem("token");

  // =====================================================
  // FETCH PROFILE
  // =====================================================

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {

      const res = await API.get(
        "/users/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "MY PROFILE:",
        res.data
      );

      setProfile(res.data);

    } catch (error) {

      console.error(
        "Fetch Profile Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
        "Failed to load profile."
      );

    }
  };

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    // ---------------------------------------------------
    // PHONE
    // ---------------------------------------------------

    if (name === "phone") {

      const phone =
        value.replace(/\D/g, "");

      if (phone.length > 10) return;

      setProfile((prev) => ({
        ...prev,
        phone,
      }));

      setErrors((prev) => ({
        ...prev,
        phone: "",
      }));

      return;
    }

    // ---------------------------------------------------
    // PINCODE
    // ---------------------------------------------------

    if (name === "pincode") {

      const pin =
        value.replace(/\D/g, "");

      if (pin.length > 6) return;

      setProfile((prev) => ({
        ...prev,
        pincode: pin,
      }));

      setErrors((prev) => ({
        ...prev,
        pincode: "",
      }));

      return;
    }

    // ---------------------------------------------------
    // GENDER
    // ---------------------------------------------------

    if (name === "gender") {

      setProfile((prev) => ({
        ...prev,
        gender: value,
      }));

      setErrors((prev) => ({
        ...prev,
        gender: "",
      }));

      return;
    }

    // ---------------------------------------------------
    // OTHER FIELDS
    // ---------------------------------------------------

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // =====================================================
  // FILE CHANGE
  // =====================================================

  const handleFileChange = (field) => (e) => {

    const file =
      e.target.files?.[0];

    if (!file) return;

    setProfile((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validate = () => {

    const newErrors = {};

    // ---------------------------------------------------
    // NAME
    // ---------------------------------------------------

    if (!profile.name?.trim()) {

      newErrors.name =
        "Name is required.";
    }

    // ---------------------------------------------------
    // PHONE
    // ---------------------------------------------------

    if (
      profile.phone &&
      !/^[0-9]{10}$/.test(
        profile.phone
      )
    ) {

      newErrors.phone =
        "Phone must contain exactly 10 digits.";
    }

    // ---------------------------------------------------
    // PINCODE
    // ---------------------------------------------------

    if (
      profile.pincode &&
      !/^[0-9]{6}$/.test(
        profile.pincode
      )
    ) {

      newErrors.pincode =
        "Invalid pincode.";
    }

    // ---------------------------------------------------
    // GENDER
    // ---------------------------------------------------

    if (
      profile.gender &&
      ![
        "male",
        "female",
        "other",
      ].includes(profile.gender)
    ) {

      newErrors.gender =
        "Invalid gender selected.";
    }

    // ---------------------------------------------------
    // NGO
    // ---------------------------------------------------

    if (
      profile.role === "ngo" &&
      !profile.organizationName?.trim()
    ) {

      newErrors.organizationName =
        "NGO name is required.";
    }

    // ---------------------------------------------------
    // ORGANIZATION DONOR
    // ---------------------------------------------------

    if (
      profile.role === "donor" &&
      profile.donorType === "organization" &&
      !profile.organizationName?.trim()
    ) {

      newErrors.organizationName =
        "Organization name is required.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const saveProfile = async () => {

    setMessage("");

    if (!validate()) return;

    setSaving(true);

    try {

      const data =
        new FormData();

      /*
       * Only send editable fields.
       *
       * This prevents MongoDB fields such as
       * _id, createdAt, updatedAt, etc. from
       * being unnecessarily submitted.
       */

      const editableFields = [
        "name",
        "phone",
        "gender",
        "address",
        "city",
        "state",
        "pincode",

        // NGO
        "organizationName",
        "organizationCategory",
        "ngoCategory",
        "gstNumber",

        // Volunteer
        "vehicleType",
        "vehicleNumber",
        "vehicleCapacity",
        "availability",
        "licenseNumber",
        "skills",
      ];

      editableFields.forEach(
        (key) => {

          const value =
            profile[key];

          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {

            data.append(
              key,
              value
            );
          }
        }
      );

      // =================================================
      // FILES
      // =================================================

      const fileFields = [
        "profileImage",
        "registrationCertificate",
        "gstCertificate",
        "licenseImage",
        "governmentIdImage",
        "vehicleRCImage",
        "vehicleImage",
      ];

      fileFields.forEach(
        (field) => {

          const value =
            profile[field];

          /*
           * Only append when the value is
           * an actual newly selected File.
           *
           * Existing database paths should
           * not be re-submitted.
           */

          if (value instanceof File) {

            data.append(
              field,
              value
            );
          }
        }
      );

      await API.put(
        "/users/profile",
        data,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setMessage(
        "Profile updated successfully."
      );

      // Refresh from database
      await fetchProfile();

    } catch (error) {

      console.error(
        "Update Profile Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
        "Failed to update profile."
      );

    } finally {

      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (!profile) {

    return (

      <DashboardLayout>

        <PageHeader
          title="My Profile"
          subtitle="Manage your personal information."
        />

        <div className="profile-loading">
          Loading profile...
        </div>

      </DashboardLayout>
    );
  }

  // =====================================================
  // ROLE CHECKS
  // =====================================================

  const isOrgDonor =
    profile.role === "donor" &&
    profile.donorType ===
      "organization";

  const isNgo =
    profile.role === "ngo";

  const isVolunteer =
    profile.role === "volunteer";

  // =====================================================
  // AVATAR
  // =====================================================

  const avatarUrl =
    getFileUrl(
      profile.profileImage
    );

  // =====================================================
  // JSX
  // =====================================================

  return (

    <DashboardLayout>

      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information."
      />

      <div className="profile-wrap">

        {/* =================================================
            IDENTITY CARD
        ================================================= */}

        <div className="dashboard-card profile-identity">

          <div className="profile-avatar">

            {avatarUrl ? (

              <img
                src={avatarUrl}
                alt={profile.name}
                className="profile-avatar-img"
              />

            ) : (

              profile.name
                ?.charAt(0)
                .toUpperCase()

            )}

          </div>

          <h3>
            {profile.name}
          </h3>

          <span className="profile-role-badge">
            {profile.role?.toUpperCase()}
          </span>

          {message && (

            <div
              className={`profile-message ${
                message.includes(
                  "successfully"
                )
                  ? "success"
                  : "error"
              }`}
            >
              {message}
            </div>

          )}

        </div>

        {/* =================================================
            PERSONAL INFORMATION
        ================================================= */}

        <div className="dashboard-card profile-section">

          <h4 className="profile-section-title">
            Personal Information
          </h4>

          {/* NAME + EMAIL */}

          <div className="profile-row">

            <div className="profile-field">

              <label>
                {isOrgDonor || isNgo
                  ? "Contact Person Name"
                  : "Full Name"}
              </label>

              <input
                className={
                  errors.name
                    ? "invalid"
                    : ""
                }
                name="name"
                value={
                  profile.name || ""
                }
                onChange={handleChange}
              />

              {errors.name && (

                <span className="profile-error">
                  {errors.name}
                </span>

              )}

            </div>

            <div className="profile-field">

              <label>
                Email
              </label>

              <input
                value={
                  profile.email || ""
                }
                disabled
              />

            </div>

          </div>

          {/* PHONE + GENDER */}

          <div className="profile-row">

            <div className="profile-field">

              <label>
                Phone
              </label>

              <input
                name="phone"
                value={
                  profile.phone || ""
                }
                onChange={handleChange}
                maxLength={10}
                inputMode="numeric"
                className={
                  errors.phone
                    ? "invalid"
                    : ""
                }
              />

              {errors.phone && (

                <span className="profile-error">
                  {errors.phone}
                </span>

              )}

            </div>

            <div className="profile-field">

              <label>
                Gender
              </label>

              <select
                name="gender"
                value={
                  profile.gender || ""
                }
                onChange={handleChange}
                className={
                  errors.gender
                    ? "invalid"
                    : ""
                }
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

              {errors.gender && (

                <span className="profile-error">
                  {errors.gender}
                </span>

              )}

            </div>

          </div>

          {/* PINCODE */}

          <div className="profile-field">

            <label>
              Pincode
            </label>

            <input
              name="pincode"
              value={
                profile.pincode || ""
              }
              onChange={handleChange}
              maxLength={6}
              inputMode="numeric"
              className={
                errors.pincode
                  ? "invalid"
                  : ""
              }
            />

            {errors.pincode && (

              <span className="profile-error">
                {errors.pincode}
              </span>

            )}

          </div>

          {/* CITY + STATE */}

          <div className="profile-row">

            <div className="profile-field">

              <label>
                City
              </label>

              <input
                name="city"
                value={
                  profile.city || ""
                }
                onChange={handleChange}
              />

            </div>

            <div className="profile-field">

              <label>
                State
              </label>

              <input
                name="state"
                value={
                  profile.state || ""
                }
                onChange={handleChange}
              />

            </div>

          </div>

          {/* ADDRESS */}

          <div className="profile-field">

            <label>
              Address
            </label>

            <textarea
              rows="3"
              name="address"
              value={
                profile.address || ""
              }
              onChange={handleChange}
            />

          </div>

        </div>

        {/* =================================================
            NGO INFORMATION
        ================================================= */}

        {isNgo && (

          <div className="dashboard-card profile-section">

            <h4 className="profile-section-title">
              NGO Information
            </h4>

            <div className="profile-field">

              <label>
                NGO Name
              </label>

              <input
                name="organizationName"
                value={
                  profile.organizationName ||
                  ""
                }
                onChange={handleChange}
                className={
                  errors.organizationName
                    ? "invalid"
                    : ""
                }
              />

              {errors.organizationName && (

                <span className="profile-error">
                  {errors.organizationName}
                </span>

              )}

            </div>

            <div className="profile-row">

              <div className="profile-field">

                <label>
                  Organization Category
                </label>

                <input
                  value="NGO / Non-profit"
                  disabled
                />

              </div>

              <div className="profile-field">

                <label>
                  NGO Category
                </label>

                <select
                  name="ngoCategory"
                  value={
                    profile.ngoCategory ||
                    ""
                  }
                  onChange={handleChange}
                >

                  <option value="">
                    Select Category
                  </option>

                  <option>
                    Child Care
                  </option>

                  <option>
                    Orphanage
                  </option>

                  <option>
                    Old Age Home
                  </option>

                  <option>
                    Disability Support
                  </option>

                  <option>
                    Medical Aid
                  </option>

                  <option>
                    Food Distribution
                  </option>

                  <option>
                    Education
                  </option>

                  <option>
                    Women Empowerment
                  </option>

                  <option>
                    Animal Welfare
                  </option>

                  <option>
                    Disaster Relief
                  </option>

                  <option>
                    Multi Purpose
                  </option>

                </select>

              </div>

            </div>

            <div className="profile-field">

              <label>
                NGO Registration Number (Optional)
              </label>

              <input
                name="gstNumber"
                value={
                  profile.gstNumber ||
                  ""
                }
                onChange={handleChange}
              />

            </div>

          </div>

        )}

        {/* =================================================
            ORGANIZATION DONOR
        ================================================= */}

        {isOrgDonor && (

          <div className="dashboard-card profile-section">

            <h4 className="profile-section-title">
              Organization Details
            </h4>

            <div className="profile-field">

              <label>
                Organization Name
              </label>

              <input
                name="organizationName"
                value={
                  profile.organizationName ||
                  ""
                }
                onChange={handleChange}
                className={
                  errors.organizationName
                    ? "invalid"
                    : ""
                }
              />

              {errors.organizationName && (

                <span className="profile-error">
                  {errors.organizationName}
                </span>

              )}

            </div>

            <div className="profile-row">

              <div className="profile-field">

                <label>
                  Organization Category
                </label>

                <select
                  name="organizationCategory"
                  value={
                    profile.organizationCategory ||
                    ""
                  }
                  onChange={handleChange}
                >

                  <option value="">
                    Select Category
                  </option>

                  <option>
                    Restaurant
                  </option>

                  <option>
                    Bakery
                  </option>

                  <option>
                    Supermarket
                  </option>

                  <option>
                    Clothing Store
                  </option>

                  <option>
                    Book Store
                  </option>

                  <option>
                    Pharmacy
                  </option>

                  <option>
                    Hotel
                  </option>

                  <option>
                    Corporate Office
                  </option>

                  <option>
                    Manufacturer
                  </option>

                  <option>
                    Other
                  </option>

                </select>

              </div>

              <div className="profile-field">

                <label>
                  GST Number (Optional)
                </label>

                <input
                  name="gstNumber"
                  value={
                    profile.gstNumber ||
                    ""
                  }
                  onChange={handleChange}
                />

              </div>

            </div>

          </div>

        )}

        {/* =================================================
            VOLUNTEER INFORMATION
        ================================================= */}

        {isVolunteer && (

          <div className="dashboard-card profile-section">

            <h4 className="profile-section-title">
              Vehicle Information
            </h4>

            {/* VEHICLE TYPE + NUMBER */}

            <div className="profile-row">

              <div className="profile-field">

                <label>
                  Vehicle Type
                </label>

                <select
                  name="vehicleType"
                  value={
                    profile.vehicleType ||
                    ""
                  }
                  onChange={handleChange}
                >

                  <option value="">
                    Select Vehicle
                  </option>

                  <option value="Bicycle">
                    🚲 Bicycle
                  </option>

                  <option value="Bike">
                    🏍 Bike
                  </option>

                  <option value="Scooter">
                    🛵 Scooter
                  </option>

                  <option value="Car">
                    🚗 Car
                  </option>

                  <option value="Van">
                    🚐 Van
                  </option>

                  <option value="Mini Truck">
                    🚚 Mini Truck
                  </option>

                </select>

              </div>

              <div className="profile-field">

                <label>
                  Vehicle Number
                </label>

                <input
                  name="vehicleNumber"
                  value={
                    profile.vehicleNumber ||
                    ""
                  }
                  onChange={handleChange}
                  placeholder="KA01AB1234"
                />

              </div>

            </div>

            {/* CAPACITY + AVAILABILITY */}

            <div className="profile-row">

              <div className="profile-field">

                <label>
                  Vehicle Capacity
                </label>

                <select
                  name="vehicleCapacity"
                  value={
                    profile.vehicleCapacity ||
                    ""
                  }
                  onChange={handleChange}
                >

                  <option value="">
                    Select Capacity
                  </option>

                  <option value="20 Kg">
                    20 Kg
                  </option>

                  <option value="50 Kg">
                    50 Kg
                  </option>

                  <option value="100 Kg">
                    100 Kg
                  </option>

                  <option value="250 Kg">
                    250 Kg
                  </option>

                  <option value="500 Kg">
                    500 Kg
                  </option>

                </select>

              </div>

              <div className="profile-field">

                <label>
                  Availability
                </label>

                <select
                  name="availability"
                  value={
                    profile.availability ||
                    ""
                  }
                  onChange={handleChange}
                >

                  <option value="">
                    Select Availability
                  </option>

                  <option value="Weekdays">
                    Weekdays
                  </option>

                  <option value="Weekends">
                    Weekends
                  </option>

                  <option value="Evenings">
                    Evenings
                  </option>

                  <option value="Full Time">
                    Full Time
                  </option>

                  <option value="Any Time">
                    Any Time
                  </option>

                </select>

              </div>

            </div>

            {/* LICENSE + SKILLS */}

            <div className="profile-row">

              <div className="profile-field">

                <label>
                  Driving License Number
                </label>

                <input
                  name="licenseNumber"
                  value={
                    profile.licenseNumber ||
                    ""
                  }
                  onChange={handleChange}
                  placeholder="Optional"
                />

              </div>

              <div className="profile-field">

                <label>
                  Skills
                </label>

                <input
                  name="skills"
                  value={
                    profile.skills ||
                    ""
                  }
                  onChange={handleChange}
                  placeholder="Driving, First Aid, Packing..."
                />

              </div>

            </div>

          </div>

        )}

        {/* =================================================
            VERIFICATION DOCUMENTS
        ================================================= */}

        <div className="dashboard-card profile-section">

          <h4 className="profile-section-title">
            📂 Verification Documents
          </h4>

          <div className="profile-doc-grid">

            {/* =================================================
                PROFILE IMAGE
            ================================================= */}

            <DocSlot
              label="Profile Picture"
              value={
                profile.profileImage
              }
              accept="image/*"
              onChange={
                handleFileChange(
                  "profileImage"
                )
              }
            />

            {/* =================================================
                NGO DOCUMENTS
            ================================================= */}

            {isNgo && (
              <>

                <DocSlot
                  label="NGO Registration Certificate"
                  value={
                    profile.registrationCertificate
                  }
                  accept="image/*,.pdf"
                  onChange={
                    handleFileChange(
                      "registrationCertificate"
                    )
                  }
                />

                <DocSlot
                  label="GST Certificate"
                  value={
                    profile.gstCertificate
                  }
                  accept="image/*,.pdf"
                  onChange={
                    handleFileChange(
                      "gstCertificate"
                    )
                  }
                />

              </>
            )}

            {/* =================================================
                ORGANIZATION DONOR
            ================================================= */}

            {isOrgDonor && (
              <>

                <DocSlot
                  label="GST Certificate"
                  value={
                    profile.gstCertificate
                  }
                  accept="image/*,.pdf"
                  onChange={
                    handleFileChange(
                      "gstCertificate"
                    )
                  }
                />

              </>
            )}

            {/* =================================================
                VOLUNTEER DOCUMENTS
            ================================================= */}

            {isVolunteer && (
              <>

                <DocSlot
                  label="Driving Licence"
                  value={
                    profile.licenseImage
                  }
                  accept="image/*,.pdf"
                  onChange={
                    handleFileChange(
                      "licenseImage"
                    )
                  }
                />

                <DocSlot
                  label="Government ID"
                  value={
                    profile.governmentIdImage
                  }
                  accept="image/*,.pdf"
                  onChange={
                    handleFileChange(
                      "governmentIdImage"
                    )
                  }
                />

                <DocSlot
                  label="Vehicle RC"
                  value={
                    profile.vehicleRCImage
                  }
                  accept="image/*,.pdf"
                  onChange={
                    handleFileChange(
                      "vehicleRCImage"
                    )
                  }
                />

                <DocSlot
                  label="Vehicle Photo"
                  value={
                    profile.vehicleImage
                  }
                  accept="image/*"
                  onChange={
                    handleFileChange(
                      "vehicleImage"
                    )
                  }
                />

              </>
            )}

          </div>

        </div>

        {/* =================================================
            SAVE BUTTON
        ================================================= */}

        <button
          className="profile-save"
          onClick={saveProfile}
          disabled={saving}
        >

          {saving
            ? "Saving..."
            : "Save Changes"}

        </button>

      </div>

    </DashboardLayout>
  );
}

export default Profile;