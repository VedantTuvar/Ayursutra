import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { formatTime } from '../../shared/utils/formatters';
import {
  Calendar,
  CheckCircle2,
  Play,
  ClipboardList,
  Flame,
  User,
  FlaskConical
} from 'lucide-react';
import toast from 'react-hot-toast';
import SessionNotesModal from '../sessions/SessionNotesModal';

export function TherapistDashboard() {
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // 1. Fetch therapist's own sessions today
  const { data: mySessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['dashboard', 'therapist-sessions'],
    queryFn: async () => {
      const res = await api.get('/sessions/my');
      return res.data.data;
    }
  });

  // 2. Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await api.post(`/sessions/${sessionId}/start`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Session marked as In Progress');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not start session';
      toast.error(msg);
    }
  });

  const loading = sessionsLoading;

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  // Calculate stats in memory
  const totalToday = mySessions?.length || 0;
  const completedCount = mySessions?.filter((s: any) => s.status === 'COMPLETED').length || 0;
  const inProgressCount = mySessions?.filter((s: any) => s.status === 'IN_PROGRESS').length || 0;
  const pendingCount = totalToday - completedCount;

  // Calculate required oils in memory for today
  const oilsRequired: { [key: string]: number } = {};
  mySessions?.forEach((s: any) => {
    if (s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS') {
      const prescribed = s.plannedTherapy?.prescribedOils;
      if (prescribed) {
        try {
          const parsed = typeof prescribed === 'string' ? JSON.parse(prescribed) : prescribed;
          parsed.forEach((oil: any) => {
            oilsRequired[oil.name] = (oilsRequired[oil.name] || 0) + Number(oil.quantityMl || oil.quantityGrams || 150);
          });
        } catch (e) {}
      } else if (s.plannedTherapy?.therapyType?.defaultOils) {
        // Fallback to default oils (assume 150ml)
        s.plannedTherapy.therapyType.defaultOils.forEach((oil: string) => {
          oilsRequired[oil] = (oilsRequired[oil] || 0) + 150;
        });
      }
    }
  });

  const oilsList = Object.keys(oilsRequired).map((name) => ({
    name,
    amount: oilsRequired[name]
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Therapist Workstation"
        description="View today's treatment sessions queue and document treatment response details."
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Sessions Today */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Today's Session Load
            </span>
            <span className="text-3xl font-display font-bold text-slate-800">
              {totalToday}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Sessions Completed */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Completed Today
            </span>
            <span className="text-3xl font-display font-bold text-emerald-700">
              {completedCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Sessions In Progress */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Currently Active
            </span>
            <span className="text-3xl font-display font-bold text-amber-600">
              {inProgressCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Therapist sessions queue */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 mb-6">
            Today's Therapy Schedule
          </h3>

          <div className="space-y-4 flex-1">
            {mySessions?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 py-12">
                No sessions scheduled for you today. Take rest!
              </div>
            ) : (
              mySessions?.map((s: any) => {
                const isScheduled = s.status === 'SCHEDULED' || s.status === 'RESCHEDULED';
                const isInProgress = s.status === 'IN_PROGRESS';
                return (
                  <div
                    key={s.id}
                    className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all ${
                      isInProgress 
                        ? 'bg-amber-50/20 border-amber-200/60 shadow-sm shadow-amber-500/5'
                        : s.status === 'COMPLETED'
                        ? 'bg-slate-50/40 border-slate-100 opacity-75'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Avatar initials placeholder */}
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-display font-semibold border border-slate-200 shrink-0 text-sm">
                        {s.patient?.user?.name.charAt(0)}
                      </div>
                      
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            {s.patient?.user?.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500 border border-slate-200/40">
                            {s.room?.name || 'General Table'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold truncate">
                          {s.plannedTherapy?.therapyType?.name || 'Panchakarma Treatment'} ({s.plannedTherapy?.durationMins || 60} mins)
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Time: {formatTime(s.scheduledStart)} - {formatTime(s.scheduledEnd)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <StatusBadge status={s.status} />
                      
                      {isScheduled && (
                        <button
                          onClick={() => startSessionMutation.mutate(s.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors shrink-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start</span>
                        </button>
                      )}

                      {isInProgress && (
                        <button
                          onClick={() => setSelectedSessionId(s.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-lg shadow-sm transition-colors shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Required Oils Widget */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-6">
            <FlaskConical className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-800">Prescribed Oils Needed</h3>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {oilsList.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 py-12">
                No pending oils requirements for today.
              </div>
            ) : (
              oilsList.map((oil, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-700 truncate">
                    {oil.name}
                  </span>
                  <span className="text-sm font-bold text-brand-700 shrink-0">
                    {oil.amount} ml
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Session Complete Notes modal overlay */}
      {selectedSessionId && (
        <SessionNotesModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
          onSuccess={() => {
            setSelectedSessionId(null);
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          }}
        />
      )}
    </div>
  );
}
export default TherapistDashboard;
