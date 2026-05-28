import { Server, Socket } from 'socket.io';
import { logger } from '../lib/logger';

let ioInstance: Server | null = null;

export function initializeSocket(io: Server) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    logger.debug(`Socket client connected: ${socket.id}`);

    // Clinicians and client displays subscribe to their clinic's workspace notifications
    socket.on('join:clinic', (clinicId: string) => {
      socket.join(`clinic:${clinicId}`);
      logger.debug(`Socket client ${socket.id} subscribed to room: clinic:${clinicId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket client disconnected: ${socket.id}`);
    });
  });
}

export function emitToClinic(clinicId: string, event: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`clinic:${clinicId}`).emit(event, data);
    logger.info(`Broadcast [${event}] triggered to workspace: clinic:${clinicId}`);
  } else {
    logger.debug('Socket instance not loaded yet; skipping realtime event broadcast.');
  }
}
