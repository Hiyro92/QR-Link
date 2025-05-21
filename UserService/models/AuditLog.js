const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditLog = sequelize.define(
    "AuditLog",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "users",
                key: "id",
            },
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        resource_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        resource_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        user_agent: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        details: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        tableName: "audit_logs",
        timestamps: false,
    }
);

module.exports = AuditLog;
