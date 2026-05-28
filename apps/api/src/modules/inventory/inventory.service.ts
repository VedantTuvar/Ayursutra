import { inventoryRepository } from './inventory.repository';
import { CreateInventoryItemInput, UpdateInventoryItemInput, StockInInput, ConsumeInput } from './inventory.schema';
import { NotFoundError } from '../../lib/errors';
import { TransactionType, InventoryCategory } from '@prisma/client';
import { emitToClinic } from '../../sockets/scheduling.socket';

export class InventoryService {
  /**
   * Filter and list inventory stock items
   */
  public async listInventoryItems(
    clinicId: string,
    filters: { search?: string; category?: InventoryCategory; lowStockOnly?: boolean }
  ) {
    return inventoryRepository.findMany(clinicId, filters);
  }

  /**
   * Fetch specific inventory item file
   */
  public async getInventoryItemById(clinicId: string, id: string) {
    const item = await inventoryRepository.findById(clinicId, id);
    if (!item) {
      throw new NotFoundError('Inventory stock item was not found');
    }
    return item;
  }

  /**
   * Register a new inventory stock item
   */
  public async createInventoryItem(clinicId: string, input: CreateInventoryItemInput) {
    return inventoryRepository.create(clinicId, input);
  }

  /**
   * Update details of an inventory item
   */
  public async updateInventoryItem(clinicId: string, id: string, input: UpdateInventoryItemInput) {
    const item = await inventoryRepository.findById(clinicId, id);
    if (!item) {
      throw new NotFoundError('Inventory stock item was not found');
    }

    return inventoryRepository.update(clinicId, id, input);
  }

  /**
   * Replenish item stock quantities (STOCK_IN)
   */
  public async stockIn(clinicId: string, id: string, recordedById: string, input: StockInInput) {
    const result = await inventoryRepository.recordTransaction(
      clinicId,
      id,
      TransactionType.STOCK_IN,
      input.quantity,
      recordedById,
      undefined,
      input.notes || 'Manual Stock Replenishment'
    );

    return result;
  }

  /**
   * Deduct item stock quantities (CONSUMED)
   */
  public async consume(clinicId: string, id: string, recordedById: string, input: ConsumeInput) {
    const result = await inventoryRepository.recordTransaction(
      clinicId,
      id,
      TransactionType.CONSUMED,
      input.quantity,
      recordedById,
      input.sessionId,
      input.notes || 'Manual stock deduction'
    );

    // If stock falls below safety levels, broadcast alerts immediately
    if (Number(result.item.currentStock) < Number(result.item.minimumThreshold)) {
      emitToClinic(clinicId, 'inventory:low', { item: result.item });
    }

    return result;
  }

  /**
   * Query low stock items below thresholds
   */
  public async getLowStockItems(clinicId: string) {
    return inventoryRepository.findMany(clinicId, { lowStockOnly: true });
  }

  /**
   * Query historical logs for specific item
   */
  public async getTransactionHistory(clinicId: string, id: string) {
    const item = await this.getInventoryItemById(clinicId, id);
    return item.transactions;
  }
}

export const inventoryService = new InventoryService();
