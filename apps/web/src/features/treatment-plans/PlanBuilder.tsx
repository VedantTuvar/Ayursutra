import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function PlanBuilder() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();

  // State Management
  const [step, setStep] = useState(1);
  const [name, setName] = useState('14-Day Vata Shamana Panchakarma');
  const [description, setDescription] = useState('Intensive course to pacify aggregated Vata Dosha.');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalDays, setTotalDays] = useState(14);
  const [dietInstructions, setDietInstructions] = useState('Warm fresh foods only. Favor sweet/salty tastes.');
  const [lifestyleNotes, setLifestyleNotes] = useState('Avoid cold winds and drafts. Meditate daily.');
  
  // Day planner list of therapies
  const [plannedTherapies, setPlannedTherapies] = useState<Array<{
    dayNumber: number;
    therapyTypeId: string;
    durationMins: number;
    sequenceOrder: number;
    notes?: string;
  }>>([
    { dayNumber: 1, therapyTypeId: '', durationMins: 60, sequenceOrder: 1, notes: 'Focus on lumbar spine.' }
  ]);

  // 1. Fetch Patient details
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patients', 'detail', patientId],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}`);
      return res.data.data;
    }
  });

  // 2. Fetch Therapy Types list
  const { data: therapies, isLoading: therapiesLoading } = useQuery({
    queryKey: ['therapy-types', 'list'],
    queryFn: async () => {
      const res = await api.get('/therapy-types');
      return res.data.data;
    }
  });

  // 3. Save draft mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/patients/${patientId}/plans`, payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success('Treatment plan saved as Draft successfully');
      navigate(`/patients/${patientId}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not draft plan';
      toast.error(msg);
    }
  });

  const loading = patientLoading || therapiesLoading;

  const handleAddTherapy = () => {
    const nextDay = plannedTherapies.length > 0 
      ? Math.max(...plannedTherapies.map(t => t.dayNumber)) 
      : 1;

    setPlannedTherapies([
      ...plannedTherapies,
      { dayNumber: nextDay, therapyTypeId: '', durationMins: 60, sequenceOrder: 1, notes: '' }
    ]);
  };

  const handleRemoveTherapy = (index: number) => {
    setPlannedTherapies(plannedTherapies.filter((_, idx) => idx !== index));
  };

  const handleTherapyChange = (index: number, field: string, value: any) => {
    const updated = [...plannedTherapies];
    updated[index] = {
      ...updated[index],
      [field]: field === 'dayNumber' || field === 'durationMins' || field === 'sequenceOrder'
        ? Number(value)
        : value
    };

    // Prepopulate duration if therapy type changes
    if (field === 'therapyTypeId') {
      const selected = therapies?.find((t: any) => t.id === value);
      if (selected) {
        updated[index].durationMins = selected.defaultDurationMins;
      }
    }

    setPlannedTherapies(updated);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim() || !startDate) {
        toast.error('Plan name and start dates are required');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = () => {
    // Validate Step 2
    const invalid = plannedTherapies.some(pt => !pt.therapyTypeId || pt.dayNumber <= 0 || pt.dayNumber > totalDays);
    if (invalid) {
      toast.error(`Please select valid therapy types and make sure day numbers are between 1 and ${totalDays}`);
      return;
    }

    const payload = {
      name,
      description,
      startDate,
      totalDays,
      dietInstructions,
      lifestyleNotes,
      plannedTherapies
    };

    saveMutation.mutate(payload);
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <Link to={`/patients/${patientId}`} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-sm font-semibold text-slate-400">Back to Patient clinical file</span>
      </div>

      <PageHeader
        title="Panchakarma Treatment Plan Builder"
        description={`Design personalized multi-week clinical courses for ${patient?.user?.name || 'Patient'}.`}
      />

      {/* Steps indicator */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-8 shrink-0">
        {[
          { num: 1, label: 'Course Settings' },
          { num: 2, label: 'Day-by-Day Planner' }
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
              step === s.num ? 'text-brand-700 font-bold' : 'text-slate-400'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[11px] ${
              step === s.num 
                ? 'bg-brand-700 border-brand-700 text-white font-bold' 
                : 'bg-white border-slate-200 text-slate-400'
            }`}>
              {s.num}
            </span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 shadow-md">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
            Course Setup & General Instructions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Plan Name */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-slate-500 font-semibold block">Plan Name / Target</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 14-Day Vata Shamana Panchakarma"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
              />
            </div>

            {/* Total Days */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">Duration (Days)</label>
              <input
                type="number"
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
              />
            </div>

            {/* Brief Description */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-slate-500 font-semibold block">Clinical Target / Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Targeting chronic lumbar aggregations..."
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
              />
            </div>

            {/* Diet instructions */}
            <div className="space-y-1 sm:col-span-3">
              <label className="text-xs text-slate-500 font-semibold block">Prescribed Diet Instructions</label>
              <textarea
                value={dietInstructions}
                onChange={(e) => setDietInstructions(e.target.value)}
                placeholder="Warm fluids only. Take milk with ghee at bedtime..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium"
              />
            </div>

            {/* Lifestyle instructions */}
            <div className="space-y-1 sm:col-span-3">
              <label className="text-xs text-slate-500 font-semibold block">Lifestyle & Daily Routine Notes</label>
              <textarea
                value={lifestyleNotes}
                onChange={(e) => setLifestyleNotes(e.target.value)}
                placeholder="Avoid drafts. Meditate mornings..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-6 border-t border-slate-100 mt-6 shrink-0">
            <button
              onClick={handleNextStep}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all shrink-0"
            >
              <span>Add Planned Therapies</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Day-by-day planner */}
      {step === 2 && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-6 flex-wrap gap-2">
            <h3 className="text-base font-bold text-slate-800">
              Schedule Daily Sequential Therapies
            </h3>
            <button
              type="button"
              onClick={handleAddTherapy}
              className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              <Plus className="w-4 h-4" />
              <span>Add Planned Session</span>
            </button>
          </div>

          {/* List of day items */}
          <div className="space-y-4">
            {plannedTherapies.map((pt, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Day input */}
                <div className="w-20 shrink-0">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Day #</label>
                  <input
                    type="number"
                    value={pt.dayNumber}
                    onChange={(e) => handleTherapyChange(idx, 'dayNumber', e.target.value)}
                    min={1}
                    max={totalDays}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white text-center font-bold"
                  />
                </div>

                {/* Therapy selection */}
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Therapy</label>
                  <select
                    value={pt.therapyTypeId}
                    onChange={(e) => handleTherapyChange(idx, 'therapyTypeId', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white font-medium"
                  >
                    <option value="">-- Pick Therapy --</option>
                    {therapies?.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category.toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className="w-24 shrink-0">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={pt.durationMins}
                    onChange={(e) => handleTherapyChange(idx, 'durationMins', e.target.value)}
                    min={5}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white text-right"
                  />
                </div>

                {/* Notes */}
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Specific Instructions</label>
                  <input
                    type="text"
                    value={pt.notes || ''}
                    onChange={(e) => handleTherapyChange(idx, 'notes', e.target.value)}
                    placeholder="Focus warm oils on lumbar regions..."
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white placeholder-slate-300"
                  />
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveTherapy(idx)}
                  className="p-2 mt-4 sm:mt-0 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Stepper controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8 shrink-0">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-brand-750 hover:bg-brand-750 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Treatment Draft</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default PlanBuilder;
