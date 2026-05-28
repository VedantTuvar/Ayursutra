import { prisma } from '../config/database';
import { logger } from '../lib/logger';
import { emitToClinic } from '../sockets/scheduling.socket';

/**
 * Periodically scans for items where currentStock falls below the minimum safety threshold
 */
export async function checkLowStockItems(): Promise<void> {
  logger.info('Executing periodic clinical inventory stock audits...');

  try {
    const items = await prisma.inventoryItem.findMany({
      where: {
        isActive: true
      }
    });

    // Filter in-memory due to Decimal type conversion requirements in complex comparisons
    const lowStockItems = items.filter((item) => Number(item.currentStock) < Number(item.minimumThreshold));

    logger.info(`Found ${lowStockItems.length} items currently below minimum safety thresholds.`);

    for (const item of lowStockItems) {
      // Broadcast to clinic workspace display panels
      emitToClinic(item.clinicId, 'inventory:low', { item });
      
      logger.warn(`[STOCK ALERT]: Item '${item.name}' (ID: ${item.id}) is below safety threshold! Current: ${item.currentStock}${item.unit}, Min Required: ${item.minimumThreshold}${item.unit}`);
    }
  } catch (err) {
    logger.error('Inventory stock audit sweep failed:', err);
  }
}
