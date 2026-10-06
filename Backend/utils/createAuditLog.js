const AuditLog = require("../models/AuditLog");

const createAuditLog = async (
  admin,
  action,
  description,
  targetUser = null,
  targetDonation = null
) => {

  await AuditLog.create({

    admin,

    action,

    description,

    targetUser,

    targetDonation,

  });

};

module.exports = createAuditLog;