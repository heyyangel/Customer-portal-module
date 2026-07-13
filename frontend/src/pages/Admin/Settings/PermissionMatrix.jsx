import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Available granular permissions in the system
const PERMISSIONS = [
  { id: 'view_orders', label: 'View Bookings' },
  { id: 'create_order', label: 'Create Bookings' },
  { id: 'manage_orders', label: 'Manage Bookings' },
  { id: 'manage_inventory', label: 'Manage Inventory' },
  { id: 'view_reports', label: 'Reports' },
  { id: 'manage_users', label: 'Manage Users' },
  { id: 'manage_roles', label: 'Manage Roles' },
];

export const PermissionMatrix = () => {
  const { roles, fetchRoles, updateRolePermissions, loading } = useAdminStore();
  const [localPermissions, setLocalPermissions] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    // Initialize local state from fetched roles
    const stateMap = {};
    roles.forEach(role => {
      stateMap[role._id] = new Set(role.permissions || []);
    });
    setLocalPermissions(stateMap);
  }, [roles]);

  const handleToggle = (roleId, permId) => {
    setLocalPermissions(prev => {
      const rolePerms = new Set(prev[roleId]);
      if (rolePerms.has(permId)) {
        rolePerms.delete(permId);
      } else {
        rolePerms.add(permId);
      }
      return { ...prev, [roleId]: rolePerms };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    let successCount = 0;
    
    // Check which roles have changed and update them
    for (const role of roles) {
      const originalPerms = new Set(role.permissions || []);
      const newPerms = localPermissions[role._id] || new Set();
      
      // Simple comparison
      const isChanged = 
        originalPerms.size !== newPerms.size || 
        [...newPerms].some(p => !originalPerms.has(p));

      if (isChanged) {
        const res = await updateRolePermissions(role._id, Array.from(newPerms));
        if (res) successCount++;
      }
    }
    
    setSaving(false);
    if (successCount > 0) {
      toast.success(`Successfully updated ${successCount} role(s)`);
    } else {
      toast.success('No changes to save.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Role Permissions</h2>
          <p className="text-sm text-slate-500">Configure global access controls via the permission matrix.</p>
        </div>
        <Button size="sm" variant="primary" onClick={handleSave} disabled={saving || roles.length === 0}>
          {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {roles.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No roles found in the database.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600 border-r border-slate-200">Permission</th>
                  {roles.map(role => (
                    <th key={role._id} className="px-6 py-4 font-bold text-slate-600 text-center">{role.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSIONS.map(perm => (
                  <tr key={perm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 border-r border-slate-200">{perm.label}</td>
                    {roles.map(role => {
                      const isChecked = localPermissions[role._id]?.has(perm.id) || false;
                      const isSuperAdmin = role.name === 'Super Admin' || role.name === 'Administrator';
                      
                      return (
                        <td key={`${perm.id}-${role._id}`} className="px-6 py-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => handleToggle(role._id, perm.id)}
                            disabled={isSuperAdmin} // Keep admin locked if desired, or remove disabled attribute
                            className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 disabled:opacity-50"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
