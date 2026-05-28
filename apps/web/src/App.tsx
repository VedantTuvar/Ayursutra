import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './shared/components/Layout';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { PatientsPage } from './features/patients/PatientsPage';
import { PatientDetail } from './features/patients/PatientDetail';
import { PrakritiAssessment } from './features/patients/PrakritiAssessment';
import { PlanBuilder } from './features/treatment-plans/PlanBuilder';
import { SchedulingPage } from './features/scheduling/SchedulingPage';
import { TherapistsPage } from './features/therapists/TherapistsPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { BillingPage } from './features/billing/BillingPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { HomePage } from './features/home/HomePage';
import { useAuthStore } from './features/auth/authStore';

export function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Home Page */}
        <Route path="/" element={<HomePage />} />

        {/* Public auth screen */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes wrapped in Layout shell */}
        <Route element={<Layout />}>
          
          {/* Feature dashboards */}
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Patient registry */}
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="patients/:id/assessment" element={<PrakritiAssessment />} />
          
          {/* Treatment plan builder */}
          <Route path="patients/:patientId/plans/new" element={<PlanBuilder />} />

          {/* Core scheduling & therapists */}
          <Route path="schedule" element={<SchedulingPage />} />
          <Route path="therapists" element={<TherapistsPage />} />
          
          {/* Pharmacy Inventory */}
          <Route path="inventory" element={<InventoryPage />} />
          
          {/* Billing and Invoices */}
          <Route path="billing" element={<BillingPage />} />
          
          {/* Analytics Reports */}
          <Route path="analytics" element={<AnalyticsPage />} />
          
          {/* Configurations */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback route redirection */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
