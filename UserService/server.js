// server.js (angepasst)
const app = require("./app");
const { sequelize, syncDatabase } = require("./models");
const config = require("./config/config");
const { seedInitialData } = require("./utils/seeder"); // Importiere den Seeder

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    console.log(`Using DB Dialect: ${config.db.dialect}`);

    // Sync database models
    const forceSync =
      config.nodeEnv === "development" && process.env.FORCE_SYNC === "true";
    await syncDatabase(forceSync);

    if (forceSync) {
      console.log(
        "Database synced with force: true. Tables dropped and recreated."
      );
      // Ausgelagerte Seed-Funktion aufrufen
      await seedInitialData();
    } else {
      console.log("Database synced.");
    }

    // Server starten
    const server = app.listen(config.port, () => {
      console.log(
        `Server running on port ${config.port} in ${config.nodeEnv} mode`
      );
      if (config.nodeEnv === "development") {
        console.log(`Force sync was ${forceSync ? "ENABLED" : "DISABLED"}.`);
        if (config.db.dialect === "sqlite") {
          console.log(`SQLite database file: ${config.db.storage}`);
        }
      }
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("Shutting down server...");
      server.close(async () => {
        console.log("HTTP server closed.");
        await sequelize.close();
        console.log("Database connection closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();
