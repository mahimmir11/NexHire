import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NexHireLogo } from '../common/NexHireLogo';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
  LogIn,
} from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Track window scroll for subtle elevation and blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'STUDENT':
        return '/student/dashboard';
      case 'RECRUITER':
        return '/recruiter/dashboard';
      case 'PLACEMENT_ADMIN':
      case 'SUPER_ADMIN':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const navLinks = [
    { label: 'Home', href: '/', isHash: false },
    { label: 'Features', href: '/#features', isHash: true, id: 'features' },
    { label: 'How It Works', href: '/#how-it-works', isHash: true, id: 'how-it-works' },
    { label: 'Roles', href: '/#roles', isHash: true, id: 'roles' },
    { label: 'Blog', href: '/blog', isHash: false },
    { label: 'About', href: '/about', isHash: false },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, isHash: boolean, id?: string) => {
    if (isHash && location.pathname === '/' && id) {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `#${id}`);
      }
    }
  };

  const isLinkActive = (href: string, isHash: boolean) => {
    if (isHash) {
      return location.pathname === '/' && location.hash === href.replace('/', '');
    }
    if (href === '/') {
      return location.pathname === '/' && !location.hash;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass-nav shadow-sm shadow-[#2E9D74]/5 py-3'
          : 'bg-white/70 backdrop-blur-md border-b border-[#A7D6C0]/30 py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <NexHireLogo size="md" withSubtitle={false} />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href, link.isHash);
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={(e) => handleNavClick(e, link.isHash, link.id)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'text-[#2E9D74] bg-[#2E9D74]/10 shadow-xs'
                      : 'text-[#1e4435] hover:text-[#2E9D74] hover:bg-[#EAF6F0]/80'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF6F0] text-[#2E9D74] border border-[#A7D6C0]/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E9D74] animate-pulse"></span>
                  {user.role.replace('_', ' ')}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(getDashboardPath())}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2E9D74] to-[#61B795] hover:from-[#258260] hover:to-[#50a181] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 transition-all duration-200 flex items-center gap-2 hover:shadow-lg hover:shadow-[#2E9D74]/30 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Go to Dashboard</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#143026] hover:text-[#2E9D74] hover:bg-[#EAF6F0] transition-colors duration-200 flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#2E9D74]" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 hover:shadow-lg hover:shadow-[#2E9D74]/30 transition-all duration-200 flex items-center gap-1.5 group cursor-pointer"
                >
                  <span>Explore Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#143026] hover:bg-[#EAF6F0] border border-[#A7D6C0]/60 focus:outline-none focus:ring-2 focus:ring-[#2E9D74]"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#2E9D74]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card mx-3 mt-3 rounded-2xl p-4 shadow-xl border border-[#A7D6C0]/70 animate-fadeIn">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href, link.isHash);
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={(e) => {
                    handleNavClick(e, link.isHash, link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${
                    active
                      ? 'text-[#2E9D74] bg-[#2E9D74]/10'
                      : 'text-[#143026] hover:bg-[#EAF6F0]'
                  }`}
                >
                  <span>{link.label}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-[#2E9D74]"></span>}
                </Link>
              );
            })}

            <div className="pt-3 mt-2 border-t border-[#A7D6C0]/50 flex flex-col gap-2">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(getDashboardPath());
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2E9D74] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to {user.role.replace('_', ' ')} Dashboard</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl border border-[#A7D6C0] text-center text-xs font-bold text-[#143026] hover:bg-[#EAF6F0]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl bg-[#2E9D74] text-center text-xs font-bold text-white hover:bg-[#258260] shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
