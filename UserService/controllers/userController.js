const { User, Role, Company } = require("../models");
const { logActivity } = require("../services/auditService");
const { sendVerificationEmail } = require("../services/emailService");
const { v4: uuidv4 } = require("uuid");

// Get current user profile
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: {
                exclude: [
                    "password_hash",
                    "email_verification_token",
                    "password_reset_token",
                    "password_reset_expires",
                ],
            },
            include: [{ model: Role }, { model: Company }],
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("Error getting current user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update current user profile
const updateCurrentUser = async (req, res) => {
    try {
        const { first_name, last_name, phone, timezone, language } = req.body;

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update user
        if (first_name !== undefined) user.first_name = first_name;
        if (last_name !== undefined) user.last_name = last_name;
        if (phone !== undefined) user.phone = phone;
        if (timezone !== undefined) user.timezone = timezone;
        if (language !== undefined) user.language = language;

        user.updated_at = new Date();
        await user.save();

        // Log the activity
        await logActivity(req, "USER_UPDATE", "User", user.id);

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                timezone: user.timezone,
                language: user.language,
            },
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isValidPassword = await user.isValidPassword(currentPassword);

        if (!isValidPassword) {
            return res
                .status(401)
                .json({ message: "Current password is incorrect" });
        }

        // Update password
        user.password_hash = newPassword;
        user.updated_at = new Date();
        await user.save();

        // Log the activity
        await logActivity(req, "PASSWORD_CHANGE", "User", user.id);

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get company users (for admins)
const getCompanyUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { company_id: req.user.company_id },
            attributes: {
                exclude: [
                    "password_hash",
                    "email_verification_token",
                    "password_reset_token",
                    "password_reset_expires",
                ],
            },
            include: [{ model: Role }],
        });

        res.status(200).json({ users });
    } catch (error) {
        console.error("Error getting company users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get single user (for admins)
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({
            where: {
                id: userId,
                company_id: req.user.company_id,
            },
            attributes: {
                exclude: [
                    "password_hash",
                    "email_verification_token",
                    "password_reset_token",
                    "password_reset_expires",
                ],
            },
            include: [{ model: Role }],
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("Error getting user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Create new user (for admins)
const createUser = async (req, res) => {
    try {
        const { email, firstName, lastName, roleId, phone } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "Email already registered" });
        }

        // Check if role exists and belongs to the company
        const role = await Role.findOne({
            where: {
                id: roleId,
                company_id: req.user.company_id,
            },
        });

        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        // Generate temp password and verification token
        const tempPassword = Math.random().toString(36).slice(-8);
        const verificationToken = uuidv4();

        // Create user
        const user = await User.create({
            username: email.split("@")[0],
            email,
            password_hash: tempPassword,
            company_id: req.user.company_id,
            role_id: roleId,
            first_name: firstName,
            last_name: lastName,
            phone,
            is_active: true,
            is_email_verified: false,
            email_verification_token: verificationToken,
            created_at: new Date(),
            updated_at: new Date(),
        });

        // Send verification email
        await sendVerificationEmail(user, verificationToken);

        // Log the activity
        await logActivity(req, "USER_CREATE", "User", user.id);

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                roleId: user.role_id,
            },
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update user (for admins)
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { firstName, lastName, roleId, phone, isActive } = req.body;

        // Find user
        const user = await User.findOne({
            where: {
                id: userId,
                company_id: req.user.company_id,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if role exists and belongs to the company
        if (roleId) {
            const role = await Role.findOne({
                where: {
                    id: roleId,
                    company_id: req.user.company_id,
                },
            });

            if (!role) {
                return res.status(404).json({ message: "Role not found" });
            }

            user.role_id = roleId;
        }

        // Update user
        if (firstName !== undefined) user.first_name = firstName;
        if (lastName !== undefined) user.last_name = lastName;
        if (phone !== undefined) user.phone = phone;
        if (isActive !== undefined) user.is_active = isActive;

        user.updated_at = new Date();
        await user.save();

        // Log the activity
        await logActivity(req, "USER_UPDATE", "User", user.id, {
            updatedBy: req.user.id,
        });

        res.status(200).json({
            message: "User updated successfully",
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                roleId: user.role_id,
                isActive: user.is_active,
            },
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete user (for admins)
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user
        const user = await User.findOne({
            where: {
                id: userId,
                company_id: req.user.company_id,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Don't allow deleting yourself
        if (user.id === req.user.id) {
            return res
                .status(400)
                .json({ message: "Cannot delete your own account" });
        }

        // Delete user
        await user.destroy();

        // Log the activity
        await logActivity(req, "USER_DELETE", "User", userId, {
            deletedBy: req.user.id,
        });

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getCurrentUser,
    updateCurrentUser,
    changePassword,
    getCompanyUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
