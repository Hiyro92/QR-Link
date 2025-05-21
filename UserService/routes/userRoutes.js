const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation");
const userController = require("../controllers/userController");
const { authenticateJWT } = require("../middleware/auth");
const { hasPermission } = require("../middleware/permissions");

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Current user routes
router.get("/me", userController.getCurrentUser);

router.put(
    "/me",
    [
        body("firstName").optional(),
        body("lastName").optional(),
        body("phone").optional(),
        body("timezone").optional(),
        body("language").optional(),
        validate,
    ],
    userController.updateCurrentUser
);

router.post(
    "/change-password",
    [
        body("currentPassword")
            .notEmpty()
            .withMessage("Current password is required"),
        body("newPassword")
            .isLength({ min: 8 })
            .withMessage("New password must be at least 8 characters long"),
        validate,
    ],
    userController.changePassword
);

// Admin routes
router.get(
    "/company",
    hasPermission("view_users"),
    userController.getCompanyUsers
);

router.get(
    "/:userId",
    [
        param("userId").isUUID(4).withMessage("Valid user ID is required"),
        validate,
    ],
    hasPermission("view_users"),
    userController.getUserById
);

router.post(
    "/",
    [
        body("email").isEmail().withMessage("Valid email is required"),
        body("firstName").notEmpty().withMessage("First name is required"),
        body("lastName").notEmpty().withMessage("Last name is required"),
        body("roleId").isUUID(4).withMessage("Valid role ID is required"),
        validate,
    ],
    hasPermission("create_users"),
    userController.createUser
);

router.put(
    "/:userId",
    [
        param("userId").isUUID(4).withMessage("Valid user ID is required"),
        body("firstName").optional(),
        body("lastName").optional(),
        body("roleId")
            .optional()
            .isUUID(4)
            .withMessage("Valid role ID is required"),
        body("isActive").optional().isBoolean(),
        validate,
    ],
    hasPermission("update_users"),
    userController.updateUser
);

router.delete(
    "/:userId",
    [
        param("userId").isUUID(4).withMessage("Valid user ID is required"),
        validate,
    ],
    hasPermission("delete_users"),
    userController.deleteUser
);

module.exports = router;
