import React from 'react';
import { Plus, ArrowRight, AlertTriangle, Users, Layers } from 'lucide-react';
import { DailyStock, Sale, UserDto } from '../types';

interface DashboardTabProps {
  dailyStocks: DailyStock[];
  sales: Sale[];
  allUsers: UserDto[];
  totalStockOnHandAmount: number;
  totalActiveAgentsCount: number;
  criticalAirtelAlerts: Array<{ item: string; threshold: string; hub: string; level: string }>;
  setActiveTab: (tab: 'dashboard' | 'dailyStock' | 'allocations' | 'sales' | 'reports' | 'users') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  dailyStocks,
  sales,
  allUsers,
  totalStockOnHandAmount,
  totalActiveAgentsCount,
  criticalAirtelAlerts,
  setActiveTab
}) => {
  const growth = React.useMemo(() => {
    if (!dailyStocks || dailyStocks.length < 2) return null;
    const current = dailyStocks[0].openingAmount;
    const previous = dailyStocks[1].openingAmount;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }, [dailyStocks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-grow">
      
      {/* Primary Stock Stat - Large Bento Grid Widget */}
      <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Total On-Hand Inventory Pool
              </h2>
              <p className="text-5xl font-black text-slate-900 tracking-tight mt-1">
                ₹{totalStockOnHandAmount.toLocaleString('en-IN')}
              </p>
              {growth !== null ? (
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

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-slate-400 text-[10px] font-bold uppercase">Flexy Balance</p>
              <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                ₹{(dailyStocks[0]?.flexy ?? 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-slate-400 text-[10px] font-bold uppercase">SIM Inventory</p>
              <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                {(dailyStocks[0]?.sim ?? 0)} Units
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Bar Charts (Simulating weekly cycle stats) */}
        <div className="mt-8">
          <div className="flex items-end gap-1.5 h-24">
            <div className="flex-1 bg-slate-100 rounded-lg h-[40%]" title="Mon"></div>
            <div className="flex-1 bg-slate-100 rounded-lg h-[60%]" title="Tue"></div>
            <div className="flex-1 bg-slate-100 rounded-lg h-[35%]" title="Wed"></div>
            <div className="flex-1 bg-[#EE1D23] rounded-lg h-[85%]" title="Thu (Peak Sales)"></div>
            <div className="flex-1 bg-slate-100 rounded-lg h-[55%]" title="Fri"></div>
            <div className="flex-1 bg-slate-100 rounded-lg h-[70%]" title="Sat"></div>
            <div className="flex-1 bg-slate-200 rounded-lg h-[90%]" title="Sun"></div>
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
      </div>

      {/* Distribution Efficiency - Active FSC count representation */}
      <div className="bg-[#141414] rounded-3xl p-6 text-white flex flex-col justify-between">
        <div>
          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
            Active FSC Agents
          </p>
          <p className="text-4xl font-black mt-2 text-white">
            {totalActiveAgentsCount}
          </p>
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

      {/* Quick Actions Card */}
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

      {/* Low Stock Watch - Critical Threshold Alerts */}
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

      {/* Recent Submissions Feed */}
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

      {/* Simulated Live Hub Coverage Map */}
      <div className="md:col-span-2 bg-slate-900 rounded-3xl relative overflow-hidden flex items-center justify-center min-h-[160px] p-6 text-white">
        <div className="absolute inset-0 bg-radial from-slate-800/40 to-slate-950 opacity-90"></div>
        <div className="relative z-10 text-center space-y-1">
          <p className="text-[9px] text-red-500 font-extrabold uppercase tracking-widest">
            NCR Coverage Hub Network
          </p>
          <p className="font-extrabold text-white text-sm">Real-Time Distribution Map</p>
          <p className="text-[10px] text-slate-400 font-bold font-mono">5 active hubs connected</p>
        </div>

        {/* Pulsing Hot Spots */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-[#EE1D23] rounded-full border-2 border-white shadow-lg shadow-red-500/50 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-[#EE1D23] rounded-full border-2 border-white shadow-lg shadow-red-500/50 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/2 w-3 h-3 bg-[#EE1D23] rounded-full border-2 border-white shadow-lg shadow-red-500/50"></div>
      </div>

    </div>
  );
};
