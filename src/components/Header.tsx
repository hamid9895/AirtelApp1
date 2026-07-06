import React from 'react';
import { Layers, ClipboardList, TrendingUp, DollarSign, FileText, Users, LogOut } from 'lucide-react';
import { UserDto } from '../types';

interface HeaderProps {
  user: UserDto;
  activeTab: 'dashboard' | 'dailyStock' | 'allocations' | 'sales' | 'reports' | 'users';
  setActiveTab: (tab: 'dashboard' | 'dailyStock' | 'allocations' | 'sales' | 'reports' | 'users') => void;
  isStandaloneMode: boolean;
  onLogOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  isStandaloneMode,
  onLogOut
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row justify-between items-center shrink-0 sticky top-0 z-40 shadow-sm/5 gap-4">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#EE1D23] rounded-full flex items-center justify-center shadow-md">
          <span className="text-white font-black text-sm">A</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Airtel <span className="font-normal text-slate-500">StockDistro</span>
            </h1>
            {isStandaloneMode ? (
              <span className="bg-sky-50 text-sky-700 border border-sky-200/60 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                Standalone Mode
              </span>
            ) : (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Cloud Linked
              </span>
            )}
          </div>
          <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">
            FSC Allocation & Sales Processing Portal
          </p>
        </div>
      </div>

      {/* Navigation Tabs (Dynamic based on Roles) */}
      <nav className="flex bg-slate-100/95 border border-slate-200/80 p-1 rounded-2xl gap-1 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard' 
              ? 'bg-[#141414] text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Dashboard
        </button>

        {/* Manager/Admin only Stock logs tab */}
        {(user.role === 'Admin' || user.role === 'Manager') && (
          <>
            <button
              onClick={() => setActiveTab('dailyStock')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dailyStock' 
                  ? 'bg-[#141414] text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Daily Stock
            </button>
            <button
              onClick={() => setActiveTab('allocations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'allocations' 
                  ? 'bg-[#141414] text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              FSC Allocations
            </button>
          </>
        )}

        {/* Sales tracking sheet available to all authenticated accounts */}
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sales' 
              ? 'bg-[#141414] text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Sales Sheets
        </button>

        {/* Administrative Only reports calculations */}
        {(user.role === 'Admin' || user.role === 'Manager') && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reports' 
                ? 'bg-[#141414] text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Reports
          </button>
        )}

        {/* Administrative Users roster control */}
        {(user.role === 'Admin' || user.role === 'Manager') && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users' 
                ? 'bg-[#141414] text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
        )}
      </nav>

      {/* Logged in credentials and sign out action */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs font-bold text-slate-900">{user.name}</p>
          <p className="text-[10px] text-[#EE1D23] font-extrabold tracking-wide uppercase">{user.role} Account</p>
        </div>
        <button
          onClick={onLogOut}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center"
          title="Log out from system"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
