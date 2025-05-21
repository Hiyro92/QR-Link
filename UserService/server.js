const app = require("./app");
const { sequelize, syncDatabase } = require("./models");
const config = require("./config/config");

const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log("Database connection has been established successfully.");

        // Sync database models (set to true only in development to force recreate tables)
        await syncDatabase(
            config.nodeEnv === "development" &&
                process.env.FORCE_SYNC === "true"
        );

        // Start server
        const server = app.listen(config.port, () => {
            console.log(
                `Server running on port ${config.port} in ${config.nodeEnv} mode`
            );
        });

        // Handle shutdown gracefully
        process.on("SIGTERM", () => {
            console.log("SIGTERM signal received: closing HTTP server");
            server.close(() => {
                console.log("HTTP server closed");
                // Close database connection
                sequelize.close().then(() => {
                    console.log("Database connection closed");
                    process.exit(0);
                });
            });
        });
    } catch (error) {
        console.error("Unable to start server:", error);
        process.exit(1);
    }
};

startServer();
