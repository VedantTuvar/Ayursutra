import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { formatDate } from '../../shared/utils/formatters';
import {
  Users,
  ClipboardList,
  Activity,
  PlusCircle,
  FileCheck2,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function DoctorDashboard() {
  // 1. Fetch clinic patients list
  const { data: patientsList, isLoading: patientsLoading } = useQuery({
    queryKey: ['dashboard', 'doctor-patients'],
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data.data;
    }
  });

  const loading = patientsLoading;

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  // Filter patients with draft plans or no active plans
  const pendingPlansCount = patientsList?.filter(
    (p: any) => !p.treatmentPlans || p.treatmentPlans.length === 0 || p.treatmentPlans.some((plan: any) => plan.status === 'DRAFT')
  ).length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Doctor clinical workstation"
        description="Design personalized Panchakarma planned courses and track patient Prakriti assessments."
      >
        <Link
          to="/patients"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register Patient</span>
        </Link>
      </PageHeader>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Patients */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              My Patient Queue
            </span>
            <span className="text-3xl font-display font-bold text-slate-800">
              {patientsList?.length || 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Plan Reviews */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Pending Plan Setups
            </span>
            <span className="text-3xl font-display font-bold text-slate-800 text-amber-600">
              {pendingPlansCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Assessments */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Prakriti profiles
            </span>
            <span className="text-3xl font-display font-bold text-slate-800 text-emerald-700">
              {patientsList?.filter((p: any) => p.prakriti).length || 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's clinical patients queue */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-800">Active Patient Roster</h3>
            <Link to="/patients" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
              Manage Patients
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {patientsList?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 py-12">
                No patients registered yet. Click 'Register Patient' to start.
              </div>
            ) : (
              patientsList?.slice(0, 5).map((p: any) => {
                const hasActive = p.treatmentPlans?.some((plan: any) => plan.status === 'ACTIVE');
                const planLabel = hasActive ? 'Active Plan' : 'No Active Plan';
                return (
                  <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <Link to={`/patients/${p.id}`} className="text-sm font-semibold text-slate-800 hover:text-brand-700 truncate">
                        {p.user?.name}
                      </Link>
                      <span className="text-xs text-slate-400 truncate">
                        Phone: {p.user?.phone || 'N/A'} | Prakriti: {p.prakriti?.dominance || 'Not Assessed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        hasActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}>
                        {planLabel}
                      </span>
                      <Link
                        to={`/patients/${p.id}`}
                        className="text-xs font-semibold text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 transition-colors"
                      >
                        Clinical File
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick links & references panel */}
        <div className="space-y-6">
          {/* Quick links */}
          <div className="glass-card p-6 flex flex-col">
            <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 mb-4">
              Clinical Tasks
            </h3>
            <div className="space-y-3 flex-1">
              <Link
                to="/patients"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 text-slate-700">
                  <FileCheck2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold">New Prakriti Check</span>
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase">Start</span>
              </Link>
              <Link
                to="/patients"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 text-slate-700">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-semibold">Build Plan templates</span>
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase">Build</span>
              </Link>
            </div>
          </div>

          {/* Clinical metrics */}
          <div className="glass-card p-6 bg-gradient-to-br from-brand-800 to-brand-900 text-white flex flex-col relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-sm font-semibold text-brand-200 uppercase tracking-wider mb-2">
              Ayurvedic Tip of the Day
            </h3>
            <p className="text-sm font-medium leading-relaxed flex-1">
              "When Vata dosha dominates during the dry seasons, prescribe warm sesame oil Abhyanga followed by herbal Swedana steam baths. Favor sweet, hot, and unctuous diet plans."
            </p>
            <div className="mt-4 pt-4 border-t border-brand-700/50 flex items-center justify-between text-xs text-brand-300">
              <span>Sutra of Charaka Samhita</span>
              <span>🌿</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DoctorDashboard;
