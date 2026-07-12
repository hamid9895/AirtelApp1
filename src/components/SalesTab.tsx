import React, { useState, useEffect } from 'react';
import { DollarSign, Info, Users, AlertTriangle, Plus, ChevronLeft, Calendar, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { Sale, UserDto, CustomFieldConfig, Allocation } from '../types';
import { DataGrid, GridColumn } from './DataGrid';

interface SalesTabProps {
  sales: Sale[];
  allUsers: UserDto[];
  fscUsersList: UserDto[];
  user: UserDto;
  onDeleteSale: (id: string) => void;
  onSubmitSaleDraft: (id: string) => void;
  onSubmitSaleForm: (e: React.FormEvent, customFields?: Record<string, string | number>) => void;
  onReviewSaleSubmit: (action: 'approve' | 'reject') => void;
  saleDate: string;
  setSaleDate: (v: string) => void;
  saleFscId: string;
  setSaleFscId: (v: string) => void;
  saleOpeningBalance: number;
  setSaleOpeningBalance: (v: number) => void;
  saleClosingBalance: number;
  setSaleClosingBalance: (v: number) => void;
  saleAmount: number;
  setSaleAmount: (v: number) => void;
  salePreviousShort: number;
  setSalePreviousShort: (v: number) => void;
  saleTodayShort: number;
  setSaleTodayShort: (v: number) => void;
  saleOpeningSim: number;
  setSaleOpeningSim: (v: number) => void;
  saleSim: number;
  setSaleSim: (v: number) => void;
  saleClosingSim: number;
  setSaleClosingSim: (v: number) => void;
  saleRemarks: string;
  setSaleRemarks: (v: string) => void;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (v: string) => void;
  globalSearch: string;
  setGlobalSearch: (v: string) => void;
  filteredSales: Sale[];
  selectedSaleToReview: Sale | null;
  setSelectedSaleToReview: (v: Sale | null) => void;
  reviewNoteText: string;
  setReviewNoteText: (v: string) => void;

  // Edit Hooks
  onEditSaleClick: (sale: Sale) => void;
  editingSaleId: string | null;
  onCancelEdit: () => void;

  customFieldConfigs: CustomFieldConfig[];
  globalConfig?: { commissionPercentage: number; simAmount: number } | null;
  allocations: Allocation[];
  saleAutoRefill1: number;
  setSaleAutoRefill1: (v: number) => void;
  saleAutoRefill2: number;
  setSaleAutoRefill2: (v: number) => void;
  saleAutoRefill3: number;
  setSaleAutoRefill3: (v: number) => void;
  saleEcManual1: number;
  setSaleEcManual1: (v: number) => void;
  saleEcManual2: number;
  setSaleEcManual2: (v: number) => void;
}

export const SalesTab: React.FC<SalesTabProps> = ({
  sales,
  allUsers,
  fscUsersList,
  user,
  onDeleteSale,
  onSubmitSaleDraft,
  onSubmitSaleForm,
  onReviewSaleSubmit,
  saleDate,
  setSaleDate,
  saleFscId,
  setSaleFscId,
  saleOpeningBalance,
  setSaleOpeningBalance,
  saleClosingBalance,
  setSaleClosingBalance,
  saleAmount,
  setSaleAmount,
  salePreviousShort,
  setSalePreviousShort,
  saleTodayShort,
  setSaleTodayShort,
  saleOpeningSim,
  setSaleOpeningSim,
  saleSim,
  setSaleSim,
  saleClosingSim,
  setSaleClosingSim,
  saleRemarks,
  setSaleRemarks,
  selectedStatusFilter,
  setSelectedStatusFilter,
  globalSearch,
  setGlobalSearch,
  filteredSales,
  selectedSaleToReview,
  setSelectedSaleToReview,
  reviewNoteText,
  setReviewNoteText,
  onEditSaleClick,
  editingSaleId,
  onCancelEdit,
  customFieldConfigs,
  globalConfig,
  allocations,
  saleAutoRefill1,
  setSaleAutoRefill1,
  saleAutoRefill2,
  setSaleAutoRefill2,
  saleAutoRefill3,
  setSaleAutoRefill3,
  saleEcManual1,
  setSaleEcManual1,
  saleEcManual2,
  setSaleEcManual2
}) => {
  // --- LOCAL NAVIGATION STATE ---
  // List-first separated screen
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [localCustomFields, setLocalCustomFields] = useState<Record<string, string | number>>({});

  // Sync component view mode with editing changes
  useEffect(() => {
    if (editingSaleId) {
      setViewMode('edit');
      const matchingSale = sales.find(s => s.id === editingSaleId);
      if (matchingSale) {
        setLocalCustomFields(matchingSale.customFields || {});
      }
    } else {
      setLocalCustomFields({});
      if (viewMode === 'edit') {
        setViewMode('list');
      }
    }
  }, [editingSaleId, sales]);

  const autoRefill1 = saleAutoRefill1 || 0;
  const autoRefill2 = saleAutoRefill2 || 0;
  const autoRefill3 = saleAutoRefill3 || 0;
  const totalRefills = autoRefill1 + autoRefill2 + autoRefill3;

  const ecManual1 = saleEcManual1 || 0;
  const ecManual2 = saleEcManual2 || 0;
  const totalEc = ecManual1 + ecManual2;

  const distributedSims = saleOpeningSim || 0;

  const calculatedSaleAmount = saleOpeningBalance + totalRefills + totalEc - saleClosingBalance;
  const closingShort = salePreviousShort + saleTodayShort;
  const closingSimsCount = saleOpeningSim - saleSim;
  
  const simRate = globalConfig?.simAmount || 20;
  const calculatedSimAmount = saleSim * simRate;
  const totalSaleAmount = calculatedSaleAmount + calculatedSimAmount;

  // Dynamic carry-over of custom fields from allocation to sales form
  useEffect(() => {
    if (viewMode === 'add' && saleDate) {
      const selectedFscId = user.role === 'FSC' ? user.id : saleFscId;
      if (selectedFscId) {
        const matchingAlloc = allocations.find(a => a.date === saleDate && a.fscId === selectedFscId);
        if (matchingAlloc && matchingAlloc.customFields) {
          setLocalCustomFields(matchingAlloc.customFields);
        } else {
          setLocalCustomFields({});
        }
      }
    }
  }, [saleDate, saleFscId, viewMode, allocations, user]);

  // --- SEPARATED HELPER FUNCTIONS & MATH EXPLANATIONS ---

  /**
   * Triggers the pre-fill editing session and navigates to the Manage View.
   */
  const handleEditTrigger = (sale: Sale) => {
    onEditSaleClick(sale);
    setViewMode('edit');
  };

  /**
   * Safely returns back to lists after clearing temporary editing variables.
   */
  const handleReturnToList = () => {
    onCancelEdit();
    setViewMode('list');
  };

  /**
   * Handles form submit and immediately updates view to list-mode on complete.
   */
  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitSaleForm(e, localCustomFields);
    setViewMode('list');
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setLocalCustomFields(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  /**
   * Calculates estimated net airtime credit sales value based on refills and balances.
   * Net Airtime Sales = (Opening Balance + All Auto-Refills + All Manual EasyCharges) - Closing Balance.
   */
  const calculateEstimatedSalesTotal = () => {
    // These values are matched in the parent App or state dynamically
    return saleOpeningBalance - saleClosingBalance; // simplified base view representation
  };

  // --- DATA GRID COLUMN SCHEMA ---
  const saleColumns: GridColumn<Sale>[] = [
    { 
      key: 'fscName', 
      label: 'FSC Coordinator', 
      type: 'string', 
      sortable: true,
      render: (r) => {
        const name = allUsers.find(u => u.id === r.fscId)?.name || r.fscName || 'FSC Agent';
        return (
          <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {name}
          </span>
        );
      }
    },
    { 
      key: 'date', 
      label: 'Audit Date', 
      type: 'date', 
      sortable: true,
      render: (r) => (
        <span className="font-semibold text-slate-500 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {r.date}
        </span>
      )
    },
    {
      key: 'openingBalance',
      label: 'Opening Balance',
      type: 'currency',
      sortable: true,
      render: (r) => <span className="text-slate-600 font-semibold">₹{(r.openingBalance || 0).toLocaleString('en-IN')}</span>
    },
    {
      key: 'refillsAndClaims',
      label: 'Allocated Refills',
      type: 'currency',
      sortable: true,
      render: (r) => {
        const totalRefills = (r.autoRefill1 || 0) + (r.autoRefill2 || 0) + (r.autoRefill3 || 0);
        return (
          <div className="text-[11px] leading-tight min-w-[120px]">
            <span className="font-semibold text-slate-700">₹{totalRefills.toLocaleString('en-IN')}</span>
            <p className="text-[9px] text-slate-400 mt-0.5">
              R1: ₹{(r.autoRefill1 || 0).toLocaleString('en-IN')} | R2: ₹{(r.autoRefill2 || 0).toLocaleString('en-IN')} | R3: ₹{(r.autoRefill3 || 0).toLocaleString('en-IN')}
            </p>
          </div>
        );
      }
    },
    {
      key: 'manualEc',
      label: 'Manual EasyCharge',
      type: 'currency',
      sortable: true,
      render: (r) => {
        const totalEc = (r.ecManual1 || 0) + (r.ecManual2 || 0);
        return (
          <div className="text-[11px] leading-tight min-w-[100px]">
            <span className="font-semibold text-slate-700">₹{totalEc.toLocaleString('en-IN')}</span>
            <p className="text-[9px] text-slate-400 mt-0.5">
              EC1: ₹{(r.ecManual1 || 0).toLocaleString('en-IN')} | EC2: ₹{(r.ecManual2 || 0).toLocaleString('en-IN')}
            </p>
          </div>
        );
      }
    },
    {
      key: 'closingBalance',
      label: 'Closing Balance',
      type: 'currency',
      sortable: true,
      render: (r) => <span className="text-slate-600 font-semibold">₹{(r.closingBalance || 0).toLocaleString('en-IN')}</span>
    },
    {
      key: 'previousShort',
      label: 'Prev Shortages',
      type: 'currency',
      sortable: true,
      render: (r) => <span className="text-slate-600 font-semibold">₹{(r.previousShort || 0).toLocaleString('en-IN')}</span>
    },
    {
      key: 'simDetails',
      label: 'SIMs (Op / Sold / Cl)',
      type: 'number',
      sortable: true,
      render: (r) => (
        <div className="text-[11px] leading-tight min-w-[110px]">
          <span className="font-semibold text-slate-800">Sold: {r.sim || 0} SIMs</span>
          <p className="text-[9px] text-slate-400 mt-0.5">
            Op: {r.openingSim || 0} | Cl: {r.closingSim || 0}
          </p>
        </div>
      )
    },
    {
      key: 'remarks',
      label: 'Remarks / Notes',
      type: 'string',
      sortable: false,
      render: (r) => <span className="text-slate-500 font-normal italic max-w-[150px] truncate block" title={r.remarks || ''}>{r.remarks || '-'}</span>
    },
    { 
      key: 'saleTotal', 
      label: 'Credit Sales Collected', 
      type: 'currency', 
      sortable: true, 
      render: (r) => (
        <div>
          <span className="font-extrabold text-slate-950">₹{r.saleTotal.toLocaleString('en-IN')}</span>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Remitted: ₹{r.saleAmount.toLocaleString('en-IN')}</p>
        </div>
      )
    },
    { 
      key: 'shortAmount', 
      label: 'Field Shortages', 
      type: 'currency', 
      sortable: true, 
      render: (r) => (
        <div>
          {r.shortAmount > 0 ? (
            <span className="text-rose-600 font-extrabold flex items-center gap-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              ₹{r.shortAmount.toLocaleString('en-IN')}
            </span>
          ) : (
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              Ok
            </span>
          )}
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Workflow Status', 
      type: 'string', 
      sortable: true, 
      render: (r) => (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
          r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
          r.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
          r.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
          'bg-slate-50 text-slate-600 border-slate-200'
        }`}>
          {r.status}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Audit Workflow',
      sortable: false,
      render: (r) => {
        const canReview = r.status === 'Pending' && ['Admin', 'Manager', 'Approver'].includes(user.role);
        const canSubmit = r.status === 'Draft' && (user.role === 'FSC' || user.role === 'Admin');

        return (
          <div className="flex gap-1.5 justify-end">
            {canSubmit && (
              <button
                onClick={() => onSubmitSaleDraft(r.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                title="Submit sheet to managers for ledger approval"
              >
                Submit Draft
              </button>
            )}

            {canReview && (
              <button
                onClick={() => {
                  setSelectedSaleToReview(r);
                  setReviewNoteText(r.remarks || '');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
              >
                Review Sheet
              </button>
            )}
            
            {r.status !== 'Approved' && (
              <button
                onClick={() => onDeleteSale(r.id)}
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-all cursor-pointer"
                title="Delete Sheet"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  const activeFscConfigs = customFieldConfigs.filter(c => c.target === 'fsc');
  const dynamicColumns = activeFscConfigs.map(c => ({
    key: `cf_${c.id}` as any,
    label: `${c.name} (Custom)`,
    type: 'string' as any,
    sortable: false,
    render: (r: any) => {
      const val = r.customFields?.[c.id];
      if (val === undefined || val === null || val === '') return <span className="text-slate-300">-</span>;
      return <span className="text-slate-700 font-semibold text-xs">{val}</span>;
    }
  }));

  const remarksIndex = saleColumns.findIndex(col => col.key === 'remarks');
  const finalColumns = [...saleColumns];
  if (remarksIndex !== -1) {
    finalColumns.splice(remarksIndex, 0, ...dynamicColumns);
  } else {
    finalColumns.push(...dynamicColumns);
  }

  const renderFullSaleBreakdown = (sale: Sale) => {
    const totalRefills = (sale.autoRefill1 || 0) + (sale.autoRefill2 || 0) + (sale.autoRefill3 || 0);
    const totalEc = (sale.ecManual1 || 0) + (sale.ecManual2 || 0);
    
    const calculatedSaleAmount = (sale.openingBalance || 0) + totalRefills + totalEc - (sale.closingBalance || 0);
    const closingSimsCount = (sale.openingSim || 0) - (sale.sim || 0);
    
    const simRate = globalConfig?.simAmount || 20;
    const calculatedSimAmount = (sale.sim || 0) * simRate;
    const totalSaleAmount = calculatedSaleAmount + calculatedSimAmount;
    
    const closingShort = (sale.previousShort || 0) + (sale.todayShort || 0);

    return (
      <div className="space-y-4 text-xs select-text">
        {/* Section 1: FSC Allocation & Distribution */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 space-y-3.5 text-left">
          <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <p className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest">
              1. FSC Allocation & Distribution (Vault Data)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-2.5 rounded-xl border border-slate-150 shadow-xs">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Opening Balance</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 block">₹{(sale.openingBalance || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-150 shadow-xs">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Distributed SIMs</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 block">{(sale.openingSim || 0)} Units</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-wider block">Auto-Refill Credit Batches</span>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white p-2 rounded-lg border border-slate-150 text-center">
                <span className="text-[7.5px] font-bold text-slate-400 block">Batch 1</span>
                <span className="text-[11px] font-extrabold text-slate-700 mt-0.5 block">₹{(sale.autoRefill1 || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-150 text-center">
                <span className="text-[7.5px] font-bold text-slate-400 block">Batch 2</span>
                <span className="text-[11px] font-extrabold text-slate-700 mt-0.5 block">₹{(sale.autoRefill2 || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-150 text-center">
                <span className="text-[7.5px] font-bold text-slate-400 block">Batch 3</span>
                <span className="text-[11px] font-extrabold text-slate-700 mt-0.5 block">₹{(sale.autoRefill3 || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 text-center">
                <span className="text-[7.5px] font-black text-indigo-500 block">Total Refills</span>
                <span className="text-[11px] font-black text-indigo-700 mt-0.5 block">₹{totalRefills.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">EasyCharge Top-ups</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded-lg border border-slate-150 text-center">
                <span className="text-[7.5px] font-bold text-slate-400 block">EasyCharge 1</span>
                <span className="text-[11px] font-extrabold text-slate-700 mt-0.5 block">₹{(sale.ecManual1 || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-150 text-center">
                <span className="text-[7.5px] font-bold text-slate-400 block">EasyCharge 2</span>
                <span className="text-[11px] font-extrabold text-slate-700 mt-0.5 block">₹{(sale.ecManual2 || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 text-center">
                <span className="text-[7.5px] font-black text-emerald-600 block">Total EasyCharge</span>
                <span className="text-[11px] font-black text-emerald-700 mt-0.5 block">₹{totalEc.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Daily Sales Entry */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-left">
          <div className="flex items-center gap-1.5 border-b border-slate-150 pb-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <p className="text-[9.5px] font-black text-slate-700 uppercase tracking-widest">
              2. Daily Sales Entry Details
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 block uppercase">Closing Balance (Remaining)</span>
              <span className="text-xs font-bold text-slate-700 mt-0.5 block">₹{(sale.closingBalance || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 block uppercase">Calculated Airtime Sales</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 block">
                ₹{calculatedSaleAmount.toLocaleString('en-IN')}
                <span className="text-[9px] text-slate-400 font-normal block mt-0.5">Net of Comm: ₹{(sale.saleTotal || 0).toLocaleString('en-IN')}</span>
              </span>
            </div>

            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 block uppercase">SIMs Sold Count</span>
              <span className="text-xs font-bold text-slate-700 mt-0.5 block">{(sale.sim || 0)} SIMs</span>
            </div>
            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 block uppercase">Closing SIMs Count</span>
              <span className="text-xs font-bold text-slate-700 mt-0.5 block">{closingSimsCount} Units</span>
            </div>

            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 block uppercase">SIM Sales Amount</span>
              <span className="text-xs font-bold text-slate-700 mt-0.5 block">₹{calculatedSimAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-[8px] font-black text-emerald-700 block uppercase tracking-wider">Total Sales (Airtime + SIM)</span>
              <span className="text-xs font-black text-emerald-700 mt-0.5 block">₹{totalSaleAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Shortage Auditing & Ledger */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 space-y-3 text-left">
          <div className="flex items-center gap-1.5 border-b border-[#EE1D23]/10 pb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest">
              3. Shortage Auditing & Ledger
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-150 text-center">
              <span className="text-[8px] font-black text-slate-400 block uppercase">Last Day Short</span>
              <span className="text-xs font-bold text-slate-700 mt-0.5 block">₹{(sale.previousShort || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-150 text-center">
              <span className="text-[8px] font-black text-slate-400 block uppercase">Today's Short / Extra</span>
              <span className={`text-xs font-bold mt-0.5 block ${(sale.todayShort || 0) < 0 ? 'text-rose-600' : (sale.todayShort || 0) > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                ₹{(sale.todayShort || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className={`p-2.5 rounded-xl border text-center ${closingShort < 0 ? 'bg-rose-50 border-rose-100 text-rose-700' : closingShort > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-white border-slate-150 text-slate-700'}`}>
              <span className="text-[8px] font-black block uppercase">Closing Short Balance</span>
              <span className="text-xs font-black mt-0.5 block">₹{closingShort.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Dynamic Custom Fields */}
        {activeFscConfigs.length > 0 && (
          <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-150 text-left">
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Info className="w-3.5 h-3.5 text-[#EE1D23]" />
              <p className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest">
                4. Custom Information Fields
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {activeFscConfigs.map(c => {
                const val = sale.customFields?.[c.id];
                return (
                  <div key={c.id} className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 block uppercase">{c.name}</span>
                    <p className="font-extrabold text-slate-700 mt-0.5">{val !== undefined && val !== null && val !== '' ? val : '-'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. LIST SCREEN (Main Queue Board) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          
          {/* Header Controls Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#EE1D23]" />
                Daily Coordinator Sales Sheets Workspace
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Audit field collections, verify closing balances, and authorize shortages</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Central Status Filtering Dropdown */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span>Filter</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-[#EE1D23]"
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <button
                onClick={() => {
                  onCancelEdit(); // Clear input buffers
                  setViewMode('add');
                }}
                className="bg-[#EE1D23] hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Sales Sheet</span>
              </button>
            </div>
          </div>

          {/* Core Paged Data Grid */}
          <DataGrid
            data={filteredSales}
            columns={finalColumns}
            searchPlaceholder="Search sheets by FSC name or date (YYYY-MM-DD)..."
            searchKeys={['fscName', 'date', 'status']}
            onView={setSelectedSale}
            onEdit={(row) => row.status === 'Draft' ? handleEditTrigger(row) : undefined}
            canEdit={(row) => row.status === 'Draft'} // Only draft reports are editable
            onDelete={(row) => onDeleteSale(row.id)}
            canDelete={(row) => {
              if (user.role === 'Admin') return true;
              if (user.role === 'FSC') {
                return row.status === 'Draft' && row.fscId === user.id;
              }
              return row.status === 'Draft';
            }}
            exportFilename="airtel_daily_sales_ledger"
            actionsLabel="Submissions & Audits"
          />

        </div>
      )}

      {/* 2. MANAGE SCREEN (Record/Edit Form panel) */}
      {(viewMode === 'add' || viewMode === 'edit') && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col gap-5 animate-fade-in">
          
          {/* Header Layout */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleReturnToList}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer"
                title="Go back to list board"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  {viewMode === 'edit' ? 'Edit Sales Sheet Draft' : 'Record Daily Sales Sheet'}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {viewMode === 'edit' ? 'Update draft sheet values' : 'Record closing balances, collections, and remitted amounts'}
                </p>
              </div>
            </div>
            
            <div className="p-2 rounded-2xl bg-red-50 text-[#EE1D23]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleFormSubmission} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Sales Date</label>
                <input
                  type="date"
                  required
                  disabled={viewMode === 'edit'} // Lock historic date on edits to prevent inconsistencies
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#EE1D23] disabled:opacity-50"
                />
              </div>

              {user.role !== 'FSC' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Field Sales Coordinator (FSC)</label>
                  <select
                    required
                    disabled={viewMode === 'edit'} // Lock recipient on edits to maintain reference integrity
                    value={saleFscId}
                    onChange={(e) => setSaleFscId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#EE1D23] disabled:opacity-50"
                  >
                    <option value="">-- Choose FSC --</option>
                    {fscUsersList.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">FSC Agent (Self)</label>
                  <input
                    type="text"
                    disabled
                    value={user.name}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            {/* Sync Alert details */}
            <div className="p-3.5 bg-rose-50 border border-rose-100/50 rounded-2xl text-[10px] text-slate-650 flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-[#EE1D23] shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-[#EE1D23]">Airtel Dynamic Sync:</span> Picking an active working date will automatically pull recorded opening balances, auto-refill allocations, and EasyCharge batches from the Distribution Vault.
              </div>
            </div>

            {/* 1. FSC ALLOCATION & DISTRIBUTION (Read-Only Vault Data) */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-5">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  FSC Allocation & Distribution (Auto-Loaded)
                </p>
              </div>

              {/* Sub-section A: Airtime & SIMs Overview */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">General Balance & Cards</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opening Balance */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Opening Balance</span>
                    <span className="text-sm font-black text-slate-800 mt-1 block">₹{saleOpeningBalance.toLocaleString('en-IN')}</span>
                    <span className="text-[8.5px] text-slate-400 block mt-0.5 italic">Last day closing balance</span>
                  </div>

                  {/* Distributed SIM cards count */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Distributed SIMs</span>
                    <span className="text-sm font-black text-slate-800 mt-1 block">{distributedSims} Units</span>
                    <span className="text-[8.5px] text-slate-400 block mt-0.5 italic">Allocated for today</span>
                  </div>
                </div>
              </div>

              {/* Sub-section B: Auto-Refill Credit Batches */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Auto-Refill Credit Batches</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Batch 1 */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-wider">Batch 1</span>
                    <span className="text-xs font-extrabold text-slate-700 mt-1 block">₹{autoRefill1.toLocaleString('en-IN')}</span>
                  </div>
                  {/* Batch 2 */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-wider">Batch 2</span>
                    <span className="text-xs font-extrabold text-slate-700 mt-1 block">₹{autoRefill2.toLocaleString('en-IN')}</span>
                  </div>
                  {/* Batch 3 */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-wider">Batch 3</span>
                    <span className="text-xs font-extrabold text-slate-700 mt-1 block">₹{autoRefill3.toLocaleString('en-IN')}</span>
                  </div>
                  {/* Total Refills */}
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 shadow-xs">
                    <span className="text-[8px] font-black text-indigo-500 uppercase block tracking-wider">Total Auto-Refills</span>
                    <span className="text-xs font-black text-indigo-700 mt-1 block">₹{totalRefills.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Sub-section C: EasyCharge Manual Top-ups */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">EasyCharge Top-ups</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* EC 1 */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-wider">EasyCharge 1</span>
                    <span className="text-xs font-extrabold text-slate-700 mt-1 block">₹{ecManual1.toLocaleString('en-IN')}</span>
                  </div>
                  {/* EC 2 */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-wider">EasyCharge 2</span>
                    <span className="text-xs font-extrabold text-slate-700 mt-1 block">₹{ecManual2.toLocaleString('en-IN')}</span>
                  </div>
                  {/* Total EasyCharge */}
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 shadow-xs">
                    <span className="text-[8px] font-black text-emerald-600 uppercase block tracking-wider">Total EasyCharge</span>
                    <span className="text-xs font-black text-emerald-700 mt-1 block">₹{totalEc.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. DAILY SALES DATA ENTRY */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-150 pb-2">
                <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                  Daily Sales Entry
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sales Closing Balance Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                    Sales Closing Balance (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter remaining balance..."
                    value={saleClosingBalance === 0 ? '' : saleClosingBalance}
                    onChange={(e) => setSaleClosingBalance(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#EE1D23]/10 focus:border-[#EE1D23] transition-all"
                  />
                  <p className="text-[9px] text-slate-400 leading-normal">
                    FSC will type the remaining credit balance they have at end of day.
                  </p>
                </div>

                {/* Sale Amount Read-Only Display */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">
                    Calculated Sale Amount (₹)
                  </label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-700 select-all cursor-not-allowed h-9 flex items-center">
                    ₹{calculatedSaleAmount.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Formula: (Opening Balance + Auto-Refill Credit + EasyCharge) - Closing Balance
                  </p>
                </div>

                {/* Saled Sim Count Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                    Saled SIM Count
                  </label>
                  <input
                    type="number"
                    placeholder="Enter sold SIM cards count..."
                    value={saleSim === 0 ? '' : saleSim}
                    onChange={(e) => setSaleSim(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#EE1D23]/10 focus:border-[#EE1D23] transition-all"
                  />
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Enter the count of SIM cards sold by the FSC today.
                  </p>
                </div>

                {/* Closing Sim Count Read-Only Display */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">
                    Closing SIM Count [Read-Only]
                  </label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 h-9 flex items-center">
                    {closingSimsCount} Units
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Formula: Distributed SIM Count - Saled SIM Count
                  </p>
                </div>

                {/* Sim Amount Read-Only Display */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">
                    SIM Amount (₹) [Read-Only]
                  </label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 h-9 flex items-center">
                    ₹{calculatedSimAmount.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Rate: ₹{simRate}/SIM (Formula: Saled SIM Count × Rate)
                  </p>
                </div>

                {/* Total Sale Amount Read-Only display */}
                <div className="space-y-1 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/50">
                  <label className="text-[10px] font-black uppercase text-emerald-700 block tracking-wider">
                    Total Sale Amount (₹) [Auto-Calc]
                  </label>
                  <span className="text-lg font-black text-emerald-700 block mt-0.5">
                    ₹{totalSaleAmount.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[8.5px] text-emerald-600/90 leading-tight mt-1">
                    Formula: Sale Amount + SIM Amount
                  </p>
                </div>
              </div>
            </div>

            {/* 3. SHORTAGE AUDITING & LEDGER */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Shortage Auditing & Ledger
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Last Day Short Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Last Day Short Amount (₹)
                  </label>
                  <div className={`w-full border rounded-xl px-3 py-2 text-xs font-bold h-9 flex items-center ${
                    salePreviousShort < 0 ? 'bg-rose-50 border-rose-100 text-rose-700' :
                    salePreviousShort > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                    'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    ₹{salePreviousShort.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Automatically loaded shortage from last sheet (can be + or -).
                  </p>
                </div>

                {/* Today Short Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 block">
                    Today Short (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter today's short (can be - or +)..."
                    value={saleTodayShort === 0 ? '' : saleTodayShort}
                    onChange={(e) => setSaleTodayShort(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#EE1D23]/10 focus:border-[#EE1D23] transition-all"
                  />
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Type shortages as negative numbers (e.g., -1200) or extra collections as positive.
                  </p>
                </div>

                {/* Closing Short Read-Only Display */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Closing Short (₹) [Auto-Calc]
                  </label>
                  <div className={`w-full border rounded-xl px-3 py-2 text-xs font-black h-9 flex items-center ${
                    closingShort < 0 ? 'bg-rose-50 border-rose-200 text-rose-700' :
                    closingShort > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    ₹{closingShort.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Formula: Last Day Short + Today Short (Will become tomorrow's Last Day Short).
                  </p>
                </div>
              </div>
            </div>

            {/* DYNAMIC CUSTOM FIELDS SECTION */}
            {activeFscConfigs.length > 0 && (
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/75">
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Info className="w-3.5 h-3.5 text-[#EE1D23]" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Custom Fields (Information Only)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeFscConfigs.map(c => (
                    <div key={c.id} className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500">
                        {c.name}
                      </label>
                      <input
                        type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'}
                        value={localCustomFields[c.id] || ''}
                        onChange={(e) => handleCustomFieldChange(c.id, e.target.value)}
                        placeholder={`Enter ${c.name.toLowerCase()}...`}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks / Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Remarks / Slip details / Notes</label>
              <textarea
                value={saleRemarks}
                onChange={(e) => setSaleRemarks(e.target.value)}
                placeholder="Mention any bank deposit reference code, flexy shortages reasons, etc..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#EE1D23] h-16 resize-none"
              />
            </div>

            {/* Bottom Actions Row */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReturnToList}
                className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-5 py-2.5 rounded-2xl text-xs transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#EE1D23] hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md cursor-pointer select-none"
              >
                {viewMode === 'edit' ? 'Update Sales Draft' : 'Save Sales Draft'}
              </button>
            </div>

          </form>

        </div>
      )}

      {/* 3. INTERACTIVE APPROVALS MODAL REVIEW */}
      {selectedSaleToReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 space-y-4 animate-slide-up shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#EE1D23]" />
                  Review Field Coordinator Sales Sheet
                </h3>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                  Audit workflow queue stage: authorization review
                </p>
              </div>
              <button 
                onClick={() => setSelectedSaleToReview(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="overflow-y-auto pr-1 space-y-4 flex-1">
              {/* FSC & Date Header block */}
              <div className="grid grid-cols-2 gap-3 text-xs text-left">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">FSC Coordinator</span>
                  <p className="font-extrabold text-slate-800 mt-0.5">
                    {allUsers.find(u => u.id === selectedSaleToReview.fscId)?.name || 'FSC Agent'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Sales Sheet Date</span>
                  <p className="font-extrabold text-slate-800 mt-0.5">{selectedSaleToReview.date}</p>
                </div>
              </div>

              {/* Comprehensive Breakdown */}
              {renderFullSaleBreakdown(selectedSaleToReview)}

              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl space-y-1 text-left">
                <span className="text-amber-800 font-bold uppercase text-[9px]">Coordinator Notes</span>
                <p className="text-xs text-slate-750 italic leading-relaxed">
                  "{selectedSaleToReview.remarks || 'No notes specified by agent.'}"
                </p>
              </div>

              {/* Comments input */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Reviewer Note / Settle Remarks</label>
                <textarea
                  value={reviewNoteText}
                  onChange={(e) => setReviewNoteText(e.target.value)}
                  placeholder="Add matching bank transaction references, recovery agreement remarks, or reasons for rejection..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#EE1D23] h-16 resize-none"
                />
              </div>
            </div>

            {/* Modal actions */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => onReviewSaleSubmit('reject')}
                className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold py-2.5 rounded-2xl text-xs cursor-pointer select-none transition-colors"
              >
                Reject Sheet
              </button>
              <button
                onClick={() => onReviewSaleSubmit('approve')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-2xl text-xs cursor-pointer select-none transition-all shadow-md"
              >
                Authorize & Settle Ledger
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. DETAIL VIEW MODAL */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="sales-detail-modal">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className={`p-6 flex justify-between items-start text-white text-left ${
              selectedSale.status === 'Approved' ? 'bg-gradient-to-r from-emerald-600 to-emerald-800' :
              selectedSale.status === 'Pending' ? 'bg-gradient-to-r from-amber-500 to-amber-700' :
              selectedSale.status === 'Rejected' ? 'bg-gradient-to-r from-rose-600 to-rose-800' :
              'bg-gradient-to-r from-slate-600 to-slate-800'
            }`}>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">FSC Daily Sales Sheet</span>
                <h3 className="text-lg font-extrabold mt-1">{allUsers.find(u => u.id === selectedSale.fscId)?.name || selectedSale.fscName || 'FSC Coordinator'}</h3>
                <p className="text-[10px] text-white/90 font-bold tracking-wider mt-0.5">Date: {selectedSale.date} | Status: {selectedSale.status.toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setSelectedSale(null)}
                className="text-white hover:bg-white/10 p-2 rounded-xl transition-all font-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 pr-4">
              
              {/* Financial Quick Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Credit Sales</span>
                  <span className="text-sm font-black text-slate-800">₹{(selectedSale.saleTotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Remitted Cash</span>
                  <span className="text-sm font-black text-emerald-600">₹{(selectedSale.saleAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Shortage</span>
                  <span className={`text-sm font-black ${selectedSale.shortAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{(selectedSale.shortAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Full Detailed Breakdown */}
              {renderFullSaleBreakdown(selectedSale)}

              {/* Remarks Box */}
              <div className="space-y-3 text-left">
                {selectedSale.remarks && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Coordinator Remarks</span>
                    <p className="text-xs text-slate-750 italic">"{selectedSale.remarks}"</p>
                  </div>
                )}
                
                {selectedSale.reviewNote && (
                  <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-2xl">
                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-1">Reviewer Note / Settlement logs</span>
                    <p className="text-xs text-slate-750 italic font-bold">"{selectedSale.reviewNote}"</p>
                  </div>
                )}
              </div>

              {/* Workflow Logs */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-[10px] text-slate-400 font-bold space-y-1.5 uppercase text-left">
                <div>CREATED BY: <span className="text-slate-600 font-extrabold">{allUsers.find(u => u.id === selectedSale.createdBy)?.name || selectedSale.createdBy || 'SYSTEM'}</span> ({new Date(selectedSale.createdAt).toLocaleString()})</div>
                {selectedSale.submittedBy && (
                  <div>SUBMITTED BY: <span className="text-slate-600 font-extrabold">{allUsers.find(u => u.id === selectedSale.submittedBy)?.name || selectedSale.submittedBy}</span> {selectedSale.submittedAt && `(${new Date(selectedSale.submittedAt).toLocaleString()})`}</div>
                )}
                {selectedSale.reviewedBy && (
                  <div>REVIEWED BY: <span className="text-slate-600 font-extrabold">{allUsers.find(u => u.id === selectedSale.reviewedBy)?.name || selectedSale.reviewedBy}</span> {selectedSale.reviewedAt && `(${new Date(selectedSale.reviewedAt).toLocaleString()})`}</div>
                )}
              </div>

            </div>

            {/* Footer action */}
            <div className="bg-slate-50 p-4 flex justify-end border-t border-slate-100">
              <button 
                onClick={() => setSelectedSale(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
