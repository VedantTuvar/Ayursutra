import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { useSessionsList, useCancelSession } from './useSchedule';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { BookSessionModal } from './BookSessionModal';
import { SessionNotesModal } from '../sessions/SessionNotesModal';
import { PlusCircle, Search, Trash2, CheckCircle2, User, Home, ShieldAlert, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function SchedulingPage() {
  const queryClient = useQueryClient();

  // Filters State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [therapistFilter, setTherapistFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  // Modals Toggles
  const [bookingOpen, setBookingOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [preFillStart, setPreFillStart] = useState('');
  const [preFillDate, setPreFillDate] = useState('');

  // 1. Fetch staff therapists for sidebar filtering
  const { data: therapists } = useQuery({
    queryKey: ['therapists', 'list-filters'],
    queryFn: async () => {
      const res = await api.get('/therapists');
      return res.data.data;
    }
  });

  // 2. Fetch clinic rooms for sidebar filtering
  const { data: rooms } = useQuery({
    queryKey: ['rooms', 'list-filters'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data.data;
    }
  });

  // 3. Fetch scheduled sessions
  const { data: sessions, isLoading: sessionsLoading } = useSessionsList({
    date: selectedDate,
    view: viewMode,
    therapistId: therapistFilter,
    roomId: roomFilter
  });

  // 4. Cancel session mutation
  const cancelMutation = useCancelSession();

  // Map database sessions to FullCalendar events
  const events = sessions?.map((s: any) => {
    // Determine status colors
    let backgroundColor = '#4f46e5'; // Indigo default SCHEDULED
    if (s.status === 'IN_PROGRESS') {
      backgroundColor = '#d97706'; // Amber
    } else if (s.status === 'COMPLETED') {
      backgroundColor = '#16a34a'; // Emerald green
    } else if (s.status === 'CANCELLED' || s.status === 'NO_SHOW') {
      backgroundColor = '#e11d48'; // Rose red
    } else if (s.status === 'RESCHEDULED') {
      backgroundColor = '#0284c7'; // Sky blue
    }

    return {
      id: s.id,
      title: `${s.patient?.user?.name || 'Patient'} — ${s.plannedTherapy?.therapyType?.name || 'Therapy'}`,
      start: s.scheduledStart,
      end: s.scheduledEnd,
      backgroundColor,
      borderColor: 'transparent',
      extendedProps: {
        patientName: s.patient?.user?.name,
        therapyName: s.plannedTherapy?.therapyType?.name,
        therapistName: s.therapist?.name || 'Unassigned',
        roomName: s.room?.name || 'Unassigned',
        status: s.status,
        notes: s.notes
      }
    };
  }) || [];

  const handleDateClick = (arg: any) => {
    const clickedISO = arg.dateStr; // "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS"
    if (clickedISO.includes('T')) {
      const parts = clickedISO.split('T');
      setPreFillDate(parts[0]);
      setPreFillStart(parts[1].slice(0, 5));
    } else {
      setPreFillDate(clickedISO);
      setPreFillStart('09:00');
    }
    setBookingOpen(true);
  };

  const handleEventClick = (arg: any) => {
    const sId = arg.event.id;
    const props = arg.event.extendedProps;
    
    // Set active target for detail popover or modals
    setSelectedSessionId(sId);
  };

  const handleCancelClick = () => {
    if (selectedSessionId) {
      if (window.confirm('Are you sure you want to cancel this scheduled Panchakarma session?')) {
        cancelMutation.mutate({ id: selectedSessionId }, {
          onSuccess: () => {
            setSelectedSessionId(null);
          }
        });
      }
    }
  };

  const activeSessionProps = events.find((e: any) => e.id === selectedSessionId)?.extendedProps;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Therapy Scheduling Calendar"
        description="Schedule daily sessions, allocate rooms, and coordinate therapists in real-time."
      >
        <button
          onClick={() => {
            setPreFillDate(new Date().toISOString().slice(0, 10));
            setPreFillStart('09:00');
            setBookingOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book Session</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar Filters Card */}
        <div className="space-y-6 lg:col-span-1">
          {/* Calendar filters card */}
          <div className="glass-card p-5 space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              Calendar Filters
            </h3>

            {/* Quick date picker */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">Date Navigation</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-medium"
              />
            </div>

            {/* View switcher */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">Calendar View</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-medium"
              >
                <option value="week">Week Grid View</option>
                <option value="day">Day Schedule View</option>
              </select>
            </div>

            {/* Therapist Filters */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">Filter by Therapist</label>
              <select
                value={therapistFilter}
                onChange={(e) => setTherapistFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-medium"
              >
                <option value="">-- All Therapists --</option>
                {therapists?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Room Filters */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-semibold block">Filter by Room</label>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-medium"
              >
                <option value="">-- All Rooms --</option>
                {rooms?.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Key guide card */}
          <div className="glass-card p-5 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Status Color Indicators
            </h4>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-[#4f46e5] border border-[#4338ca]/10 shrink-0" />
                <span className="text-slate-600">Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-[#d97706] border border-[#b45309]/10 shrink-0" />
                <span className="text-slate-600">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-[#16a34a] border border-[#15803d]/10 shrink-0" />
                <span className="text-slate-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-[#e11d48] border border-[#be123c]/10 shrink-0" />
                <span className="text-slate-600">Cancelled / Missed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-[#0284c7] border border-[#0369a1]/10 shrink-0" />
                <span className="text-slate-600">Rescheduled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Central FullCalendar Panel */}
        <div className="glass-panel p-4 sm:p-6 lg:col-span-3 shadow-md bg-white">
          {sessionsLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={viewMode === 'day' ? 'timeGridDay' : 'timeGridWeek'}
              initialDate={selectedDate}
              headerToolbar={{
                left: 'title',
                center: '',
                right: 'timeGridWeek,timeGridDay'
              }}
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              slotMinTime="07:00:00"
              slotMaxTime="21:00:00"
              allDaySlot={false}
              editable={false}
              selectable={true}
              height="auto"
            />
          )}
        </div>
      </div>

      {/* Selected Session detail Overlay Drawer */}
      {selectedSessionId && activeSessionProps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedSessionId(null)} />
          
          <div className="relative w-full max-w-md bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800">Session Booking details</h3>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="p-1 rounded text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Patient Name</span>
                <p className="font-bold text-slate-800 flex items-center gap-2 mt-0.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{activeSessionProps.patientName}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Therapy Type</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{activeSessionProps.therapyName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={activeSessionProps.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Therapist</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{activeSessionProps.therapistName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Room / Table</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{activeSessionProps.roomName}</p>
                </div>
              </div>

              {activeSessionProps.notes && (
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Notes</span>
                  <p className="text-xs text-slate-500 font-medium italic mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{activeSessionProps.notes}"
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6 shrink-0">
                {(activeSessionProps.status === 'SCHEDULED' || activeSessionProps.status === 'RESCHEDULED') && (
                  <button
                    onClick={handleCancelClick}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Cancel Appointment</span>
                  </button>
                )}

                {activeSessionProps.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => setNotesOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Session</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Session Modal Overlay */}
      {bookingOpen && (
        <BookSessionModal
          preFilledDate={preFillDate}
          preFilledStart={preFillStart}
          onClose={() => setBookingOpen(false)}
        />
      )}

      {/* Vitals Notes Completion Modal Overlay */}
      {notesOpen && selectedSessionId && (
        <SessionNotesModal
          sessionId={selectedSessionId}
          onClose={() => setNotesOpen(false)}
          onSuccess={() => {
            setNotesOpen(false);
            setSelectedSessionId(null);
            queryClient.invalidateQueries({ queryKey: ['schedule'] });
          }}
        />
      )}
    </div>
  );
}
export default SchedulingPage;
