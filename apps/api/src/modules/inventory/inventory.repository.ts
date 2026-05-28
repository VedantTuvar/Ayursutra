import { prisma } from '../../config/database';
import { CreateInventoryItemInput, UpdateInventoryItemInput } from './inventory.schema';
import { TransactionType, InventoryCategory } from '@prisma/client';

export class InventoryRepository {
  /**
   * Search and filter inventory items
   */
  public async findMany(
    clinicId: string,
    filters: {
      search?: string;
      category?: InventoryCategory;
      lowStockOnly?: boolean;
    }
  ) {
    const where: any = { clinicId, isActive: true };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { supplier: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    if (filters.lowStockOnly) {
      return items.filter((i) => Number(i.currentStock) < Number(i.minimumThreshold));
    }

    return items;
  }

  /**
   * Get specific item details with history
   */
  public async findById(clinicId: string, id: string) {
    return prisma.inventoryItem.findFirst({
      where: { id, clinicId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            recordedBy: { select: { id: true, name: true } },
            session: {
              include: {
                patient: { include: { user: { select: { name: true } } } }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Create standard inventory item
   */
  public async create(clinicId: string, input: CreateInventoryItemInput) {
    return prisma.inventoryItem.create({
      data: {
        clinicId,
        name: input.name,
        nameHindi: input.nameHindi,
        category: input.category,
        unit: input.unit,
        currentStock: input.currentStock,
        minimumThreshold: input.minimumThreshold,
        unitCost: input.unitCost,
        supplier: input.supplier,
        batchNumber: input.batchNumber,
        expiryDate: input.expiryDate,
        isActive: true
      }
    });
  }

  /**
   * Update item properties
   */
  public async update(clinicId: string, id: string, input: UpdateInventoryItemInput) {
    return prisma.inventoryItem.update({
      where: { id },
      data: {
        name: input.name,
        nameHindi: input.nameHindi,
        category: input.category,
        unit: input.unit,
        currentStock: input.currentStock,
        minimumThreshold: input.minimumThreshold,
        unitCost: input.unitCost,
        supplier: input.supplier,
        batchNumber: input.batchNumber,
        expiryDate: input.expiryDate,
        isActive: input.isActive
      }
    });
  }

  /**
   * Record transactional changes and adjust stock atomically
   */
  public async recordTransaction(
    clinicId: string,
    itemId: string,
    type: TransactionType,
    quantity: number,
    recordedById: string,
    sessionId?: string,
    notes?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: { id: itemId, clinicId }
      });
      if (!item) {
        throw new Error('Inventory stock item was not found');
      }

      // Determine stock adjustments based on transaction type
      const isIncrement = type === TransactionType.STOCK_IN || type === TransactionType.RETURNED;
      const adjustment = isIncrement ? quantity : -quantity;

      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStock: { increment: adjustment }
        }
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          itemId,
          type,
          quantity,
          sessionId,
          recordedById,
          notes
        },
        include: {
          recordedBy: { select: { name: true } }
        }
      });

      return { item: updatedItem, transaction };
    });
  }
}

export const inventoryRepository = new InventoryRepository();
