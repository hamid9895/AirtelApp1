import React from 'react';
import { Plus, ArrowRight, AlertTriangle, Users, Layers, Settings } from 'lucide-react';
import { DailyStock, Sale, UserDto, Allocation } from '../types';
import { DashboardConfig, computeDashboardMetrics } from './DashboardConfigTab';

interface DashboardTabProps {
  dailyStocks: DailyStock[];
  sales: Sale[];
  allocations: Allocation[];
  allUsers: UserDto[];
  totalStockOnHandAmount: number;
  totalActiveAgentsCount: number;
  criticalAirtelAlerts: Array<{ item: string; threshold: string; hub: string; level: string }>;
  setActiveTab: (tab: 'dashboard' | 'dailyStock' | 'allocations' | 'sales' | 'reports' | 'users' | 'masters-fsc' | 'masters-stock' | 'user-roles' | 'audit' | 'configurations' | 'admin-tables' | 'dashboard-config') => void;
  config: DashboardConfig;
  globalConfig: { commissionPercentage: number; simAmount: number } | null;
  user: UserDto | null;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  dailyStocks,
  sales,
  allocations,
  allUsers,
  totalStockOnHandAmount,
  totalActiveAgentsCount,
  criticalAirtelAlerts,
  setActiveTab,
  config,
  globalConfig,
  user
}) => {
  const simPrice = globalConfig?.simAmount || 150;

  // Safe parsing of config with fallback default settings
  const activeConfig = React.useMemo(() => {
    return {
      totalPoolLabel: 'Total On-Hand Inventory Pool',
      flexyLabel: 'Flexy Balance',
      simLabel: 'SIM Inventory',
      closingLabel: 'Closing Balance',
      onHandPositions: ['flexy', 'sim', 'closing'],
      ...config
    };
  }, [config]);

  // Real-time computed values using chosen formula
  const computed = React.useMemo(() => {
    return computeDashboardMetrics(dailyStocks, sales, allocations, activeConfig, simPrice);
  }, [dailyStocks, sales, allocations, activeConfig, simPrice]);

  const growth = React.useMemo(() => {
    if (!dailyStocks || dailyStocks.length < 2) return null;
    const current = dailyStocks[0].openingAmount;
    const previous = dailyStocks[1].openingAmount;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }, [dailyStocks]);

  // Determine final displayed values (using manual allocations if overridden)
  const displayOnHandAmount = computed.totalPoolVal;
  const displayActiveAgents = activeConfig.overrideActiveAgents ? activeConfig.manualActiveAgents : totalActiveAgentsCount;

  // Determine chart values
  const monVal = activeConfig.useManualWeeklyData ? activeConfig.weeklyData.mon : 40;
  const tueVal = activeConfig.useManualWeeklyData ? activeConfig.weeklyData.tue : 60;
  const wedVal = activeConfig.useManualWeeklyData ? activeConfig.weeklyData.wed : 35;
  const thuVal = activeConfig.useManualWeeklyData ? activeConfig.weeklyData.thu : 85;
  const friVal = activeConfig.useManualWeeklyData ? activeConfig.weeklyData.fri : 55;
  const satVal = activeConfig.useManualWeeklyData ? activeConfig.weeklyData.sat : 70;
  const sunVal = activeConfig.useManualWeeklyData ? activeConfig.weeklyData.sun : 90;

  // Check if any widget is visible
  const hasVisibleWidgets = 
    activeConfig.showOnHandInventory || 
    activeConfig.showActiveAgents || 
    activeConfig.showQuickActions || 
    activeConfig.showLowStockWatch || 
    activeConfig.showRecentSales || 
    activeConfig.showCoverageMap;

  if (!hasVisibleWidgets) {
    const isAdminOrManager = user && (user.role === 'Admin' || user.role === 'Manager');
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 animate-fade-in my-8 shadow-sm">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
          Dashboard is Empty
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          {isAdminOrManager 
            ? "All standard widgets have been de-allocated in the settings. Use the Dashboard Configuration menu to choose which metrics you would like to display."
            : "All standard widgets have been de-allocated in the settings. Please contact an Administrator or Manager to configure the dashboard metrics."
          }
        </p>
        {isAdminOrManager && (
          <button
            onClick={() => setActiveTab('dashboard-config')}
            className="bg-[#EE1D23] hover:bg-red-700 text-white text-xs font-black uppercase px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Dashboard</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-grow animate-fade-in">
      
      {/* Primary Stock Stat - Large Bento Grid Widget */}
      {activeConfig.showOnHandInventory && (
        <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  {activeConfig.totalPoolLabel}
                </h2>
                <p className="text-5xl font-black text-slate-900 tracking-tight mt-1">
                  ₹{displayOnHandAmount.toLocaleString('en-IN')}
                </p>
                {activeConfig.overrideOnHandAmount ? (
                  <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider mt-1.5">
                    ● Allocated Manual Overwrite Active
                  </p>
                ) : growth !== null ? (
                  <p className={`text-xs font-semibold mt-1 ${growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}% from last daily stock
                  </p>
                ) : (
                  <p className="text-slate-400 text-xs font-semibold mt-1">
                    No historical cycle data
                  </p>
                )}
              </div>
              <span className="bg-[#EE1D23]/10 text-[#EE1D23] px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide">
                Live Stock
              </span>
            </div>

            {/* Sub-Metrics Group Grid (ordered by positioning configuration) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              {(computed.widgets || []).filter(w => w.visible).map((widget) => {
                return (
                  <div key={widget.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between hover:border-slate-300 transition-all">
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">{widget.label}</p>
                    <p className="text-base font-extrabold text-slate-800 mt-1">
                      {widget.isCurrency 
                        ? `₹${Math.round(widget.computedValue).toLocaleString('en-IN')}` 
                        : `${Math.round(widget.computedValue).toLocaleString('en-IN')} Units`
                      }
                    </p>
                    {widget.override && (
                      <span className="text-[8px] text-indigo-500 font-bold uppercase block mt-1">● Override</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Bar Charts (Simulating weekly cycle stats) */}
          <div className="mt-8">
            <div className="flex items-end gap-1.5 h-24">
              <div 
                className="flex-1 bg-slate-100 rounded-lg transition-all duration-300" 
                style={{ height: `${monVal}%` }} 
                title={`Mon: ${monVal}%`}
              ></div>
              <div 
                className="flex-1 bg-slate-100 rounded-lg transition-all duration-300" 
                style={{ height: `${tueVal}%` }} 
                title={`Tue: ${tueVal}%`}
              ></div>
              <div 
                className="flex-1 bg-slate-100 rounded-lg transition-all duration-300" 
                style={{ height: `${wedVal}%` }} 
                title={`Wed: ${wedVal}%`}
              ></div>
              <div 
                className="flex-1 bg-[#EE1D23] rounded-lg transition-all duration-300" 
                style={{ height: `${thuVal}%` }} 
                title={`Thu (Peak Sales): ${thuVal}%`}
              ></div>
              <div 
                className="flex-1 bg-slate-100 rounded-lg transition-all duration-300" 
                style={{ height: `${friVal}%` }} 
                title={`Fri: ${friVal}%`}
              ></div>
              <div 
                className="flex-1 bg-slate-100 rounded-lg transition-all duration-300" 
                style={{ height: `${satVal}%` }} 
                title={`Sat: ${satVal}%`}
              ></div>
              <div 
                className="flex-1 bg-slate-200 rounded-lg transition-all duration-300" 
                style={{ height: `${sunVal}%` }} 
                title={`Sun: ${sunVal}%`}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Efficiency - Active FSC count representation */}
      {config.showActiveAgents && (
        <div className="bg-[#141414] rounded-3xl p-6 text-white flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
              Active FSC Agents
            </p>
            <p className="text-4xl font-black mt-2 text-white">
              {displayActiveAgents}
            </p>
            {config.overrideActiveAgents && (
              <p className="text-indigo-400 text-[8px] font-bold uppercase tracking-wider mt-1">
                Allocated Override
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#141414] bg-red-600 text-[10px] flex items-center justify-center font-bold text-white">RK</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#141414] bg-[#EE1D23] text-[10px] flex items-center justify-center font-bold text-white">SV</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#141414] bg-slate-700 text-[10px] flex items-center justify-center font-bold text-white">AM</div>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">
              100% active NCR coverage
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions Card */}
      {config.showQuickActions && (
        <div className="bg-[#EE1D23] rounded-3xl p-6 text-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Plus className="w-8 h-8 text-white" />
            <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-md">
              Console shortcuts
            </span>
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-black leading-tight">
              Record FSC<br />Daily Sales
            </p>
            <button
              onClick={() => setActiveTab('sales')}
              className="bg-white text-[#EE1D23] font-bold text-xs px-4 py-2 rounded-xl transition-all hover:bg-slate-100 flex items-center gap-1 cursor-pointer select-none"
            >
              Log Sales Sheet
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Low Stock Watch - Critical Threshold Alerts */}
      {config.showLowStockWatch && (
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Critical Alerts / Low Stock Watch
            </h3>
            <span className="bg-rose-50 text-rose-700 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Attention Required
            </span>
          </div>

          <div className="space-y-3">
            {criticalAirtelAlerts.map((alert, i) => (
              <div 
                key={i} 
                className={`flex items-center justify-between p-3 rounded-2xl border ${
                  alert.level === 'rose' 
                    ? 'bg-rose-50/50 border-rose-100 text-rose-900' 
                    : 'bg-amber-50/50 border-amber-100 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${alert.level === 'rose' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{alert.item}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{alert.hub}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold">
                  {alert.threshold}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Submissions Feed */}
      {config.showRecentSales && (
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
              Recent Sales Reports Status
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                    <th className="pb-1">FSC</th>
                    <th className="pb-1 text-center">Amount</th>
                    <th className="pb-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sales.slice(0, 3).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-800">
                        {allUsers.find(u => u.id === s.fscId)?.name || s.fscName || 'FSC'}
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-600">
                        ₹{s.saleAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          s.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          s.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          s.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('sales')}
            className="text-[10px] text-[#EE1D23] font-bold uppercase tracking-wider text-right hover:underline mt-4 self-end"
          >
            Go to Sales Sheet Queue →
          </button>
        </div>
      )}

      {/* Simulated Live Hub Coverage Map */}
      {config.showCoverageMap && (
        <div className="md:col-span-2 bg-slate-900 rounded-3xl relative overflow-hidden flex items-center justify-center min-h-[160px] p-6 text-white">
          <div className="absolute inset-0 bg-radial from-slate-800/40 to-slate-950 opacity-90"></div>
          <div className="relative z-10 text-center space-y-1">
            <p className="text-[9px] text-red-500 font-extrabold uppercase tracking-widest">
              {config.coverageMapMessage}
            </p>
            <p className="font-extrabold text-white text-sm">Real-Time Distribution Map</p>
            <p className="text-[10px] text-slate-400 font-bold font-mono">{config.activeHubsCount} active hubs connected</p>
          </div>

          {/* Pulsing Hot Spots */}
          <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-[#EE1D23] rounded-full border-2 border-white shadow-lg shadow-red-500/50 animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-[#EE1D23] rounded-full border-2 border-white shadow-lg shadow-red-500/50 animate-bounce"></div>
          <div className="absolute top-1/2 right-1/2 w-3 h-3 bg-[#EE1D23] rounded-full border-2 border-white shadow-lg shadow-red-500/50"></div>
        </div>
      )}

    </div>
  );
};
