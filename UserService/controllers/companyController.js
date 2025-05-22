const { Company } = require("../models");
const { logActivity } = require("../services/auditService");

// Get company profile
const getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.company_id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ company });
  } catch (error) {
    console.error("Error getting company profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update company profile
const updateCompanyProfile = async (req, res) => {
  try {
    const { name, address, phone, logo } = req.body;

    const company = await Company.findByPk(req.user.company_id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Update company
    if (name !== undefined) company.name = name;
    if (address !== undefined) company.address = address;
    if (phone !== undefined) company.phone = phone;
    if (logo !== undefined) company.logo = logo;

    await company.save();

    // Log the activity
    await logActivity(req, "COMPANY_UPDATE", "Company", company.id);

    res.status(200).json({
      message: "Company profile updated successfully",
      company: {
        id: company.id,
        name: company.name,
        address: company.address,
        phone: company.phone,
        logo: company.logo,
      },
    });
  } catch (error) {
    console.error("Error updating company profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update company settings
const updateCompanySettings = async (req, res) => {
  try {
    const { settings } = req.body;

    const company = await Company.findByPk(req.user.company_id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Update company settings
    company.settings = settings;
    await company.save();

    // Log the activity
    await logActivity(req, "COMPANY_SETTINGS_UPDATE", "Company", company.id);

    res.status(200).json({
      message: "Company settings updated successfully",
      settings: company.settings,
    });
  } catch (error) {
    console.error("Error updating company settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getCompanyProfile,
  updateCompanyProfile,
  updateCompanySettings,
};
