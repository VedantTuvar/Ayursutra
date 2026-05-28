import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { formatCurrency } from '../../shared/utils/formatters';
import {
  TrendingUp,
  Users,
  Calendar,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Activity,
  Heart
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30'); // '7' | '30' | '90'

  // Calculate fromDate query parameter based on range select
  const getDates = () => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - Number(dateRange));
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10)
    };
  };

  const datesParams = getDates();

  // 1. Fetch Overview KPIs
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview', dateRange],
    queryFn: async () => {
      const res = await api.get('/analytics/overview', { params: datesParams });
      return res.data.data;
    }
  });

  // 2. Fetch Revenue Trends
  const { data: revenueTrend, isLoading: revenueLoading } = useQuery({
    queryKey: ['analytics', 'revenue', dateRange],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue', {
        params: { ...datesParams, groupBy: Number(dateRange) > 30 ? 'week' : 'day' }
      });
      return res.data.data;
    }
  });

  // 3. Fetch Therapy popularities
  const { data: therapyBreakdown, isLoading: therapyLoading } = useQuery({
    queryKey: ['analytics', 'therapy-breakdown', dateRange],
    queryFn: async () => {
      const res = await api.get('/analytics/therapy-breakdown', { params: datesParams });
      return res.data.data;
    }
  });

  // 4. Fetch Therapist utilization rosters
  const { data: therapistUtilization, isLoading: therapistLoading } = useQuery({
    queryKey: ['analytics', 'therapist-utilization', dateRange],
    queryFn: async () => {
      const res = await api.get('/analytics/therapist-utilization', { params: datesParams });
      return res.data.data;
    }
  });

  // 5. Fetch Patient registries stats
  const { data: patientStats } = useQuery({
    queryKey: ['analytics', 'patient-stats', dateRange],
    queryFn: async () => {
      const res = await api.get('/analytics/patient-stats', { params: datesParams });
      return res.data.data;
    }
  });

  // 6. Fetch Inventory consumption trends
  const { data: inventoryUsage } = useQuery({
    queryKey: ['analytics', 'inventory-usage', dateRange],
    queryFn: async () => {
      const res = await api.get('/analytics/inventory-usage', { params: datesParams });
      return res.data.data;
    }
  });

  // Colors list for visual segments
  const COLORS = ['#0f766e', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6'];

  const patientPieData = patientStats
    ? [
        { name: 'New Patients', value: patientStats.newPatients },
        { name: 'Returning Patients', value: patientStats.returningPatients }
      ]
    : [];

  const isPageLoading = overviewLoading || revenueLoading || therapyLoading || therapistLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Clinical Analytics & Reports"
        description="Verify therapist bookings, review patient demographics, monitor monthly revenue, and track inventory."
      >
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm shrink-0">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs font-semibold text-slate-700 focus:outline-none bg-transparent"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </PageHeader>

      {isPageLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm font-semibold text-slate-400">Aggregating clinic data matrices...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Dashboard Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Revenue card */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">
                  Monthly Revenue
                </span>
                <p className="text-xl font-bold font-display text-slate-900 mt-0.5 truncate">
                  {formatCurrency(overview?.monthlyRevenue || 0)}
                </p>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Paid / Issued Invoices
                </span>
              </div>
            </div>

            {/* Sessions card */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">
                  Today's Queue
                </span>
                <p className="text-xl font-bold font-display text-slate-900 mt-0.5">
                  {overview?.sessionsToday || 0} Sessions
                </p>
                <span className="text-[10px] text-slate-450 text-indigo-750 font-bold block mt-0.5">
                  Active treatment queue
                </span>
              </div>
            </div>

            {/* Patients card */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">
                  Total Patients
                </span>
                <p className="text-xl font-bold font-display text-slate-900 mt-0.5">
                  {overview?.totalPatients || 0} Registered
                </p>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Ayurvedic profiles
                </span>
              </div>
            </div>

            {/* Low stock alerts card */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
                overview?.inventoryAlerts > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-250 animate-pulse'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">
                  Inventory Alerts
                </span>
                <p className={`text-xl font-bold font-display mt-0.5 ${
                  overview?.inventoryAlerts > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}>
                  {overview?.inventoryAlerts || 0} Items Low
                </p>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Stocks under safety limits
                </span>
              </div>
            </div>
          </div>

          {/* Revenue and Therapy Breakdowns charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend line area graph */}
            <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col min-w-0">
              <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-6 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Gross Clinic Income Trend</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Billed income over selected interval</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-450 font-bold">Total Aggregate:</span>
                  <p className="text-base font-extrabold text-slate-800">
                    {formatCurrency(revenueTrend?.reduce((acc: number, curr: any) => acc + Number(curr.value), 0) || 0)}
                  </p>
                </div>
              </div>

              <div className="h-72 w-full text-xs">
                {revenueTrend && revenueTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val)), 'Revenue']}
                        contentStyle={{ borderRadius: '12px', borderColor: '#f1f5f9', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#0f766e"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium font-sans">
                    No revenue transactions found.
                  </div>
                )}
              </div>
            </div>

            {/* Patient demographic details split */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col min-w-0">
              <div className="pb-4 border-b border-slate-50 mb-6 shrink-0">
                <h3 className="text-sm font-bold text-slate-800">Patient Registrations</h3>
                <p className="text-[10px] text-slate-400 font-medium">New vs. Returning client ratios</p>
              </div>

              <div className="h-56 w-full text-xs flex items-center justify-center">
                {patientPieData.length > 0 && (patientPieData[0].value > 0 || patientPieData[1].value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={patientPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {patientPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} Patients`, 'Category']} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" fontSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-450 font-medium font-sans">
                    No registered patients detected.
                  </div>
                )}
              </div>

              <div className="mt-auto border-t border-slate-50 pt-4 grid grid-cols-2 gap-4 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">New Registrations</span>
                  <span className="font-extrabold text-slate-800 text-lg">{patientStats?.newPatients || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Returning Database</span>
                  <span className="font-extrabold text-slate-800 text-lg">{patientStats?.returningPatients || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Therapists and popular treatments breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Therapies Bar Graph */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col min-w-0">
              <div className="pb-4 border-b border-slate-50 mb-6 shrink-0">
                <h3 className="text-sm font-bold text-slate-800">Popular Panchakarma Treatments</h3>
                <p className="text-[10px] text-slate-400 font-medium">Breakdown of therapies by volume completed</p>
              </div>

              <div className="h-64 w-full text-xs">
                {therapyBreakdown && therapyBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={therapyBreakdown} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                      <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis dataKey="therapy" type="category" stroke="#94a3b8" fontSize={8} tickLine={false} width={80} />
                      <Tooltip formatter={(v) => [`${v} Sessions`, 'Completed']} />
                      <Bar dataKey="count" fill="#0f766e" radius={[0, 8, 8, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-450 font-medium font-sans">
                    No therapy bookings recorded.
                  </div>
                )}
              </div>
            </div>

            {/* Therapist utilization donuts */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col min-w-0">
              <div className="pb-4 border-b border-slate-50 mb-6 shrink-0">
                <h3 className="text-sm font-bold text-slate-800">Therapist Utilization</h3>
                <p className="text-[10px] text-slate-400 font-medium">Session count distribution amongst clinical staff</p>
              </div>

              <div className="h-64 w-full text-xs">
                {therapistUtilization && therapistUtilization.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={therapistUtilization} margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                      <XAxis dataKey="therapist" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip formatter={(v) => [`${v} Sessions`, 'Assigned']} />
                      <Bar dataKey="sessionsCount" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-450 font-medium font-sans">
                    No therapist session records found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pharmacy oil usage index list */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
            <div className="pb-4 border-b border-slate-50 mb-6 shrink-0">
              <h3 className="text-sm font-bold text-slate-800">Clinical Medicated Oils & Herbs Usage</h3>
              <p className="text-[10px] text-slate-400 font-medium">Top volumes consumed in therapies completed</p>
            </div>

            <div className="overflow-x-auto text-xs">
              {inventoryUsage && inventoryUsage.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="px-6 py-3">Inventory Material Name</th>
                      <th className="px-6 py-3 text-right">Aggregate Volume Consumed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                    {inventoryUsage.map((usage: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/10">
                        <td className="px-6 py-3.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-700" />
                          <span className="font-semibold text-slate-850">{usage.name}</span>
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-slate-800">
                          {usage.quantity} {usage.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-slate-400 font-medium font-sans">
                  No inventory usage entries recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AnalyticsPage;
