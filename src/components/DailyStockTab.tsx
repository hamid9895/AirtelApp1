import React, { useState, useEffect } from 'react';
import { ClipboardList, Calendar, Plus, ChevronLeft, Info } from 'lucide-react';
import { DailyStock, CustomFieldConfig } from '../types';
import { DataGrid, GridColumn } from './DataGrid';

interface DailyStockTabProps {
  dailyStocks: DailyStock[];
  onDeleteStock: (id: string) => void;
  onSubmitStock: (e: React.FormEvent, customFields?: Record<string, string | number>) => void;
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

  customFieldConfigs: CustomFieldConfig[];
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
  onCancelEdit,
  customFieldConfigs
}) => {
  // --- LOCAL NAVIGATION STATE ---
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [localCustomFields, setLocalCustomFields] = useState<Record<string, string | number>>({});
  const [selectedStock, setSelectedStock] = useState<DailyStock | null>(null);

  // Sync component view mode if central editing states change
  useEffect(() => {
    if (editingStockId) {
      setViewMode('edit');
      const matchingStock = dailyStocks.find(s => s.id === editingStockId);
      if (matchingStock) {
        setLocalCustomFields(matchingStock.customFields || {});
      }
    } else {
      setLocalCustomFields({});
      if (viewMode === 'edit') {
        setViewMode('list');
      }
    }
  }, [editingStockId, dailyStocks]);

  // --- SEPARATED HELPER FUNCTIONS ---

  const handleEditTrigger = (stock: DailyStock) => {
    onEditStockClick(stock);
    setViewMode('edit');
  };

  const handleReturnToList = () => {
    onCancelEdit();
    setLocalCustomFields({});
    setViewMode('list');
  };

  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitStock(e, localCustomFields);
    setLocalCustomFields({});
    setViewMode('list');
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setLocalCustomFields(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // --- DATA GRID COLUMN SCHEMAS ---
  const baseColumns: GridColumn<DailyStock>[] = [
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

  // Dynamically append custom fields to columns list
  const activeStockConfigs = customFieldConfigs.filter(c => c.target === 'stock');
  const dynamicColumns = activeStockConfigs.map(c => ({
    key: `cf_${c.id}` as any,
    label: c.name,
    type: (c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'string') as any,
    sortable: true,
    render: (r: DailyStock) => {
      const val = r.customFields?.[c.id];
      if (val === undefined || val === null || val === '') return <span className="text-slate-300">-</span>;
      if (c.type === 'number') return <span className="font-bold text-slate-600">{Number(val).toLocaleString()}</span>;
      return <span className="text-slate-600 font-medium">{val}</span>;
    }
  }));

  const stockColumns = [...baseColumns, ...dynamicColumns];

  return (
    <div className="space-y-6" id="daily-stock-tab-root">
      
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
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                List of recorded daily opening stocks & airtime balances
              </p>
            </div>

            <button
              onClick={() => {
                onCancelEdit(); // Clear fields first
                setLocalCustomFields({});
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
            onView={setSelectedStock}
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
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Opening Cash Amount (₹) [Read-Only]</label>
                <input
                  type="number"
                  required
                  disabled
                  value={stockOpeningAmount}
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
                  value={stockOpeningSim}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-500 cursor-not-allowed opacity-75"
                  title="Automatically calculated from previous day's closing SIM count"
                />
              </div>
            </div>

            <div className="space-y-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/75 space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">
                Flexy Airtime & Claims Allocation
              </p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Primary Flexy Balance (₹)</label>
                <input
                  type="number"
                  required
                  value={stockFlexy === 0 ? '' : stockFlexy}
                  onChange={(e) => setStockFlexy(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400">Claim Batch 1 (₹)</label>
                  <input
                    type="number"
                    required
                    value={stockFlexyClaim1 === 0 ? '' : stockFlexyClaim1}
                    onChange={(e) => setStockFlexyClaim1(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400">Claim Batch 2 (₹)</label>
                  <input
                    type="number"
                    required
                    value={stockFlexyClaim2 === 0 ? '' : stockFlexyClaim2}
                    onChange={(e) => setStockFlexyClaim2(e.target.value === '' ? 0 : Number(e.target.value))}
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
                value={stockSim === 0 ? '' : stockSim}
                onChange={(e) => setStockSim(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
              />
            </div>

            {/* DYNAMIC CUSTOM FIELDS SECTION */}
            {activeStockConfigs.length > 0 && (
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/75">
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Info className="w-3.5 h-3.5 text-[#EE1D23]" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Custom Fields (Information Only)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeStockConfigs.map(c => (
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

      {/* 3. DETAIL VIEW MODAL */}
      {selectedStock && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="daily-stock-detail-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#EE1D23] to-[#C41217] text-white p-6 flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Daily Stock Log</span>
                <h3 className="text-lg font-extrabold mt-1">Date: {selectedStock.date}</h3>
                <p className="text-[10px] text-red-100 font-bold tracking-wider mt-0.5">ID: {selectedStock.id}</p>
              </div>
              <button 
                onClick={() => setSelectedStock(null)}
                className="text-white hover:bg-white/10 p-2 rounded-xl transition-all font-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/75">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400">Opening cash</span>
                  <p className="text-sm font-extrabold text-slate-800">₹{selectedStock.openingAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/75">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400">Opening SIM count</span>
                  <p className="text-sm font-extrabold text-slate-800">{selectedStock.openingSim} SIMs</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/75">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400">Flexy Airtime</span>
                  <p className="text-sm font-extrabold text-slate-800">₹{selectedStock.flexy.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/75">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400">SIM cards added</span>
                  <p className="text-sm font-extrabold text-slate-800">+{selectedStock.sim} SIMs</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/75">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400">Claim Batch 1</span>
                  <p className="text-sm font-semibold text-slate-800">₹{selectedStock.flexyClaim1.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/75">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400">Claim Batch 2</span>
                  <p className="text-sm font-semibold text-slate-800">₹{selectedStock.flexyClaim2.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Dynamic calculations */}
              <div className="border-t border-b border-slate-100 py-3 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Calculated Closing Cash</span>
                  <span className="text-base font-black text-emerald-600">
                    ₹{((selectedStock as any).closingAmount !== undefined ? (selectedStock as any).closingAmount : selectedStock.openingAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Calculated Closing SIMs</span>
                  <span className="text-base font-black text-blue-600">
                    {((selectedStock as any).closingSim !== undefined ? (selectedStock as any).closingSim : selectedStock.openingSim)} SIMs
                  </span>
                </div>
              </div>

              {/* Custom fields */}
              {activeStockConfigs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Custom Extension Fields</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {activeStockConfigs.map(c => {
                      const val = selectedStock.customFields?.[c.id];
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
                <div>CREATED BY: <span className="text-slate-600 uppercase">{selectedStock.createdBy || 'SYSTEM'}</span></div>
                <div>CREATED AT: <span className="text-slate-600">{new Date(selectedStock.createdAt).toLocaleString()}</span></div>
              </div>
            </div>

            {/* Footer action */}
            <div className="bg-slate-50 p-4 flex justify-end border-t border-slate-100">
              <button 
                onClick={() => setSelectedStock(null)}
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
