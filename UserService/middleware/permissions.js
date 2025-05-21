const { User, Role, Permission, RolePermission } = require("../models");

// Check if user has required permission
const hasPermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;

            // Get user with role
            const user = await User.findByPk(userId, {
                include: [
                    {
                        model: Role,
                        include: [
                            {
                                model: Permission,
                                where: { name: permissionName },
                                required: false,
                            },
                        ],
                    },
                ],
            });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Check if user has the required permission
            const hasRequiredPermission =
                user.Role &&
                user.Role.Permissions &&
                user.Role.Permissions.length > 0;

            if (!hasRequiredPermission) {
                return res
                    .status(403)
                    .json({ message: "Insufficient permissions" });
            }

            next();
        } catch (error) {
            console.error("Permission check error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };
};

module.exports = {
    hasPermission,
};
