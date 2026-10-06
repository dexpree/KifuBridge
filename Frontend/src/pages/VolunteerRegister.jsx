import { useState } from "react";

import API from "../services/api";

import { Link, useNavigate } from "react-router-dom";

import indianStates from "../data/indianStates";

import "../styles/volunteerRegister.css";

import LocationPicker from "../components/LocationPicker";

const VEHICLE_TYPES = [
  { value: "Bicycle", icon: "🚲" },
  { value: "Bike", icon: "🏍" },
  { value: "Scooter", icon: "🛵" },
  { value: "Car", icon: "🚗" },
  { value: "Van", icon: "🚐" },
  { value: "Mini Truck", icon: "🚚" },
];

const VEHICLE_CAPACITIES = [
  "20 Kg",
  "50 Kg",
  "100 Kg",
  "250 Kg",
  "500 Kg",
];

const AVAILABILITY_OPTIONS = [
  "Weekdays",
  "Weekends",
  "Evenings",
  "Full Time",
  "Any Time",
];

// Indian vehicle registration format
const VEHICLE_NUMBER_REGEX =
  /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

// Indian driving licence format
const LICENSE_NUMBER_REGEX =
  /^[A-Z]{2}[0-9]{2}[0-9]{4,11}$/;

function VolunteerRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    password: "",

    address: "",
    city: "",
    state: "",
    pincode: "",

    role: "volunteer",

    skills: "",
    availability: "",

    vehicleType: "",
    vehicleNumber: "",
    vehicleCapacity: "",
    licenseNumber: "",

    // =====================================================
    // VOLUNTEER IMAGES
    // =====================================================

    profileImage: null,
    vehicleImage: null,
    licenseImage: null,
    governmentIdImage: null,
    vehicleRCImage: null,
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // -----------------------------------------------------
    // PHONE
    // -----------------------------------------------------

    if (name === "phone") {
      const phone = value.replace(/\D/g, "");

      if (phone.length > 10) return;

      setFormData((previous) => ({
        ...previous,
        phone,
      }));

      setErrors((previous) => ({
        ...previous,
        phone: "",
      }));

      return;
    }

    // -----------------------------------------------------
    // PINCODE
    // -----------------------------------------------------

    if (name === "pincode") {
      const pin = value.replace(/\D/g, "");

      if (pin.length > 6) return;

      setFormData((previous) => ({
        ...previous,
        pincode: pin,
      }));

      setErrors((previous) => ({
        ...previous,
        pincode: "",
      }));

      return;
    }

    // -----------------------------------------------------
    // VEHICLE / LICENSE NUMBER
    // -----------------------------------------------------

    if (
      name === "vehicleNumber" ||
      name === "licenseNumber"
    ) {
      const cleaned = value
        .toUpperCase()
        .replace(/\s/g, "");

      setFormData((previous) => ({
        ...previous,
        [name]: cleaned,
      }));

      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));

      return;
    }

    // -----------------------------------------------------
    // FILE INPUT
    // -----------------------------------------------------

    if (e.target.type === "file") {
      const file = e.target.files?.[0] || null;

      setFormData((previous) => ({
        ...previous,
        [name]: file,
      }));

      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));

      return;
    }

    // -----------------------------------------------------
    // NORMAL INPUT
    // -----------------------------------------------------

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  // =====================================================
  // LOCATION
  // =====================================================

  const handleLocationChange = (_coords) => {
    // Coordinates are not currently stored.
  };

  const handleAddressChange = (data) => {
    setFormData((previous) => ({
      ...previous,

      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    }));
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    const newErrors = {};

    // -----------------------------------------------------
    // BASIC INFORMATION
    // -----------------------------------------------------

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email.";
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone =
        "Phone must contain exactly 10 digits.";
    }

    if (!formData.gender) {
      newErrors.gender =
        "Please select your gender.";
    }

    if (formData.password.length < 6) {
      newErrors.password =
        "Password should contain at least 6 characters.";
    }

    // -----------------------------------------------------
    // VEHICLE
    // -----------------------------------------------------

    if (!formData.vehicleType) {
      newErrors.vehicleType =
        "Please select a vehicle type.";
    }

    if (!formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber =
        "Vehicle number is required.";
    } else if (
      !VEHICLE_NUMBER_REGEX.test(
        formData.vehicleNumber
      )
    ) {
      newErrors.vehicleNumber =
        "Enter a valid vehicle number, e.g. KA01AB1234.";
    }

    if (!formData.vehicleCapacity) {
      newErrors.vehicleCapacity =
        "Please select a vehicle capacity.";
    }

    // -----------------------------------------------------
    // LICENSE
    // -----------------------------------------------------

    if (
      formData.licenseNumber.trim() &&
      !LICENSE_NUMBER_REGEX.test(
        formData.licenseNumber
      )
    ) {
      newErrors.licenseNumber =
        "Enter a valid licence number, e.g. KA0120230012345.";
    }

    // -----------------------------------------------------
    // ADDRESS
    // -----------------------------------------------------

    if (!formData.address.trim()) {
      newErrors.address =
        "Address is required.";
    }

    if (!formData.city.trim()) {
      newErrors.city =
        "City is required.";
    }

    if (!formData.state) {
      newErrors.state =
        "Please select a state.";
    }

    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode =
        "Invalid pincode.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        if (
          formData[key] !== null &&
          formData[key] !== ""
        ) {
          data.append(key, formData[key]);
        }
      });

      const res = await API.post(
        "/auth/register",
        data,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setMessage(
        res.data.message ||
          "Volunteer registration successful."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error(
        "Volunteer Registration Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="volunteer-register-page">

      <div className="auth-glow"></div>

      <div className="auth-card wide">

        {/* =================================================
            BACK
        ================================================= */}

        <Link
          to="/register"
          className="auth-back"
        >
          ← Back
        </Link>

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="auth-brand">
          <h2>KifuBridge</h2>
        </div>

        <p className="auth-subtitle">
          Volunteer Registration
        </p>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div className="auth-alert info">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* =================================================
              NAME
          ================================================= */}

          <div className="auth-field">

            <label>Full Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={
                errors.name
                  ? "invalid"
                  : ""
              }
              placeholder="Enter your full name"
            />

            {errors.name && (
              <div className="auth-error">
                {errors.name}
              </div>
            )}

          </div>

          {/* =================================================
              EMAIL
          ================================================= */}

          <div className="auth-field">

            <label>Email Address</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={
                errors.email
                  ? "invalid"
                  : ""
              }
              placeholder="Enter your email"
            />

            {errors.email && (
              <div className="auth-error">
                {errors.email}
              </div>
            )}

          </div>

          {/* =================================================
              PHONE
          ================================================= */}

          <div className="auth-field">

            <label>Phone Number</label>

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              inputMode="numeric"
              className={
                errors.phone
                  ? "invalid"
                  : ""
              }
              placeholder="10-digit mobile number"
            />

            {errors.phone && (
              <div className="auth-error">
                {errors.phone}
              </div>
            )}

          </div>

          {/* =================================================
              GENDER
          ================================================= */}

          <div className="auth-field">

            <label htmlFor="gender">
              Gender
            </label>

            <select
              id="gender"
              name="gender"
              value={formData.gender}
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
              <div className="auth-error">
                {errors.gender}
              </div>
            )}

          </div>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="auth-field">

            <label>Password</label>

            <div className="auth-password-group">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={
                  errors.password
                    ? "invalid"
                    : ""
                }
                placeholder="Create password"
              />

              <button
                type="button"
                className="auth-toggle-visibility"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >
                {showPassword
                  ? "🙈"
                  : "👁️"}
              </button>

            </div>

            {errors.password && (
              <div className="auth-error">
                {errors.password}
              </div>
            )}

          </div>

          {/* =================================================
              VEHICLE TYPE
          ================================================= */}

          <div className="auth-field">

            <label>
              🚗 Vehicle Type
            </label>

            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className={
                errors.vehicleType
                  ? "invalid"
                  : ""
              }
            >

              <option value="">
                Select vehicle
              </option>

              {VEHICLE_TYPES.map((vehicle) => (
                <option
                  key={vehicle.value}
                  value={vehicle.value}
                >
                  {vehicle.icon}{" "}
                  {vehicle.value}
                </option>
              ))}

            </select>

            {errors.vehicleType && (
              <div className="auth-error">
                {errors.vehicleType}
              </div>
            )}

          </div>

          {/* =================================================
              VEHICLE NUMBER
          ================================================= */}

          <div className="auth-field">

            <label>
              🚘 Vehicle Number
            </label>

            <input
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              className={
                errors.vehicleNumber
                  ? "invalid"
                  : ""
              }
              placeholder="KA01AB1234"
            />

            {errors.vehicleNumber && (
              <div className="auth-error">
                {errors.vehicleNumber}
              </div>
            )}

          </div>

          {/* =================================================
              VEHICLE CAPACITY
          ================================================= */}

          <div className="auth-field">

            <label>
              📦 Vehicle Capacity
            </label>

            <select
              name="vehicleCapacity"
              value={formData.vehicleCapacity}
              onChange={handleChange}
              className={
                errors.vehicleCapacity
                  ? "invalid"
                  : ""
              }
            >

              <option value="">
                Select capacity
              </option>

              {VEHICLE_CAPACITIES.map(
                (capacity) => (
                  <option
                    key={capacity}
                    value={capacity}
                  >
                    {capacity}
                  </option>
                )
              )}

            </select>

            {errors.vehicleCapacity && (
              <div className="auth-error">
                {errors.vehicleCapacity}
              </div>
            )}

          </div>

          {/* =================================================
              LICENSE NUMBER
          ================================================= */}

          <div className="auth-field">

            <label>
              🪪 Driving Licence Number
              (Optional)
            </label>

            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              className={
                errors.licenseNumber
                  ? "invalid"
                  : ""
              }
              placeholder="Optional, e.g. KA0120230012345"
            />

            {errors.licenseNumber && (
              <div className="auth-error">
                {errors.licenseNumber}
              </div>
            )}

          </div>

          {/* =================================================
              SKILLS
          ================================================= */}

          <div className="auth-field">

            <label>
              Skills (Optional)
            </label>

            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="Driving, First Aid, Packing, Communication..."
            />

          </div>

          {/* =================================================
              PROFILE PHOTO
          ================================================= */}

          <div className="auth-field">

            <label>
              👤 Profile Photo
            </label>

            <input
              type="file"
              name="profileImage"
              accept="image/*"
              onChange={handleChange}
            />

          </div>

          {/* =================================================
              VEHICLE PHOTO - NEW
          ================================================= */}

          <div className="auth-field">

            <label>
              🚗 Vehicle Photo
            </label>

            <input
              type="file"
              name="vehicleImage"
              accept="image/*"
              onChange={handleChange}
            />

            <small
              style={{
                display: "block",
                marginTop: "6px",
                color:
                  "rgba(226, 232, 240, 0.55)",
                fontSize: "11px",
              }}
            >
              Upload a clear photo of the
              vehicle used for donation delivery.
            </small>

          </div>

          {/* =================================================
              DRIVING LICENCE
          ================================================= */}

          <div className="auth-field">

            <label>
              🪪 Driving Licence
            </label>

            <input
              type="file"
              name="licenseImage"
              accept="image/*,.pdf"
              onChange={handleChange}
            />

          </div>

          {/* =================================================
              GOVERNMENT ID
          ================================================= */}

          <div className="auth-field">

            <label>
              🆔 Government ID
            </label>

            <input
              type="file"
              name="governmentIdImage"
              accept="image/*,.pdf"
              onChange={handleChange}
            />

          </div>

          {/* =================================================
              VEHICLE RC
          ================================================= */}

          <div className="auth-field">

            <label>
              📄 Vehicle RC
            </label>

            <input
              type="file"
              name="vehicleRCImage"
              accept="image/*,.pdf"
              onChange={handleChange}
            />

          </div>

          {/* =================================================
              AVAILABILITY
          ================================================= */}

          <div className="auth-field">

            <label>
              Availability (Optional)
            </label>

            <select
              name="availability"
              value={formData.availability}
              onChange={handleChange}
            >

              <option value="">
                Select availability
              </option>

              {AVAILABILITY_OPTIONS.map(
                (availability) => (
                  <option
                    key={availability}
                    value={availability}
                  >
                    {availability}
                  </option>
                )
              )}

            </select>

          </div>

          {/* =================================================
              ADDRESS
          ================================================= */}

          <div className="auth-field">

            <div className="auth-field-header">

              <label>
                Address
              </label>

              <button
                type="button"
                className="auth-link-button"
                onClick={() =>
                  setShowMap(
                    (previous) =>
                      !previous
                  )
                }
              >
                {showMap
                  ? "Hide map"
                  : "📍 Use map instead"}
              </button>

            </div>

            <textarea
              rows="3"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={
                errors.address
                  ? "invalid"
                  : ""
              }
              placeholder="Type your address, or use the map"
            />

            {errors.address && (
              <div className="auth-error">
                {errors.address}
              </div>
            )}

            {showMap && (
              <div className="auth-map-wrap">

                <LocationPicker
                  onLocationChange={
                    handleLocationChange
                  }
                  onAddressChange={
                    handleAddressChange
                  }
                />

              </div>
            )}

          </div>

          {/* =================================================
              CITY + STATE
          ================================================= */}

          <div className="auth-row">

            <div className="auth-field">

              <label>
                City
              </label>

              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={
                  errors.city
                    ? "invalid"
                    : ""
                }
                placeholder="City"
              />

              {errors.city && (
                <div className="auth-error">
                  {errors.city}
                </div>
              )}

            </div>

            <div className="auth-field">

              <label>
                State
              </label>

              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={
                  errors.state
                    ? "invalid"
                    : ""
                }
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
                <div className="auth-error">
                  {errors.state}
                </div>
              )}

            </div>

          </div>

          {/* =================================================
              PINCODE
          ================================================= */}

          <div className="auth-field">

            <label>
              Pincode
            </label>

            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              maxLength={6}
              inputMode="numeric"
              className={
                errors.pincode
                  ? "invalid"
                  : ""
              }
              placeholder="Enter pincode"
            />

            {errors.pincode && (
              <div className="auth-error">
                {errors.pincode}
              </div>
            )}

          </div>

          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >

            {loading
              ? "Creating Account..."
              : "Register as Volunteer"}

          </button>

        </form>

        {/* =================================================
            FOOTER
        ================================================= */}

        <p className="auth-footer">

          Already have an account?

          <Link to="/login">
            {" "}Login
          </Link>

        </p>

        <p className="auth-footer mt-2">

          Want to register as another role?

          <Link to="/register">
            {" "}Back to Role Selection
          </Link>

        </p>

      </div>

    </div>
  );
}

export default VolunteerRegister;