import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { PatientForm } from './PatientForm';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, ArrowRight, Activity } from 'lucide-react';
import { usePatientsList } from './usePatients';

export function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  // 1. Fetch patients list with search query
  const { data: response, isLoading } = usePatientsList(searchQuery);
  const patients = response?.data || [];

  const columns = [
    {
      header: 'Patient Name',
      accessor: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-display font-semibold border border-indigo-100 text-xs">
            {item.user?.name.charAt(0)}
          </div>
          <span className="font-semibold text-slate-800">{item.user?.name}</span>
        </div>
      )
    },
    {
      header: 'Phone Number',
      accessor: (item: any) => <span>{item.user?.phone || 'N/A'}</span>
    },
    {
      header: 'Prakriti dominance',
      accessor: (item: any) => (
        <div className="flex items-center gap-2">
          {item.prakriti ? (
            <>
              <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 uppercase">
                {item.prakriti.dominance}
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-400 font-semibold italic">Not Assessed</span>
          )}
        </div>
      )
    },
    {
      header: 'Active Plan',
      accessor: (item: any) => {
        const activePlan = item.treatmentPlans?.find((p: any) => p.status === 'ACTIVE');
        return activePlan ? (
          <span className="text-xs font-semibold text-brand-700 max-w-[150px] truncate block">
            {activePlan.name}
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-semibold">No Active Plan</span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: (item: any) => (
        <Link
          to={`/patients/${item.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
        >
          <span>Clinical File</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Patient management"
        description="Access Prakriti assessment charts, view historical planned therapies, and create clinical profiles."
      >
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register Patient</span>
        </button>
      </PageHeader>

      {/* Main patients list datatable */}
      <DataTable
        columns={columns}
        data={patients}
        searchPlaceholder="Search patients by name, email or phone..."
        onSearch={(q) => setSearchQuery(q)}
        isLoading={isLoading}
      />

      {/* Register Patient Modal Overlay */}
      {formOpen && <PatientForm onClose={() => setFormOpen(false)} />}
    </div>
  );
}
export default PatientsPage;
