import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu, X, Zap, User, LogOut, BriefcaseBusiness, MessageSquare,
  ChevronRight, DollarSign, Wallet, BarChart2, Settings, ShieldCheck,
  Home,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/auth.store';
import { useLogout } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const logout = useLogout();
  const navigate = useNavigate();
  const unreadMessages = useUnreadMessages();

  const close = () => setDrawerOpen(false);

  // Public nav — always visible on desktop
  const publicLinks = [
    { to: '/jobs',      label: 'Find Jobs' },
    { to: '/services',  label: 'Services' },
    { to: '/providers', label: 'Providers' },
  ];

  // Role-specific sections shown inside the drawer
  const drawerSections =
    user?.role === 'client'
      ? [
          {
            title: 'My Work',
            links: [
              { to: '/jobs/my',   label: 'My Jobs',   icon: <BriefcaseBusiness className="w-4 h-4" /> },
              { to: '/analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
            ],
          },
        ]
      : user?.role === 'provider'
      ? [
          {
            title: 'My Work',
            links: [
              { to: '/bids/my',    label: 'My Bids',    icon: <BriefcaseBusiness className="w-4 h-4" /> },
              { to: '/profile/me', label: 'My Profile', icon: <User className="w-4 h-4" /> },
              { to: '/analytics',  label: 'Analytics',  icon: <BarChart2 className="w-4 h-4" /> },
            ],
          },
          {
            title: 'Earnings',
            links: [
              { to: '/wallet',     label: 'Wallet',     icon: <Wallet className="w-4 h-4" /> },
              { to: '/commission', label: 'Commission',  icon: <DollarSign className="w-4 h-4" /> },
            ],
          },
        ]
      : user?.role === 'admin'
      ? [
          {
            title: 'Admin',
            links: [
              { to: '/admin', label: 'Dashboard', icon: <ShieldCheck className="w-4 h-4" /> },
            ],
          },
        ]
      : [];

  return (
    <>
      {/* ── Navbar bar ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 font-bold text-xl shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-blue-700">Skill<span className="text-green-600">Link</span></span>
            </Link>

            {/* Desktop public nav — centre */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {publicLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    clsx(
                      'px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              {isAuthenticated && user ? (
                <>
                  {/* Messages — always visible */}
                  <NavLink
                    to="/conversations"
                    className={({ isActive }) =>
                      clsx(
                        'relative p-2 rounded-xl transition-all duration-150',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-500 hover:bg-blue-50 hover:text-blue-700',
                      )
                    }
                    aria-label="Messages"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold text-white">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </NavLink>

                  {/* Notification bell */}
                  <NotificationDropdown />

                  {/* Avatar button — opens drawer */}
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-150"
                    aria-label="Open menu"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-white text-xs font-bold shrink-0">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block max-w-[80px] truncate text-sm">{user.name?.split(' ')[0]}</span>
                    <Menu className="w-4 h-4 text-gray-400" />
                  </button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                    Log in
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                    Get started
                  </Button>
                  {/* Mobile hamburger for guest */}
                  <button
                    className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Slide-over drawer ────────────────────────────────────────────── */}
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm animate-fade-in"
          onClick={close}
        />
      )}

      {/* Panel — slides in from right */}
      <div
        className={clsx(
          'fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-in-out',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white font-bold text-sm shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          ) : (
            <Link to="/" onClick={close} className="flex items-center gap-2 font-bold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-700 text-white">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-blue-700">Skill<span className="text-green-600">Link</span></span>
            </Link>
          )}
          <button
            onClick={close}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto py-3 px-3">

          {/* Mobile-only: public explore links */}
          <div className="md:hidden mb-2">
            <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Explore</p>
            {publicLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={close}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50',
                  )
                }
              >
                <Home className="w-4 h-4 text-gray-400" />
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Role sections */}
          {drawerSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </p>
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={close}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700',
                    )
                  }
                >
                  <span className={clsx('shrink-0 text-gray-400 group-hover:text-blue-600')}>
                    {link.icon}
                  </span>
                  <span className="flex-1">{link.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </NavLink>
              ))}
            </div>
          ))}

          {/* Account actions */}
          {isAuthenticated && user && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>

              {user.role === 'client' && (
                <Link
                  to="/jobs/create"
                  onClick={close}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                >
                  <BriefcaseBusiness className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="flex-1">Post a Job</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </Link>
              )}

              <Link
                to="/settings"
                onClick={close}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="flex-1">Settings</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              </Link>
            </div>
          )}

          {/* Guest CTA */}
          {!isAuthenticated && (
            <div className="flex flex-col gap-2 px-1 pt-2">
              <Button fullWidth onClick={() => { navigate('/register'); close(); }}>
                Create free account
              </Button>
              <Button variant="outline" fullWidth onClick={() => { navigate('/login'); close(); }}>
                Log in
              </Button>
            </div>
          )}
        </div>

        {/* Drawer footer — sign out */}
        {isAuthenticated && (
          <div className="px-3 py-4 border-t border-gray-100">
            <button
              onClick={() => { logout.mutate(); close(); }}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
