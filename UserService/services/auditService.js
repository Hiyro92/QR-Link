const { AuditLog } = require("../models");

const logActivity = async (
    req,
    action,
    resourceType,
    resourceId,
    details = null
) => {
    try {
        await AuditLog.create({
            user_id: req.user ? req.user.id : null,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
            details,
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

module.exports = {
    logActivity,
};
