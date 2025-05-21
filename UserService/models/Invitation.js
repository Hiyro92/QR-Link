const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Invitation = sequelize.define(
    "Invitation",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "companies",
                key: "id",
            },
        },
        role_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "roles",
                key: "id",
            },
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        status: {
            type: DataTypes.ENUM("pending", "accepted", "expired"),
            defaultValue: "pending",
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "invitations",
        timestamps: false,
    }
);

module.exports = Invitation;
