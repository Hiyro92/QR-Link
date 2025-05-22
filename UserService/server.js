const app = require("./app");
const { sequelize, syncDatabase } = require("./models"); // Import sequelize instance and sync function
const config = require("./config/config"); // Import config
const { Permission } = require("./models"); // Import Permission model to seed initial data
const { v4: uuidv4 } = require("uuid"); // Import uuid for seeding

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    console.log(`Using DB Dialect: ${config.db.dialect}`);

    // Sync database models (creates tables if they don't exist)
    // Set FORCE_SYNC=true in .env (only for development!) to drop and recreate tables
    const forceSync =
      config.nodeEnv === "development" && process.env.FORCE_SYNC === "true";
    await syncDatabase(forceSync); // Pass force option to syncDatabase function
    if (forceSync) {
      console.log(
        "Database synced with force: true. Tables dropped and recreated."
      );
      // Seed initial data (e.g., system permissions) only after a force sync in dev
      await seedInitialData();
    } else {
      console.log("Database synced.");
      // Optionally, run migrations here instead of force sync for production
    }

    // Start server
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

    // Handle shutdown gracefully
    const shutdown = async () => {
      console.log("Shutting down server...");
      server.close(async () => {
        console.log("HTTP server closed.");
        // Close database connection
        await sequelize.close();
        console.log("Database connection closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown); // Handle termination signals
    process.on("SIGINT", shutdown); // Handle interrupt signals (Ctrl+C)
  } catch (error) {
    console.error("Unable to start server:", error);
    // Log this critical startup error if audit logging is available before failure
    // logActivity(null, 'SERVER_STARTUP_FAILED', 'System', null, { error: error.message }); // Requires auditService to be initialized without DB first?
    process.exit(1); // Exit process with failure code
  }
};

// Function to seed initial data, like system permissions
const seedInitialData = async () => {
  try {
    console.log("Seeding initial data...");
    // Create core system permissions if they don't exist
    const defaultPermissions = [
      {
        id: uuidv4(),
        name: "view_users",
        description: "Can view users in their company",
        resource: "users",
      },
      {
        id: uuidv4(),
        name: "create_users",
        description: "Can invite and create new users",
        resource: "users",
      },
      {
        id: uuidv4(),
        name: "update_users",
        description: "Can update user details",
        resource: "users",
      },
      {
        id: uuidv4(),
        name: "delete_users",
        description: "Can deactivate users",
        resource: "users",
      }, // Soft delete
      {
        id: uuidv4(),
        name: "view_roles",
        description: "Can view roles and their permissions",
        resource: "roles",
      },
      {
        id: uuidv4(),
        name: "create_roles",
        description: "Can create new roles",
        resource: "roles",
      },
      {
        id: uuidv4(),
        name: "update_roles",
        description: "Can update existing roles",
        resource: "roles",
      },
      {
        id: uuidv4(),
        name: "delete_roles",
        description: "Can delete roles",
        resource: "roles",
      },
      {
        id: uuidv4(),
        name: "view_permissions",
        description: "Can view all available permissions",
        resource: "permissions",
      }, // To see what permissions exist
      {
        id: uuidv4(),
        name: "view_company_profile",
        description: "Can view company details",
        resource: "company",
      },
      {
        id: uuidv4(),
        name: "update_company_profile",
        description: "Can update company details",
        resource: "company",
      },
      {
        id: uuidv4(),
        name: "manage_company_settings",
        description: "Can manage company settings",
        resource: "company",
      }, // For JSON settings field
      // Add other application-specific permissions here
    ];

    // Use upsert to avoid duplicates if seeding is run multiple times without force sync
    // Note: Sequelize upsert might behave differently per database. findOrCreate is safer.
    for (const perm of defaultPermissions) {
      await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: perm,
      });
    }
    console.log("System permissions seeded.");

    // TODO: Optionally create a default 'Owner' or 'System Admin' role (company_id = null)
    // and associate system permissions with it. This role isn't tied to a company.

    // TODO: Optionally create default roles for new companies (e.g., 'Member', 'Manager')
    // These roles could be copied/created when a new company registers.
  } catch (error) {
    console.error("Error seeding initial data:", error);
    // Decide if server should exit on seed failure
  }
};

startServer();
