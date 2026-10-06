const Notification = require("../models/Notification");

const sendNotification = async (
  user,
  title,
  message,
  type = "info",
  link = ""
) => {

  await Notification.create({

    user,

    title,

    message,

    type,

    link,

  });

};

module.exports = sendNotification;