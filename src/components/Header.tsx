import React, { useState, useRef, useEffect } from 'react';
import { Layers, ClipboardList, TrendingUp, DollarSign, FileText, Users, LogOut, ChevronDown, Settings2 } from 'lucide-react';
import { UserDto } from '../types';

interface HeaderProps {
  user: UserDto;
  activeTab: 'dashboard' | 'dailyStock' | 'allocations' | 'sales' | 'reports' | 'users' | 'masters-fsc' | 'masters-stock';
  setActiveTab: (tab: 'dashboard' | 'dailyStock' | 'allocations' | 'sales' | 'reports' | 'users' | 'masters-fsc' | 'masters-stock') => void;
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMastersActive = activeTab === 'masters-fsc' || activeTab === 'masters-stock';

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

        {/* Masters dropdown (Manager/Admin only) */}
        {(user.role === 'Admin' || user.role === 'Manager') && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isMastersActive
                  ? 'bg-[#141414] text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              Masters
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    setActiveTab('masters-fsc');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                    activeTab === 'masters-fsc' ? 'text-[#EE1D23] bg-slate-50/50' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EE1D23]/80"></span>
                  FSC Custom Fields
                </button>
                <button
                  onClick={() => {
                    setActiveTab('masters-stock');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                    activeTab === 'masters-stock' ? 'text-[#EE1D23] bg-slate-50/50' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500/80"></span>
                  Daily Stock Custom Fields
                </button>
              </div>
            )}
          </div>
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
        {user.photo ? (
          <img
            src={user.photo}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
            <Users className="w-4 h-4 text-slate-500" />
          </div>
        )}
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
