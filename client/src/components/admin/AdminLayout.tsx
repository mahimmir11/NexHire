import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  FileCheck2,
  Calendar,
  Award,
  ShieldCheck,
  Users,
  Building,
  BarChart3,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { NotificationBell } from '../NotificationBell';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  actions?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  pageTitle = 'Administrative Center',
  pageSubtitle = 'Institutional placement management and campus recruitment governance',
  actions,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const operationalNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/companies', label: 'Companies', icon: Building2 },
    { to: '/admin/opportunities', label: 'Opportunities', icon: Briefcase },
    { to: '/admin/applications', label: 'Applications', icon: FileCheck2 },
    { to: '/admin/interviews', label: 'Interviews', icon: Calendar },
    { to: '/admin/offers', label: 'Job Offers', icon: Award },
    { to: '/admin/placements', label: 'Placements', icon: ShieldCheck },
  ];

  const governanceNavItems = [
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/departments', label: 'Departments', icon: Building },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    { to: '/admin/settings', label: 'System Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isItemActive = (to: string) => {
    if (to === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/admin' || location.pathname === '/placement/dashboard' || location.pathname === '/placement';
    }
    const cleanTo = to.replace('/admin/', '');
    return location.pathname.includes(cleanTo);
  };

  return (
    <div className="min-h-screen bg-[#EAF6F0] text-[#143026] flex flex-col md:flex-row antialiased">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#A7D6C0]/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[#61B795]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#2E9D74]/15 rounded-full blur-3xl"></div>
      </div>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white/90 backdrop-blur-md border-r border-[#A7D6C0]/80 shadow-sm sticky top-0 h-screen p-5 justify-between z-20">
        <div className="flex flex-col h-[calc(100vh-120px)] space-y-5">
          {/* NexHire Brand & Role Identity */}
          <div className="flex items-center gap-3 px-1 flex-shrink-0">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center shadow-md shadow-[#2E9D74]/25 ring-2 ring-white flex-shrink-0">
              <span className="font-extrabold text-xl text-white">N</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-lg font-black tracking-tight text-[#143026]">NexHire</span>
                <span
                  className={`text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border ${
                    isSuperAdmin
                      ? 'bg-purple-100 text-purple-900 border-purple-300'
                      : 'bg-[#2E9D74]/15 text-[#2E9D74] border-[#2E9D74]/30'
                  }`}
                >
                  {isSuperAdmin ? '⚡ Super Admin' : '🎓 Placement Admin'}
                </span>
              </div>
              <p className="text-[11px] text-[#4d7565] font-medium leading-none mt-1 truncate">
                {isSuperAdmin ? 'System Governance Portal' : 'Placement Cell Operations'}
              </p>
            </div>
          </div>

          {/* Scrollable Navigation Groups */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin scrollbar-thumb-[#A7D6C0] scrollbar-track-transparent">
            {/* Group 1: Recruitment Operations */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#5b8071]">
                Recruitment Operations
              </p>
              {operationalNavItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 group ${
                      active
                        ? 'bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white shadow-sm shadow-[#2E9D74]/25'
                        : 'text-[#315746] hover:bg-[#EAF6F0] hover:text-[#143026]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 flex-shrink-0 ${
                          active ? 'text-white' : 'text-[#2E9D74]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                  </NavLink>
                );
              })}
            </div>

            {/* Group 2: Institution & Governance */}
            <div className="space-y-1 pt-1">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#5b8071]">
                Institution & Governance
              </p>
              {governanceNavItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 group ${
                      active
                        ? 'bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white shadow-sm shadow-[#2E9D74]/25'
                        : 'text-[#315746] hover:bg-[#EAF6F0] hover:text-[#143026]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 flex-shrink-0 ${
                          active ? 'text-white' : 'text-[#2E9D74]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Profile Card & Sign Out Button */}
        <div className="pt-3 border-t border-[#A7D6C0]/60 space-y-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 p-2 bg-[#EAF6F0]/70 rounded-xl border border-[#A7D6C0]/50">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-xs ring-2 ring-white flex-shrink-0 ${
                isSuperAdmin ? 'bg-purple-600' : 'bg-[#2E9D74]'
              }`}
            >
              {isSuperAdmin ? '⚡' : 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#143026] truncate leading-tight">
                {isSuperAdmin ? 'Super Administrator' : 'Placement Officer'}
              </p>
              <p className="text-[10px] text-[#4d7565] truncate font-medium">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Sticky Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white/95 backdrop-blur-md border-b border-[#A7D6C0]/80 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center shadow-xs">
              <span className="font-extrabold text-sm text-white">N</span>
            </div>
            <div>
              <span className="font-black text-sm text-[#143026]">NexHire</span>
              <span
                className={`ml-1.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${
                  isSuperAdmin
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : 'bg-[#2E9D74]/15 text-[#2E9D74] border-[#2E9D74]/30'
                }`}
              >
                {isSuperAdmin ? 'Super Admin' : 'Placement'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#2E9D74] hover:bg-[#EAF6F0] rounded-xl transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-[#A7D6C0]/80 p-4 space-y-4 z-20 shadow-lg animate-fadeIn max-h-[80vh] overflow-y-auto">
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#5b8071]">
                Recruitment Operations
              </p>
              {operationalNavItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      active
                        ? 'bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white shadow-xs'
                        : 'text-[#315746] hover:bg-[#EAF6F0]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="space-y-1 pt-2 border-t border-[#A7D6C0]/40">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#5b8071]">
                Institution & Governance
              </p>
              {governanceNavItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      active
                        ? 'bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white shadow-xs'
                        : 'text-[#315746] hover:bg-[#EAF6F0]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#A7D6C0]/50 space-y-2">
              <div className="p-2 bg-[#EAF6F0] rounded-xl text-xs">
                <p className="font-bold text-[#143026]">
                  {isSuperAdmin ? 'Super Administrator' : 'Placement Officer'}
                </p>
                <p className="text-[10px] text-[#4d7565]">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Desktop Bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-5 border-b border-[#A7D6C0]/50 bg-white/60 backdrop-blur-sm sticky top-0 z-10">
          <div className="space-y-0.5">
            <h1 className="text-xl font-black text-[#143026] tracking-tight">{pageTitle}</h1>
            <p className="text-xs text-[#4d7565]">{pageSubtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {actions}
            <NotificationBell />
            <div className="h-6 w-px bg-[#A7D6C0]/60 mx-1"></div>
            <div className="text-right">
              <p className="text-xs font-bold text-[#143026] leading-tight">
                {isSuperAdmin ? 'Super Administrator' : 'Placement Officer'}
              </p>
              <p className="text-[10px] text-[#4d7565]">{user?.email}</p>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-xs ${
                isSuperAdmin ? 'bg-purple-600' : 'bg-[#2E9D74]'
              }`}
            >
              {isSuperAdmin ? '⚡' : 'P'}
            </div>
          </div>
        </div>

        {/* Main Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
