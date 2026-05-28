import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/authenticate';
import { tenantScope } from '../../middleware/tenantScope';
import { validate } from '../../middleware/validate';
import { createInventoryItemSchema, updateInventoryItemSchema, stockInSchema, consumeSchema } from './inventory.schema';

const router = Router();

router.get(
  '/',
  authenticate,
  tenantScope,
  inventoryController.listInventoryItems
);

router.get(
  '/low-stock',
  authenticate,
  tenantScope,
  inventoryController.getLowStockItems
);

router.post(
  '/',
  authenticate,
  tenantScope,
  validate({ body: createInventoryItemSchema }),
  inventoryController.createInventoryItem
);

router.get(
  '/:id',
  authenticate,
  tenantScope,
  inventoryController.getInventoryItemById
);

router.put(
  '/:id',
  authenticate,
  tenantScope,
  validate({ body: updateInventoryItemSchema }),
  inventoryController.updateInventoryItem
);

router.post(
  '/:id/stock-in',
  authenticate,
  tenantScope,
  validate({ body: stockInSchema }),
  inventoryController.stockIn
);

router.post(
  '/:id/consume',
  authenticate,
  tenantScope,
  validate({ body: consumeSchema }),
  inventoryController.consume
);

router.get(
  '/:id/history',
  authenticate,
  tenantScope,
  inventoryController.getTransactionHistory
);

export const inventoryRouter = router;
