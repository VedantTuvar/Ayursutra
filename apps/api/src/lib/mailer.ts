import * as nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: env.SMTP_PORT || 587,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: env.SMTP_USER && env.SMTP_PASS ? {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  } : undefined
});

/**
 * Send an email using standard SMTP configurations
 */
export async function sendMail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  // If credentials are not supplied, skip and log to output console
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.info(`[Email Draft - SMTP Credentials Missing]:\nTo: ${to}\nSubject: ${subject}\nContent: ${text}`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    });
    logger.info(`Email successfully dispatched: MessageID: ${info.messageId}`);
    return true;
  } catch (err) {
    logger.error('Nodemailer SMTP Transporter Dispatch Failure:', err);
    return false;
  }
}
export const mailer = { sendMail };
