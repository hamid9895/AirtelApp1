import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Plus, ChevronLeft, Calendar, AlertTriangle, Info } from 'lucide-react';
import { Allocation, UserDto, DailyStock, CustomFieldConfig } from '../types';
import { DataGrid, GridColumn } from './DataGrid';

interface AllocationsTabProps {
  allocations: Allocation[];
  fscUsersList: UserDto[];
  dailyStocks: DailyStock[];
  onDeleteAllocation: (id: string) => void;
  onSubmitAllocation: (e: React.FormEvent, customFields?: Record<string, string | number>) => void;
  allocDate: string;
  setAllocDate: (v: string) => void;
  allocFscId: string;
  setAllocFscId: (v: string) => void;
  allocOpeningBalance: number;
  setAllocOpeningBalance: (v: number) => void;
  allocOpeningSim: number;
  setAllocOpeningSim: (v: number) => void;
  allocAutoRefill1: number;
  setAllocAutoRefill1: (v: number) => void;
  allocAutoRefill2: number;
  setAllocAutoRefill2: (v: number) => void;
  allocAutoRefill3: number;
  setAllocAutoRefill3: (v: number) => void;
  allocEcManual1: number;
  setAllocEcManual1: (v: number) => void;
  allocEcManual2: number;
  setAllocEcManual2: (v: number) => void;
  allocSim: number;
  setAllocSim: (v: number) => void;

  // Edit Hooks passed from parent core
  onEditAllocationClick: (alloc: Allocation) => void;
  editingAllocId: string | null;
  onCancelEdit: () => void;

  customFieldConfigs: CustomFieldConfig[];
  globalConfig?: { commissionPercentage: number; simAmount: number } | null;
}

