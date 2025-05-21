const express = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validation");
const authController = require("../controllers/authController");
const { authenticateJWT } = require("../middleware/auth");

const router = express.Router();

// Register company
router.post(
    "/register",
    [
        body("companyName").notEmpty().withMessage("Company name is required"),
        body("email").isEmail().withMessage("Valid email is required"),
        body("password")
            .isLength({ min: 8 })
            .withMessage("Password must be at least 8 characters long"),
        body("firstName").notEmpty().withMessage("First name is required"),
        body("lastName").notEmpty().withMessage("Last name is required"),
        validate,
    ],
    authController.registerCompany
);

// Verify email
router.get("/verify-email/:token", authController.verifyEmail);

// Login
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Valid email is required"),
        body("password").notEmpty().withMessage("Password is required"),
        validate,
    ],
    authController.login
);

// Refresh token
router.post(
    "/refresh-token",
    [
        body("refreshToken")
            .notEmpty()
            .withMessage("Refresh token is required"),
        validate,
    ],
    authController.refreshToken
);

// Forgot password
router.post(
    "/forgot-password",
    [body("email").isEmail().withMessage("Valid email is required"), validate],
    authController.forgotPassword
);

// Reset password
router.post(
    "/reset-password",
    [
        body("token").notEmpty().withMessage("Token is required"),
        body("password")
            .isLength({ min: 8 })
            .withMessage("Password must be at least 8 characters long"),
        validate,
    ],
    authController.resetPassword
);

// Logout
router.post("/logout", authenticateJWT, authController.logout);

module.exports = router;
