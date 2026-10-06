import { useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import indianStates from "../data/indianStates";
import "../styles/donorregister.css";
import LocationPicker from "../components/LocationPicker";

// Standard 15-character Indian GST number format, e.g. 22AAAAA0000A1Z5
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const MAX_PROFILE_IMAGE_MB = 5;

function DonorRegister() {
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
    role: "donor",
    donorType: "individual",
    organizationName: "",
    organizationCategory: "",
    gstNumber: "",
    profileImage: null,
    registrationCertificate: null,
    gstCertificate: null,
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Map is opt-in: most people will just type their address and move on,
  // so it stays collapsed under the Address field until they ask for it.
  const [showMap, setShowMap] = useState(false);

  const isOrganization = formData.donorType === "organization";

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Restrict phone number to 10 digits
    if (name === "phone") {
      const phone = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone }));
      setErrors((prev) => ({ ...prev, phone: "" }));
      return;
    }

    // Restrict pincode to 6 digits
    if (name === "pincode") {
      const pin = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev) => ({ ...prev, pincode: pin }));
      setErrors((prev) => ({ ...prev, pincode: "" }));
      return;
    }

    // Normalize GST number to uppercase, strip spaces, cap at 15 chars
    if (name === "gstNumber") {
      const cleaned = value.toUpperCase().replace(/\s/g, "").slice(0, 15);
      setFormData((prev) => ({ ...prev, gstNumber: cleaned }));
      setErrors((prev) => ({ ...prev, gstNumber: "" }));
      return;
    }

    // Switching donor type: clear any leftover organization-only errors
    if (name === "donorType") {
      setFormData((prev) => ({ ...prev, donorType: value }));
      setErrors((prev) => ({
        ...prev,
        organizationName: "",
        organizationCategory: "",
        gstNumber: "",
        registrationCertificate: "",
      }));
      return;
    }

    if (type === "file") {
      const file = e.target.files?.[0] || null;

      // NOTE: this used to hardcode the "profileImage" key, so a large
      // registration certificate or GST certificate silently showed no
      // error message anywhere on the form. Now keyed by the actual field.
      if (file && file.size > MAX_PROFILE_IMAGE_MB * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [name]: `File must be under ${MAX_PROFILE_IMAGE_MB}MB.`,
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email.";
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must contain 10 digits.";
    }

    if (!formData.gender) {
  newErrors.gender = "Please select your gender.";
}

    if (formData.password.length < 6) {
      newErrors.password = "Minimum 6 characters.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!formData.state) {
      newErrors.state = "Select a state.";
    }

    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Enter a valid 6-digit pincode.";
    }

    if (isOrganization) {
      if (!formData.organizationName.trim()) {
        newErrors.organizationName = "Organization name is required.";
      }

      if (!formData.organizationCategory) {
        newErrors.organizationCategory = "Choose a category.";
      }

      if (!formData.registrationCertificate) {
        newErrors.registrationCertificate =
          "Registration certificate is required for organizations.";
      }

      // GST is optional, but if provided it must be a valid 15-character GSTIN
      if (
        formData.gstNumber.trim() &&
        !GST_REGEX.test(formData.gstNumber.trim())
      ) {
        newErrors.gstNumber =
          "Enter a valid 15-character GST number, e.g. 22AAAAA0000A1Z5.";
      }
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
      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        organizationName: formData.organizationName.trim(),
        gstNumber: formData.gstNumber.trim(),
      };

      const data = new FormData();
      Object.keys(payload).forEach((key) => {
        if (payload[key] !== null && payload[key] !== "") {
          data.append(key, payload[key]);
        }
      });

      const res = await API.post("/auth/register", data, {
        headers: { "Content-Type": "multipart/form-data" },
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

  // LocationPicker calls both of these. Only the address fields were
  // ever wired up (handleAddressChange) — onLocationChange pointed at
  // a handleLocationChange that didn't exist, which would throw the
  // moment LocationPicker tried to call it. If you want to persist
  // raw coordinates too, add lat/lng keys to formData and set them here.
  const handleLocationChange = (_coords) => {};

  const handleAddressChange = (data) => {
    setFormData((prev) => ({
      ...prev,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    }));
  };

  return (
  <div className="donor-register-page">
      <div className="auth-glow" aria-hidden="true"></div>
   
  

      <div className="auth-card wide">
              <Link to="/register" className="auth-back">
        ← Back
      </Link>
        <div className="auth-brand">
       
        
          <h2>KifuBridge</h2>
          <span className="auth-brand-mark" aria-hidden="true">
            <span className="auth-brand-node" />
            <span className="auth-brand-line" />
            <span className="auth-brand-node" />
          </span>
        </div>

        <p className="auth-subtitle">Donor Registration</p>

        {message && <div className="auth-alert info">{message}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="name">
              {isOrganization ? "Contact Person Name" : "Full Name"}
            </label>
            <input
              id="name"
              type="text"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "invalid" : ""}
              placeholder={
                isOrganization
                  ? "Enter contact person's name"
                  : "Enter your full name"
              }
            />
            {errors.name && <div className="auth-error">{errors.name}</div>}
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "invalid" : ""}
              placeholder="Enter your email"
            />
            {errors.email && <div className="auth-error">{errors.email}</div>}
          </div>

          <div className="auth-field">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              inputMode="numeric"
              className={`auth-mono ${errors.phone ? "invalid" : ""}`}
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
            <label htmlFor="password">Password</label>
            <div className="auth-password-group">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "invalid" : ""}
                placeholder="Create password"
              />
              <button
                type="button"
                className="auth-toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && (
              <div className="auth-error">{errors.password}</div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="donorType">Donor Type</label>
            <select
              id="donorType"
              name="donorType"
              value={formData.donorType}
              onChange={handleChange}
            >
              <option value="individual">Individual Donor</option>
              <option value="organization">Organization Donor</option>
            </select>
          </div>

          {isOrganization && (
            <div className="org-fields">
              <div className="auth-field">
                <label htmlFor="organizationName">Organization Name</label>
                <input
                  id="organizationName"
                  type="text"
                  name="organizationName"
                  autoComplete="organization"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className={errors.organizationName ? "invalid" : ""}
                  placeholder="Enter organization name"
                />
                {errors.organizationName && (
                  <div className="auth-error">{errors.organizationName}</div>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="organizationCategory">
                  Organization Category
                </label>
                <select
                  id="organizationCategory"
                  name="organizationCategory"
                  value={formData.organizationCategory}
                  onChange={handleChange}
                  className={errors.organizationCategory ? "invalid" : ""}
                >
                  <option value="">Select Category</option>
                  <option>Restaurant</option>
                  <option>Bakery</option>
                  <option>Supermarket</option>
                  <option>Clothing Store</option>
                  <option>Book Store</option>
                  <option>Pharmacy</option>
                  <option>Hotel</option>
                  <option>Corporate Office</option>
                  <option>Manufacturer</option>
                  <option>Other</option>
                </select>
                {errors.organizationCategory && (
                  <div className="auth-error">
                    {errors.organizationCategory}
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="registrationCertificate">
                  Organization Registration Certificate
                </label>
                <div className="auth-file-input">
                  <label
                    htmlFor="registrationCertificate"
                    className="auth-file-button"
                  >
                    Choose file
                  </label>
                  <span className="auth-file-name">
                    {formData.registrationCertificate
                      ? formData.registrationCertificate.name
                      : "No file selected"}
                  </span>
                  <input
                    id="registrationCertificate"
                    type="file"
                    name="registrationCertificate"
                    accept="image/*,.pdf"
                    onChange={handleChange}
                    className="auth-file-native"
                  />
                </div>
                {errors.registrationCertificate && (
                  <div className="auth-error">
                    {errors.registrationCertificate}
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="gstCertificate">
                  GST Certificate (Optional)
                </label>
                <div className="auth-file-input">
                  <label htmlFor="gstCertificate" className="auth-file-button">
                    Choose file
                  </label>
                  <span className="auth-file-name">
                    {formData.gstCertificate
                      ? formData.gstCertificate.name
                      : "No file selected"}
                  </span>
                  <input
                    id="gstCertificate"
                    type="file"
                    name="gstCertificate"
                    accept="image/*,.pdf"
                    onChange={handleChange}
                    className="auth-file-native"
                  />
                </div>
                {errors.gstCertificate && (
                  <div className="auth-error">{errors.gstCertificate}</div>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="gstNumber">GST Number (Optional)</label>
                <input
                  id="gstNumber"
                  type="text"
                  name="gstNumber"
                  maxLength={15}
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className={`auth-mono ${errors.gstNumber ? "invalid" : ""}`}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                />
                {errors.gstNumber && (
                  <div className="auth-error">{errors.gstNumber}</div>
                )}
              </div>
            </div>
          )}

          {/* ================= Address ================= */}
          <div className="auth-field">
            <div className="auth-field-header">
              <label htmlFor="address">Address</label>
              <button
                type="button"
                className="auth-link-button"
                onClick={() => setShowMap((prev) => !prev)}
              >
                {showMap ? "Hide map" : "📍 Use map instead"}
              </button>
            </div>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={errors.address ? "invalid" : ""}
              placeholder="Type your address, or use the map"
              rows={3}
            />
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
              <label htmlFor="city">City</label>
              <input
                id="city"
                type="text"
                name="city"
                autoComplete="address-level2"
                value={formData.city}
                onChange={handleChange}
                className={errors.city ? "invalid" : ""}
                placeholder="City"
              />
              {errors.city && (
                <div className="auth-error">{errors.city}</div>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="state">State</label>
              <select
                id="state"
                name="state"
                autoComplete="address-level1"
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
            <label htmlFor="pincode">Pincode</label>
            <input
              id="pincode"
              type="text"
              name="pincode"
              autoComplete="postal-code"
              value={formData.pincode}
              onChange={handleChange}
              maxLength={6}
              inputMode="numeric"
              className={`auth-mono ${errors.pincode ? "invalid" : ""}`}
              placeholder="Pincode"
            />
            {errors.pincode && (
              <div className="auth-error">{errors.pincode}</div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="profileImage">Profile Photo</label>
            <div className="auth-file-input">
              <label htmlFor="profileImage" className="auth-file-button">
                Choose file
              </label>
              <span className="auth-file-name">
                {formData.profileImage
                  ? formData.profileImage.name
                  : "No file selected"}
              </span>
              <input
                id="profileImage"
                type="file"
                name="profileImage"
                accept="image/*"
                onChange={handleChange}
                className="auth-file-native"
              />
            </div>
            {errors.profileImage && (
              <div className="auth-error">{errors.profileImage}</div>
            )}
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Donor Account"}
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

export default DonorRegister;