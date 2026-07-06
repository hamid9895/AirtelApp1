import React, { useState, useMemo } from 'react';
import { RefreshCw, Download, BarChart3, Users, ClipboardList, AlertOctagon, TrendingUp, DollarSign } from 'lucide-react';
import { ReportSummary, Sale, Allocation, DailyStock, UserDto } from '../types';
import { DataGrid, GridColumn } from './DataGrid';

interface ReportsTabProps {
  reportFromDate: string;
  setReportFromDate: (v: string) => void;
  reportToDate: string;
  setReportToDate: (v: string) => void;
  onCompileLedger: () => void;
  reportSummaries: ReportSummary[];
  sales: Sale[];
  allocations: Allocation[];
  dailyStocks: DailyStock[];
  allUsers: UserDto[];
}

type ReportType = 'reconciliation' | 'fsc_performance' | 'inventory_flow' | 'shortage_liability';

export const ReportsTab: React.FC<ReportsTabProps> = ({
  reportFromDate,
  setReportFromDate,
  reportToDate,
  setReportToDate,
  onCompileLedger,
  reportSummaries,
  sales,
  allocations,
  dailyStocks,
  allUsers
}) => {
  // --- STATE MANAGERS ---
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('reconciliation');

  // --- SEPARATED CALCULATION & PROCESSING UTILITY FUNCTIONS ---

  /**
   * Calculates coordinator performance metrics based on allocations and approved sales.
   * Compiles total collections, shortages, active days, averages, and rates per agent.
   */
  const fscPerformanceData = useMemo(() => {
    const fscs = allUsers.filter(u => u.role === 'FSC');
    return fscs.map(fsc => {
      // Fetch approved sales to compute hard metrics
      const fscSales = sales.filter(s => s.fscId === fsc.id && s.status === 'Approved');
      const fscAllocations = allocations.filter(a => a.fscId === fsc.id);
      
      const totalAllocated = fscAllocations.reduce((sum, a) => sum + a.totalAllocated, 0);
      const totalAllocatedSims = fscAllocations.reduce((sum, a) => sum + a.sim, 0);
      const totalSales = fscSales.reduce((sum, s) => sum + s.saleAmount, 0);
      const totalShortages = fscSales.reduce((sum, s) => sum + s.shortAmount, 0);
      
      // Calculate distinct active days
      const activeDays = new Set([
        ...fscSales.map(s => s.date), 
        ...fscAllocations.map(a => a.date)
      ]).size;
      
      const avgSalesPerDay = activeDays > 0 ? Math.round(totalSales / activeDays) : 0;
      const shortageRate = totalAllocated > 0 ? Number(((totalShortages / totalAllocated) * 100).toFixed(1)) : 0;
      
      return {
        id: fsc.id,
        fscName: fsc.name,
        email: fsc.email,
        activeDays,
        totalAllocated,
        totalAllocatedSims,
        totalSales,
        totalShortages,
        avgSalesPerDay,
        shortageRate
      };
    });
  }, [allUsers, sales, allocations]);

  /**
   * Processes daily stock ledgers joining them with the total agent distribution amounts.
   * Computes available stock pools, distributions, and remaining available cash & SIM stock.
   */
  const inventoryFlowData = useMemo(() => {
    return dailyStocks.map(stock => {
      const dateAllocations = allocations.filter(a => a.date === stock.date);
      const totalAllocatedAmt = dateAllocations.reduce((sum, a) => sum + a.totalAllocated, 0);
      const totalAllocatedSims = dateAllocations.reduce((sum, a) => sum + a.sim, 0);
      
      const totalOpeningPool = stock.openingAmount + stock.flexy;
      const remainingPool = Math.max(0, totalOpeningPool - totalAllocatedAmt);
      const remainingSims = Math.max(0, (stock.openingSim || 0) + (stock.sim || 0) - totalAllocatedSims);
      
      return {
        id: stock.id,
        date: stock.date,
        openingAmount: stock.openingAmount,
        flexyBalance: stock.flexy,
        totalOpeningPool,
        totalAllocatedAmt,
        totalAllocatedSims,
        remainingPool,
        remainingSims
      };
    });
  }, [dailyStocks, allocations]);

  /**
   * Compiles outstanding shortage balances and liabilities per agent.
   * Compares approved liabilities, pending sheet projections, and calculates total exposure.
   */
  const shortageLiabilityData = useMemo(() => {
    const fscs = allUsers.filter(u => u.role === 'FSC');
    return fscs.map(fsc => {
      const fscSales = sales.filter(s => s.fscId === fsc.id);
      const approvedSales = fscSales.filter(s => s.status === 'Approved');
      const pendingSales = fscSales.filter(s => s.status === 'Pending');
      
      const totalApprovedShort = approvedSales.reduce((sum, s) => sum + s.shortAmount, 0);
      const totalPendingShort = pendingSales.reduce((sum, s) => {
        // Compute raw math for pending sheets: opening + refills + manual - closing - sales
        const totalAllocated = s.openingBalance + s.autoRefill1 + s.autoRefill2 + s.autoRefill3 + s.ecManual1 + s.ecManual2;
        const totalSalesVal = totalAllocated - s.closingBalance;
        const currentShort = Math.max(0, totalSalesVal - s.saleAmount);
        return sum + currentShort;
      }, 0);
      
      const totalLiability = totalApprovedShort + totalPendingShort;
      const lastTransactionDate = fscSales.length > 0 
        ? fscSales.reduce((latest, current) => current.date > latest ? current.date : latest, fscSales[0].date)
        : 'N/A';
         
      return {
        id: fsc.id,
        fscName: fsc.name,
        email: fsc.email,
        approvedCount: approvedSales.length,
        pendingCount: pendingSales.length,
        approvedShort: totalApprovedShort,
        pendingShort: totalPendingShort,
        totalLiability,
        lastTransactionDate
      };
    });
  }, [allUsers, sales]);

  // --- STATS CARDS MEMO CALCS ---
  const statsOverview = useMemo(() => {
    const totalSalesCollected = sales.filter(s => s.status === 'Approved').reduce((sum, s) => sum + s.saleAmount, 0);
    const totalOutstandingShorts = shortageLiabilityData.reduce((sum, d) => sum + d.totalLiability, 0);
    const avgShortRate = fscPerformanceData.length > 0 
      ? Number((fscPerformanceData.reduce((sum, d) => sum + d.shortageRate, 0) / fscPerformanceData.length).toFixed(1))
      : 0;

    return {
      totalSalesCollected,
      totalOutstandingShorts,
      avgShortRate
    };
  }, [sales, shortageLiabilityData, fscPerformanceData]);

  // --- DATA GRID COLUMN SCHEMA DEFINITIONS ---

  // 1. Reconciliation Columns
  const reconciliationColumns: GridColumn<ReportSummary>[] = [
    { key: 'date', label: 'Audit Date', type: 'date', sortable: true },
    { key: 'totalFsc', label: 'Active FSCs', type: 'number', sortable: true, render: (r) => <span className="font-bold text-slate-700">{r.totalFsc} FSC Agents</span> },
    { key: 'totalAllocated', label: 'Distributed Stock', type: 'currency', sortable: true },
    { key: 'totalSaleAmount', label: 'Sales Collected', type: 'currency', sortable: true, render: (r) => <span className="font-extrabold text-emerald-600">₹{r.totalSaleAmount.toLocaleString('en-IN')}</span> },
    { key: 'totalShort', label: 'Total Shortage', type: 'currency', sortable: true, render: (r) => <span className="font-extrabold text-red-600">₹{r.totalShort.toLocaleString('en-IN')}</span> },
    {
      key: 'statuses',
      label: 'Submissions',
      sortable: false,
      render: (r) => (
        <div className="flex gap-1.5 text-[10px] font-bold">
          {r.approvedCount > 0 && <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">{r.approvedCount} Approved</span>}
          {r.pendingCount > 0 && <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">{r.pendingCount} Pending</span>}
        </div>
      )
    }
  ];

  // 2. FSC Performance Columns
  const fscPerformanceColumns: GridColumn<any>[] = [
    { key: 'fscName', label: 'FSC Name', type: 'string', sortable: true, render: (r) => <div className="font-extrabold text-slate-900">{r.fscName} <span className="block text-[9px] text-slate-400 font-normal">{r.email}</span></div> },
    { key: 'activeDays', label: 'Working Days', type: 'number', sortable: true },
    { key: 'totalAllocated', label: 'Total Allocations', type: 'currency', sortable: true },
    { key: 'totalSales', label: 'Total Sales Collected', type: 'currency', sortable: true, render: (r) => <span className="font-bold text-emerald-600">₹{r.totalSales.toLocaleString('en-IN')}</span> },
    { key: 'totalShortages', label: 'Total Shortages', type: 'currency', sortable: true, render: (r) => <span className="font-bold text-red-600">₹{r.totalShortages.toLocaleString('en-IN')}</span> },
    { key: 'avgSalesPerDay', label: 'Avg Daily Sales', type: 'currency', sortable: true },
    { key: 'shortageRate', label: 'Shortage Rate', type: 'number', sortable: true, render: (r) => <span className={`font-black ${r.shortageRate > 5 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100' : 'text-slate-700'}`}>{r.shortageRate}%</span> }
  ];

  // 3. Inventory Flow Columns
  const inventoryFlowColumns: GridColumn<any>[] = [
    { key: 'date', label: 'Inventory Date', type: 'date', sortable: true },
    { key: 'openingAmount', label: 'Opening Cash Pool', type: 'currency', sortable: true },
    { key: 'flexyBalance', label: 'Flexy Limit Pool', type: 'currency', sortable: true },
    { key: 'totalOpeningPool', label: 'Total Stock Available', type: 'currency', sortable: true },
    { key: 'totalAllocatedAmt', label: 'Allocated Out (INR)', type: 'currency', sortable: true, render: (r) => <span className="font-bold text-slate-800">₹{r.totalAllocatedAmt.toLocaleString('en-IN')}</span> },
    { key: 'totalAllocatedSims', label: 'Allocated SIMs', type: 'number', sortable: true, render: (r) => <span className="font-medium text-slate-650">{r.totalAllocatedSims} SIMs</span> },
    { key: 'remainingPool', label: 'Remaining Cash Pool', type: 'currency', sortable: true, render: (r) => <span className="font-extrabold text-[#EE1D23]">₹{r.remainingPool.toLocaleString('en-IN')}</span> },
    { key: 'remainingSims', label: 'Vault SIMs Balance', type: 'number', sortable: true }
  ];

  // 4. Shortage Liability Columns
  const shortageLiabilityColumns: GridColumn<any>[] = [
    { key: 'fscName', label: 'Coordinator Name', type: 'string', sortable: true, render: (r) => <div className="font-extrabold text-slate-900">{r.fscName} <span className="block text-[9px] text-slate-400 font-normal">{r.email}</span></div> },
    { key: 'approvedShort', label: 'Approved Outstanding Short', type: 'currency', sortable: true, render: (r) => <span className="font-bold text-slate-800">₹{r.approvedShort.toLocaleString('en-IN')}</span> },
    { key: 'pendingShort', label: 'Pending Audit Estimates', type: 'currency', sortable: true, render: (r) => <span className="font-semibold text-slate-500">₹{r.pendingShort.toLocaleString('en-IN')}</span> },
    { key: 'totalLiability', label: 'Total Shortage Liability', type: 'currency', sortable: true, render: (r) => <span className="font-black text-red-600 bg-red-50/70 border border-red-100 px-2 py-1 rounded-xl">₹{r.totalLiability.toLocaleString('en-IN')}</span> },
    { key: 'pendingCount', label: 'Pending Sheets count', type: 'number', sortable: true, render: (r) => <span className={r.pendingCount > 0 ? 'text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full' : 'text-slate-400'}>{r.pendingCount} sheets</span> },
    { key: 'lastTransactionDate', label: 'Last Activity', type: 'string', sortable: true }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. REPORT DATE SELECTION HEADER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#EE1D23]" />
            Airtel Analytics & Reporting Workspace
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Compile audits, check coordinator liabilities, and inspect stock flows</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Audit From Date</label>
              <input
                type="date"
                value={reportFromDate}
                onChange={(e) => setReportFromDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#EE1D23]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Audit To Date</label>
              <input
                type="date"
                value={reportToDate}
                onChange={(e) => setReportToDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#EE1D23]"
              />
            </div>
          </div>

          <button
            onClick={onCompileLedger}
            className="bg-[#EE1D23] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer select-none whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4 animate-pulse" />
            Compile Ledger Data
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Sales Collected */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Approved Sales (Airtel ERP)</p>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">₹{statsOverview.totalSalesCollected.toLocaleString('en-IN')}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Total authenticated credit ledger</span>
          </div>
        </div>

        {/* Card 2: Outstanding Shortages */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-2xl text-red-600">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Outstanding Shortage Exposure</p>
            <h3 className="text-lg font-black text-red-600 mt-0.5">₹{statsOverview.totalOutstandingShorts.toLocaleString('en-IN')}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Aggregated approved + pending liabilities</span>
          </div>
        </div>

        {/* Card 3: Average Shortage Rate */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-slate-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Average Field Loss Rate</p>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{statsOverview.avgShortRate}%</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Mean coordinator shortage rate</span>
          </div>
        </div>

      </div>

      {/* 3. INTERACTIVE REPORT SELECTOR TABS */}
      <div className="border-b border-slate-200 flex gap-1 overflow-x-auto pb-1 select-none">
        <button
          onClick={() => setSelectedReportType('reconciliation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            selectedReportType === 'reconciliation'
              ? 'bg-[#EE1D23] text-white'
              : 'text-slate-650 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Reconciliation Ledger
        </button>

        <button
          onClick={() => setSelectedReportType('fsc_performance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            selectedReportType === 'fsc_performance'
              ? 'bg-[#EE1D23] text-white'
              : 'text-slate-650 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          FSC Coordinator Performance
        </button>

        <button
          onClick={() => setSelectedReportType('inventory_flow')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            selectedReportType === 'inventory_flow'
              ? 'bg-[#EE1D23] text-white'
              : 'text-slate-650 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Daily Stock Flow Ledger
        </button>

        <button
          onClick={() => setSelectedReportType('shortage_liability')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            selectedReportType === 'shortage_liability'
              ? 'bg-[#EE1D23] text-white'
              : 'text-slate-650 hover:bg-slate-100'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          Shortage & Liability Aging
        </button>
      </div>

      {/* 4. CHOSEN DATA GRID VIEW */}
      <div className="space-y-4">
        {selectedReportType === 'reconciliation' && (
          <div>
            <div className="mb-3 px-1">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Airtel Consolidated Reconciliation Ledger</h3>
              <p className="text-[10px] text-slate-400 font-medium">Shows overall daily allocations, approved sales, and shortages compiled by date.</p>
            </div>
            <DataGrid
              data={reportSummaries}
              columns={reconciliationColumns}
              searchPlaceholder="Filter by Date (YYYY-MM-DD)..."
              searchKeys={['date']}
              exportFilename={`reconciliation_report_${reportFromDate}_to_${reportToDate}`}
            />
          </div>
        )}

        {selectedReportType === 'fsc_performance' && (
          <div>
            <div className="mb-3 px-1">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">FSC Agent Performance Leaderboard</h3>
              <p className="text-[10px] text-slate-400 font-medium">Summarizes each agent's active days, allocations size, aggregated sales, and computed field loss rates.</p>
            </div>
            <DataGrid
              data={fscPerformanceData}
              columns={fscPerformanceColumns}
              searchPlaceholder="Search Coordinator Name or Email..."
              searchKeys={['fscName', 'email']}
              exportFilename={`fsc_performance_report_${reportFromDate}_to_${reportToDate}`}
            />
          </div>
        )}

        {selectedReportType === 'inventory_flow' && (
          <div>
            <div className="mb-3 px-1">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Daily Stock Pool & Allocation Flow Ledger</h3>
              <p className="text-[10px] text-slate-400 font-medium">Tracks opening inventory limits against actual coordinator distributions to audit Vault reserves.</p>
            </div>
            <DataGrid
              data={inventoryFlowData}
              columns={inventoryFlowColumns}
              searchPlaceholder="Filter by Date..."
              searchKeys={['date']}
              exportFilename={`daily_stock_flow_report_${reportFromDate}_to_${reportToDate}`}
            />
          </div>
        )}

        {selectedReportType === 'shortage_liability' && (
          <div>
            <div className="mb-3 px-1">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Shortage Liability Exposure & Aging Ledger</h3>
              <p className="text-[10px] text-slate-400 font-medium">Highlights outstanding liabilities per coordinator divided by approved vs pending-audit classifications.</p>
            </div>
            <DataGrid
              data={shortageLiabilityData}
              columns={shortageLiabilityColumns}
              searchPlaceholder="Search Coordinator Name or Email..."
              searchKeys={['fscName', 'email']}
              exportFilename={`shortage_liability_aging_report_${reportFromDate}_to_${reportToDate}`}
            />
          </div>
        )}
      </div>

    </div>
  );
};
