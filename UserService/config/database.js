const { Sequelize } = require("sequelize");
const config = require("./config");
const path = require("path");
const fs = require("fs");

let sequelizeConfig = {
  dialect: config.db.dialect,
  logging: config.nodeEnv === "development" ? console.log : false,
};

if (config.db.dialect === "sqlite") {
  // Ensure the directory for the SQLite file exists
  const dbPath = path.resolve(config.db.storage);
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  sequelizeConfig.storage = dbPath; // Use storage option for SQLite
  console.log(`Using SQLite database at: ${dbPath}`);
} else {
  // Configuration for other dialects like MySQL, PostgreSQL
  sequelizeConfig.host = config.db.host;
  sequelizeConfig.port = config.db.port;
  sequelizeConfig.database = config.db.database;
  sequelizeConfig.username = config.db.username;
  sequelizeConfig.password = config.db.password;
  sequelizeConfig.pool = {
    // Connection pool settings (adjust for production)
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  };
  console.log(
    `Using ${config.db.dialect} database: ${config.db.database} on ${config.db.host}:${config.db.port}`
  );
}

const sequelize = new Sequelize(sequelizeConfig);

module.exports = sequelize;
