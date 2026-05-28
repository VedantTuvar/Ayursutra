import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { initializeSocket } from './sockets/scheduling.socket';

// Background Job Workers imports
import { checkMissedSessions, sendAppointmentReminders } from './workers/notification.worker';
import { checkLowStockItems } from './workers/inventory.worker';

const server = http.createServer(app);

// Bind Socket.io realtime syncing
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? 'http://localhost:5173'
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }
});

initializeSocket(io);

// Start HTTP Server listening
server.listen(env.PORT, () => {
  logger.info(`AyurSutra API Server listening on port: ${env.PORT} 🚀`);
  logger.info(`Interactive API Swagger Documentation: http://localhost:${env.PORT}/api/docs 🌿`);

  // Start background job schedule workers
  logger.info('Initializing background clinical worker schedulers...');

  // 1. Audit missed sessions hourly
  setInterval(async () => {
    try {
      await checkMissedSessions();
    } catch (err) {
      logger.error('Missed sessions background worker sweep failure:', err);
    }
  }, 60 * 60 * 1000); // 1 Hour in ms

  // 2. Audit low stock items every 6 hours
  setInterval(async () => {
    try {
      await checkLowStockItems();
    } catch (err) {
      logger.error('Inventory stock audit background worker sweep failure:', err);
    }
  }, 6 * 60 * 60 * 1000); // 6 Hours in ms

  // 3. Dispatch patient reminders daily at 7 AM
  let lastReminderDateStr = '';
  setInterval(async () => {
    try {
      const now = new Date();
      // Checks local clinic hours
      if (now.getHours() === 7) {
        const currentDateStr = now.toDateString();
        if (lastReminderDateStr !== currentDateStr) {
          lastReminderDateStr = currentDateStr;
          await sendAppointmentReminders();
        }
      }
    } catch (err) {
      logger.error('Daily email reminders background worker sweep failure:', err);
    }
  }, 10 * 60 * 1000); // Sweeps state every 10 minutes

  // Proactively run initial sweeps on boot for testing validation
  setTimeout(() => {
    checkMissedSessions().catch(() => {});
    checkLowStockItems().catch(() => {});
  }, 5000);
});
