export const handleInputChange = (
  e,
  formData,
  setFormData,
  errors,
  setErrors
) => {

  const { name, value } = e.target;

  let updatedValue = value;

  // =========================
  // Phone Number
  // =========================

  if (name === "phone") {

    updatedValue = value.replace(/\D/g, "");

    if (updatedValue.length > 10)
      return;
  }

  // =========================
  // Pincode
  // =========================

  if (name === "pincode") {

    updatedValue = value.replace(/\D/g, "");

    if (updatedValue.length > 6)
      return;
  }

  // =========================
  // GST / Registration Number
  // =========================

  if (
    name === "gstNumber" ||
    name === "registrationNumber"
  ) {

    updatedValue = value.toUpperCase();

  }

  setFormData({

    ...formData,

    [name]: updatedValue,

  });

  setErrors({

    ...errors,

    [name]: "",

  });

};