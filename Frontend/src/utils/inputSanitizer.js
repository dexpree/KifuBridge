export const sanitizeInput = (name, value) => {

  let updatedValue = value;

  switch (name) {

    case "phone":

      updatedValue = value.replace(/\D/g, "");

      if (updatedValue.length > 10)
        return null;

      break;

    case "pincode":

      updatedValue = value.replace(/\D/g, "");

      if (updatedValue.length > 6)
        return null;

      break;

    case "name":

      updatedValue = value.replace(
        /[^A-Za-z\s]/g,
        ""
      );

      break;

    case "city":

      updatedValue = value.replace(
        /[^A-Za-z\s]/g,
        ""
      );

      break;

    case "organizationName":

      updatedValue = value.replace(
        /[^A-Za-z0-9\s.&()-]/g,
        ""
      );

      break;

    case "gstNumber":

      updatedValue =
        value.toUpperCase();

      break;

    default:
      break;

  }

  return updatedValue;

};