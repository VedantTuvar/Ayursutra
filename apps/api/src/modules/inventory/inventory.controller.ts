import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';
import { InventoryCategory } from '@prisma/client';

export class InventoryController {
  public async listInventoryItems(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const search = req.query.q ? String(req.query.q) : undefined;
      const category = req.query.category ? String(req.query.category) as InventoryCategory : undefined;
      const lowStockOnly = req.query.lowStockOnly === 'true';

      const data = await inventoryService.listInventoryItems(clinicId, {
        search,
        category,
        lowStockOnly
      });

      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getInventoryItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;
      const data = await inventoryService.getInventoryItemById(clinicId, id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async createInventoryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await inventoryService.createInventoryItem(clinicId, req.body);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async updateInventoryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;
      const data = await inventoryService.updateInventoryItem(clinicId, id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async stockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const recordedById = req.user!.userId;
      const { id } = req.params;
      
      const data = await inventoryService.stockIn(clinicId, id, recordedById, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async consume(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const recordedById = req.user!.userId;
      const { id } = req.params;

      const data = await inventoryService.consume(clinicId, id, recordedById, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getLowStockItems(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await inventoryService.getLowStockItems(clinicId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getTransactionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;
      const data = await inventoryService.getTransactionHistory(clinicId, id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
