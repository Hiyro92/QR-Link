const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Company = sequelize.define(
    "Company",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        logo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        subscription_plan: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        subscription_expiry_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        settings: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        domain: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "companies",
        timestamps: false,
    }
);

module.exports = Company;
