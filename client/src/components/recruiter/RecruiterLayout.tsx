import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  GraduationCap,
  Users,
  UserCheck,
  Calendar,
  Award,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { CompanyVerificationStatus } from '../../types/company.types';
import { NotificationBell } from '../NotificationBell';



interface RecruiterLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  verificationStatus?: CompanyVerificationStatus;
  companyName?: string;
}

export const RecruiterLayout: React.FC<RecruiterLayoutProps> = ({
  children,
  pageTitle = 'Enterprise Portal',
  pageSubtitle = 'Manage corporate profile, recruitment team, and hiring operations',
  verificationStatus,
  companyName,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/recruiter/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/recruiter/applications', label: 'Applicants', icon: UserCheck },
    { to: '/recruiter/interviews', label: 'Interviews', icon: Calendar },
    { to: '/recruiter/offers', label: 'Candidate Offers', icon: Award },
    { to: '/recruiter/placements', label: 'Placements', icon: ShieldCheck },
    { to: '/recruiter/jobs', label: 'Job Openings', icon: Briefcase },
    { to: '/recruiter/internships', label: 'Internships', icon: GraduationCap },
    { to: '/recruiter/profile', label: 'Company Profile', icon: Building2 },
    { to: '/recruiter/team', label: 'Recruiter Team', icon: Users },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const recruiterProfile = user?.profile as { fullName?: string; designation?: string } | undefined;

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
                  Recruiter
                </span>
              </div>
              <p className="text-[11px] text-[#4d7565] font-medium leading-none mt-0.5">Enterprise Hiring Portal</p>
            </div>
          </div>

          {/* Company Quick Summary */}
          {companyName && (
            <div className="p-3 bg-[#EAF6F0]/80 rounded-xl border border-[#A7D6C0]/60 text-xs">
              <span className="text-[10px] font-semibold tracking-wider text-[#2E9D74] uppercase block">
                Partner Organization
              </span>
              <p className="font-bold text-[#143026] truncate mt-0.5 text-sm">{companyName}</p>
              {verificationStatus && (
                <div className="mt-1 flex items-center gap-1.5">
                  {verificationStatus === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Institutional Partner
                    </span>
                  )}
                  {verificationStatus === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 text-amber-600" /> Pending Verification
                    </span>
                  )}
                  {verificationStatus === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100/80 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 text-red-600" /> Action Required
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white shadow-md shadow-[#2E9D74]/20'
                      : 'text-[#315746] hover:bg-[#EAF6F0] hover:text-[#143026]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-[#2E9D74]'
                    }`}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-[#A7D6C0]/50 space-y-3">
          <div className="flex items-center gap-3 p-2 bg-[#EAF6F0]/60 rounded-xl border border-[#A7D6C0]/40">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white font-bold text-sm shadow-inner ring-2 ring-white">
              {recruiterProfile?.fullName ? recruiterProfile.fullName.charAt(0).toUpperCase() : 'R'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#143026] truncate">
                {recruiterProfile?.fullName || 'Recruiter'}
              </p>
              <p className="text-[11px] text-[#4d7565] truncate">
                {recruiterProfile?.designation || user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white/95 backdrop-blur-md border-b border-[#A7D6C0]/80 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center shadow-sm">
              <span className="font-extrabold text-base text-white">N</span>
            </div>
            <div>
              <span className="font-black text-sm text-[#143026]">NexHire</span>
              <span className="ml-1 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#2E9D74]/15 text-[#2E9D74]">
                Recruiter
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#2E9D74] hover:bg-[#EAF6F0] rounded-xl transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-[#A7D6C0]/80 p-4 space-y-2 z-20 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white'
                      : 'text-[#315746] hover:bg-[#EAF6F0]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* Verification Status Banner if Pending or Rejected */}
        {verificationStatus === 'PENDING' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Institutional Verification in Progress:</strong> Your company profile is currently undergoing review by the University Placement Cell. You can manage your company details and team recruiters while review is active.
              </span>
            </div>
            <span className="hidden sm:inline-block font-semibold bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded text-[11px]">
              Pending Approval
            </span>
          </div>
        )}

        {verificationStatus === 'REJECTED' && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex items-center justify-between text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                <strong>Verification Clarification Required:</strong> The placement office has flagged items on your profile. Please review company information, update required fields, or reach out to the university placement administrator.
              </span>
            </div>
            <span className="hidden sm:inline-block font-semibold bg-rose-200 text-rose-800 px-2 py-0.5 rounded text-[11px]">
              Needs Review
            </span>
          </div>
        )}

        {/* Top Bar for Desktop */}
        <div className="hidden md:flex items-center justify-between px-8 py-5 border-b border-[#A7D6C0]/50 bg-white/50 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-black text-[#143026] tracking-tight">{pageTitle}</h1>
            <p className="text-xs text-[#4d7565] mt-0.5">{pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right">
              <p className="text-xs font-bold text-[#143026]">{companyName || 'Corporate Partner'}</p>
              <p className="text-[11px] text-[#4d7565]">{recruiterProfile?.fullName || user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2E9D74] to-[#61B795] text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {recruiterProfile?.fullName ? recruiterProfile.fullName.charAt(0).toUpperCase() : 'R'}
            </div>
          </div>
        </div>

        {/* Page Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
