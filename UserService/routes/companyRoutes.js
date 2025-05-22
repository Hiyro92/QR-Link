const express = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validation");
const companyController = require("../controllers/companyController");
const { authenticateJWT } = require("../middleware/auth");
const { hasPermission } = require("../middleware/permissions");

const router = express.Router();

// All company routes require authentication
router.use(authenticateJWT);

// Get company profile
router.get(
  "/",
  hasPermission("view_company_profile"), // Example permission
  companyController.getCompanyProfile
);

// Update company profile
router.put(
  "/",
  [
    body("name").optional().isString(),
    body("address").optional().isString(),
    body("phone").optional().isString(),
    body("logo").optional().isURL(),
    validate,
  ],
  hasPermission("update_company_profile"), // Example permission
  companyController.updateCompanyProfile
);

// Update company settings
router.put(
  "/settings",
  [
    body("settings").isObject().withMessage("Settings must be a JSON object"),
    validate,
  ],
  hasPermission("manage_company_settings"), // Example permission
  companyController.updateCompanySettings
);

module.exports = router;
