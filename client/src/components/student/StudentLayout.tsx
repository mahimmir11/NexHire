import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  User,
  GraduationCap,
  Sparkles,
  Award,
  Compass,
  FileText,
  FileCheck2,
  Calendar,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { NotificationBell } from '../NotificationBell';


interface StudentLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  children,
  pageTitle = 'Student Portal',
  pageSubtitle = 'Manage your academic profile, skills, and placement journey',
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/opportunities', label: 'Campus Drives', icon: Briefcase },
    { to: '/student/applications', label: 'My Applications', icon: FileCheck2 },
    { to: '/student/interviews', label: 'My Interviews', icon: Calendar },
    { to: '/student/offers', label: 'Job Offers', icon: Award },
    { to: '/student/placement', label: 'My Placement', icon: ShieldCheck },
    { to: '/student/profile', label: 'Personal Profile', icon: User },
    { to: '/student/academic', label: 'Academic Info', icon: GraduationCap },
    { to: '/student/skills', label: 'Skills & Expertise', icon: Sparkles },
    { to: '/student/certifications', label: 'Certifications', icon: Award },
    { to: '/student/career', label: 'Career Preferences', icon: Compass },
    { to: '/student/documents', label: 'Resume & Documents', icon: FileText },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#EAF6F0] text-[#143026] flex flex-col md:flex-row antialiased">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#A7D6C0]/35 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[#61B795]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#2E9D74]/15 rounded-full blur-3xl"></div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white/90 backdrop-blur-md border-r border-[#A7D6C0]/80 shadow-sm sticky top-0 h-screen p-5 justify-between z-20">
        <div className="space-y-6">
          {/* NexHire Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center shadow-md shadow-[#2E9D74]/25 ring-2 ring-white">
              <span className="font-extrabold text-xl text-white">N</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-[#143026]">NexHire</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#2E9D74]/15 text-[#2E9D74] border border-[#2E9D74]/30">
                  Student
                </span>
              </div>
              <p className="text-[11px] text-[#4d7565] font-medium leading-none mt-0.5">Placement &amp; Internship Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 pt-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5b8071] mb-2">Student Workspace</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== '/student/dashboard' && location.pathname.startsWith(item.to));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2E9D74] to-[#34a87e] text-white shadow-sm shadow-[#2E9D74]/25'
                      : 'text-[#2a4d3e] hover:bg-[#EAF6F0] hover:text-[#143026]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition ${isActive ? 'text-white' : 'text-[#2E9D74] group-hover:scale-110'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Student Card & Sign Out */}
        <div className="pt-4 border-t border-[#A7D6C0]/70 space-y-3">
          <div className="p-3 rounded-xl bg-[#EAF6F0]/80 border border-[#A7D6C0]/70 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#2E9D74] text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
              {user?.profile?.fullName ? user.profile.fullName.charAt(0) : 'S'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-[#143026] truncate">{user?.profile?.fullName || 'Student User'}</p>
              <p className="text-[11px] text-[#4d7565] truncate">{user?.profile?.studentId || user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200/80 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-[#A7D6C0] sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white font-bold text-base shadow-sm">
            N
          </div>
          <div>
            <span className="font-extrabold text-sm text-[#143026] block leading-tight">NexHire</span>
            <span className="text-[10px] text-[#2E9D74] font-semibold">Student Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#EAF6F0] text-[#143026] border border-[#A7D6C0] hover:bg-[#A7D6C0]/30 transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-72 bg-white h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-[#2E9D74] flex items-center justify-center text-white font-bold">N</div>
                  <span className="font-bold text-sm text-[#143026]">Student Menu</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-[#2E9D74] text-white shadow-sm'
                          : 'text-[#2a4d3e] hover:bg-[#EAF6F0]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#A7D6C0] space-y-3">
              <div className="p-2.5 rounded-xl bg-[#EAF6F0] text-xs">
                <p className="font-bold text-[#143026]">{user?.profile?.fullName || 'Student'}</p>
                <p className="text-[11px] text-[#4d7565]">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/60 backdrop-blur-md border-b border-[#A7D6C0]/60 sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-black text-[#143026] tracking-tight">{pageTitle}</h1>
            <p className="text-xs text-[#4d7565] mt-0.5">{pageSubtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E9D74]/10 border border-[#2E9D74]/30 text-xs font-bold text-[#2E9D74]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Student Session</span>
            </div>

            <NotificationBell />
          </div>
        </header>

        {/* Page Inner Content Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-8 py-4 border-t border-[#A7D6C0]/50 text-center text-xs text-[#5b8071] bg-white/40">
          <p>NexHire &bull; Student Placement &amp; Internship Management &bull; Official Theme</p>
        </footer>
      </div>
    </div>
  );
};
