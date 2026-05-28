import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import toast from 'react-hot-toast';

/**
 * Hook to retrieve patients list, with optional search query
 */
export function usePatientsList(search?: string) {
  return useQuery({
    queryKey: ['patients', 'list', search],
    queryFn: async () => {
      const res = await api.get('/patients', {
        params: { q: search }
      });
      return res.data;
    }
  });
}

/**
 * Hook to retrieve specific patient details
 */
export function usePatientDetail(id?: string) {
  return useQuery({
    queryKey: ['patients', 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/patients/${id}`);
      return res.data.data;
    },
    enabled: !!id
  });
}

/**
 * Hook to retrieve patient treatment timeline
 */
export function usePatientTimeline(id?: string) {
  return useQuery({
    queryKey: ['patients', 'timeline', id],
    queryFn: async () => {
      if (!id) return [];
      const res = await api.get(`/patients/${id}/timeline`);
      return res.data.data;
    },
    enabled: !!id
  });
}

/**
 * Hook to retrieve patient active treatment plan
 */
export function usePatientActivePlan(id?: string) {
  return useQuery({
    queryKey: ['patients', 'active-plan', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/patients/${id}/active-plan`);
      return res.data.data;
    },
    enabled: !!id
  });
}

/**
 * Mutation to register a new patient profile
 */
export function useRegisterPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/patients', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Patient registered successfully');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Failed to register patient';
      toast.error(msg);
    }
  });
}

/**
 * Mutation to update patient properties
 */
export function useUpdatePatient(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put(`/patients/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Patient details updated successfully');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Failed to update patient';
      toast.error(msg);
    }
  });
}

/**
 * Mutation to submit Prakriti assessment scores
 */
export function useSaveAssessment(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/patients/${id}/assessment`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Prakriti assessment scores calculated and logged successfully');
      queryClient.invalidateQueries({ queryKey: ['patients', 'detail', id] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Failed to save assessment';
      toast.error(msg);
    }
  });
}
