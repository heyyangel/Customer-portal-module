import { useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { UserPlus, MoreVertical, Shield, Mail, Key, Loader2 } from 'lucide-react';

export const UserManagement = () => {
  const { users, fetchUsers, loading, error } = useAdminStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500">Manage system users, roles, and access credentials.</p>
        </div>
        <Button size="sm" variant="primary">
          <UserPlus size={16} className="mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600">User</th>
                <th className="px-6 py-4 font-bold text-slate-600">Roles</th>
                <th className="px-6 py-4 font-bold text-slate-600">Status</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={24} /> Loading users...
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{u.name}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1"><Mail size={12}/>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.length > 0 ? u.roles.map(r => (
                          <span key={r._id} className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded flex items-center gap-1">
                            <Shield size={12} /> {r.name}
                          </span>
                        )) : (
                          <span className="text-xs text-slate-400 italic">No roles</span>
                        )}
                        {/* Note: In a real app we would have a dropdown here or in a modal to assign roles */}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${u.status === 'Active' ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-600'}`}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" title="Reset Password"><Key size={14} /></Button>
                        <Button variant="ghost" size="sm"><MoreVertical size={16} /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
