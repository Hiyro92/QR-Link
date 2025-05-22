// controllers/companyController.js
const {
  Company,
  User,
  Role,
  RolePermission,
  Permission,
} = require("../models");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const { logActivity } = require("../services/auditService");

// Hilfsfunktion zum Klonen der Standard-Rollen für ein neues Unternehmen
const createCompanyDefaultRoles = async (companyId) => {
  try {
    // Hole alle System-Rollen
    const systemRoles = await Role.findAll({
      where: { is_system_role: true },
      include: [{ model: Permission }],
    });

    const createdRoles = [];

    // Erstelle Kopien für das Unternehmen
    for (const systemRole of systemRoles) {
      // Rolle kopieren ohne die ID und bestimmte Felder
      const { id, company_id, is_system_role, created_at, ...roleData } =
        systemRole.toJSON();

      // Neue Rolle für das Unternehmen erstellen
      const newRole = await Role.create({
        ...roleData,
        id: uuidv4(), // Neue UUID generieren
        company_id: companyId,
        is_system_role: false,
      });

      createdRoles.push(newRole);

      // Berechtigungen zuweisen
      if (systemRole.Permissions && systemRole.Permissions.length > 0) {
        for (const permission of systemRole.Permissions) {
          await RolePermission.create({
            role_id: newRole.id,
            permission_id: permission.id,
          });
        }
      }
    }

    return createdRoles;
  } catch (error) {
    console.error("Error creating default roles for company:", error);
    throw error;
  }
};

// Unternehmen erstellen
const createCompany = async (req, res) => {
  try {
    const { name, address, phone, email, website, settings, ...otherFields } =
      req.body;

    // Validiere erforderliche Felder
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    // Prüfe, ob bereits ein Unternehmen mit diesem Namen existiert
    const existingCompany = await Company.findOne({ where: { name } });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "A company with this name already exists",
      });
    }

    // Unternehmen erstellen
    const company = await Company.create({
      id: uuidv4(),
      name,
      address,
      phone,
      email,
      website,
      settings: settings || {},
      ...otherFields,
    });

    // Standard-Rollen für das neue Unternehmen erstellen
    const createdRoles = await createCompanyDefaultRoles(company.id);

    // Log-Aktivität
    await logActivity(
      req,
      "COMPANY_CREATED",
      req.user ? req.user.id : null,
      company.id,
      { company_name: company.name, roles_created: createdRoles.length }
    );

    res.status(201).json({
      success: true,
      data: company,
      roles: createdRoles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      })),
    });
  } catch (error) {
    console.error("Create company error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create company",
      error: error.message,
    });
  }
};

// Alle Unternehmen abrufen (mit Paginierung)
const getCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    // Suchfilter erstellen
    const filter = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    // Unternehmen abfragen mit Anzahl der Benutzer
    const { count, rows } = await Company.findAndCountAll({
      where: filter,
      limit,
      offset,
      order: [["name", "ASC"]],
      attributes: {
        include: [
          [
            // SQLite und MySQL haben unterschiedliche Funktionen für Subqueries
            sequelize.literal(`(
              SELECT COUNT(*) 
              FROM users 
              WHERE users.company_id = "Company".id
            )`),
            "user_count",
          ],
        ],
      },
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve companies",
      error: error.message,
    });
  }
};

// Einzelnes Unternehmen abrufen mit Benutzeranzahl und Rollen
const getCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id, {
      include: [
        {
          model: Role,
          attributes: ["id", "name", "description"],
        },
      ],
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Anzahl der Benutzer separat abfragen
    const userCount = await User.count({ where: { company_id: id } });

    res.status(200).json({
      success: true,
      data: {
        ...company.toJSON(),
        user_count: userCount,
      },
    });
  } catch (error) {
    console.error("Get company error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve company",
      error: error.message,
    });
  }
};

