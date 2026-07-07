import React, { useState, useEffect } from 'react';
import { DollarSign, Info, Users, AlertTriangle, Plus, ChevronLeft, Calendar, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { Sale, UserDto } from '../types';
import { DataGrid, GridColumn } from './DataGrid';

interface SalesTabProps {
  sales: Sale[];
  allUsers: UserDto[];
  fscUsersList: UserDto[];
  user: UserDto;
  onDeleteSale: (id: string) => void;
  onSubmitSaleDraft: (id: string) => void;
  onSubmitSaleForm: (e: React.FormEvent) => void;
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
}

export const SalesTab: React.FC<SalesTabProps> = ({
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
  onCancelEdit
}) => {
  // --- LOCAL NAVIGATION STATE ---
  // List-first separated screen
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Sync component view mode with editing changes
  useEffect(() => {
    if (editingSaleId) {
      setViewMode('edit');
    } else if (viewMode === 'edit') {
      setViewMode('list');
    }
  }, [editingSaleId]);

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
    onSubmitSaleForm(e);
    setViewMode('list');
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
            columns={saleColumns}
            searchPlaceholder="Search sheets by FSC name or date (YYYY-MM-DD)..."
            searchKeys={['fscName', 'date', 'status']}
            onView={setSelectedSale}
            onEdit={(row) => row.status === 'Draft' ? handleEditTrigger(row) : undefined}
            canEdit={(row) => row.status === 'Draft'} // Only draft reports are editable
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

            {/* Balances Section */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/75 space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">Credit Balances Audit</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400">Opening Balance (₹) [Read-Only]</label>
                  <input
                    type="number"
                    required
                    disabled
                    value={saleOpeningBalance}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-500 cursor-not-allowed opacity-75"
                    title="Automatically retrieved from your approved manager allocation"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400">Closing Balance (₹)</label>
                  <input
                    type="number"
                    required
                    value={saleClosingBalance}
                    onChange={(e) => setSaleClosingBalance(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
                  />
                </div>
              </div>
            </div>

            {/* Remittance Section */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/75 space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">Remittance & Liabilities</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-[#EE1D23]">Net Cash Remitted (₹)</label>
                  <input
                    type="number"
                    required
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(Number(e.target.value))}
                    className="w-full bg-white border border-[#EE1D23]/30 focus:border-[#EE1D23] rounded-xl px-3 py-2 text-xs font-black text-[#EE1D23]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400">Previous Shortages (₹)</label>
                  <input
                    type="number"
                    required
                    value={salePreviousShort}
                    onChange={(e) => setSalePreviousShort(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SIM Cards auditing */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/75 space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">SIM Cards Auditing</p>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold uppercase text-slate-400">Opening SIMs [Read-Only]</label>
                  <input
                    type="number"
                    required
                    disabled
                    value={saleOpeningSim}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-500 cursor-not-allowed opacity-75"
                    title="Automatically retrieved from your approved manager allocation"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold uppercase text-slate-400">SIMs Sold</label>
                  <input
                    type="number"
                    required
                    value={saleSim}
                    onChange={(e) => setSaleSim(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold uppercase text-slate-400">Closing SIMs</label>
                  <input
                    type="number"
                    required
                    value={saleClosingSim}
                    onChange={(e) => setSaleClosingSim(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

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
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-5 animate-slide-up shadow-2xl">
            
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

            {/* Metrics parameters panel */}
            <div className="grid grid-cols-2 gap-3 text-xs">
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
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Computed Airtime Sales</span>
                <p className="font-black text-[#EE1D23] mt-0.5">₹{selectedSaleToReview.saleTotal.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Net Cash Settle / Remitted</span>
                <p className="font-extrabold text-emerald-600 mt-0.5">₹{selectedSaleToReview.saleAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl space-y-1">
              <span className="text-amber-800 font-bold uppercase text-[9px]">Coordinator Notes</span>
              <p className="text-xs text-slate-750 italic leading-relaxed">
                "{selectedSaleToReview.remarks || 'No notes specified by agent.'}"
              </p>
            </div>

            {/* Comments input */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Reviewer Note / Settle Remarks</label>
              <textarea
                value={reviewNoteText}
                onChange={(e) => setReviewNoteText(e.target.value)}
                placeholder="Add matching bank transaction references, recovery agreement remarks, or reasons for rejection..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#EE1D23] h-16 resize-none"
              />
            </div>

            {/* Modal actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
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

      {/* 3. DETAIL VIEW MODAL */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="sales-detail-modal">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className={`p-6 flex justify-between items-start text-white ${
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
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Financial Summary Cards */}
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

              {/* Grid Breakdown */}
              <div className="border-t border-b border-slate-100 py-4 grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">Opening Balance</span>
                  <p className="font-extrabold text-slate-800">₹{(selectedSale.openingBalance || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">Closing Balance</span>
                  <p className="font-extrabold text-slate-800">₹{(selectedSale.closingBalance || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">Allocated Refills (R1+R2+R3)</span>
                  <p className="font-semibold text-slate-700">₹{((selectedSale.autoRefill1 || 0) + (selectedSale.autoRefill2 || 0) + (selectedSale.autoRefill3 || 0)).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">Manual EasyCharge (1+2)</span>
                  <p className="font-semibold text-slate-700">₹{((selectedSale.ecManual1 || 0) + (selectedSale.ecManual2 || 0)).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">Previous Unsettled Shortages</span>
                  <p className="font-semibold text-slate-700">₹{(selectedSale.previousShort || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">SIM Cards (Op / Sold / Cl)</span>
                  <p className="font-semibold text-slate-700">Op: {selectedSale.openingSim || 0} | Sold: {selectedSale.sim || 0} | Cl: {selectedSale.closingSim || 0}</p>
                </div>
              </div>

              {/* Remarks Box */}
              <div className="space-y-3">
                {selectedSale.remarks && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Coordinator Remarks</span>
                    <p className="text-xs text-slate-700 italic">"{selectedSale.remarks}"</p>
                  </div>
                )}
                
                {selectedSale.reviewNote && (
                  <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-2xl">
                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-1">Reviewer Note / Settlement logs</span>
                    <p className="text-xs text-slate-750 font-bold italic">"{selectedSale.reviewNote}"</p>
                  </div>
                )}
              </div>

              {/* Workflow Logs */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-[10px] text-slate-400 font-bold space-y-1.5 uppercase">
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
