import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import toast from 'react-hot-toast';

interface ScheduleFilters {
  date: string;
  view: 'day' | 'week';
  therapistId?: string;
  roomId?: string;
}

/**
 * Hook to retrieve scheduled sessions based on date range and filters
 */
export function useSessionsList(filters: ScheduleFilters) {
  return useQuery({
    queryKey: ['schedule', 'sessions', filters],
    queryFn: async () => {
      const res = await api.get('/schedule', {
        params: {
          date: filters.date,
          view: filters.view,
          therapistId: filters.therapistId || undefined,
          roomId: filters.roomId || undefined
        }
      });
      return res.data.data;
    }
  });
}

/**
 * Hook to retrieve available therapists for a specific time range and therapy type
 */
export function useAvailableTherapists(start?: string, end?: string, therapyTypeId?: string) {
  return useQuery({
    queryKey: ['therapists', 'available', start, end, therapyTypeId],
    queryFn: async () => {
      if (!start || !end || !therapyTypeId) return [];
      const res = await api.get('/therapists/available', {
        params: { start, end, therapyTypeId }
      });
      return res.data.data;
    },
    enabled: !!start && !!end && !!therapyTypeId
  });
}

/**
 * Hook to retrieve available rooms for a specific time range
 */
export function useAvailableRooms(start?: string, end?: string) {
  return useQuery({
    queryKey: ['rooms', 'available', start, end],
    queryFn: async () => {
      if (!start || !end) return [];
      const res = await api.get('/rooms/available', {
        params: { start, end }
      });
      return res.data.data;
    },
    enabled: !!start && !!end
  });
}

/**
 * Mutation to book a new therapy session
 */
export function useBookSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/sessions', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Panchakarma session scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not schedule session due to conflicts';
      toast.error(msg, { duration: 5000 });
    }
  });
}

/**
 * Mutation to reschedule an existing session
 */
export function useRescheduleSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.put(`/sessions/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Panchakarma session rescheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not reschedule session due to conflicts';
      toast.error(msg, { duration: 5000 });
    }
  });
}

/**
 * Mutation to cancel a booked session
 */
export function useCancelSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await api.delete(`/sessions/${id}`, {
        data: { reason }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Therapy session cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not cancel session';
      toast.error(msg);
    }
  });
}
export default useSessionsList;
