import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users, Bell, Shield, BarChart3, Send, Trash2,
  UserCheck, UserX, AlertTriangle, Activity, Globe,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/common/StatsCard';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Mock data
const mockUsers = [
  { uid: '1', name: 'Ramesh Kumar', email: 'ramesh@example.com', role: 'farmer' as const, phone: '+919876543210', status: 'active' },
  { uid: '2', name: 'Dr. Priya Sharma', email: 'priya@example.com', role: 'expert' as const, phone: '+919876543211', status: 'active' },
  { uid: '3', name: 'Lakshmi Devi', email: 'lakshmi@example.com', role: 'farmer' as const, phone: '+919876543212', status: 'active' },
  { uid: '4', name: 'Venkata Rao', email: 'venkata@example.com', role: 'farmer' as const, phone: '+919876543213', status: 'active' },
  { uid: '5', name: 'Dr. Suresh Reddy', email: 'suresh@example.com', role: 'expert' as const, phone: '+919876543214', status: 'inactive' },
  { uid: '6', name: 'Anjali Kumari', email: 'anjali@example.com', role: 'farmer' as const, phone: '+919876543215', status: 'active' },
];

const mockAlerts = [
  { id: '1', type: 'weather', severity: 'warning', title: 'Heavy Rainfall Expected', message: 'IMD warns of heavy rainfall in Telangana region for next 48 hours.', createdAt: new Date(Date.now() - 3600000) },
  { id: '2', type: 'pest', severity: 'critical', title: 'Fall Armyworm Alert', message: 'Fall armyworm outbreak reported in multiple districts. Inspect maize fields immediately.', createdAt: new Date(Date.now() - 86400000) },
  { id: '3', type: 'system', severity: 'info', title: 'System Maintenance', message: 'Scheduled maintenance on July 6th, 2-4 AM IST.', createdAt: new Date(Date.now() - 172800000) },
];

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.split('/').pop() || 'overview';
  const activeTab = (path === 'dashboard' || path === 'overview') ? 'overview' : path;
  const [users, setUsers] = useState(mockUsers);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [userFilter, setUserFilter] = useState<'all' | 'farmer' | 'expert'>('all');

  // New alert form
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'info' | 'warning' | 'critical'>('warning');

  const filteredUsers = users.filter((u) => userFilter === 'all' || u.role === userFilter);
  const farmers = users.filter((u) => u.role === 'farmer');
  const experts = users.filter((u) => u.role === 'expert');

  const handleBroadcastAlert = async () => {
    if (!alertTitle.trim() || !alertMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const phones = farmers.map((f) => f.phone);
      await axios.post(`${API_URL}/sms/bulk`, {
        phones,
        alertTitle,
        alertMessage,
      });
    } catch {
      // Mock success
    }

    setAlerts([
      {
        id: Date.now().toString(),
        type: 'system',
        severity: alertSeverity,
        title: alertTitle,
        message: alertMessage,
        createdAt: new Date(),
      },
      ...alerts,
    ]);

    toast.success(`Alert broadcast to ${farmers.length} farmers!`);
    setAlertTitle('');
    setAlertMessage('');
  };

  const toggleUserStatus = (uid: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === uid ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    );
    toast.success('User status updated');
  };

  const severityColors: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    critical: 'bg-red-500/10 text-red-300 border-red-500/20',
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 via-indigo-600/5 to-pink-500/10 rounded-3xl border border-purple-500/10 p-6">
        <h2 className="text-2xl font-bold text-white mb-1">
          🛡️ {t('welcome_admin')}, {profile?.name || 'Admin'}
        </h2>
        <p className="text-gray-400 text-sm">Manage users, alerts, and system configuration</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={t('total_farmers')} value={farmers.length} icon={<Users size={20} />} color="emerald" trend="up" trendValue="+3" />
        <StatsCard title={t('total_experts')} value={experts.length} icon={<Shield size={20} />} color="blue" />
        <StatsCard title={t('active_alerts')} value={alerts.length} icon={<Bell size={20} />} color="amber" />
        <StatsCard title={t('queries_today')} value={12} icon={<Activity size={20} />} color="purple" trend="up" trendValue="+5" />
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2">
        {[
          { id: 'overview', icon: BarChart3, label: 'Overview' },
          { id: 'users', icon: Users, label: t('manage_users') },
          { id: 'alerts', icon: Bell, label: t('broadcast_alert') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id === 'overview' ? '/dashboard' : `/dashboard/${tab.id}`)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                : 'bg-white/5 text-gray-500 border border-white/5 hover:text-gray-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bell size={18} className="text-amber-400" /> Recent Alerts
            </h3>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`p-4 rounded-xl border ${severityColors[alert.severity]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <span className="text-[10px] uppercase font-bold">{alert.severity}</span>
                  </div>
                  <p className="text-xs text-gray-400">{alert.message}</p>
                  <p className="text-[10px] text-gray-600 mt-2">{alert.createdAt.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* User Distribution */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe size={18} className="text-purple-400" /> System Overview
            </h3>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Farmers</span>
                  <span className="text-sm font-bold text-emerald-300">{farmers.length}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(farmers.length / users.length) * 100}%` }} />
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Experts</span>
                  <span className="text-sm font-bold text-blue-300">{experts.length}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(experts.length / users.length) * 100}%` }} />
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Active Users</span>
                  <span className="text-sm font-bold text-purple-300">{users.filter((u) => u.status === 'active').length}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(users.filter((u) => u.status === 'active').length / users.length) * 100}%` }} />
                </div>
              </div>

              {/* Platform stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-emerald-500/5 rounded-xl p-4 text-center border border-emerald-500/10">
                  <p className="text-2xl font-bold text-emerald-300">156</p>
                  <p className="text-xs text-gray-500">Total Queries</p>
                </div>
                <div className="bg-blue-500/5 rounded-xl p-4 text-center border border-blue-500/10">
                  <p className="text-2xl font-bold text-blue-300">89%</p>
                  <p className="text-xs text-gray-500">Resolution Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── USERS TAB ───────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users size={18} className="text-purple-400" /> {t('manage_users')}
            </h3>
            <div className="flex gap-1 bg-white/5 rounded-xl p-1">
              {(['all', 'farmer', 'expert'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setUserFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                    userFilter === f ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {f === 'all' ? 'All' : t(f)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('role')}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('phone')}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          user.role === 'expert' ? 'bg-blue-500/30' : 'bg-emerald-500/30'
                        }`}>
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium capitalize ${
                        user.role === 'expert' ? 'bg-blue-500/10 text-blue-300' : 'bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">{user.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                        user.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleUserStatus(user.uid)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.status === 'active'
                            ? 'hover:bg-red-500/10 text-gray-500 hover:text-red-400'
                            : 'hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400'
                        }`}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ALERTS TAB ──────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Alert */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" /> {t('broadcast_alert')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Severity</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['info', 'warning', 'critical'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setAlertSeverity(sev)}
                      className={`py-2 rounded-xl text-xs font-medium capitalize transition-all border ${
                        alertSeverity === sev ? severityColors[sev] : 'bg-white/5 text-gray-500 border-white/5'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('alert_title')}</label>
                <input
                  type="text"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="e.g., Heavy Rainfall Warning"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('alert_message')}</label>
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                  placeholder="Detailed alert message..."
                />
              </div>
              <button
                onClick={handleBroadcastAlert}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-purple-400 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Send size={18} />
                {t('send_alert')} ({farmers.length} {t('farmer')}s)
              </button>
            </div>
          </div>

          {/* Alert History */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Alert History</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-xl border ${severityColors[alert.severity]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold">{alert.severity}</span>
                      <button
                        onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                        className="p-1 rounded-lg hover:bg-white/10 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{alert.message}</p>
                  <p className="text-[10px] text-gray-600 mt-2">{alert.createdAt.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
