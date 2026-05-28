import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  onSearch,
  isLoading = false
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">
      {/* Search Input bar */}
      {onSearch && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/20">
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="w-full max-w-xs px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white placeholder-slate-400 font-medium"
          />
        </div>
      )}

      {/* Responsive table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4.5 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                  <LoadingSpinner size="md" />
                  <span className="text-sm font-medium text-slate-400">Loading data records...</span>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                  No matches or clinical records found.
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50/20 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                      {col.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default DataTable;
