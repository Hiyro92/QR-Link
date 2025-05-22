const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation");
const roleController = require("../controllers/roleController");
const { authenticateJWT } = require("../middleware/auth");
const { hasPermission } = require("../middleware/permissions");

const router = express.Router();

// All role/permission routes require authentication
router.use(authenticateJWT);

// Get all permissions (system-wide)
router.get(
  "/permissions",
  hasPermission("view_permissions"), // Example permission to view available permissions
  roleController.getAllPermissions
);

// Get all roles for the company
router.get(
  "/",
  hasPermission("view_roles"), // Example permission to view roles
  roleController.getCompanyRoles
);

// Get a specific role by ID
router.get(
  "/:roleId",
  [
    param("roleId").isUUID(4).withMessage("Valid role ID is required"),
    validate,
  ],
  hasPermission("view_roles"), // Requires permission to view roles
  roleController.getRoleById
);

// Create a new role
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Role name is required").isString(),
    body("description").optional().isString(),
    body("permissionIds")
      .optional()
      .isArray()
      .withMessage("permissionIds must be an array"),
    body("permissionIds.*")
      .optional()
      .isUUID(4)
      .withMessage("Each permission ID must be a valid UUID"), // Validate array elements
    validate,
  ],
  hasPermission("create_roles"), // Requires permission to create roles
  roleController.createRole
);

// Update a role
router.put(
  "/:roleId",
  [
    param("roleId").isUUID(4).withMessage("Valid role ID is required"),
    body("name").optional().isString(),
    body("description").optional().isString(),
    body("permissionIds")
      .optional()
      .isArray()
      .withMessage("permissionIds must be an array"),
    body("permissionIds.*")
      .optional()
      .isUUID(4)
      .withMessage("Each permission ID must be a valid UUID"),
    validate,
  ],
  hasPermission("update_roles"), // Requires permission to update roles
  roleController.updateRole
);

// Delete a role
router.delete(
  "/:roleId",
  [
    param("roleId").isUUID(4).withMessage("Valid role ID is required"),
    validate,
  ],
  hasPermission("delete_roles"), // Requires permission to delete roles
  roleController.deleteRole
);

module.exports = router;
