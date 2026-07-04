import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Cloud, Sprout, Bug, Droplets, MessageCircle,
  Bell, Settings, LogOut, Menu, X, Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Language } from '../../context/LanguageContext';

interface NavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const { profile, logout } = useAuth();
  const { language, setLanguage, t, languageNames } = useLanguage();

  // Read the active session/demo role
  const demoRole = sessionStorage.getItem('demoRole') || profile?.role || 'farmer';

  const farmerTabs = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { id: 'weather', label: t('weather'), icon: Cloud, path: '/dashboard/weather' },
    { id: 'crop', label: t('crop_recommendation'), icon: Sprout, path: '/dashboard/crop' },
    { id: 'disease', label: t('disease_detection'), icon: Bug, path: '/dashboard/disease' },
    { id: 'irrigation', label: t('irrigation'), icon: Droplets, path: '/dashboard/irrigation' },
    { id: 'advisory', label: t('advisories'), icon: MessageCircle, path: '/dashboard/advisory' },
    { id: 'alerts', label: t('alerts'), icon: Bell, path: '/dashboard/alerts' },
  ];

  const expertTabs = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { id: 'advisory', label: t('advisories'), icon: MessageCircle, path: '/dashboard/advisory' },
    { id: 'weather', label: t('weather'), icon: Cloud, path: '/dashboard/weather' },
    { id: 'alerts', label: t('alerts'), icon: Bell, path: '/dashboard/alerts' },
  ];

  const adminTabs = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { id: 'users', label: t('manage_users'), icon: Settings, path: '/dashboard/users' },
    { id: 'alerts', label: t('broadcast_alert'), icon: Bell, path: '/dashboard/alerts' },
  ];

  const tabs = demoRole === 'admin' ? adminTabs : demoRole === 'expert' ? expertTabs : farmerTabs;

  return (
    <>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-gray-400">
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
              🌾
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold bg-gradient-to-r from-emerald-300 to-green-400 bg-clip-text text-transparent">
                {t('app_name')}
              </h1>
              <p className="text-[10px] text-gray-500 -mt-0.5">{t('tagline')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            <Globe size={14} className="text-gray-500 ml-2" />
            {(Object.keys(languageNames) as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  language === lang
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Profile */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-medium text-gray-300">{profile?.name || 'User'}</p>
              <p className="text-[10px] text-emerald-400/70 capitalize">{demoRole}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
            title={t('logout')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-gray-900/90 backdrop-blur-xl border-r border-white/5 z-40 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="p-4 space-y-1.5 mt-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            // NavLink uses end=true for root /dashboard to prevent match on subpaths
            const isRoot = tab.path === '/dashboard';
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                end={isRoot}
                onClick={onToggleSidebar}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-500/5 font-semibold'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-emerald-400' : ''} />
                    {tab.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 p-4 bg-gradient-to-br from-emerald-500/10 to-green-600/5 rounded-2xl border border-emerald-500/10">
          <p className="text-xs text-emerald-300/80 font-medium">Kisan Alert v1.0</p>
          <p className="text-[10px] text-gray-500 mt-1">AI-Powered Agriculture</p>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggleSidebar}
        />
      )}
    </>
  );
};

export default Navbar;

