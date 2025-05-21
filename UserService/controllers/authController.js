const { v4: uuidv4 } = require("uuid");
const { User, Company, Role } = require("../models");
const { generateToken, generateRefreshToken } = require("../utils/jwt");
const {
    sendVerificationEmail,
    sendPasswordResetEmail,
} = require("../services/emailService");
const { logActivity } = require("../services/auditService");
const config = require("../config/config");

// Register a new company with admin user
const registerCompany = async (req, res) => {
    try {
        const {
            companyName,
            companyAddress,
            companyPhone,
            email,
            password,
            firstName,
            lastName,
        } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "Email already registered" });
        }

        // Create company
        const company = await Company.create({
            name: companyName,
            address: companyAddress,
            phone: companyPhone,
            is_active: true,
            created_at: new Date(),
        });

        // Create admin role for the company
        const adminRole = await Role.create({
            name: "Admin",
            description: "Company Administrator",
            company_id: company.id,
            created_at: new Date(),
        });

        // Generate verification token
        const verificationToken = uuidv4();

        // Create user
        const user = await User.create({
            username: email.split("@")[0],
            email,
            password_hash: password,
            company_id: company.id,
            role_id: adminRole.id,
            first_name: firstName,
            last_name: lastName,
            is_active: true,
            is_email_verified: false,
            email_verification_token: verificationToken,
            created_at: new Date(),
            updated_at: new Date(),
        });

        // Send verification email
        await sendVerificationEmail(user, verificationToken);

        // Log the activity
        await logActivity(req, "COMPANY_REGISTER", "Company", company.id);

        res.status(201).json({
            message:
                "Company registered successfully. Please verify your email.",
            companyId: company.id,
        });
    } catch (error) {
        console.error("Error registering company:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Verify email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Find user with verification token
        const user = await User.findOne({
            where: { email_verification_token: token },
        });

        if (!user) {
            return res
                .status(400)
                .json({ message: "Invalid verification token" });
        }

        // Update user
        user.is_email_verified = true;
        user.email_verification_token = null;
        user.updated_at = new Date();
        await user.save();

        // Log the activity
        await logActivity(req, "EMAIL_VERIFY", "User", user.id);

        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({
            where: { email },
            include: [{ model: Company }],
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return res.status(401).json({
                message:
                    "Account is locked due to too many failed login attempts",
                lockedUntil: user.locked_until,
            });
        }

        // Check if email is verified
        if (!user.is_email_verified) {
            return res.status(401).json({ message: "Email not verified" });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({ message: "Account is inactive" });
        }

        // Check if company is active
        if (!user.Company.is_active) {
            return res
                .status(401)
                .json({ message: "Company account is inactive" });
        }

        // Verify password
        const isValidPassword = await user.isValidPassword(password);

        if (!isValidPassword) {
            // Increment failed login attempts
            user.failed_login_attempts += 1;

            // Check if account should be locked
            if (
                user.failed_login_attempts >=
                config.security.maxFailedLoginAttempts
            ) {
                user.locked_until = new Date(
                    Date.now() + config.security.lockoutDuration
                );
            }

            await user.save();

            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Reset failed login attempts
        user.failed_login_attempts = 0;
        user.locked_until = null;
        user.last_login = new Date();
        await user.save();

        // Generate JWT token
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        // Log the activity
        await logActivity(req, "USER_LOGIN", "User", user.id);

        res.status(200).json({
            message: "Login successful",
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                company: {
                    id: user.Company.id,
                    name: user.Company.name,
                },
            },
        });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Refresh token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res
                .status(400)
                .json({ message: "Refresh token is required" });
        }

        // Verify the refresh token
        const decoded = verifyToken(refreshToken);

        // Check token type
        if (decoded.type !== "refresh") {
            return res.status(401).json({ message: "Invalid token type" });
        }

        // Get user
        const user = await User.findByPk(decoded.user.id, {
            include: [{ model: Company }],
        });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Check if user is active
        if (!user.is_active || !user.Company.is_active) {
            return res.status(401).json({ message: "Account is inactive" });
        }

        // Generate new tokens
        const newToken = generateToken(user);
        const newRefreshToken = generateRefreshToken(user);

        // Log the activity
        await logActivity(req, "TOKEN_REFRESH", "User", user.id);

        res.status(200).json({
            token: newToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.error("Error refreshing token:", error);

        if (error.message === "Invalid or expired token") {
            return res
                .status(401)
                .json({ message: "Invalid or expired refresh token" });
        }

        res.status(500).json({ message: "Internal server error" });
    }
};

// Forgot password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ where: { email } });

        if (!user) {
            // Don't reveal that the user doesn't exist
            return res.status(200).json({
                message:
                    "If that email exists in our system, we have sent a password reset link",
            });
        }

        // Generate reset token
        const resetToken = uuidv4();

        // Update user
        user.password_reset_token = resetToken;
        user.password_reset_expires = new Date(
            Date.now() + config.security.passwordResetExpiry
        );
        user.updated_at = new Date();
        await user.save();

        // Send password reset email
        await sendPasswordResetEmail(user, resetToken);

        // Log the activity
        await logActivity(req, "PASSWORD_RESET_REQUEST", "User", user.id);

        res.status(200).json({
            message:
                "If that email exists in our system, we have sent a password reset link",
        });
    } catch (error) {
        console.error("Error in forgot password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Reset password
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Find user
        const user = await User.findOne({
            where: {
                password_reset_token: token,
                password_reset_expires: { [Op.gt]: new Date() },
            },
        });

        if (!user) {
            return res
                .status(400)
                .json({ message: "Invalid or expired reset token" });
        }

        // Update user
        user.password_hash = password;
        user.password_reset_token = null;
        user.password_reset_expires = null;
        user.updated_at = new Date();
        await user.save();

        // Log the activity
        await logActivity(req, "PASSWORD_RESET", "User", user.id);

        res.status(200).json({
            message: "Password has been reset successfully",
        });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        // Note: JWT tokens are stateless, so we can't invalidate them
        // Client should delete the token from their storage

        // Log the activity
        if (req.user) {
            await logActivity(req, "USER_LOGOUT", "User", req.user.id);
        }

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    registerCompany,
    verifyEmail,
    login,
    refreshToken,
    forgotPassword,
    resetPassword,
    logout,
};
