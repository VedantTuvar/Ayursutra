import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { useRegisterPatient } from './usePatients';
import toast from 'react-hot-toast';

const patientFormSchema = z.object({
  name: z.string().min(2, 'Patient name must be at least 2 characters'),
  email: z.string().email('Please supply a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  medicalHistory: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().min(1, 'Emergency name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phone: z.string().min(10, 'Emergency phone is required')
  })
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
  onClose: () => void;
}

export function PatientForm({ onClose }: PatientFormProps) {
  const registerMutation = useRegisterPatient();
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema)
  });

  const handleAddSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, idx) => idx !== index));
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, idx) => idx !== index));
  };

  const onSubmit = (values: PatientFormValues) => {
    const payload = {
      ...values,
      symptoms,
      allergies
    };

    registerMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Click-away Backdrop overlay */}
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      {/* Form Dialog Card */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-10 my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 shrink-0">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 leading-snug">
              Register New Patient
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Create a new patient file and automatic user account credentials.
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto pr-2 space-y-6">
          
          {/* Basics */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-2">
              Primary Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Full Name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Amit Patel"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
                {errors.name && <span className="text-xs text-rose-500 font-medium block mt-1">{errors.name.message}</span>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Email Address</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="e.g. amit@demo.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
                {errors.email && <span className="text-xs text-rose-500 font-medium block mt-1">{errors.email.message}</span>}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Phone Number</label>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="e.g. 9892011122"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
                {errors.phone && <span className="text-xs text-rose-500 font-medium block mt-1">{errors.phone.message}</span>}
              </div>

              {/* DOB */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Date of Birth</label>
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
                {errors.dateOfBirth && <span className="text-xs text-rose-500 font-medium block mt-1">{errors.dateOfBirth.message}</span>}
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Gender</label>
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Blood Group</label>
                <select
                  {...register('bloodGroup')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Symptoms and Allergies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Symptoms list */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-2">
                Active Symptoms
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  placeholder="Add symptom (e.g. Back Pain)"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddSymptom}
                  className="p-2 text-brand-700 hover:bg-brand-50 border border-brand-150 rounded-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {symptoms.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg"
                  >
                    <span>{s}</span>
                    <button type="button" onClick={() => handleRemoveSymptom(idx)} className="text-indigo-400 hover:text-indigo-600">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Allergies list */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-2">
                Known Allergies
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  placeholder="Add allergy (e.g. Gluten)"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="p-2 text-brand-700 hover:bg-brand-50 border border-brand-150 rounded-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {allergies.map((a, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 rounded-lg"
                  >
                    <span>{a}</span>
                    <button type="button" onClick={() => handleRemoveAllergy(idx)} className="text-rose-400 hover:text-rose-600">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-2">
              Medical History
            </label>
            <textarea
              {...register('medicalHistory')}
              placeholder="Chronical conditions, previous surgeries, or concurrent treatments..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium"
            />
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-2">
              Emergency Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Contact Name */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Contact Name</label>
                <input
                  type="text"
                  {...register('emergencyContact.name')}
                  placeholder="Sunita Patel"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
                {errors.emergencyContact?.name && (
                  <span className="text-xs text-rose-500 font-medium block mt-1">
                    {errors.emergencyContact.name.message}
                  </span>
                )}
              </div>

              {/* Relationship */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Relationship</label>
                <input
                  type="text"
                  {...register('emergencyContact.relationship')}
                  placeholder="Spouse"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
                {errors.emergencyContact?.relationship && (
                  <span className="text-xs text-rose-500 font-medium block mt-1">
                    {errors.emergencyContact.relationship.message}
                  </span>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Contact Phone</label>
                <input
                  type="text"
                  {...register('emergencyContact.phone')}
                  placeholder="9892011123"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
                {errors.emergencyContact?.phone && (
                  <span className="text-xs text-rose-500 font-medium block mt-1">
                    {errors.emergencyContact.phone.message}
                  </span>
                )}
              </div>
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
              disabled={registerMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Patient</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default PatientForm;
