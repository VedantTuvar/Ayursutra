import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { formatCurrency, formatDate, formatTime } from '../../shared/utils/formatters';
import {
  Users,
  Calendar,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export function AdminDashboard() {
  // 1. Fetch dashboard overview KPIs
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data.data;
    }
  });

  // 2. Fetch revenue trend data (last 30 days)
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue?groupBy=day');
      return res.data.data;
    }
  });

  // 3. Fetch therapy breakdown data
  const { data: breakdownData, isLoading: breakdownLoading } = useQuery({
    queryKey: ['dashboard', 'breakdown'],
    queryFn: async () => {
      const res = await api.get('/analytics/therapy-breakdown');
      return res.data.data;
    }
  });

  // 4. Fetch recent sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['dashboard', 'recent-sessions'],
    queryFn: async () => {
      const res = await api.get('/schedule');
      return res.data.data.slice(0, 5); // Take 5 recent
    }
  });

  // 5. Fetch low stock items
  const { data: lowStock, isLoading: stockLoading } = useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: async () => {
      const res = await api.get('/inventory/low-stock');
      return res.data.data;
    }
  });

  const loading = overviewLoading || revenueLoading || breakdownLoading || sessionsLoading || stockLoading;

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  // Format charts data safely
  const formattedRevenue = revenueData?.map((item: any) => ({
    date: item.label,
    Amount: item.value
  })) || [];

  const formattedBreakdown = breakdownData?.slice(0, 5).map((item: any) => ({
    Therapy: item.therapy,
    Sessions: item.count
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Clinics Dashboard"
        description="Monitor Panchakarma session volumes, GST revenue pipelines, and pharmacy oil stocks."
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Patients */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Patients
            </span>
            <span className="text-3xl font-display font-bold text-slate-800">
              {overview?.totalPatients || 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Sessions Today */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Sessions Today
            </span>
            <span className="text-3xl font-display font-bold text-slate-800">
              {overview?.sessionsToday || 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Monthly Revenue
            </span>
            <span className="text-3xl font-display font-bold text-slate-800">
              {formatCurrency(overview?.monthlyRevenue || 0)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 shadow-sm shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Low Stock Warnings
            </span>
            <span className="text-3xl font-display font-bold text-slate-800">
              {overview?.inventoryAlerts || 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recharts Diagrams Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-brand-700" />
            <h3 className="text-base font-bold text-slate-800">Revenue Trend (INR)</h3>
          </div>
          <div className="h-64 w-full">
            {formattedRevenue.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No billing history generated inside this date range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Amount" stroke="#15803d" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Therapy Breakdowns */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-brand-700" />
            <h3 className="text-base font-bold text-slate-800">Top Therapy Categories</h3>
          </div>
          <div className="h-64 w-full">
            {formattedBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No completed sessions logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="Therapy" type="category" stroke="#94a3b8" fontSize={10} width={90} />
                  <Tooltip />
                  <Bar dataKey="Sessions" fill="#0369a1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Lists: Recent sessions & stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent sessions */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-800">Recent Appointments</h3>
            <Link to="/schedule" className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1">
              <span>View Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {sessions?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 py-12">
                No active appointments booked for today.
              </div>
            ) : (
              sessions?.map((s: any) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {s.patient?.user?.name}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      {s.plannedTherapy?.therapyType?.name || 'Medicated Therapy'} — {s.room?.name || 'General Space'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500 font-medium">
                      {formatTime(s.scheduledStart)}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-800">Pharmacy Stock Warnings</h3>
            <Link to="/inventory" className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1">
              <span>Add Stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {lowStock?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-emerald-600 font-semibold py-12">
                ✓ All items currently have safe stock margins.
              </div>
            ) : (
              lowStock?.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {item.name}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      Category: {item.category} — Supplier: {item.supplier || 'Local'}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-rose-600 block">
                      {Number(item.currentStock)} {item.unit}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Min: {Number(item.minimumThreshold)} {item.unit}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminDashboard;
