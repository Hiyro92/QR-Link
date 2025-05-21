const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Role = sequelize.define(
    "Role",
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
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "companies",
                key: "id",
            },
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "roles",
        timestamps: false,
    }
);

module.exports = Role;
