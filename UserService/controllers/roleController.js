const { Role, Permission, RolePermission } = require("../models");
const { logActivity } = require("../services/auditService");

// Get all roles for the logged-in user's company
const getCompanyRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      where: { company_id: req.user.company_id },
      include: [{ model: Permission, attributes: ["id", "name", "resource"] }],
    });

    res.status(200).json({ roles });
  } catch (error) {
    console.error("Error getting company roles:", error);
    await logActivity(req, "GET_COMPANY_ROLES_FAILED", "Role", null, {
      callerId: req.user ? req.user.id : null,
      companyId: req.user ? req.user.company_id : null,
      error: error.message,
    });
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single role by ID for the logged-in user's company
const getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await Role.findOne({
      where: {
        id: roleId,
        company_id: req.user.company_id,
      },
      include: [{ model: Permission, attributes: ["id", "name", "resource"] }],
    });

    if (!role) {
      await logActivity(req, "GET_ROLE_BY_ID_FAILED", "Role", roleId, {
        callerId: req.user.id,
        reason: "Role not found or not in company",
      });
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({ role });
  } catch (error) {
    console.error("Error getting role by ID:", error);
    await logActivity(req, "GET_ROLE_BY_ID_FAILED", "Role", req.params.roleId, {
      callerId: req.user ? req.user.id : null,
      error: error.message,
    });
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new role for the logged-in user's company
const createRole = async (req, res) => {
  try {
    const { name, description, permissionIds = [] } = req.body;

    // Check if role name already exists for this company
    const existingRole = await Role.findOne({
      where: {
        name: name,
        company_id: req.user.company_id,
      },
    });

    if (existingRole) {
      await logActivity(req, "ROLE_CREATE_FAILED", "Role", null, {
        callerId: req.user.id,
        companyId: req.user.company_id,
        reason: "Role name already exists",
        roleName: name,
      });
      return res
        .status(400)
        .json({ message: "Role name already exists for this company" });
    }

    // Create the role
    const role = await Role.create({
      name: name,
      description: description,
      company_id: req.user.company_id,
      created_at: new Date(),
    });

    // Associate permissions if provided
    if (permissionIds.length > 0) {
      // Basic check: ensure provided permissionIds are valid UUIDs (validation middleware handles format)
      // A more robust check would verify these permissionIds actually exist in the global Permission table
      const rolePermissions = permissionIds.map((permId) => ({
        role_id: role.id,
        permission_id: permId,
      }));
      await RolePermission.bulkCreate(rolePermissions);
    }

    // Log the activity
    await logActivity(req, "ROLE_CREATE", "Role", role.id, {
      createdBy: req.user.id,
      companyId: req.user.company_id,
      roleName: role.name,
    });

    res.status(201).json({
      message: "Role created successfully",
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
      },
    });
  } catch (error) {
    console.error("Error creating role:", error);
    await logActivity(req, "ROLE_CREATE_FAILED", "Role", null, {
      callerId: req.user ? req.user.id : null,
      companyId: req.user ? req.user.company_id : null,
      error: error.message,
      requestBody: req.body,
    });
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a role for the logged-in user's company
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissionIds } = req.body; // permissionIds is an array of permission UUIDs

    // Find the role
    const role = await Role.findOne({
      where: {
        id: roleId,
        company_id: req.user.company_id,
      },
    });

    if (!role) {
      await logActivity(req, "ROLE_UPDATE_FAILED", "Role", roleId, {
        callerId: req.user.id,
        reason: "Role not found or not in company",
      });
      return res.status(404).json({ message: "Role not found" });
    }

    // Prevent updating the default admin role (optional rule)
    // if (role.name === 'Admin' && !role.company_id) { // Assuming system-wide admin roles have no company_id
    //    return res.status(403).json({ message: 'Cannot update system-wide admin role' });
    // }
    // Or prevent updating the company's initial admin role if needed

    // Update role fields if provided
    if (name !== undefined) {
      // Check if new role name already exists (excluding the current role)
      const existingRole = await Role.findOne({
        where: {
          name: name,
          company_id: req.user.company_id,
          id: { [Op.ne]: roleId },
        },
      });
      if (existingRole) {
        await logActivity(req, "ROLE_UPDATE_FAILED", "Role", roleId, {
          callerId: req.user.id,
          companyId: req.user.company_id,
          reason: "Role name already exists",
          newRoleName: name,
        });
        return res
          .status(400)
          .json({ message: "Role name already exists for this company" });
      }
      role.name = name;
    }
    if (description !== undefined) role.description = description;

    await role.save(); // Save role name/description changes first

    // Update permissions if permissionIds array is provided
    if (permissionIds !== undefined) {
      // Remove existing RolePermissions for this role
      await RolePermission.destroy({ where: { role_id: role.id } });

      // Create new RolePermissions
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permId) => ({
          role_id: role.id,
          permission_id: permId,
        }));
        await RolePermission.bulkCreate(rolePermissions);
      }
      // Log permission update
      await logActivity(req, "ROLE_PERMISSIONS_UPDATE", "Role", role.id, {
        newPermissionIds: permissionIds,
        updatedBy: req.user.id,
      });
    }

    // Log the activity
    await logActivity(req, "ROLE_UPDATE", "Role", role.id, {
      updatedFields: { name, description },
      updatedBy: req.user.id,
    });

    res.status(200).json({
      message: "Role updated successfully",
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: permissionIds, // Reflect the updated permissions (IDs)
      },
    });
  } catch (error) {
    console.error("Error updating role:", error);
    await logActivity(req, "ROLE_UPDATE_FAILED", "Role", req.params.roleId, {
      callerId: req.user ? req.user.id : null,
      error: error.message,
      requestBody: req.body,
    });
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a role for the logged-in user's company
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    // Find the role
    const role = await Role.findOne({
      where: {
        id: roleId,
        company_id: req.user.company_id,
      },
    });

    if (!role) {
      await logActivity(req, "ROLE_DELETE_FAILED", "Role", roleId, {
        callerId: req.user.id,
        reason: "Role not found or not in company",
      });
      return res.status(404).json({ message: "Role not found" });
    }

    // Prevent deleting the default admin role or any role currently assigned to users
    const usersWithRole = await User.count({ where: { role_id: role.id } });
    if (usersWithRole > 0) {
      await logActivity(req, "ROLE_DELETE_FAILED", "Role", roleId, {
        callerId: req.user.id,
        reason: "Role assigned to users",
        userCount: usersWithRole,
      });
      return res.status(400).json({
        message: "Cannot delete role because it is assigned to users",
      });
    }

    // If the role is the *only* admin role for the company, prevent deletion? (More complex rule)
    // For simplicity, we'll allow deleting any role not assigned to users for now.

    // Delete the role (this will also cascade delete associated RolePermissions)
    await role.destroy();

    // Log the activity
    await logActivity(req, "ROLE_DELETE", "Role", roleId, {
      deletedBy: req.user.id,
      roleName: role.name,
    });

    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    await logActivity(req, "ROLE_DELETE_FAILED", "Role", req.params.roleId, {
      callerId: req.user ? req.user.id : null,
      error: error.message,
    });
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all available permissions (system-wide)
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      attributes: ["id", "name", "description", "resource"],
    });
    res.status(200).json({ permissions });
  } catch (error) {
    console.error("Error getting all permissions:", error);
    await logActivity(req, "GET_ALL_PERMISSIONS_FAILED", "Permission", null, {
      callerId: req.user ? req.user.id : null,
      error: error.message,
    });
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getCompanyRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
};
