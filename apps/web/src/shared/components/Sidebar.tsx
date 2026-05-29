import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import { UserRole } from '@ayursutra/shared-types';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  IndianRupee,
  BarChart3,
  Settings,
  HeartPulse
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user } = useAuthStore();
  const role = user?.role;

  // Define navigation items with roles
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: [UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.THERAPIST, UserRole.RECEPTIONIST]
    },
    {
      to: '/patients',
      label: 'Patients',
      icon: Users,
      roles: [UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST]
    },
    {
      to: '/schedule',
      label: 'Calendar',
      icon: Calendar,
      roles: [UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.THERAPIST, UserRole.RECEPTIONIST]
    },
    {
      to: '/therapists',
      label: 'Therapists',
      icon: HeartPulse,
      roles: [UserRole.CLINIC_ADMIN, UserRole.DOCTOR]
    },
    {
      to: '/inventory',
      label: 'Inventory',
      icon: Package,
      roles: [UserRole.CLINIC_ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST]
    },
    {
      to: '/billing',
      label: 'Billing & Invoices',
      icon: IndianRupee,
      roles: [UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST]
    },
    {
      to: '/analytics',
      label: 'Analytics Reports',
      icon: BarChart3,
      roles: [UserRole.CLINIC_ADMIN]
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      roles: [UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST]
    }
  ];

  // Filter items by role
  const allowedItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 transform md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand logo header */}
      <div className="h-16 flex items-center gap-3 px-5 bg-slate-950/40 border-b border-slate-800/60">
        <img src="/logo.png" alt="AyurSutra Logo" className="h-11 w-auto object-contain" />
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/40 ml-auto">
          SaaS
        </span>
      </div>

      {/* Navigation menu list */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-700 text-white shadow-lg shadow-brand-900/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer clinic details */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20">
        <div className="flex flex-col gap-0.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
            Clinic Account
          </span>
          <span className="font-display font-medium text-slate-300 truncate">
            {user?.clinicName || 'Wellness Center'}
          </span>
        </div>
      </div>
    </aside>
  );
}
export default Sidebar;
