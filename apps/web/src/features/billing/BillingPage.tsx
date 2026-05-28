import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { formatCurrency, formatDate } from '../../shared/utils/formatters';
import {
  IndianRupee,
  PlusCircle,
  Download,
  CreditCard,
  X,
  Plus,
  FileText,
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export function BillingPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals / Overlays
  const [generateOpen, setGenerateOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  
  // Forms states
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [invoiceStartDate, setInvoiceStartDate] = useState('');
  const [invoiceEndDate, setInvoiceEndDate] = useState('');
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);

  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // 1. Fetch Invoices list
  const { data: invoicesRes, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', 'list', searchQuery, statusFilter],
    queryFn: async () => {
      const res = await api.get('/invoices', {
        params: {
          status: statusFilter || undefined
        }
      });
      return res.data.data;
    }
  });

  // 2. Fetch Patients for Generator
  const { data: patientsRes } = useQuery({
    queryKey: ['patients', 'simple-list'],
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data.data || [];
    },
    enabled: generateOpen
  });

  // Mutations
  const generateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/invoices/generate', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('GST Invoice generated successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setGenerateOpen(false);
      // Reset form
      setSelectedPatientId('');
      setInvoiceStartDate('');
      setInvoiceEndDate('');
      setInvoiceDiscount(0);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not generate invoice';
      toast.error(msg);
    }
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.post(`/invoices/${id}/payments`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setPaymentOpen(false);
      // Reset form
      setPaymentAmount('');
      setPaymentMethod('CASH');
      setPaymentRef('');
      setPaymentNotes('');
      if (selectedInvoice) {
        // Refresh detail view
        api.get(`/invoices/${selectedInvoice.id}`).then((res) => {
          setSelectedInvoice(res.data.data);
        });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not record payment';
      toast.error(msg);
    }
  });

  const issueMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/invoices/${id}/issue`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Invoice finalized and issued successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (selectedInvoice) {
        api.get(`/invoices/${selectedInvoice.id}`).then((res) => {
          setSelectedInvoice(res.data.data);
        });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Could not issue invoice';
      toast.error(msg);
    }
  });

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !invoiceStartDate || !invoiceEndDate) {
      toast.error('Please specify patient, start date, and end date');
      return;
    }
    generateMutation.mutate({
      patientId: selectedPatientId,
      startDate: invoiceStartDate,
      endDate: invoiceEndDate,
      discountAmount: Number(invoiceDiscount)
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid positive payment amount');
      return;
    }
    recordPaymentMutation.mutate({
      id: selectedInvoice.id,
      payload: {
        amount: Number(paymentAmount),
        method: paymentMethod,
        reference: paymentRef || undefined,
        notes: paymentNotes || undefined
      }
    });
  };

  const handleDownloadPDF = (id: string, invoiceNumber: string) => {
    const token = api.defaults.headers.common['Authorization'] || `Bearer ${localStorage.getItem('ayursutra_auth_session') ? JSON.parse(localStorage.getItem('ayursutra_auth_session')!).accessToken : ''}`;
    const cleanToken = String(token).replace('Bearer ', '');
    
    // Trigger download in new window or iframe
    const downloadUrl = `${api.defaults.baseURL}/invoices/${id}/pdf?token=${cleanToken}`;
    window.open(downloadUrl, '_blank');
    toast.success(`Opening PDF invoice #${invoiceNumber}`);
  };

  const columns = [
    {
      header: 'Invoice No.',
      accessor: (item: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{item.invoiceNumber}</span>
          <span className="text-[10px] text-slate-400 font-bold">{formatDate(item.createdAt)}</span>
        </div>
      )
    },
    {
      header: 'Patient Name',
      accessor: (item: any) => (
        <span className="font-semibold text-slate-800">{item.patient?.user?.name || 'N/A'}</span>
      )
    },
    {
      header: 'Gross Total',
      accessor: (item: any) => (
        <span className="font-bold text-slate-800">{formatCurrency(item.totalAmount)}</span>
      )
    },
    {
      header: 'Taxes (18% GST)',
      accessor: (item: any) => (
        <span className="text-slate-500 font-medium">{formatCurrency(item.taxAmount)}</span>
      )
    },
    {
      header: 'Balance Due',
      accessor: (item: any) => {
        const balance = Number(item.totalAmount) - Number(item.paidAmount);
        return (
          <span className={`font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(balance)}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: (item: any) => <StatusBadge status={item.status} />
    },
    {
      header: 'Quick Actions',
      accessor: (item: any) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedInvoice(item)}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
          <button
            onClick={() => handleDownloadPDF(item.id, item.invoiceNumber)}
            className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          {item.status !== 'PAID' && item.status !== 'DRAFT' && (
            <button
              onClick={() => {
                setSelectedInvoice(item);
                setPaymentAmount(Number(item.totalAmount) - Number(item.paidAmount));
                setPaymentOpen(true);
              }}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Collect</span>
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Billing & Invoice Ledger"
        description="Verify automated therapy billing logs, review tax items, and record incoming patient payments."
      >
        <button
          onClick={() => setGenerateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Auto Invoice</span>
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full max-w-xs px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-medium shadow-sm"
        >
          <option value="">-- All Statuses --</option>
          <option value="DRAFT">Draft (Unissued)</option>
          <option value="ISSUED">Issued (Unpaid)</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid in Full</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Invoices List */}
      <DataTable
        columns={columns}
        data={invoicesRes || []}
        isLoading={invoicesLoading}
        searchPlaceholder="Search invoices..."
      />

      {/* Generate Auto Invoice Modal */}
      {generateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setGenerateOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800">Generate GST Invoice</h3>
              <button
                onClick={() => setGenerateOpen(false)}
                className="p-1 rounded text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl text-xs text-indigo-800 leading-relaxed font-medium">
                Generating an invoice automatically sweeps all completed or logged therapy sessions within the designated dates that have not yet been billed.
              </div>

              {/* Patient */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patientsRes?.map((pat: any) => (
                    <option key={pat.id} value={pat.id}>
                      {pat.user?.name} ({pat.user?.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-semibold block">Start Date</label>
                  <input
                    type="date"
                    value={invoiceStartDate}
                    onChange={(e) => setInvoiceStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-semibold block">End Date</label>
                  <input
                    type="date"
                    value={invoiceEndDate}
                    onChange={(e) => setInvoiceEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                    required
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Flat Discount Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">₹</span>
                  <input
                    type="number"
                    value={invoiceDiscount || ''}
                    onChange={(e) => setInvoiceDiscount(e.target.value ? Number(e.target.value) : 0)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                    min="0"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setGenerateOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-250 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {generateMutation.isPending ? 'Generating...' : 'Generate and Preview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Overlay */}
      {selectedInvoice && !paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)} />
          
          <div className="relative w-full max-w-2xl bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-slate-800">Invoice Details</h3>
                <StatusBadge status={selectedInvoice.status} />
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Header Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block">Invoice Number</span>
                  <span className="text-slate-800 font-bold text-sm">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block">Date Issued</span>
                  <span className="text-slate-800 font-bold text-sm">{formatDate(selectedInvoice.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block">Patient</span>
                  <span className="text-slate-800 font-bold text-sm">{selectedInvoice.patient?.user?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block">Outstanding Balance</span>
                  <span className="text-rose-600 font-bold text-sm">
                    {formatCurrency(Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount))}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed Line Items</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                        <th className="px-4 py-2">Therapy Type / Description</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">GST (18%)</th>
                        <th className="px-4 py-2 text-right">Net Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                      {selectedInvoice.lineItems?.map((line: any) => (
                        <tr key={line.id}>
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-slate-800">
                              {line.therapyType?.name || line.description}
                            </div>
                            {line.session && (
                              <div className="text-[10px] text-slate-400 font-bold uppercase">
                                Session date: {formatDate(line.session.scheduledStartTime)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">{formatCurrency(line.price)}</td>
                          <td className="px-4 py-2.5 text-right">{formatCurrency(line.tax)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                            {formatCurrency(Number(line.price) + Number(line.tax))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="flex flex-col items-end gap-1.5 text-xs border-t border-slate-100 pt-4 font-medium text-slate-500">
                <div className="flex justify-between w-64">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between w-64">
                  <span>GST Taxes (18%):</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                {Number(selectedInvoice.discountAmount) > 0 && (
                  <div className="flex justify-between w-64 text-emerald-600 font-bold">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedInvoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 text-sm font-bold text-slate-800 border-t border-slate-100 pt-1.5 mt-1">
                  <span>Gross Total Amount:</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between w-64 text-emerald-600 font-bold">
                  <span>Paid To Date:</span>
                  <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                </div>
              </div>

              {/* Payments History */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Receipt History</h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                          <th className="px-4 py-2">Transaction ID / Reference</th>
                          <th className="px-4 py-2">Method</th>
                          <th className="px-4 py-2 text-right">Amount Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                        {selectedInvoice.payments.map((pmt: any) => (
                          <tr key={pmt.id}>
                            <td className="px-4 py-2">
                              <div className="font-semibold text-slate-800">
                                {pmt.reference || `TXN-${pmt.id.slice(0, 8).toUpperCase()}`}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold">
                                {formatDate(pmt.createdAt)}
                              </div>
                            </td>
                            <td className="px-4 py-2">{pmt.method}</td>
                            <td className="px-4 py-2 text-right font-bold text-emerald-600">
                              {formatCurrency(pmt.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6 shrink-0">
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-brand-700 hover:bg-brand-50 border border-brand-200 rounded-xl"
                >
                  <Download className="w-4 h-4" />
                  <span>Download / Print GST Invoice</span>
                </button>

                <div className="flex gap-2">
                  {selectedInvoice.status === 'DRAFT' && (
                    <button
                      onClick={() => issueMutation.mutate(selectedInvoice.id)}
                      disabled={issueMutation.isPending}
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
                    >
                      {issueMutation.isPending ? 'Finalizing...' : 'Finalize & Issue'}
                    </button>
                  )}
                  {selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'DRAFT' && (
                    <button
                      onClick={() => {
                        setPaymentAmount(Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount));
                        setPaymentOpen(true);
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
                    >
                      Record Payment Receipt
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Receipt Modal */}
      {paymentOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setPaymentOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800">Record Payment</h3>
              <button
                onClick={() => setPaymentOpen(false)}
                className="p-1 rounded text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Invoice Target</span>
                <p className="font-bold text-slate-800">{selectedInvoice.invoiceNumber} - {selectedInvoice.patient?.user?.name}</p>
                <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                  Remaining Balance Due: {formatCurrency(Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount))}
                </span>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Amount Received (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">₹</span>
                  <input
                    type="number"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white font-bold text-slate-800"
                    placeholder="e.g. 1500"
                    required
                    min="1"
                  />
                </div>
              </div>

              {/* Method */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                  required
                >
                  <option value="CASH">Cash Payments</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer NEFT/IMPS</option>
                </select>
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Transaction Reference No. (Optional)</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UPI Ref #8493820281"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white placeholder-slate-350"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Internal Notes (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Handed over at checkout desk"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-700 bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setPaymentOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-250 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {recordPaymentMutation.isPending ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default BillingPage;
