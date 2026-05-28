import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { useAvailableTherapists, useAvailableRooms, useBookSession } from './useSchedule';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { X, Calendar, User, HeartPulse, ShieldAlert, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookSessionModalProps {
  preFilledDate?: string; // YYYY-MM-DD
  preFilledStart?: string; // HH:MM
  onClose: () => void;
}

export function BookSessionModal({ preFilledDate, preFilledStart, onClose }: BookSessionModalProps) {
  const bookMutation = useBookSession();

  // State Management
  const [patientId, setPatientId] = useState('');
  const [therapyTypeId, setTherapyTypeId] = useState('');
  const [date, setDate] = useState(preFilledDate || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(preFilledStart || '09:00');
  const [durationMins, setDurationMins] = useState(60);
  const [therapistId, setTherapistId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [notes, setNotes] = useState('');

  // 1. Fetch Patients list
  const { data: patientsResponse, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', 'list-simple'],
    queryFn: async () => {
      const res = await api.get('/patients?limit=100');
      return res.data.data;
    }
  });

  // 2. Fetch Therapy Types list
  const { data: therapies, isLoading: therapiesLoading } = useQuery({
    queryKey: ['therapy-types', 'list-simple'],
    queryFn: async () => {
      const res = await api.get('/therapy-types');
      return res.data.data;
    }
  });

  // Update duration when therapy type changes
  useEffect(() => {
    if (therapyTypeId && therapies) {
      const selected = therapies.find((t: any) => t.id === therapyTypeId);
      if (selected) {
        setDurationMins(selected.defaultDurationMins);
      }
    }
  }, [therapyTypeId, therapies]);

  // Calculate start/end ISO timestamps for availability queries
  const getStartEndISO = () => {
    if (!date || !startTime) return { startISO: undefined, endISO: undefined };
    try {
      const start = new Date(`${date}T${startTime}`);
      if (isNaN(start.getTime())) return { startISO: undefined, endISO: undefined };
      
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + Number(durationMins));
      
      return {
        startISO: start.toISOString(),
        endISO: end.toISOString()
      };
    } catch (e) {
      return { startISO: undefined, endISO: undefined };
    }
  };

  const { startISO, endISO } = getStartEndISO();

  // 3. Query available therapists based on slots and certified skills
  const { data: availableTherapists, isLoading: therapistsQueryLoading } = useAvailableTherapists(
    startISO,
    endISO,
    therapyTypeId
  );

  // 4. Query available rooms based on slots
  const { data: availableRooms, isLoading: roomsQueryLoading } = useAvailableRooms(
    startISO,
    endISO
  );

  // Auto-reset selection if old selected is not in available lists anymore
  useEffect(() => {
    if (availableTherapists && !availableTherapists.some((t: any) => t.id === therapistId)) {
      setTherapistId('');
    }
  }, [availableTherapists]);

  useEffect(() => {
    if (availableRooms && !availableRooms.some((r: any) => r.id === roomId)) {
      setRoomId('');
    }
  }, [availableRooms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      toast.error('Please select a patient');
      return;
    }
    if (!therapyTypeId) {
      toast.error('Please select a therapy type');
      return;
    }
    if (!startISO || !endISO) {
      toast.error('Please enter a valid slot and duration');
      return;
    }

    const payload = {
      patientId,
      plannedTherapyId: undefined, // custom calendar book
      treatmentPlanId: undefined,
      therapistId: therapistId || null,
      roomId: roomId || null,
      scheduledStart: startISO,
      scheduledEnd: endISO,
      notes
    };

    bookMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const loading = patientsLoading || therapiesLoading;

  if (loading) {
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

      {/* Modal Card Drawer */}
      <div className="relative w-full max-w-lg bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-10 my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 shrink-0">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 leading-snug">
              Book Panchakarma Session
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Intelligent multi-resource scheduler with automated conflict filters.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Patient Selector */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-semibold block">Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium"
            >
              <option value="">-- Pick Patient --</option>
              {patientsResponse?.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.user?.name} (Phone: {p.user?.phone || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {/* Therapy Type Selector */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-semibold block">Therapy Type</label>
            <select
              value={therapyTypeId}
              onChange={(e) => setTherapyTypeId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium"
            >
              <option value="">-- Pick Panchakarma Therapy --</option>
              {therapies?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category.toLowerCase()}) — Default: {t.defaultDurationMins} mins
                </option>
              ))}
            </select>
          </div>

          {/* Slots & Timing parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Date */}
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs text-slate-500 font-semibold block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">Duration (Mins)</label>
              <input
                type="number"
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
                min={5}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white text-right"
              />
            </div>
          </div>

          {/* Dynamic Available Therapist & Room Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Therapist */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">
                Available Skilled Therapist {therapistsQueryLoading && '...'}
              </label>
              <select
                value={therapistId}
                onChange={(e) => setTherapistId(e.target.value)}
                disabled={!therapyTypeId || therapistsQueryLoading}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium disabled:opacity-50"
              >
                <option value="">-- Select Therapist --</option>
                {availableTherapists?.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Expert)
                  </option>
                ))}
              </select>
              {!therapyTypeId && (
                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                  Pick a therapy type first to load skilled therapists.
                </span>
              )}
            </div>

            {/* Room */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">
                Available Droni Room {roomsQueryLoading && '...'}
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={roomsQueryLoading}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium disabled:opacity-50"
              >
                <option value="">-- Select Room / Table --</option>
                {availableRooms?.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label className="text-xs text-slate-500 font-semibold block">Session Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Day 1 course session, focuses on warm oil Swedana"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white placeholder-slate-300 font-medium"
            />
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
              disabled={bookMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {bookMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <span>Schedule Session</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default BookSessionModal;
