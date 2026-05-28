import { checkLowStockItems } from '../workers/inventory.worker';

export const inventoryCheckJobs = {
  checkLowStockItems
};
export default inventoryCheckJobs;
