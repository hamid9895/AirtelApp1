import React, { useState, useEffect } from 'react';
import { ClipboardList, Calendar, Plus, ChevronLeft } from 'lucide-react';
import { DailyStock } from '../types';
import { DataGrid, GridColumn } from './DataGrid';

interface DailyStockTabProps {
  dailyStocks: DailyStock[];
  onDeleteStock: (id: string) => void;
  onSubmitStock: (e: React.FormEvent) => void;
  stockDate: string;
  setStockDate: (v: string) => void;
  stockOpeningAmount: number;
  setStockOpeningAmount: (v: number) => void;
  stockOpeningSim: number;
  setStockOpeningSim: (v: number) => void;
  stockFlexy: number;
  setStockFlexy: (v: number) => void;
  stockFlexyClaim1: number;
  setStockFlexyClaim1: (v: number) => void;
  stockFlexyClaim2: number;
  setStockFlexyClaim2: (v: number) => void;
  stockSim: number;
  setStockSim: (v: number) => void;
  
  // Edit & Mode Hooks passed from central state
  onEditStockClick: (stock: DailyStock) => void;
  editingStockId: string | null;
  onCancelEdit: () => void;
}

export const DailyStockTab: React.FC<DailyStockTabProps> = ({
  dailyStocks,
  onDeleteStock,
  onSubmitStock,
  stockDate,
  setStockDate,
  stockOpeningAmount,
  setStockOpeningAmount,
  stockOpeningSim,
  setStockOpeningSim,
  stockFlexy,
  setStockFlexy,
  stockFlexyClaim1,
  setStockFlexyClaim1,
  stockFlexyClaim2,
  setStockFlexyClaim2,
  stockSim,
  setStockSim,
  onEditStockClick,
  editingStockId,
  onCancelEdit
}) => {
  // --- LOCAL NAVIGATION STATE ---
  // Default mode is 'list' as requested. switches to 'add' or 'edit' when creating/modifying
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');

  // Sync component view mode if central editing states change
  useEffect(() => {
    if (editingStockId) {
      setViewMode('edit');
    } else if (viewMode === 'edit') {
      setViewMode('list');
    }
  }, [editingStockId]);

  // --- SEPARATED HELPER FUNCTIONS ---

  /**
   * Initializes editing session by invoking parent setup and changing visual screens.
   */
  const handleEditTrigger = (stock: DailyStock) => {
    onEditStockClick(stock);
    setViewMode('edit');
  };

  /**
   * Closes active creation/edit forms and safely navigates back to grid list view.
   */
  const handleReturnToList = () => {
    onCancelEdit();
    setViewMode('list');
  };

  /**
   * Dispatches form submissions and resets local view to list screen on success.
   */
  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitStock(e);
    setViewMode('list');
  };

  // --- DATA GRID COLUMN SCHEMAS ---
  const stockColumns: GridColumn<DailyStock>[] = [
    { 
      key: 'date', 
      label: 'Date', 
      type: 'date', 
      sortable: true,
      render: (r) => (
        <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#EE1D23]" />
          {r.date}
        </span>
      )
    },
    { key: 'openingAmount', label: 'Opening Cash', type: 'currency', sortable: true },
    { key: 'openingSim', label: 'Opening SIM', type: 'number', sortable: true, render: (r) => <span className="font-semibold text-slate-700">{r.openingSim} SIMs</span> },
    { key: 'flexy', label: 'Flexy', type: 'currency', sortable: true },
    { key: 'flexyClaim1', label: 'Claim 1', type: 'currency', sortable: true },
    { key: 'flexyClaim2', label: 'Claim 2', type: 'currency', sortable: true },
    { key: 'sim', label: 'SIM Added', type: 'number', sortable: true, render: (r) => <span className="font-semibold text-slate-700">+{r.sim}</span> },
    { 
      key: 'closingAmount' as any, 
      label: 'Closing Cash', 
      type: 'currency', 
      sortable: true,
      render: (r) => (
        <span className="font-bold text-emerald-700">
          ₹{((r as any).closingAmount !== undefined ? (r as any).closingAmount : r.openingAmount).toLocaleString('en-IN')}
        </span>
      )
    },
    { 
      key: 'closingSim' as any, 
      label: 'Closing SIM', 
      type: 'number', 
      sortable: true,
      render: (r) => (
        <span className="font-bold text-blue-700">
          {((r as any).closingSim !== undefined ? (r as any).closingSim : r.openingSim)} SIMs
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. LIST VIEW SCREEN (Shown by default) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          
          {/* Header Block with Navigation Controls */}
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#EE1D23]" />
                Daily Vault & Inventory Registry
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">List of recorded daily opening stocks & airtime balances</p>
            </div>

            <button
              onClick={() => {
                onCancelEdit(); // Clear fields first
                setViewMode('add');
              }}
              className="bg-[#EE1D23] hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Daily Stock</span>
            </button>
          </div>

          {/* Interactive Data Grid */}
          <DataGrid
            data={dailyStocks}
            columns={stockColumns}
            searchPlaceholder="Filter records by date (YYYY-MM-DD)..."
            searchKeys={['date']}
            onEdit={handleEditTrigger}
            onDelete={(row) => onDeleteStock(row.id)}
            exportFilename="airtel_inventory_log"
          />

        </div>
      )}

      {/* 2. MANAGE VIEW SCREEN (Used for Add & Edit operations) */}
      {(viewMode === 'add' || viewMode === 'edit') && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col gap-6 animate-fade-in">
          
          {/* Header Title with Back Action */}
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
                  {viewMode === 'edit' ? 'Modify Daily Stock Entry' : 'Log Daily Opening Stock'}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {viewMode === 'edit' ? 'Update opening balances and airtime limits' : 'Register opening vault balances'}
                </p>
              </div>
            </div>
            
            <div className="p-2 rounded-2xl bg-red-50 text-[#EE1D23]">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>

          {/* Input Entry Form */}
          <form onSubmit={handleFormSubmission} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Inventory Date</label>
              <input
                type="date"
                required
                disabled={viewMode === 'edit'} // Lock date on edits to prevent historic inconsistencies
                value={stockDate}
                onChange={(e) => setStockDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#EE1D23] disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Opening Cash Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={stockOpeningAmount}
                  onChange={(e) => setStockOpeningAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Opening SIM Count</label>
                <input
                  type="number"
                  required
                  value={stockOpeningSim}
                  onChange={(e) => setStockOpeningSim(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
                />
              </div>
            </div>

            <div className="space-y-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/75 space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">Flexy Airtime & Claims Allocation</p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Primary Flexy Balance (₹)</label>
                <input
                  type="number"
                  required
                  value={stockFlexy}
                  onChange={(e) => setStockFlexy(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400">Claim Batch 1 (₹)</label>
                  <input
                    type="number"
                    required
                    value={stockFlexyClaim1}
                    onChange={(e) => setStockFlexyClaim1(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400">Claim Batch 2 (₹)</label>
                  <input
                    type="number"
                    required
                    value={stockFlexyClaim2}
                    onChange={(e) => setStockFlexyClaim2(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">SIM Cards Total Count</label>
              <input
                type="number"
                required
                value={stockSim}
                onChange={(e) => setStockSim(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
              />
            </div>

            {/* Buttons Row */}
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
                {viewMode === 'edit' ? 'Update stock configuration' : 'Register Daily Stock'}
              </button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
};
