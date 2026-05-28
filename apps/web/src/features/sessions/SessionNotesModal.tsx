import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SessionNotesModalProps {
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SessionNotesModal({ sessionId, onClose, onSuccess }: SessionNotesModalProps) {
  const [oilsUsed, setOilsUsed] = useState<Array<{ name: string; quantityMl: number; unit: string }>>([]);
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState<number | ''>('');
  const [temp, setTemp] = useState<number | ''>('');
  const [patientResponse, setPatientResponse] = useState('');
  const [observations, setObservations] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');

  // 1. Query current session details to pre-populate oils
  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const res = await api.get(`/sessions/${sessionId}`);
      return res.data.data;
    }
  });

  useEffect(() => {
    if (session) {
      // Prepopulate oils from planned therapy oil prescriptions
      const prescribed = session.plannedTherapy?.prescribedOils;
      if (prescribed) {
        try {
          const parsed = typeof prescribed === 'string' ? JSON.parse(prescribed) : prescribed;
          setOilsUsed(parsed.map((oil: any) => ({
            name: oil.name,
            quantityMl: Number(oil.quantityMl || 150),
            unit: 'ml'
          })));
        } catch (e) {
          setOilsUsed([]);
        }
      } else if (session.plannedTherapy?.therapyType?.defaultOils) {
        setOilsUsed(session.plannedTherapy.therapyType.defaultOils.map((name: string) => ({
          name,
          quantityMl: 150,
          unit: 'ml'
        })));
      }
    }
  }, [session]);

  // 2. Submit notes mutation
  const completeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/sessions/${sessionId}/complete`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Session recorded completed and stocks deducted successfully');
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not complete session';
      toast.error(msg);
    }
  });

  const handleAddOil = () => {
    setOilsUsed([...oilsUsed, { name: '', quantityMl: 150, unit: 'ml' }]);
  };

  const handleRemoveOil = (index: number) => {
    setOilsUsed(oilsUsed.filter((_, idx) => idx !== index));
  };

  const handleOilChange = (index: number, field: string, value: any) => {
    const updated = [...oilsUsed];
    updated[index] = {
      ...updated[index],
      [field]: field === 'quantityMl' ? Number(value) : value
    };
    setOilsUsed(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    const emptyOils = oilsUsed.some((o) => !o.name.trim() || o.quantityMl <= 0);
    if (emptyOils) {
      toast.error('Please specify valid names and quantities for all oils used');
      return;
    }

    const payload = {
      oilsUsed,
      patientResponse,
      observations,
      followUpInstructions,
      vitals: bp || pulse || temp ? {
        ...(bp ? { bp } : {}),
        ...(pulse ? { pulse: Number(pulse) } : {}),
        ...(temp ? { temp: Number(temp) } : {})
      } : undefined
    };

    completeMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
        <div className="glass-panel p-6">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card drawer */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-10 my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 shrink-0">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 leading-snug">
              Complete Session & Record Notes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Patient: {session?.patient?.user?.name} — {session?.plannedTherapy?.therapyType?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-6">
          
          {/* Vitals reporting */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Patient Vital Signs
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* BP */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  placeholder="e.g. 120/80"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
              </div>

              {/* Pulse */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Pulse Rate (BPM)</label>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 72"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
              </div>

              {/* Temp */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Body Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 98.6"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Oils consumption */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Oils / Ghee Consumed
              </h4>
              <button
                type="button"
                onClick={handleAddOil}
                className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Oil</span>
              </button>
            </div>

            {oilsUsed.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-2">
                No oils specified for this session. Add rows if oils are consumed.
              </p>
            ) : (
              <div className="space-y-2">
                {oilsUsed.map((oil, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={oil.name}
                      onChange={(e) => handleOilChange(idx, 'name', e.target.value)}
                      placeholder="Oil Name (e.g. Mahanarayan Oil)"
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                    />
                    <input
                      type="number"
                      value={oil.quantityMl}
                      onChange={(e) => handleOilChange(idx, 'quantityMl', e.target.value)}
                      placeholder="Qty"
                      className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white text-right"
                    />
                    <span className="text-xs text-slate-400 font-bold uppercase w-8">ml</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOil(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clinical logs */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Treatment Logs
            </h4>
            
            {/* Patient Response */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">Patient Response</label>
              <textarea
                value={patientResponse}
                onChange={(e) => setPatientResponse(e.target.value)}
                placeholder="How did the patient feel during and after the therapy?"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium"
              />
            </div>

            {/* Observations */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">Therapist Clinical Observations</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Any stiffness, blockages, pulse changes, or skin conditions observed?"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium"
              />
            </div>

            {/* Follow-up */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">Follow-up Instructions</label>
              <textarea
                value={followUpInstructions}
                onChange={(e) => setFollowUpInstructions(e.target.value)}
                placeholder="Specific instructions given (e.g. avoid direct cold air, take hot bath after 2 hours)"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={completeMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Complete Session</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default SessionNotesModal;
