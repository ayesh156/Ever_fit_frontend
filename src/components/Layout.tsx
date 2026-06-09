import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  FileText,
  Truck,
  Users,
  BarChart3,
  Settings,
  Palette,
  Mail,
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Globe,
  ExternalLink,
  User,
  Shield,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/system',            icon: LayoutDashboard },
  { label: 'Products',  path: '/system/products',   icon: ShoppingBag },
  { label: 'Categories',path: '/system/categories', icon: FolderOpen },
  { label: 'Invoices',  path: '/system/invoices',   icon: FileText },
  { label: 'Customers', path: '/system/customers',  icon: Users },
  { label: 'Suppliers', path: '/system/suppliers',  icon: Truck },
  { label: 'Reports',   path: '/system/reports',    icon: BarChart3 },
  { label: 'Storefront',path: '/system/storefront-settings', icon: Palette },
  { label: 'Subscribers',path: '/system/subscribers', icon: Mail },
  { label: 'Settings',  path: '/system/settings',   icon: Settings },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = navItems.find(n => {
    if (n.path === '/system') return location.pathname === '/system';
    return location.pathname.startsWith(n.path);
  });

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <div className={`min-h-screen flex overflow-x-hidden ${theme === 'dark' ? 'bg-brand-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } ${theme === 'dark' ? 'bg-brand-950 border-r border-neutral-800/60' : 'bg-white border-r border-gray-200'}`}>
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 ${collapsed ? 'justify-center' : 'gap-3'} ${
          theme === 'dark' ? 'border-b border-neutral-800/60' : 'border-b border-gray-200'
        }`}>
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src="/images/logo.jpeg" alt="Ever Fit" className="w-8 h-8 rounded-full object-cover" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-lg font-bold tracking-[0.2em] uppercase">EVER FIT</h1>
              <p className={`text-[10px] tracking-[0.15em] uppercase ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Fashion System</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map(item => {
            const isActive = item.path === '/system' ? location.pathname === '/system' : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  collapsed ? 'justify-center' : ''
                } ${isActive
                  ? theme === 'dark'
                    ? 'bg-white text-black shadow-lg shadow-white/5'
                    : 'bg-brand-900 text-white shadow-lg shadow-brand-900/20'
                  : theme === 'dark'
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className={`p-3 ${theme === 'dark' ? 'border-t border-neutral-800/60' : 'border-t border-gray-200'}`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
              theme === 'dark'
                ? 'text-neutral-500 hover:text-white hover:bg-neutral-800/50'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className={`absolute inset-y-0 left-0 w-72 ${
            theme === 'dark' ? 'bg-brand-950' : 'bg-white'
          } shadow-2xl`}>
            <div className={`flex items-center justify-between h-16 px-4 ${
              theme === 'dark' ? 'border-b border-neutral-800/60' : 'border-b border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                  <img src="/logo.jpeg" alt="Ever Fit" className="w-8 h-8 rounded-full object-cover" />
                </div>
                <h1 className="font-display text-lg font-bold tracking-[0.2em] uppercase">EVER FIT</h1>
              </div>
              <button onClick={() => setSidebarOpen(false)} className={`p-2 rounded-xl ${
                theme === 'dark' ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
              }`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="py-4 px-3 space-y-1">
              {navItems.map(item => {
                const isActive = item.path === '/system' ? location.pathname === '/system' : location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-white text-black shadow-lg'
                          : 'bg-brand-900 text-white shadow-lg'
                        : theme === 'dark'
                          ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className={`absolute bottom-0 left-0 right-0 p-4 space-y-2 ${
              theme === 'dark' ? 'border-t border-neutral-800/60' : 'border-t border-gray-200'
            }`}>
              <NavLink
                to="/"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  theme === 'dark'
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span>Back to Website</span>
                <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
              </NavLink>
              <button
                onClick={() => { setSidebarOpen(false); handleLogout(); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  theme === 'dark' ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
                }`}
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 backdrop-blur-xl ${
          theme === 'dark'
            ? 'bg-brand-950/80 border-b border-neutral-800/60'
            : 'bg-white/80 border-b border-gray-200'
        }`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-xl ${
                theme === 'dark' ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {currentPage?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Visit Store */}
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900'
              }`}
              title="Visit Store"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Visit Store</span>
              <ExternalLink className="w-3 h-3 opacity-50" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800 text-neutral-400'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-500'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`flex items-center gap-2 pl-2 ml-1 border-l transition-all cursor-pointer ${
                  theme === 'dark' ? 'border-neutral-800' : 'border-gray-200'
                } ${profileOpen ? (theme === 'dark' ? 'opacity-80' : 'opacity-80') : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-semibold text-xs">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'Admin'}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{user?.role || 'Manager'}</p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <div className={`absolute right-0 mt-2 w-52 border rounded-xl shadow-2xl z-50 overflow-hidden ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'
                }`}>
                  {/* Header */}
                  <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'Admin'}</p>
                    <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>{user?.email || 'admin@everfit.com'}</p>
                  </div>
                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setProfileOpen(false); navigate('/system/settings'); }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all ${
                        theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { setProfileOpen(false); navigate('/system/settings'); }}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all ${
                          theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Staff Management</span>
                      </button>
                    )}
                  </div>
                  {/* Sign Out */}
                  <div className={`border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};