// Unternehmen aktualisieren
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, website, settings, ...otherFields } =
      req.body;

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Wenn der Name geändert wird, prüfe auf Duplikate
    if (name && name !== company.name) {
      const existingCompany = await Company.findOne({
        where: {
          name,
          id: { [Op.ne]: id }, // Ausschließen der aktuellen ID
        },
      });

      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: "A company with this name already exists",
        });
      }
    }

    // Einstellungen zusammenführen, falls vorhanden
    let updatedSettings = company.settings;
    if (settings) {
      updatedSettings = {
        ...updatedSettings,
        ...settings,
      };
    }

    // Unternehmen aktualisieren
    await company.update({
      name: name || company.name,
      address: address || company.address,
      phone: phone || company.phone,
      email: email || company.email,
      website: website || company.website,
      settings: updatedSettings,
      ...otherFields,
    });

    // Log-Aktivität
    await logActivity(
      req,
      "COMPANY_UPDATED",
      req.user ? req.user.id : null,
      company.id,
      { company_name: company.name }
    );

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Update company error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update company",
      error: error.message,
    });
  }
};

// Unternehmen löschen (ggf. nur soft delete)
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Prüfe, ob Benutzer mit diesem Unternehmen verbunden sind
    const userCount = await User.count({ where: { company_id: id } });

    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete company with active users",
        user_count: userCount,
      });
    }

    // Firmenname für Log speichern
    const companyName = company.name;

    // Rollen des Unternehmens löschen
    await Role.destroy({ where: { company_id: id } });

    // Unternehmen löschen
    await company.destroy();

    // Log-Aktivität
    await logActivity(
      req,
      "COMPANY_DELETED",
      req.user ? req.user.id : null,
      null, // Keine Firmen-ID mehr, da gelöscht
      { company_name: companyName }
    );

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("Delete company error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete company",
      error: error.message,
    });
  }
};

// Firmeneinstellungen aktualisieren
const updateCompanySettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({
        success: false,
        message: "Settings must be a valid object",
      });
    }

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Einstellungen zusammenführen
    const updatedSettings = {
      ...company.settings,
      ...settings,
    };

    // Nur Einstellungen aktualisieren
    await company.update({ settings: updatedSettings });

    // Log-Aktivität
    await logActivity(
      req,
      "COMPANY_SETTINGS_UPDATED",
      req.user ? req.user.id : null,
      company.id,
      { company_name: company.name, updated_settings: Object.keys(settings) }
    );

    res.status(200).json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        settings: updatedSettings,
      },
    });
  } catch (error) {
    console.error("Update company settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update company settings",
      error: error.message,
    });
  }
};

// Rollen eines Unternehmens abrufen
const getCompanyRoles = async (req, res) => {
  try {
    const { id } = req.params;

    // Prüfe, ob das Unternehmen existiert
    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Rollen mit Berechtigungen abrufen
    const roles = await Role.findAll({
      where: { company_id: id },
      include: [
        {
          model: Permission,
          through: { attributes: [] }, // Vermeide Junction-Tabellen-Attribute
        },
      ],
      order: [["name", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error("Get company roles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve company roles",
      error: error.message,
    });
  }
};

// Firmenspezifische Rollen zurücksetzen
const resetCompanyRoles = async (req, res) => {
  try {
    const { id } = req.params;

    // Prüfe, ob das Unternehmen existiert
    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Bestehende Rollen und deren Berechtigungszuweisungen löschen
    // (Vorsicht: Dies entfernt auch die Zuweisungen von Benutzern zu Rollen!)
    await Role.destroy({ where: { company_id: id } });

    // Neue Standard-Rollen erstellen
    const createdRoles = await createCompanyDefaultRoles(id);

    // Log-Aktivität
    await logActivity(
      req,
      "COMPANY_ROLES_RESET",
      req.user ? req.user.id : null,
      company.id,
      { company_name: company.name, roles_created: createdRoles.length }
    );

    res.status(200).json({
      success: true,
      message: "Company roles have been reset to defaults",
      data: createdRoles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      })),
    });
  } catch (error) {
    console.error("Reset company roles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset company roles",
      error: error.message,
    });
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  updateCompanySettings,
  getCompanyRoles,
  resetCompanyRoles,
};
