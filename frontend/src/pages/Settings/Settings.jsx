import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { User, Bell, Shield, Key, Mail, Building, Globe } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { motion } from 'framer-motion';

export const Settings = () => {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Account Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your personal profile, security, and app preferences.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-col gap-1 p-2 bg-slate-50/80 rounded-2xl border border-slate-200/60 shadow-inner h-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all z-10 overflow-hidden ${
                activeTab === tab.id 
                ? 'text-white shadow-md shadow-[#1a5b9e]/20' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab_settings"
                  className="absolute inset-0 bg-gradient-to-r from-[#1a5b9e] to-[#15467a] z-[-1]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon size={18} className={activeTab === tab.id ? 'text-white/90' : 'text-slate-400'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Profile Information</h3>
                  
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-32 h-32 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center text-4xl font-black text-slate-500 uppercase">
                        {(user?.user || user?.name || 'U').charAt(0)}
                      </div>
                      <Button variant="outline" size="sm">Change Photo</Button>
                    </div>
                    
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                        <input type="text" defaultValue={user?.user || user?.name} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-medium text-slate-800" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input type="email" defaultValue={user?.email} disabled className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-lg outline-none font-medium text-slate-500 cursor-not-allowed" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input type="text" defaultValue={user?.company || '—'} disabled className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-lg outline-none font-medium text-slate-500 cursor-not-allowed" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                        <input type="text" defaultValue={user?.role || 'User'} disabled className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-lg outline-none font-bold text-slate-700 cursor-not-allowed" />
                      </div>
                    </div>
                  </div>
                
                  <div className="mt-8 flex justify-end">
                    <Button variant="primary">Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6">App Preferences</h3>
                
                <div className="flex flex-col gap-8">
                  {/* Notifications */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Notifications</h4>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Mail size={14}/></div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">Email Notifications</p>
                            <p className="text-xs text-slate-500">Receive order updates and approvals via email.</p>
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Bell size={14}/></div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">Push Notifications</p>
                            <p className="text-xs text-slate-500">Receive browser notifications for real-time events.</p>
                          </div>
                        </div>
                        <input type="checkbox" className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Security Settings</h3>
                
                <div className="flex flex-col gap-6 max-w-md">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-medium text-slate-800" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-medium text-slate-800" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-medium text-slate-800" />
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <Button variant="primary">Update Password</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
