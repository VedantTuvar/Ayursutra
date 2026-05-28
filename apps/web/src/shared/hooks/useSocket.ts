import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../features/auth/authStore';
import { queryClient } from '../api/queryClient';
import toast from 'react-hot-toast';

const WS_URL = (import.meta as any).env.VITE_WS_URL || 'http://localhost:3001';

export function useSocket() {
  const { user, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect client socket
    const socket = io(WS_URL, {
      transports: ['websocket']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:clinic', user.clinicId);
    });

    // Real-time synchronization events
    socket.on('session:booked', (data: any) => {
      toast.success(`Session booked for ${data.session?.patient?.user?.name || 'Patient'}`);
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('session:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('session:cancelled', () => {
      toast.error('A therapy session has been cancelled');
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('session:completed', (data: any) => {
      toast.success(`Therapy completed: ${data.session?.patient?.user?.name || 'Patient'}`);
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    socket.on('inventory:low', (data: any) => {
      toast.error(`[LOW STOCK]: ${data.item.name} is running low! Current: ${Number(data.item.currentStock)}${data.item.unit}`, {
        duration: 6000
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  return socketRef.current;
}
export default useSocket;
