import { useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import indianStates from "../data/indianStates";
import "../styles/ngoregister.css";
import LocationPicker from "../components/LocationPicker";

const NGO_CATEGORIES = [
  { value: "Child Care", icon: "👶" },
  { value: "Orphanage", icon: "🧒" },
  { value: "Old Age Home", icon: "👴" },
  { value: "Disability Support", icon: "♿" },
  { value: "Medical Aid", icon: "🏥" },
  { value: "Food Distribution", icon: "🍲" },
  { value: "Education", icon: "📚" },
  { value: "Women Empowerment", icon: "👩" },
  { value: "Animal Welfare", icon: "🐶" },
  { value: "Disaster Relief", icon: "🆘" },
  { value: "Multi Purpose", icon: "❤️" },
];

// Loosely matches NGO registration formats (Darpan ID, Trust/Society
// registration numbers, 12A/80G certificate numbers) which vary by
// state and registration type, so this stays permissive.
const REGISTRATION_NUMBER_REGEX = /^[A-Z0-9/-]{4,30}$/i;

function NgoRegister() {
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
    role: "ngo",
    organizationName: "",
    organizationCategory: "NGO / Non-profit",
    ngoCategory: "",
    gstNumber: "",
    profileImage: null,
    registrationCertificate: null,
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Map is opt-in: most people will just type their address and move on,
  // so it stays collapsed under the Address field until they ask for it.
  const [showMap, setShowMap] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Restrict phone number to 10 digits
    if (name === "phone") {
      const phone = value.replace(/\D/g, "");
      if (phone.length > 10) return;
      setFormData({ ...formData, phone });
      setErrors({ ...errors, phone: "" });
      return;
    }

    // Restrict pincode to 6 digits
    if (name === "pincode") {
      const pin = value.replace(/\D/g, "");
      if (pin.length > 6) return;
      setFormData({ ...formData, pincode: pin });
      setErrors({ ...errors, pincode: "" });
      return;
    }

    if (e.target.type === "file") {
      setFormData({
        ...formData,
        [e.target.name]: e.target.files[0],
      });
      return;
    }

    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  // LocationPicker calls both of these. Raw coordinates aren't kept in
  // formData today — if you want to persist lat/lng too, add those keys
  // to formData and set them here instead of the no-op.
  const handleLocationChange = (_coords) => {};

  const handleAddressChange = (data) => {
    setFormData({
      ...formData,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    });
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Contact person name is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter valid email.";
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must contain exactly 10 digits.";
    }
    if (!formData.gender) {
  newErrors.gender = "Please select your gender.";
}

    if (formData.password.length < 6) {
      newErrors.password = "Password should contain at least 6 characters.";
    }

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "NGO name is required.";
    }

    if (!formData.ngoCategory) {
      newErrors.ngoCategory = "Please select an NGO category.";
    }

    // Registration number is optional, but if provided it must look valid
    if (
      formData.gstNumber.trim() &&
      !REGISTRATION_NUMBER_REGEX.test(formData.gstNumber.trim())
    ) {
      newErrors.gstNumber =
        "Enter a valid registration number (letters, numbers, / or - only).";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!formData.state) {
      newErrors.state = "Please select a state.";
    }

    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Invalid pincode.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          data.append(key, formData[key]);
        }
      });

      const res = await API.post("/auth/register", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage(res.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="ngo-register-page">
      <div className="auth-glow"></div>

    

      <div className="auth-card wide">
        <Link to="/register" className="auth-back">
        ← Back
      </Link>
        <div className="auth-brand">
            
          <h2>KifuBridge</h2>
        </div>

        <p className="auth-subtitle">NGO Registration</p>

        {message && <div className="auth-alert info">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Contact Person Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "invalid" : ""}
              placeholder="Enter contact person's name"
            />
            {errors.name && <div className="auth-error">{errors.name}</div>}
          </div>

          <div className="auth-field">
            <label>NGO Name</label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              className={errors.organizationName ? "invalid" : ""}
              placeholder="Enter NGO name"
            />
            {errors.organizationName && (
              <div className="auth-error">{errors.organizationName}</div>
            )}
          </div>

          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "invalid" : ""}
              placeholder="Enter email"
            />
            {errors.email && <div className="auth-error">{errors.email}</div>}
          </div>

          <div className="auth-field">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              inputMode="numeric"
              className={errors.phone ? "invalid" : ""}
              placeholder="10-digit mobile number"
            />
            {errors.phone && <div className="auth-error">{errors.phone}</div>}
          </div>
          <div className="auth-field">
  <label htmlFor="gender">Gender</label>

  <select
    id="gender"
    name="gender"
    value={formData.gender}
    onChange={handleChange}
    className={errors.gender ? "invalid" : ""}
  >
    <option value="">Select Gender</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
    <option value="other">Other</option>
  </select>

  {errors.gender && (
    <div className="auth-error">
      {errors.gender}
    </div>
  )}
</div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-password-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "invalid" : ""}
                placeholder="Create password"
              />
              <button
                type="button"
                className="auth-toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && (
              <div className="auth-error">{errors.password}</div>
            )}
          </div>

          <div className="auth-field">
            <label>NGO Category</label>
            <select
              name="ngoCategory"
              value={formData.ngoCategory}
              onChange={handleChange}
              className={errors.ngoCategory ? "invalid" : ""}
            >
              <option value="">Select category</option>
              {NGO_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.value}
                </option>
              ))}
            </select>
            {errors.ngoCategory && (
              <div className="auth-error">{errors.ngoCategory}</div>
            )}
          </div>

          <div className="auth-field">
            <label>Organization Type</label>
            <input type="text" value={formData.organizationCategory} disabled />
          </div>

          <div className="auth-field">
            <label>NGO Registration Number (Optional)</label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              className={errors.gstNumber ? "invalid" : ""}
              placeholder="Registration certificate number"
            />
            {errors.gstNumber && (
              <div className="auth-error">{errors.gstNumber}</div>
            )}
          </div>

          <div className="auth-field">
            <label>Profile Photo</label>
            <input
              type="file"
              name="profileImage"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label>Registration Certificate</label>
            <input
              type="file"
              name="registrationCertificate"
              accept="image/*,.pdf"
              onChange={handleChange}
            />
          </div>

          {/* ================= Address ================= */}
          <div className="auth-field">
            <div className="auth-field-header">
              <label>Address</label>
              <button
                type="button"
                className="auth-link-button"
                onClick={() => setShowMap((prev) => !prev)}
              >
                {showMap ? "Hide map" : "📍 Use map instead"}
              </button>
            </div>
            <textarea
              rows="3"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={errors.address ? "invalid" : ""}
              placeholder="Type your address, or use the map"
            ></textarea>
            {errors.address && (
              <div className="auth-error">{errors.address}</div>
            )}

            {showMap && (
              <div className="auth-map-wrap">
                <LocationPicker
                  onLocationChange={handleLocationChange}
                  onAddressChange={handleAddressChange}
                />
              </div>
            )}
          </div>

          <div className="auth-row">
            <div className="auth-field">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={errors.city ? "invalid" : ""}
                placeholder="City"
              />
              {errors.city && <div className="auth-error">{errors.city}</div>}
            </div>

            <div className="auth-field">
              <label>State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={errors.state ? "invalid" : ""}
              >
                <option value="">Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && (
                <div className="auth-error">{errors.state}</div>
              )}
            </div>
          </div>

          <div className="auth-field">
            <label>Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              maxLength={6}
              inputMode="numeric"
              onChange={handleChange}
              className={errors.pincode ? "invalid" : ""}
              placeholder="Enter pincode"
            />
            {errors.pincode && (
              <div className="auth-error">{errors.pincode}</div>
            )}
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creating Account..." : "Register NGO"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?
          <Link to="/login"> Login</Link>
        </p>

        <p className="auth-footer mt-2">
          Want to register as another role?
          <Link to="/register"> Back to Role Selection</Link>
        </p>
      </div>
    </div>
  );
}

export default NgoRegister;