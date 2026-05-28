import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { AlertTriangle, Plus, PlusCircle, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Stock In Modal States
  const [stockInItem, setStockInItem] = useState<{ id: string; name: string; unit: string } | null>(null);
  const [stockInQty, setStockInQty] = useState<number | ''>('');
  const [stockInNotes, setStockInNotes] = useState('');

  // 1. Fetch inventory items
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', 'list', searchQuery, categoryFilter],
    queryFn: async () => {
      const res = await api.get('/inventory', {
        params: {
          q: searchQuery,
          category: categoryFilter || undefined
        }
      });
      return res.data.data;
    }
  });

  // 2. Replenish stock mutation
  const stockInMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.post(`/inventory/${id}/stock-in`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Stock replenished successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setStockInItem(null);
      setStockInQty('');
      setStockInNotes('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not replenish stock';
      toast.error(msg);
    }
  });

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInItem || !stockInQty || Number(stockInQty) <= 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    stockInMutation.mutate({
      id: stockInItem.id,
      payload: {
        quantity: Number(stockInQty),
        notes: stockInNotes || 'Stock Replenishment'
      }
    });
  };

  // Calculate items below threshold
  const lowStockCount = inventory?.filter((i: any) => Number(i.currentStock) < Number(i.minimumThreshold)).length || 0;

  const columns = [
    {
      header: 'Item Name',
      accessor: (item: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{item.name}</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.category}</span>
        </div>
      )
    },
    {
      header: 'Current Stock',
      accessor: (item: any) => {
        const isLow = Number(item.currentStock) < Number(item.minimumThreshold);
        return (
          <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
            {Number(item.currentStock)} {item.unit}
          </span>
        );
      }
    },
    {
      header: 'Safety Margin',
      accessor: (item: any) => (
        <span className="text-slate-500 font-medium">
          {Number(item.minimumThreshold)} {item.unit}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => {
        const isLow = Number(item.currentStock) < Number(item.minimumThreshold);
        return <StatusBadge status={isLow ? 'LOW' : 'OK'} />;
      }
    },
    {
      header: 'Roster Actions',
      accessor: (item: any) => (
        <button
          onClick={() => setStockInItem({ id: item.id, name: item.name, unit: item.unit })}
          className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Replenish Stock</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Clinical Pharmacy Inventory"
        description="Monitor oil and ghee volumes, record stock entries, and verify safety margins."
      />

      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-amber-800 shadow-sm animate-pulse">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-800 leading-tight">Low Stock Alert Warnings!</h4>
            <p className="text-amber-700 font-medium mt-1">
              There are currently <strong className="text-rose-600">{lowStockCount} items</strong> in your clinical inventory whose stock levels have dropped below their designated minimum safety margins. Please replenish immediately to avoid session cancellations.
            </p>
          </div>
        </div>
      )}

      {/* Filtering selectors bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-wrap">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full max-w-xs px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium shadow-sm"
        >
          <option value="">-- All Categories --</option>
          <option value="OIL">Medicated Oils</option>
          <option value="GHEE">Medicated Ghees</option>
          <option value="HERB">Herbal Powders</option>
          <option value="MEDICINE">Tablets & Syrups</option>
          <option value="CONSUMABLE">Clinic Supplies</option>
        </select>
      </div>

      {/* Inventory table */}
      <DataTable
        columns={columns}
        data={inventory || []}
        searchPlaceholder="Search inventory by item name or supplier..."
        onSearch={(q) => setSearchQuery(q)}
        isLoading={isLoading}
      />

      {/* Stock In Replenish Modal Overlay */}
      {stockInItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setStockInItem(null)} />
          
          <div className="relative w-full max-w-md bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800">Replenish Stock (Stock In)</h3>
              <button
                onClick={() => setStockInItem(null)}
                className="p-1 rounded text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Item Name</span>
                <p className="font-bold text-slate-800 mt-0.5">{stockInItem.name}</p>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Quantity ({stockInItem.unit})</label>
                <div className="relative">
                  <input
                    type="number"
                    value={stockInQty}
                    onChange={(e) => setStockInQty(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold uppercase">
                    {stockInItem.unit}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Entry Logs / Notes</label>
                <input
                  type="text"
                  value={stockInNotes}
                  onChange={(e) => setStockInNotes(e.target.value)}
                  placeholder="e.g. Kottakkal batch #748 check-in"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white placeholder-slate-300 font-medium"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setStockInItem(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-250 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockInMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {stockInMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Add Stock</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default InventoryPage;
