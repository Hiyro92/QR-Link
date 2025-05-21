const jwt = require("jsonwebtoken");
const config = require("../config/config");

const generateToken = (user) => {
    // Create payload with user information and permissions
    const payload = {
        user: {
            id: user.id,
            email: user.email,
            company_id: user.company_id,
            role_id: user.role_id,
        },
    };

    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiration,
    });
};

const generateRefreshToken = (user) => {
    const payload = {
        user: {
            id: user.id,
        },
        type: "refresh",
    };

    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.refreshExpiration,
    });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
};
