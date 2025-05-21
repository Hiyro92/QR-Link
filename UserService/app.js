const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { sequelize } = require("./models");
const config = require("./config/config");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const companyRoutes = require("./routes/companyRoutes");
const roleRoutes = require("./routes/roleRoutes");

// Create express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv === "development") {
    app.use(morgan("dev"));
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/roles", roleRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "up",
        timestamp: new Date(),
        service: "user-auth-service",
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({
        message,
        stack: config.nodeEnv === "development" ? err.stack : undefined,
    });
});

module.exports = app;
