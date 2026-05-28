import React, { useState } from 'react';
import { useAuthStore } from '../../features/auth/authStore';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface TopBarProps {
  setSidebarOpen: (open: boolean) => void;
}

export function TopBar({ setSidebarOpen }: TopBarProps) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    toast.success('Successfully signed out');
    navigate('/login');
  };

  // Convert role strings to human labels
  const formatRole = (roleStr?: string) => {
    if (!roleStr) return 'Staff';
    return roleStr.replace('_', ' ');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6">
      {/* Mobile burger & Brand name */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 focus:outline-none md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="hidden md:inline text-sm font-medium text-slate-400">
          Welcome back to clinical workstation
        </span>
      </div>

      {/* User profile dropdown & notifications */}
      <div className="flex items-center gap-4">
        {/* Notifications mock icon */}
        <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        {/* User profile details */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 pl-3 rounded-full hover:bg-slate-50 border border-slate-100/50 transition-colors text-left"
          >
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800 leading-tight">
                {user?.name || 'Staff User'}
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {formatRole(user?.role)}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-display font-semibold border border-emerald-100 text-sm">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
          </button>

          {/* Dropdown popup */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-20 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-100/60 bg-slate-50/40">
                  <p className="text-xs text-slate-400 truncate">Logged in as</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
export default TopBar;
