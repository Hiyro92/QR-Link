const sequelize = require("../config/database");
const Company = require("./Company");
const User = require("./User");
const Role = require("./Role");
const Permission = require("./Permission");
const RolePermission = require("./RolePermission");
const Invitation = require("./Invitation");
const AuditLog = require("./AuditLog");

// Define relationships
Company.hasMany(User, { foreignKey: "company_id" });
User.belongsTo(Company, { foreignKey: "company_id" });

Company.hasMany(Role, { foreignKey: "company_id" });
Role.belongsTo(Company, { foreignKey: "company_id" });

Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: "role_id",
});
Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: "permission_id",
});

User.belongsTo(Role, { foreignKey: "role_id" });
Role.hasMany(User, { foreignKey: "role_id" });

Company.hasMany(Invitation, { foreignKey: "company_id" });
Invitation.belongsTo(Company, { foreignKey: "company_id" });

User.hasMany(AuditLog, { foreignKey: "user_id" });
AuditLog.belongsTo(User, { foreignKey: "user_id" });

// Function to sync all models with database
const syncDatabase = async (force = false) => {
    try {
        await sequelize.sync({ force });
        console.log("Database synced successfully");
    } catch (error) {
        console.error("Error syncing database:", error);
    }
};

module.exports = {
    sequelize,
    Company,
    User,
    Role,
    Permission,
    RolePermission,
    Invitation,
    AuditLog,
    syncDatabase,
};
