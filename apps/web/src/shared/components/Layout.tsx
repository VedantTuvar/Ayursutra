import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useSocket } from '../hooks/useSocket';

export function Layout() {
  const { isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize socket connections immediately on mount when authenticated
  useSocket();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Dynamic Navigation Drawer */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main desktop and mobile panels */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <TopBar setSidebarOpen={setSidebarOpen} />

        {/* Dynamic page content viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar click away backdrop drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
export default Layout;
