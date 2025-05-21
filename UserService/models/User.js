const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password_hash: {
            type: DataTypes.STRING,
            allowNull: true,
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
        first_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        profile_image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        timezone: {
            type: DataTypes.STRING,
            defaultValue: "UTC",
        },
        language: {
            type: DataTypes.STRING,
            defaultValue: "en",
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        is_email_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        email_verification_token: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        password_reset_token: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        password_reset_expires: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        failed_login_attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        locked_until: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        mfa_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        mfa_secret: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: "users",
        timestamps: false,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password_hash) {
                    user.password_hash = await bcrypt.hash(
                        user.password_hash,
                        10
                    );
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed("password_hash") && user.password_hash) {
                    user.password_hash = await bcrypt.hash(
                        user.password_hash,
                        10
                    );
                }
            },
        },
    }
);

// Instance method to check password
User.prototype.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password_hash);
};

module.exports = User;
