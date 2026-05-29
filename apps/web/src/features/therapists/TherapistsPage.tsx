import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { HeartPulse, Award, ShieldAlert, Sparkles } from 'lucide-react';

export function TherapistsPage() {
  // Fetch therapists list
  const { data: therapists, isLoading } = useQuery({
    queryKey: ['therapists', 'list-page'],
    queryFn: async () => {
      const res = await api.get('/therapists');
      return res.data.data;
    }
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Therapist Clinical Roster"
        description="Verify therapist certified skills, Panchakarma proficiency levels, and roster balances."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {therapists?.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-100">
            <span className="text-3xl">👥</span>
            <h4 className="text-sm font-bold text-slate-700 mt-2">No Therapists Roster</h4>
            <p className="text-xs text-slate-400 mt-0.5">Roster staff as therapists under Settings profiles.</p>
          </div>
        ) : (
          therapists?.map((t: any) => (
            <div key={t.id} className="glass-card p-6 flex flex-col gap-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
              {/* Header profile details */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-display font-semibold border border-slate-200 shrink-0 text-sm">
                  {t.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{t.name}</h3>
                  <p className="text-xs text-slate-400 truncate">{t.email}</p>
                  <p className="text-[10px] text-brand-700 font-semibold uppercase tracking-wider mt-0.5">
                    ✓ Roster Active
                  </p>
                </div>
              </div>

              {/* Skills section */}
              <div className="border-t border-slate-50 pt-4 flex-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">
                  Certified Proficiencies
                </span>

                {t.therapistSkills?.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium italic">
                    No certified skills currently assigned.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {t.therapistSkills?.map((skill: any) => (
                      <span
                        key={skill.therapyType?.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-100 uppercase"
                      >
                        <Award className="w-3 h-3 text-brand-600" />
                        <span>{skill.therapyType?.name} ({skill.proficiencyLevel.toLowerCase()})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
export default TherapistsPage;
