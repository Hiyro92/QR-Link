require("dotenv").config();

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    db: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || "auth_service",
        username: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "password",
        dialect: "mysql",
    },
    jwt: {
        secret: process.env.JWT_SECRET || "your_jwt_secret_key",
        expiration: process.env.JWT_EXPIRATION || "1h",
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
    },
    email: {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        from: process.env.EMAIL_FROM || "noreply@yourcompany.com",
    },
    app: {
        url: process.env.APP_URL || "http://localhost:3000",
        frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
    },
    security: {
        passwordResetExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        maxFailedLoginAttempts: 5,
        lockoutDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
    },
};
