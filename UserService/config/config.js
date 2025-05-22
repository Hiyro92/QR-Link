require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  db: {
    dialect: process.env.DB_DIALECT || "mysql", // Read dialect
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    database: process.env.DB_NAME || "auth_service",
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    storage: process.env.SQLITE_STORAGE || "./data/database.sqlite", // Read SQLite storage path
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your_jwt_secret_key",
    expiration: process.env.JWT_EXPIRATION || "1h",
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
    secure: process.env.EMAIL_PORT
      ? parseInt(process.env.EMAIL_PORT, 10) === 465
      : false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    from: process.env.EMAIL_FROM || "noreply@yourcompany.com",
  },
  app: {
    url: process.env.APP_URL || "http://localhost:3000",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
  },
  security: {
    passwordResetExpiry: parseInt(
      process.env.PASSWORD_RESET_EXPIRY_MS || "86400000",
      10
    ),
    maxFailedLoginAttempts: parseInt(
      process.env.MAX_FAILED_LOGIN_ATTEMPTS || "5",
      10
    ),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MS || "1800000", 10),
  },
};
