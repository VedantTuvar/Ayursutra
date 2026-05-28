import { sendAppointmentReminders, checkMissedSessions } from '../workers/notification.worker';

export const notificationJobs = {
  sendAppointmentReminders,
  checkMissedSessions
};
export default notificationJobs;
