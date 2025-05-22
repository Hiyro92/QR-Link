const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation");
const authController = require("../controllers/authController");
const { authenticateJWT } = require("../middleware/auth");
const isPasswordValid = require("../utils/isPasswordValid");

const router = express.Router();

// Register company
router.post(
  "/register",
  [
    body("companyName").notEmpty().withMessage("Company name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .custom(isPasswordValid)
      .withMessage("Password is not Valied"),
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
    body("refreshToken").notEmpty().withMessage("Refresh token is required"),
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
  "/reset-password/:token",
  [
    param("token").isUUID(4).withMessage("Valid token is required"),
    body("password")
      .custom(isPasswordValid)
      .withMessage("Password is not Valied"),
    validate,
  ],
  authController.resetPassword
);

// Logout
router.post("/logout", authenticateJWT, authController.logout);

module.exports = router;
