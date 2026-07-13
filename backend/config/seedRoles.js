import Role from '../models/Role.js';

export const seedDefaultRoles = async () => {
  try {
    const count = await Role.countDocuments();
    if (count > 0) return; // Roles already seeded

    console.log('[Seed] Seeding default roles...');

    const defaultRoles = [
      {
        name: 'Administrator',
        description: 'Full system access',
        permissions: ['manage_users', 'manage_roles', 'manage_orders', 'manage_inventory', 'view_reports']
      },
      {
        name: 'Sales Manager',
        description: 'Can manage orders',
        permissions: ['manage_orders', 'view_reports']
      },
      {
        name: 'Inventory Manager',
        description: 'Can manage stock levels',
        permissions: ['manage_inventory']
      },
      {
        name: 'Staff',
        description: 'Basic access',
        permissions: []
      }
    ];

    await Role.insertMany(defaultRoles);
    console.log('[Seed] Default roles seeded successfully.');
  } catch (error) {
    console.error(`[Seed Error] Failed to seed roles: ${error.message}`);
  }
};