export const AllocationsTab: React.FC<AllocationsTabProps> = ({
  allocations,
  fscUsersList,
  dailyStocks,
  onDeleteAllocation,
  onSubmitAllocation,
  allocDate,
  setAllocDate,
  allocFscId,
  setAllocFscId,
  allocOpeningBalance,
  setAllocOpeningBalance,
  allocOpeningSim,
  setAllocOpeningSim,
  allocAutoRefill1,
  setAllocAutoRefill1,
  allocAutoRefill2,
  setAllocAutoRefill2,
  allocAutoRefill3,
  setAllocAutoRefill3,
  allocEcManual1,
  setAllocEcManual1,
  allocEcManual2,
  setAllocEcManual2,
  allocSim,
  setAllocSim,
  onEditAllocationClick,
  editingAllocId,
  onCancelEdit,
  customFieldConfigs,
  globalConfig
}) => {
  // --- LOCAL NAVIGATION STATE ---
  // List-first separation as requested
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [localCustomFields, setLocalCustomFields] = useState<Record<string, string | number>>({});
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);

  // --- SEPARATED CALCULATIONS & CONTROLLERS ---

  // Find daily main stock for current date
  const selectedStock = dailyStocks.find(s => s.date === allocDate);

  // Commission auto-deduction calculation
  const commissionPercentage = globalConfig ? globalConfig.commissionPercentage : 3.0;
  const commFactor = 1 + (commissionPercentage / 100);

  // Sum allocations already made to other FSCs on this date
  const otherAllocationsOnDate = allocations.filter(a => a.date === allocDate && a.id !== editingAllocId);
  const totalAllocatedToOthers = otherAllocationsOnDate.reduce((sum, a) => {
    return sum + (a.autoRefill1 || 0) + (a.autoRefill2 || 0) + (a.autoRefill3 || 0) + (a.ecManual1 || 0) + (a.ecManual2 || 0);
  }, 0);
  const simAllocatedToOthers = otherAllocationsOnDate.reduce((sum, a) => sum + (a.sim || 0), 0);

  // Current values
  const currentAllocatedAmount = allocAutoRefill1 + allocAutoRefill2 + allocAutoRefill3 + allocEcManual1 + allocEcManual2;
  const currentSimCount = allocSim;

  const netAllocationReturn = Math.round((currentAllocatedAmount / commFactor) * 100) / 100;
  const netTotalToday = Math.round((allocOpeningBalance + (currentAllocatedAmount / commFactor)) * 100) / 100;

  // Main stock metrics
  const mainStockTotalCash = selectedStock ? (selectedStock.openingAmount + selectedStock.flexy + (selectedStock.flexyClaim1 || 0) + (selectedStock.flexyClaim2 || 0)) : 0;
  const mainStockTotalSim = selectedStock ? (selectedStock.openingSim + selectedStock.sim) : 0;

  const mainStockRemainingCash = selectedStock ? (mainStockTotalCash - totalAllocatedToOthers) : 0;
  const mainStockRemainingSim = selectedStock ? (mainStockTotalSim - simAllocatedToOthers) : 0;

  // FSC Agent details
  const selectedFscUser = fscUsersList.find(u => u.id === allocFscId);

  // Watch for central edit requests to dynamically open form
  useEffect(() => {
    if (editingAllocId) {
      setViewMode('edit');
      const matchingAlloc = allocations.find(a => a.id === editingAllocId);
      if (matchingAlloc) {
        setLocalCustomFields(matchingAlloc.customFields || {});
      }
    } else {
      setLocalCustomFields({});
      if (viewMode === 'edit') {
        setViewMode('list');
      }
    }
  }, [editingAllocId, allocations]);

  /**
   * Initializes editing session by invoking parent state setup and toggling UI screens.
   */
  const handleEditTrigger = (alloc: Allocation) => {
    onEditAllocationClick(alloc);
    setViewMode('edit');
  };

  /**
   * Resets editing state variables and safely navigates back to grid list view.
   */
  const handleReturnToList = () => {
    onCancelEdit();
    setLocalCustomFields({});
    setViewMode('list');
    setShowConfirmModal(false);
  };

  /**
   * Dispatches allocation submissions and returns back to history table.
   */
  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  /**
   * Confirms and saves the allocation
   */
  const handleConfirmSave = () => {
    setShowConfirmModal(false);
    onSubmitAllocation({ preventDefault: () => {} } as any, localCustomFields);
    setLocalCustomFields({});
    setViewMode('list');
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setLocalCustomFields(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // --- DATA GRID COLUMN SCHEMA ---
  const baseColumns: GridColumn<Allocation>[] = [
    { 
      key: 'date', 
      label: 'Distribution Date', 
      type: 'date', 
      sortable: true,
      render: (r) => (
        <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {r.date}
        </span>
      )
    },
    { 
      key: 'fscName', 
      label: 'Recipient FSC Agent', 
      type: 'string', 
      sortable: true,
      render: (r) => (
        <span className="font-black text-slate-900 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#EE1D23]" />
          {r.fscName || 'Field Agent'}
        </span>
      )
    },
    { key: 'openingBalance', label: 'Opening Balance (INR)', type: 'currency', sortable: true },
    { key: 'totalAllocated', label: 'Distributed Credit (INR)', type: 'currency', sortable: true },
    { key: 'sim', label: 'Allocated SIM Cards', type: 'number', sortable: true, render: (r) => <span className="font-semibold text-slate-650">{r.sim} SIMs</span> },
  ];

  // Dynamically append custom fields to columns list
  const activeFscConfigs = customFieldConfigs.filter(c => c.target === 'fsc');
  const dynamicColumns = activeFscConfigs.map(c => ({
    key: `cf_${c.id}` as any,
    label: c.name,
    type: (c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'string') as any,
    sortable: true,
    render: (r: Allocation) => {
      const val = r.customFields?.[c.id];
      if (val === undefined || val === null || val === '') return <span className="text-slate-300">-</span>;
      if (c.type === 'number') return <span className="font-bold text-slate-600">{Number(val).toLocaleString()}</span>;
      return <span className="text-slate-600 font-medium">{val}</span>;
    }
  }));

  const allocationColumns = [...baseColumns, ...dynamicColumns];

  return (
    <div className="space-y-6">
      
      {/* 1. LIST SCREEN (Main Dashboard view) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          
          {/* Header Action Row */}
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#EE1D23]" />
                FSC Credit & Stock Distribution Registry
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Track daily credit, refills, and SIM card handovers to coordinators</p>
            </div>

            <button
              onClick={() => {
                onCancelEdit(); // Reset fields to baseline
                setViewMode('add');
              }}
              className="bg-[#EE1D23] hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
              <span>Distribute Agent Stock</span>
            </button>
          </div>

          {/* Interactive Data Grid */}
          <DataGrid
            data={allocations}
            columns={allocationColumns}
            searchPlaceholder="Search recipient or date (YYYY-MM-DD)..."
            searchKeys={['fscName', 'date']}
            onView={setSelectedAllocation}
            onEdit={handleEditTrigger}
            onDelete={(row) => onDeleteAllocation(row.id)}
            exportFilename="airtel_fsc_allocations_ledger"
          />

        </div>
      )}

      {/* 2. MANAGE SCREEN (Used for Add & Edit operations) */}
      {(viewMode === 'add' || viewMode === 'edit') && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col gap-6 animate-fade-in">
          
          {/* Header layout with back navigate action */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleReturnToList}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer"
                title="Go back to list"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  {viewMode === 'edit' ? 'Modify FSC Allocation Entry' : 'New Agent Allocation Distribution'}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {viewMode === 'edit' ? 'Update refills, easycharges, and SIM counts' : 'Allocate fresh stocks to coordinators'}
                </p>
              </div>
            </div>
            
            <div className="p-2 rounded-2xl bg-red-50 text-[#EE1D23]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Core Input Form */}
          <form onSubmit={handleFormSubmission} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Distribution Date</label>
                <input
                  type="date"
                  required
                  disabled={viewMode === 'edit'} // Lock historic date range consistency
                  value={allocDate}
                  onChange={(e) => setAllocDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#EE1D23] disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Recipient Coordinator (FSC)</label>
                <select
                  required
                  disabled={viewMode === 'edit'} // Lock recipient on edits to maintain reference integrity
                  value={allocFscId}
                  onChange={(e) => setAllocFscId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#EE1D23] disabled:opacity-50"
                >
                  <option value="">-- Choose Coordinator --</option>
                  {fscUsersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Main Stock Status & Available Balance Panel */}
            <div className={`p-4 rounded-2xl border text-xs space-y-3 ${
              selectedStock 
                ? 'bg-slate-50 border-slate-200' 
                : 'bg-rose-50 border-rose-100 text-[#EE1D23]'
            }`}>
              <div className="flex justify-between items-center border-b border-dashed pb-2 border-slate-200">
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500">
                  Main Stock Status ({allocDate})
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  selectedStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-[#EE1D23]'
                }`}>
                  {selectedStock ? 'Daily Stock Loaded' : 'No Daily Stock Found'}
                </span>
              </div>

              {selectedStock ? (
                <div className="grid grid-cols-2 gap-4 text-slate-800">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase">Available Cash (INR)</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">
                      ₹{mainStockRemainingCash.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                      After allocation: <span className={mainStockRemainingCash - currentAllocatedAmount < 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-700 font-semibold'}>₹{(mainStockRemainingCash - currentAllocatedAmount).toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase">Available SIM Cards</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">
                      {mainStockRemainingSim} SIMs
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                      After allocation: <span className={mainStockRemainingSim - currentSimCount < 0 ? 'text-rose-600 font-extrabold' : 'text-slate-600'}>{mainStockRemainingSim - currentSimCount} SIMs</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] leading-relaxed font-bold">
                  ⚠️ No Daily Stock has been recorded for {allocDate} yet. Please record Main Stock first in the "Daily Stock" tab so allocations can be correctly deducted from the vault.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Opening Balance (₹) [Read-Only]</label>
                <input
                  type="number"
                  required
                  disabled
                  value={allocOpeningBalance}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-500 cursor-not-allowed opacity-75"
                  title="Automatically calculated from previous day's closing balance"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Opening SIM Count [Read-Only]</label>
                <input
                  type="number"
                  required
                  disabled
                  value={allocOpeningSim}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-500 cursor-not-allowed opacity-75"
                  title="Automatically calculated from previous day's closing SIM count"
                />
              </div>
            </div>

            {/* Auto-Refill Section */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/75 space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">Auto-Refill Credit Batches</p>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold uppercase text-slate-400">Batch 1 (₹)</label>
                  <input
                    type="number"
                    required
                    value={allocAutoRefill1 === 0 ? '' : allocAutoRefill1}
                    onChange={(e) => setAllocAutoRefill1(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold uppercase text-slate-400">Batch 2 (₹) (Optional)</label>
                  <input
                    type="number"
                    value={allocAutoRefill2 === 0 ? '' : allocAutoRefill2}
                    onChange={(e) => setAllocAutoRefill2(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold uppercase text-slate-400">Batch 3 (₹) (Optional)</label>
                  <input
                    type="number"
                    value={allocAutoRefill3 === 0 ? '' : allocAutoRefill3}
                    onChange={(e) => setAllocAutoRefill3(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* EasyCharge Top-Ups */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/75 space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">EasyCharge (EC) Manual top-ups</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold uppercase text-slate-400">EC topup 1 (₹) (Optional)</label>
                  <input
                    type="number"
                    value={allocEcManual1 === 0 ? '' : allocEcManual1}
                    onChange={(e) => setAllocEcManual1(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold uppercase text-slate-400">EC topup 2 (₹) (Optional)</label>
                  <input
                    type="number"
                    value={allocEcManual2 === 0 ? '' : allocEcManual2}
                    onChange={(e) => setAllocEcManual2(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Distributed SIM Cards count</label>
                {globalConfig && (
                  <span className="text-[9px] text-[#EE1D23] font-extrabold bg-red-50 px-2 py-0.5 rounded-lg border border-red-100/50">
                    SIM Rate: ₹{globalConfig.simAmount} (Total: ₹{(allocSim * globalConfig.simAmount).toLocaleString('en-IN')})
                  </span>
                )}
              </div>
              <input
                type="number"
                required
                value={allocSim === 0 ? '' : allocSim}
                onChange={(e) => setAllocSim(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
              />
            </div>

            {/* Total Balance / Allocation Summary Panel */}
            <div className="p-4 rounded-2xl bg-[#EE1D23]/5 border border-[#EE1D23]/10 text-xs space-y-2">
              <span className="font-extrabold uppercase tracking-widest text-[9px] text-slate-400 block border-b border-slate-100 pb-1.5">
                Distribution Summary to {selectedFscUser?.name || 'Agent'}
              </span>
              
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase">Total Cash Balance (Today)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <p className="text-base font-black text-slate-950">
                      ₹{(allocOpeningBalance + currentAllocatedAmount).toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold">
                      (₹{allocOpeningBalance} + ₹{currentAllocatedAmount})
                    </span>
                  </div>
                  {globalConfig && (
                    <p className="text-[9px] text-emerald-600 font-extrabold mt-0.5 uppercase tracking-wider">
                      Net expected return: ₹{netTotalToday.toLocaleString('en-IN')} ({commissionPercentage}% commission auto-deducted)
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase">Total SIM Balance (Today)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <p className="text-base font-black text-slate-950">
                      {allocOpeningSim + currentSimCount} SIMs
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold">
                      ({allocOpeningSim} + {currentSimCount})
                    </span>
                  </div>
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

            {/* Action Buttons Row */}
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
                {viewMode === 'edit' ? 'Update distributed balances' : 'Allocate Stock'}
              </button>
            </div>

          </form>

        </div>
      )}

      {/* 3. CONFIRMATION POPUP FOR ALLOCATIONS */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-5 animate-slide-up shadow-2xl">
            
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Confirm Stock Allocation
              </h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                Please verify distribution figures before committing
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-extrabold uppercase text-[9px]">FSC Coordinator:</span>
                  <span className="font-extrabold text-slate-800">{selectedFscUser?.name || 'FSC Agent'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-extrabold uppercase text-[9px]">Date:</span>
                  <span className="font-bold text-slate-800">{allocDate}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-2">
                  <span className="text-slate-400 font-extrabold uppercase text-[9px]">Opening Balance:</span>
                  <span className="font-semibold text-slate-700">₹{allocOpeningBalance.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-extrabold uppercase text-[9px]">Auto Refills (1+2+3):</span>
                  <span className="font-semibold text-slate-700">
                    ₹{(allocAutoRefill1 + allocAutoRefill2 + allocAutoRefill3).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-extrabold uppercase text-[9px]">EC Manual (1+2):</span>
                  <span className="font-semibold text-slate-700">
                    ₹{(allocEcManual1 + allocEcManual2).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-2">
                  <span className="text-[#EE1D23] font-extrabold uppercase text-[9px]">Total Cash Allocated Today:</span>
                  <span className="font-black text-[#EE1D23]">₹{currentAllocatedAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#EE1D23] font-extrabold uppercase text-[9px]">Total Today's Balance (Opening+Alloc):</span>
                  <span className="font-black text-slate-900">₹{(allocOpeningBalance + currentAllocatedAmount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-2">
                  <span className="text-slate-400 font-extrabold uppercase text-[9px]">Opening SIMs:</span>
                  <span className="font-semibold text-slate-700">{allocOpeningSim} SIMs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#EE1D23] font-extrabold uppercase text-[9px]">SIMs Distributed Today:</span>
                  <span className="font-black text-[#EE1D23]">{currentSimCount} SIMs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-extrabold uppercase text-[9px]">Total Today's SIM Pool:</span>
                  <span className="font-black text-slate-900">{allocOpeningSim + currentSimCount} SIMs</span>
                </div>
              </div>

              {!selectedStock && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] text-[#EE1D23] font-bold leading-relaxed">
                  ⚠️ Note: No Daily Main Stock is loaded for this date yet. Continuing will deduct from a zero vault.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold py-2.5 rounded-2xl text-xs cursor-pointer select-none transition-colors"
              >
                Go Back / Edit
              </button>
              <button
                onClick={handleConfirmSave}
                className="bg-[#EE1D23] hover:bg-red-700 text-white font-bold py-2.5 rounded-2xl text-xs cursor-pointer select-none transition-all shadow-md"
              >
                Yes, Confirm & Distribute
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. DETAIL VIEW MODAL */}
      {selectedAllocation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="allocation-detail-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">FSC Agent Distribution</span>
                <h3 className="text-lg font-extrabold mt-1">{selectedAllocation.fscName || 'Field Agent'}</h3>
                <p className="text-[10px] text-indigo-100 font-bold tracking-wider mt-0.5">Date: {selectedAllocation.date} | ID: {selectedAllocation.id}</p>
              </div>
              <button 
                onClick={() => setSelectedAllocation(null)}
                className="text-white hover:bg-white/10 p-2 rounded-xl transition-all font-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/75">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400">Opening Cash Balance</span>
                  <p className="text-sm font-extrabold text-slate-800">₹{selectedAllocation.openingBalance.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/75">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400">Opening SIM Balance</span>
                  <p className="text-sm font-extrabold text-slate-800">{selectedAllocation.openingSim} SIMs</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/75 col-span-2">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-2">Refill & EasyCharge breakdown</span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Auto 1</span>
                      <span className="font-extrabold text-slate-800">₹{(selectedAllocation.autoRefill1 || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Auto 2</span>
                      <span className="font-extrabold text-slate-800">₹{(selectedAllocation.autoRefill2 || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Auto 3</span>
                      <span className="font-extrabold text-slate-800">₹{(selectedAllocation.autoRefill3 || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Manual 1</span>
                      <span className="font-extrabold text-slate-800">₹{(selectedAllocation.ecManual1 || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Manual 2</span>
                      <span className="font-extrabold text-slate-800">₹{(selectedAllocation.ecManual2 || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic calculations */}
              <div className="border-t border-b border-slate-100 py-3 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Total Distributed cash</span>
                  <span className="text-base font-black text-[#EE1D23]">
                    ₹{selectedAllocation.totalAllocated.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">SIM Cards Distributed</span>
                  <span className="text-base font-black text-indigo-600">
                    {selectedAllocation.sim} SIMs
                  </span>
                </div>
                <div className="col-span-2 bg-indigo-50/50 px-4 py-2.5 rounded-2xl border border-indigo-100/50 flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-800">Total Pooled Cash Value:</span>
                  <span className="font-black text-indigo-900 text-sm">₹{(selectedAllocation.openingBalance + selectedAllocation.totalAllocated).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Custom fields */}
              {activeFscConfigs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Custom Extension Fields</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {activeFscConfigs.map(c => {
                      const val = selectedAllocation.customFields?.[c.id];
                      return (
                        <div key={c.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-0">
                          <span className="text-slate-500 font-bold">{c.name}:</span>
                          <span className="font-extrabold text-slate-800">
                            {val !== undefined && val !== null && val !== '' ? (
                              c.type === 'number' ? Number(val).toLocaleString() : String(val)
                            ) : (
                              <span className="text-slate-300 font-medium">-</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Meta logs */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/70 text-[10px] text-slate-400 font-bold space-y-1">
                <div>CREATED BY: <span className="text-slate-600 uppercase">{selectedAllocation.createdBy || 'SYSTEM'}</span></div>
                <div>CREATED AT: <span className="text-slate-600">{new Date(selectedAllocation.createdAt).toLocaleString()}</span></div>
              </div>
            </div>

            {/* Footer action */}
            <div className="bg-slate-50 p-4 flex justify-end border-t border-slate-100">
              <button 
                onClick={() => setSelectedAllocation(null)}
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
