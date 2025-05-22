// utils/seeder.js
const { v4: uuidv4 } = require("uuid");
const { Permission, Role, RolePermission } = require("../models");

// Core permission definitions
const getDefaultPermissions = () => [
  {
    id: uuidv4(),
    name: "view_users",
    description: "Can view users in their company",
    resource: "users",
  },
  {
    id: uuidv4(),
    name: "create_users",
    description: "Can invite and create new users",
    resource: "users",
  },
  {
    id: uuidv4(),
    name: "update_users",
    description: "Can update user details",
    resource: "users",
  },
  {
    id: uuidv4(),
    name: "delete_users",
    description: "Can deactivate users",
    resource: "users",
  },
  {
    id: uuidv4(),
    name: "view_roles",
    description: "Can view roles and their permissions",
    resource: "roles",
  },
  {
    id: uuidv4(),
    name: "create_roles",
    description: "Can create new roles",
    resource: "roles",
  },
  {
    id: uuidv4(),
    name: "update_roles",
    description: "Can update existing roles",
    resource: "roles",
  },
  {
    id: uuidv4(),
    name: "delete_roles",
    description: "Can delete roles",
    resource: "roles",
  },
  {
    id: uuidv4(),
    name: "view_permissions",
    description: "Can view all available permissions",
    resource: "permissions",
  },
  {
    id: uuidv4(),
    name: "view_company_profile",
    description: "Can view company details",
    resource: "company",
  },
  {
    id: uuidv4(),
    name: "update_company_profile",
    description: "Can update company details",
    resource: "company",
  },
  {
    id: uuidv4(),
    name: "manage_company_settings",
    description: "Can manage company settings",
    resource: "company",
  },
  // Weitere anwendungsspezifische Berechtigungen hier hinzufügen
];

// Default role definitions
const getDefaultRoles = () => [
  {
    id: uuidv4(),
    name: "Admin",
    description: "Company administrator with full access",
    is_system_role: true,
    permissions: [
      "view_users",
      "create_users",
      "update_users",
      "delete_users",
      "view_roles",
      "create_roles",
      "update_roles",
      "delete_roles",
      "view_permissions",
      "view_company_profile",
      "update_company_profile",
      "manage_company_settings",
    ],
  },
  {
    id: uuidv4(),
    name: "Manager",
    description: "Department or team manager with user management capabilities",
    is_system_role: true,
    permissions: [
      "view_users",
      "create_users",
      "update_users",
      "view_roles",
      "view_permissions",
      "view_company_profile",
    ],
  },
  {
    id: uuidv4(),
    name: "User",
    description: "Standard user with basic permissions",
    is_system_role: true,
    permissions: ["view_users", "view_company_profile"],
  },
];

// Seed system permissions
const seedPermissions = async () => {
  try {
    console.log("Seeding system permissions...");
    const defaultPermissions = getDefaultPermissions();

    // Upsert permissions
    for (const perm of defaultPermissions) {
      await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: perm,
      });
    }
    console.log(`${defaultPermissions.length} system permissions seeded`);

    // Return all permissions from DB for role assignment
    return await Permission.findAll();
  } catch (error) {
    console.error("Error seeding permissions:", error);
    throw error;
  }
};

// Seed default roles
const seedDefaultRoles = async (permissions) => {
  try {
    console.log("Seeding default system roles...");
    const defaultRoles = getDefaultRoles();
    const permissionsByName = permissions.reduce((acc, p) => {
      acc[p.name] = p;
      return acc;
    }, {});

    // Create each role and assign permissions
    for (const roleData of defaultRoles) {
      const { permissions: permissionNames, ...roleDetails } = roleData;

      // Create or find the role
      const [role, created] = await Role.findOrCreate({
        where: {
          name: roleData.name,
          is_system_role: true,
          company_id: null, // System roles aren't tied to a company
        },
        defaults: roleDetails,
      });

      if (created) {
        console.log(`Created system role: ${role.name}`);
      }

      // Assign permissions to the role
      for (const permName of permissionNames) {
        if (permissionsByName[permName]) {
          await RolePermission.findOrCreate({
            where: {
              role_id: role.id,
              permission_id: permissionsByName[permName].id,
            },
          });
        }
      }
    }

    console.log(`${defaultRoles.length} default roles seeded`);
  } catch (error) {
    console.error("Error seeding default roles:", error);
    throw error;
  }
};

// Main seeding function
const seedInitialData = async () => {
  try {
    console.log("Starting database seeding...");

    // Seed permissions first
    const permissions = await seedPermissions();

    // Then seed roles and assign permissions
    await seedDefaultRoles(permissions);

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Database seeding failed:", error);
    throw error;
  }
};

module.exports = {
  seedInitialData,
  seedPermissions,
  seedDefaultRoles,
};
