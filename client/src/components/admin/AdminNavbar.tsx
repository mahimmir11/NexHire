import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../NotificationBell';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileCheck2,
  Calendar,
  Award,
  ShieldCheck,
  Building,
  BarChart3,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface AdminNavbarProps {
  currentPage?: string;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/companies', label: 'Companies', icon: Building2 },
    { to: '/admin/opportunities', label: 'Opportunities', icon: Briefcase },
    { to: '/admin/applications', label: 'Applications', icon: FileCheck2 },
    { to: '/admin/interviews', label: 'Interviews', icon: Calendar },
    { to: '/admin/offers', label: 'Offers', icon: Award },
    { to: '/admin/placements', label: 'Placements', icon: ShieldCheck },
    { to: '/admin/departments', label: 'Departments', icon: Building },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-[#A7D6C0] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo & Role Badge */}
          <div className="flex items-center gap-3">
            <NavLink to="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white font-black text-sm shadow-xs">
                NH
              </div>
              <span className="font-extrabold text-[#143026] text-lg tracking-tight hidden sm:inline">NexHire</span>
            </NavLink>
            <span
              className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full border ${
                user?.role === 'SUPER_ADMIN'
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-[#2E9D74]/15 text-[#2E9D74] border-[#2E9D74]/30'
              }`}
            >
              {user?.role === 'SUPER_ADMIN' ? '⚡ Super Admin' : '🎓 Placement Cell Admin'}
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-xs font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#2E9D74] text-white shadow-xs'
                      : 'text-[#2a4d3e] hover:bg-[#EAF6F0]'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Action Icons: User Info + Notification Bell + Sign Out */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-bold text-[#143026] leading-tight">{user?.email}</p>
              <p className="text-[10px] text-[#4d7565] font-semibold">
                {user?.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Placement Officer'}
              </p>
            </div>

            <NotificationBell />

            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition hidden sm:flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-[#EAF6F0] text-[#143026] border border-[#A7D6C0] cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-[#A7D6C0]/50 space-y-1">
            <div className="grid grid-cols-2 gap-1.5 pb-3">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-xs font-bold p-2.5 rounded-xl transition flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#2E9D74] text-white'
                        : 'text-[#2a4d3e] bg-white border border-[#A7D6C0]/40'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
            <div className="pt-2 border-t border-[#A7D6C0]/30 flex items-center justify-between">
              <span className="text-xs text-[#4d7565] font-semibold">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-rose-600 px-3 py-1.5 bg-rose-50 rounded-lg flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
