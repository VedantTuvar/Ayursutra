import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { authRouter } from './modules/auth/auth.router';
import { usersRouter } from './modules/users/users.router';
import { patientsRouter } from './modules/patients/patients.router';
import { plansRouter } from './modules/treatment-plans/plans.router';
import { schedulingRouter } from './modules/scheduling/scheduling.router';
import { sessionsRouter } from './modules/sessions/sessions.router';
import { therapistsRouter } from './modules/therapists/therapists.router';
import { therapyTypesRouter } from './modules/therapy-types/therapy-types.router';
import { roomsRouter } from './modules/rooms/rooms.router';
import { inventoryRouter } from './modules/inventory/inventory.router';
import { billingRouter } from './modules/billing/billing.router';
import { analyticsRouter } from './modules/analytics/analytics.router';

import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/authenticate';
import { tenantScope } from './middleware/tenantScope';
import { authorize } from './middleware/authorize';
import { validate } from './middleware/validate';
import { recordPaymentSchema } from './modules/billing/billing.schema';
import { billingController } from './modules/billing/billing.controller';
import { UserRole } from '@prisma/client';

const app = express();

// Standard express body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Self-contained cookie parser middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const cookieHeader = req.headers.cookie;
  const cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts[0]?.trim();
      const val = parts.slice(1).join('=')?.trim();
      if (name) {
        cookies[name] = decodeURIComponent(val);
      }
    });
  }
  (req as any).cookies = cookies;
  next();
});

// Security headers and CORS configuration
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'http://localhost:5173' // Replace in production
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Apply global rate limiting to all standard API routes
app.use('/api/', apiRateLimiter);

// 1. Interactive Swagger UI Docs Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AyurSutra API Documentation 🌿',
      version: '1.0.0',
      description: 'Panchakarma Patient Management & Therapy Scheduling SaaS API Suite'
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/modules/**/*.ts', './dist/modules/**/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 2. Route mappings
app.get('/api/health', (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/patients', patientsRouter);

// Nested routes for treatment plans under patients
app.use('/api/v1/patients/:patientId/plans', plansRouter);

// Scheduling calendar & sessions bookings
app.use('/api/v1', schedulingRouter); // Maps /schedule and /sessions (POST, PUT, DELETE)
app.use('/api/v1/sessions', sessionsRouter); // Maps therapist session operations (/my, /:id/start, /:id/complete)

app.use('/api/v1/therapists', therapistsRouter);
app.use('/api/v1/therapy-types', therapyTypesRouter);
app.use('/api/v1/rooms', roomsRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/invoices', billingRouter);
app.use('/api/v1/analytics', analyticsRouter);

// Explicit root mount for recording payments
app.post(
  '/api/v1/payments',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST]),
  tenantScope,
  validate({ body: recordPaymentSchema }),
  billingController.recordPayment
);

// 3. Global central error handler
app.use(errorHandler);

export default app;
export { app };
