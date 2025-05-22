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
  const dbPath = path.resolve(config.db.SQLite.storage);
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  sequelizeConfig.storage = dbPath; // Use storage option for SQLite
  console.log(`Using SQLite database at: ${dbPath}`);
} else if (config.db.dialect === "mysql") {
  // Configuration for other dialects like MySQL, PostgreSQL
  sequelizeConfig.host = config.db.mySQL.host;
  sequelizeConfig.port = config.db.mySQL.port;
  sequelizeConfig.database = config.db.mySQL.database;
  sequelizeConfig.username = config.db.mySQL.username;
  sequelizeConfig.password = config.db.mySQL.password;
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
} else {
  console.error("ERROR: kein dialect definiert!");
}

const sequelize = new Sequelize(sequelizeConfig);

module.exports = sequelize;
