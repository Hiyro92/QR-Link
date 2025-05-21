const { verifyToken } = require("../utils/jwt");
const { User, Role, Permission, RolePermission } = require("../models");

// Verify JWT token middleware
const authenticateJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
                .status(401)
                .json({ message: "Authorization token required" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);

        // Attach user to request
        req.user = decoded.user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = {
    authenticateJWT,
};
