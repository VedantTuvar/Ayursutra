import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  // Map clinical enums to visual class names
  const getBadgeClasses = (s: string) => {
    const statusUpper = s.toUpperCase();
    
    switch (statusUpper) {
      // Green badges: Active, Scheduled, Paid, Stock Replenished
      case 'ACTIVE':
      case 'SCHEDULED':
      case 'PAID':
      case 'STOCK_IN':
      case 'OK':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';

      // Orange/Yellow badges: Draft, In Progress, Partially Paid, Adjusted
      case 'DRAFT':
      case 'IN_PROGRESS':
      case 'PARTIALLY_PAID':
      case 'ADJUSTED':
      case 'LOW':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';

      // Red badges: Cancelled, Missed Session, Out of Stock, Expired
      case 'CANCELLED':
      case 'NO_SHOW':
      case 'EXPIRED':
      case 'CONSUMED':
      case 'OUT':
      case 'RETURNED':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';

      // Blue/Indigo badges: Issued invoice, completed plan
      case 'COMPLETED':
      case 'ISSUED':
      case 'RESCHEDULED':
        return 'bg-sky-50 text-sky-700 border-sky-200/80';

      default:
        return 'bg-slate-50 text-slate-600 border-slate-200/80';
    }
  };

  const cleanLabel = (s: string) => {
    return s.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeClasses(
        status
      )}`}
    >
      {cleanLabel(status)}
    </span>
  );
}
export default StatusBadge;
