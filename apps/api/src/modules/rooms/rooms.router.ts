import { Router } from 'express';
import { roomsController } from './rooms.controller';
import { authenticate } from '../../middleware/authenticate';
import { tenantScope } from '../../middleware/tenantScope';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createRoomSchema, updateRoomSchema } from './rooms.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.get(
  '/',
  authenticate,
  tenantScope,
  roomsController.listRooms
);

router.get(
  '/available',
  authenticate,
  tenantScope,
  roomsController.getAvailableRooms
);

router.post(
  '/',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN]),
  tenantScope,
  validate({ body: createRoomSchema }),
  roomsController.createRoom
);

router.put(
  '/:id',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN]),
  tenantScope,
  validate({ body: updateRoomSchema }),
  roomsController.updateRoom
);

export const roomsRouter = router;
