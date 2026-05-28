import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { usePatientDetail, usePatientTimeline } from './usePatients';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { formatDate, formatCurrency, formatTime } from '../../shared/utils/formatters';
import {
  Calendar,
  IndianRupee,
  FileCheck2,
  AlertTriangle,
  User,
  IndianRupee as Rupee,
  ArrowRight,
  ClipboardList,
  HeartPulse,
  Heart,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';

export function PatientDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'plans' | 'sessions' | 'notes' | 'billing' | 'diet'>('plans');

  // 1. Fetch Patient profile details
  const { data: patient, isLoading } = usePatientDetail(id);

  // 2. Fetch Invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['patient', 'invoices', id],
    queryFn: async () => {
      const res = await api.get(`/invoices?patientId=${id}`);
      return res.data.data;
    },
    enabled: !!id
  });

  // 3. Issue invoice mutation
  const issueInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await api.post(`/invoices/${invoiceId}/issue`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Invoice issued successfully');
      queryClient.invalidateQueries({ queryKey: ['patient', 'invoices', id] });
    }
  });

  if (isLoading || invoicesLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <span className="text-3xl">🌿</span>
        <h3 className="font-display font-bold text-lg text-slate-800 mt-2">File Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">Request patient clinical file was not found.</p>
        <Link to="/patients" className="text-brand-700 font-semibold text-xs mt-4 block">Back to Patients Roster</Link>
      </div>
    );
  }

  const activePlan = patient.treatmentPlans?.find((p: any) => p.status === 'ACTIVE');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-slate-400">Clinical Patient Profile</span>
          <h1 className="text-2xl font-bold font-display text-slate-900 mt-0.5">
            {patient.user?.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/patients/${id}/assessment`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 rounded-xl border border-brand-100 transition-colors shrink-0"
          >
            <HeartPulse className="w-4 h-4 text-brand-700" />
            <span>Prakriti Check</span>
          </Link>
          <Link
            to={`/patients/${id}/plans/new`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Draft Plan</span>
          </Link>
        </div>
      </div>

      {/* Split panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card & Dosha stats */}
        <div className="space-y-6 lg:col-span-1">
          {/* Main Info Card */}
          <div className="glass-card p-6 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-display font-semibold border border-slate-200 shrink-0 text-lg">
                {patient.user?.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-base text-slate-800 truncate">
                  {patient.user?.name}
                </h3>
                <p className="text-xs text-slate-400 font-semibold truncate">{patient.user?.email}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{patient.user?.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Blood Group</span>
                <span className="text-slate-700 font-bold block mt-0.5">{patient.bloodGroup || 'Not set'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Date of Birth</span>
                <span className="text-slate-700 font-bold block mt-0.5">{patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Not set'}</span>
              </div>
            </div>

            {/* Symptoms list */}
            {patient.symptoms?.length > 0 && (
              <div className="border-t border-slate-50 pt-4">
                <span className="text-xs text-slate-400 font-semibold block mb-2">Active Clinical Symptoms</span>
                <div className="flex flex-wrap gap-1.5">
                  {patient.symptoms.map((s: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies list */}
            {patient.allergies?.length > 0 && (
              <div className="border-t border-slate-50 pt-4">
                <span className="text-xs text-slate-400 font-semibold block mb-2">Allergies Warning</span>
                <div className="flex flex-wrap gap-1.5">
                  {patient.allergies.map((a: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                      ⚠ {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Doshas progress bars */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-2">
              Dosha Constitutional Balance
            </h4>

            {patient.prakriti ? (
              <div className="space-y-4">
                {/* Vata */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 font-bold">Vata Dosha</span>
                    <span className="text-slate-700 font-bold">{patient.prakriti.vata}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${patient.prakriti.vata}%` }} />
                  </div>
                </div>

                {/* Pitta */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 font-bold">Pitta Dosha</span>
                    <span className="text-slate-700 font-bold">{patient.prakriti.pitta}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-rose-600 rounded-full" style={{ width: `${patient.prakriti.pitta}%` }} />
                  </div>
                </div>

                {/* Kapha */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 font-bold">Kapha Dosha</span>
                    <span className="text-slate-700 font-bold">{patient.prakriti.kapha}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-sky-600 rounded-full" style={{ width: `${patient.prakriti.kapha}%` }} />
                  </div>
                </div>

                <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
                  <span className="text-lg">🌿</span>
                  <div className="text-[10px] text-emerald-800 leading-tight font-medium">
                    Constitutional dominance verified as <strong className="uppercase">{patient.prakriti.dominance}</strong>. Custom Panchakarma Shamana treatments scheduled.
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <p className="text-xs font-medium mb-3">No constitutional metrics calculated.</p>
                <Link
                  to={`/patients/${id}/assessment`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  <span>Run Prakriti Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tab View Navigation */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tabs bar */}
          <div className="flex items-center gap-1 border-b border-slate-200 shrink-0 overflow-x-auto">
            {[
              { id: 'plans', label: 'Treatment Plans', icon: ClipboardList },
              { id: 'sessions', label: 'Therapies Queue', icon: Calendar },
              { id: 'notes', label: 'Vitals & Notes', icon: Heart },
              { id: 'billing', label: 'Invoices', icon: IndianRupee },
              { id: 'diet', label: 'Active Plan Diet', icon: FileSpreadsheet }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all duration-150 ${
                    isSelected
                      ? 'border-brand-700 text-brand-700 bg-brand-50/10'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab View */}
          <div className="animate-in fade-in duration-150">
            {/* 1. Plans tab */}
            {activeTab === 'plans' && (
              <div className="space-y-4">
                {patient.treatmentPlans?.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                    <span className="text-3xl">📋</span>
                    <h4 className="text-sm font-bold text-slate-700 mt-2">No Plans Drafted</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Click 'Draft Plan' at top to setup a course.</p>
                  </div>
                ) : (
                  patient.treatmentPlans?.map((plan: any) => (
                    <div key={plan.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800">{plan.name}</h4>
                          <StatusBadge status={plan.status} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Duration: {formatDate(plan.startDate)} - {plan.endDate ? formatDate(plan.endDate) : 'N/A'} ({plan.totalDays} Days)
                        </p>
                      </div>
                      <Link
                        to={`/patients/${id}`} // simple detail or action
                        className="text-xs font-semibold text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 transition-colors shrink-0 text-center"
                      >
                        Plan Details
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. Sessions tab */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                {patient.sessions?.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                    <span className="text-3xl">📅</span>
                    <h4 className="text-sm font-bold text-slate-700 mt-2">No Scheduled Sessions</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Book sessions via clinical calendar pages.</p>
                  </div>
                ) : (
                  patient.sessions?.map((s: any) => (
                    <div key={s.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            {s.plannedTherapy?.therapyType?.name || 'Custom Therapy'}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500">
                            {s.room?.name || 'General Space'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Time: {formatDate(s.scheduledStart)} @ {formatTime(s.scheduledStart)} | Therapist: {s.therapist?.name || 'Unassigned'}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. Vitals & Notes tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                {patient.sessions?.filter((s: any) => s.sessionNote).length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                    <span className="text-3xl">✍</span>
                    <h4 className="text-sm font-bold text-slate-700 mt-2">No Session Notes logged</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Therapist notes appear here upon completion.</p>
                  </div>
                ) : (
                  patient.sessions?.filter((s: any) => s.sessionNote).map((s: any) => {
                    const note = s.sessionNote;
                    const vitals = typeof note.vitals === 'string' ? JSON.parse(note.vitals) : note.vitals;
                    return (
                      <div key={s.id} className="glass-card p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">
                              {s.plannedTherapy?.therapyType?.name || 'Medicated Therapy'} Notes
                            </h4>
                            <span className="text-xs text-slate-400">
                              Date: {formatDate(s.scheduledStart)} — Logged by: {s.therapist?.name}
                            </span>
                          </div>

                          {/* Vitals badge list */}
                          {vitals && (
                            <div className="flex items-center gap-2 flex-wrap text-[10px] font-semibold text-indigo-700">
                              {vitals.bp && <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">BP: {vitals.bp}</span>}
                              {vitals.pulse && <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">P: {vitals.pulse} bpm</span>}
                              {vitals.temp && <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">T: {vitals.temp}°F</span>}
                            </div>
                          )}
                        </div>

                        {/* Note texts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {note.patientResponse && (
                            <div>
                              <span className="text-slate-400 font-semibold">Patient response:</span>
                              <p className="text-slate-600 mt-1 font-medium italic leading-relaxed">
                                "{note.patientResponse}"
                              </p>
                            </div>
                          )}
                          {note.observations && (
                            <div>
                              <span className="text-slate-400 font-semibold">Clinical Observations:</span>
                              <p className="text-slate-600 mt-1 font-medium leading-relaxed">
                                {note.observations}
                              </p>
                            </div>
                          )}
                        </div>

                        {note.followUpInstructions && (
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                            <span className="text-slate-400 font-semibold">Follow-up Instructions:</span>
                            <p className="text-slate-600 mt-1 font-medium leading-relaxed">
                              {note.followUpInstructions}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 4. Billing tab */}
            {activeTab === 'billing' && (
              <div className="space-y-4">
                {invoices?.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                    <span className="text-3xl">🧾</span>
                    <h4 className="text-sm font-bold text-slate-700 mt-2">No Invoices generated</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Clinic managers generate invoices from completed therapies.</p>
                  </div>
                ) : (
                  invoices?.map((inv: any) => (
                    <div key={inv.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800">{inv.invoiceNumber}</h4>
                          <StatusBadge status={inv.status} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Issue Date: {formatDate(inv.issueDate)} | Total Amount: <strong className="text-brand-700">{formatCurrency(inv.totalAmount)}</strong>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {inv.status === 'DRAFT' && (
                          <button
                            onClick={() => issueInvoiceMutation.mutate(inv.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-750 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
                          >
                            Issue
                          </button>
                        )}
                        <a
                          href={`${api.defaults.baseURL}/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors text-center"
                        >
                          Invoice PDF
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. Diet tab */}
            {activeTab === 'diet' && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100 mb-2">
                  Active Treatment Course Diet Instructions
                </h3>

                {activePlan ? (
                  <div className="space-y-4 text-sm leading-relaxed">
                    {activePlan.dietInstructions ? (
                      <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl">
                        <span className="text-xs text-slate-400 font-bold block mb-1">Prescribed Diet</span>
                        <p className="text-slate-700 font-medium">{activePlan.dietInstructions}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No specific diet instructions prescribe in active course.</p>
                    )}

                    {activePlan.lifestyleNotes && (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <span className="text-xs text-slate-400 font-bold block mb-1">Lifestyle & Daily Routine Notes</span>
                        <p className="text-slate-700 font-medium">{activePlan.lifestyleNotes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No active treatment plan found. Please activate plan templates.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default PatientDetail;
