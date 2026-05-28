import React from 'react';
import { useAuthStore } from '../auth/authStore';
import { UserRole } from '@ayursutra/shared-types';
import AdminDashboard from './AdminDashboard';
import DoctorDashboard from './DoctorDashboard';
import TherapistDashboard from './TherapistDashboard';

export function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  switch (user.role) {
    case UserRole.CLINIC_ADMIN:
    case UserRole.RECEPTIONIST:
    case UserRole.SUPER_ADMIN:
      return <AdminDashboard />;
    case UserRole.DOCTOR:
      return <DoctorDashboard />;
    case UserRole.THERAPIST:
      return <TherapistDashboard />;
    default:
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center glass-panel p-8 max-w-sm">
            <span className="text-3xl">🌿</span>
            <h3 className="font-display font-bold text-lg text-slate-800 mt-3">Portal Profile Setup</h3>
            <p className="text-sm text-slate-500 mt-1">
              Your patient clinical dashboard portal is registered. Please await clinical check-ins.
            </p>
          </div>
        </div>
      );
  }
}
export default DashboardPage;
