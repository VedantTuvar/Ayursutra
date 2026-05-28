import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { useAuthStore } from '../auth/authStore';
import {
  Settings,
  Activity,
  Home,
  User,
  Plus,
  Loader2,
  X,
  Edit2,
  Lock,
  Building,
  Mail,
  Phone,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'therapies' | 'rooms' | 'profile'>('therapies');

  // Modals & Forms states
  const [therapyModalOpen, setTherapyModalOpen] = useState(false);
  const [editingTherapy, setEditingTherapy] = useState<any | null>(null);

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);

  // 1. Fetch Therapy Types
  const { data: therapies, isLoading: therapiesLoading } = useQuery({
    queryKey: ['therapy-types', 'settings-list'],
    queryFn: async () => {
      const res = await api.get('/therapy-types');
      return res.data.data;
    }
  });

  // 2. Fetch Rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', 'settings-list'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data.data;
    }
  });

  // Therapy Type Mutations
  const saveTherapyMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: any }) => {
      if (id) {
        return (await api.put(`/therapy-types/${id}`, payload)).data;
      } else {
        return (await api.post('/therapy-types', payload)).data;
      }
    },
    onSuccess: () => {
      toast.success(editingTherapy ? 'Therapy config updated' : 'New therapy type added');
      queryClient.invalidateQueries({ queryKey: ['therapy-types'] });
      setTherapyModalOpen(false);
      setEditingTherapy(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not save therapy configuration';
      toast.error(msg);
    }
  });

  // Room Mutations
  const saveRoomMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: any }) => {
      if (id) {
        return (await api.put(`/rooms/${id}`, payload)).data;
      } else {
        return (await api.post('/rooms', payload)).data;
      }
    },
    onSuccess: () => {
      toast.success(editingRoom ? 'Room updated successfully' : 'New room added successfully');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setRoomModalOpen(false);
      setEditingRoom(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not save room config';
      toast.error(msg);
    }
  });

  // Handle Form Submissions
  const handleTherapySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      name: String(formData.get('name')),
      nameHindi: String(formData.get('nameHindi')) || undefined,
      category: String(formData.get('category')),
      defaultDurationMins: Number(formData.get('defaultDurationMins')),
      requiresTherapistCount: Number(formData.get('requiresTherapistCount')),
      description: String(formData.get('description')) || undefined,
      contraindications: String(formData.get('contraindications')) || undefined,
      defaultOils: String(formData.get('defaultOils'))
        ? String(formData.get('defaultOils')).split(',').map((o) => o.trim())
        : [],
      isActive: formData.get('isActive') === 'true'
    };

    saveTherapyMutation.mutate({
      id: editingTherapy?.id,
      payload
    });
  };

  const handleRoomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload = {
      name: String(formData.get('name')),
      capacity: Number(formData.get('capacity')),
      features: String(formData.get('features'))
        ? String(formData.get('features')).split(',').map((f) => f.trim())
        : [],
      isActive: formData.get('isActive') === 'true'
    };

    saveRoomMutation.mutate({
      id: editingRoom?.id,
      payload
    });
  };

  const therapyColumns = [
    {
      header: 'Therapy Name',
      accessor: (item: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{item.name}</span>
          {item.nameHindi && <span className="text-xs text-slate-400 font-hindi font-medium">{item.nameHindi}</span>}
        </div>
      )
    },
    {
      header: 'Category',
      accessor: (item: any) => <StatusBadge status={item.category} />
    },
    {
      header: 'Session Duration',
      accessor: (item: any) => (
        <span className="text-slate-600 font-semibold">{item.defaultDurationMins} minutes</span>
      )
    },
    {
      header: 'Staff Required',
      accessor: (item: any) => (
        <span className="text-slate-500 font-medium">
          {item.requiresTherapistCount} Therapist{item.requiresTherapistCount > 1 ? 's' : ''}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'EXPIRED'} />
    },
    {
      header: 'Modify',
      accessor: (item: any) => (
        <button
          onClick={() => {
            setEditingTherapy(item);
            setTherapyModalOpen(true);
          }}
          className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Config</span>
        </button>
      )
    }
  ];

  const roomColumns = [
    {
      header: 'Room Name',
      accessor: (item: any) => <span className="font-semibold text-slate-800">{item.name}</span>
    },
    {
      header: 'Bed Capacity',
      accessor: (item: any) => (
        <span className="text-slate-600 font-semibold">
          {item.capacity} Patient{item.capacity > 1 ? 's' : ''}
        </span>
      )
    },
    {
      header: 'Clinic Features',
      accessor: (item: any) => (
        <div className="flex flex-wrap gap-1">
          {item.features?.map((feat: string, idx: number) => (
            <span
              key={idx}
              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-semibold uppercase"
            >
              {feat}
            </span>
          )) || <span className="text-xs text-slate-400 italic">None</span>}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'CANCELLED'} />
    },
    {
      header: 'Modify',
      accessor: (item: any) => (
        <button
          onClick={() => {
            setEditingRoom(item);
            setRoomModalOpen(true);
          }}
          className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Room</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Settings & System Config"
        description="Configure Panchakarma therapy categories, manage clinical droni rooms, and review account permissions."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-6 shrink-0 bg-white p-1 rounded-xl shadow-sm max-w-md">
        <button
          onClick={() => setActiveTab('therapies')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'therapies'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Clinical Therapies</span>
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'rooms'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Droni Rooms</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          <span>User Profile</span>
        </button>
      </div>

      {/* Content Render panels */}
      {activeTab === 'therapies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Panchakarma Therapies Catalog</h3>
              <p className="text-[10px] text-slate-400 font-medium">Configure duration, required staff counts, and default oils.</p>
            </div>
            <button
              onClick={() => {
                setEditingTherapy(null);
                setTherapyModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Therapy</span>
            </button>
          </div>

          <DataTable
            columns={therapyColumns}
            data={therapies || []}
            isLoading={therapiesLoading}
            searchPlaceholder="Search therapies by name..."
          />
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Clinic Treatment Rooms</h3>
              <p className="text-[10px] text-slate-400 font-medium">Add massage beds or steam cabins, configure capacities.</p>
            </div>
            <button
              onClick={() => {
                setEditingRoom(null);
                setRoomModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Room</span>
            </button>
          </div>

          <DataTable
            columns={roomColumns}
            data={rooms || []}
            isLoading={roomsLoading}
            searchPlaceholder="Search rooms..."
          />
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-slate-105 flex items-center justify-center font-display font-semibold border text-sm shrink-0">
                {user?.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{user?.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold border border-brand-200/50 uppercase">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <div className="flex items-center gap-2 text-slate-800 mt-0.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user?.email}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase tracking-wider block">Associated Clinic</span>
                  <div className="flex items-center gap-2 text-slate-800 mt-0.5">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>{user?.clinicName}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex gap-3 text-slate-600 mt-4 leading-relaxed font-medium">
                <ShieldAlert className="w-5 h-5 text-slate-450 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 leading-none mb-1">Access Control Scoping</h4>
                  <span>Your account operations are securely locked to the tenant scope ID of your clinic: <code>{user?.clinicId}</code>. Standard users cannot perform cross-tenant lookups.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3">
            <Lock className="w-10 h-10 text-slate-350" />
            <h4 className="font-bold text-slate-800 text-sm">Security Controls</h4>
            <p className="text-xs text-slate-450 font-medium leading-relaxed px-4">
              All credentials use JWT authorization rotation schemas backed by standard SHA-256 password salting in the database.
            </p>
          </div>
        </div>
      )}

      {/* Therapy Config Edit/Add Modal */}
      {therapyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setTherapyModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800">
                {editingTherapy ? 'Edit Therapy Type' : 'Add Therapy Type'}
              </h3>
              <button
                onClick={() => setTherapyModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleTherapySubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Therapy Name (English)</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingTherapy?.name || ''}
                  placeholder="e.g. Abhyanga"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                  required
                />
              </div>

              {/* Hindi Name */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Sanskrit / Hindi Name (Optional)</label>
                <input
                  type="text"
                  name="nameHindi"
                  defaultValue={editingTherapy?.nameHindi || ''}
                  placeholder="e.g. अभ्यंग"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium placeholder-slate-300"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Clinical Category</label>
                <select
                  name="category"
                  defaultValue={editingTherapy?.category || 'POORVAKARMA'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                  required
                >
                  <option value="POORVAKARMA">Poorvakarma (Preparatory Therapies)</option>
                  <option value="PRADHANKARMA">Pradhankarma (Main Panchakarma Therapies)</option>
                  <option value="PASCHATKARMA">Paschatkarma (Post-treatment Regimen)</option>
                </select>
              </div>

              {/* Duration and staff */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-semibold block">Duration (Minutes)</label>
                  <input
                    type="number"
                    name="defaultDurationMins"
                    defaultValue={editingTherapy?.defaultDurationMins || 60}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                    required
                    min="5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-semibold block">Required Therapists</label>
                  <input
                    type="number"
                    name="requiresTherapistCount"
                    defaultValue={editingTherapy?.requiresTherapistCount || 1}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                    required
                    min="1"
                  />
                </div>
              </div>

              {/* Default Oils */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Default Medicated Oils / Ghees (Comma separated)</label>
                <input
                  type="text"
                  name="defaultOils"
                  defaultValue={editingTherapy?.defaultOils?.join(', ') || ''}
                  placeholder="e.g. Mahanarayan Oil, Dhanwantharam Thailam"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Clinical Description (Optional)</label>
                <textarea
                  name="description"
                  defaultValue={editingTherapy?.description || ''}
                  placeholder="Brief methodology details..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white min-h-[60px]"
                />
              </div>

              {/* Contraindications */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Contraindications (Optional)</label>
                <textarea
                  name="contraindications"
                  defaultValue={editingTherapy?.contraindications || ''}
                  placeholder="e.g. Acute inflammation, high fever, pregnancy..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white min-h-[60px]"
                />
              </div>

              {/* Active */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Active Catalog Status</label>
                <select
                  name="isActive"
                  defaultValue={editingTherapy?.isActive !== false ? 'true' : 'false'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                  required
                >
                  <option value="true">Active Catalog Item</option>
                  <option value="false">Deactivated (Archived)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setTherapyModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-250 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveTherapyMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {saveTherapyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Config</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setRoomModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800">
                {editingRoom ? 'Edit Room' : 'Add Room'}
              </h3>
              <button
                onClick={() => setRoomModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleRoomSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Room Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingRoom?.name || ''}
                  placeholder="e.g. Therapy Cabin 3 (Ganga)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                  required
                />
              </div>

              {/* Bed Capacity */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Patient Capacity / Beds</label>
                <input
                  type="number"
                  name="capacity"
                  defaultValue={editingRoom?.capacity || 1}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                  required
                  min="1"
                />
              </div>

              {/* Features */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Features (Comma separated)</label>
                <input
                  type="text"
                  name="features"
                  defaultValue={editingRoom?.features?.join(', ') || ''}
                  placeholder="e.g. Svedana box, attached shower, double droni"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Active Roster Status</label>
                <select
                  name="isActive"
                  defaultValue={editingRoom?.isActive !== false ? 'true' : 'false'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                  required
                >
                  <option value="true">Active and Available</option>
                  <option value="false">Inactive (Maintenance)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-250 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveRoomMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {saveRoomMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Room</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default SettingsPage;
