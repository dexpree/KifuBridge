export const validateEmail = (email) => {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

};

export const validatePhone = (phone) => {

  return /^[0-9]{10}$/.test(phone);

};

export const validatePincode = (pincode) => {

  return /^[0-9]{6}$/.test(pincode);

};

export const validatePassword = (password) => {

  return password.length >= 6;

};