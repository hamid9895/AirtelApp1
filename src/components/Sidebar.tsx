import React, { useState } from 'react';
import { Layers, ClipboardList, TrendingUp, DollarSign, FileText, Users, LogOut, Settings2, Menu, X, HelpCircle, Shield, History, Database } from 'lucide-react';
import { UserDto, DbStatusDto } from '../types';

interface SidebarProps {
  user: UserDto;
  activeTab: 'dashboard' | 'dailyStock' | 'allocations' | 'sales' | 'reports' | 'users' | 'masters-fsc' | 'masters-stock' | 'user-roles' | 'audit' | 'configurations' | 'admin-tables';
  setActiveTab: (tab: 'dashboard' | 'dailyStock' | 'allocations' | 'sales' | 'reports' | 'users' | 'masters-fsc' | 'masters-stock' | 'user-roles' | 'audit' | 'configurations' | 'admin-tables') => void;
  isStandaloneMode: boolean;
  dbStatus?: DbStatusDto | null;
  onLogOut: () => void;
  allowedTabs: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  isStandaloneMode,
  dbStatus,
  onLogOut,
  allowedTabs
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdminOrManager = user.role === 'Admin' || user.role === 'Manager';

  const hasAccess = (tabId: string) => {
    if (user.role === 'Admin') return true;
    return allowedTabs.includes(tabId);
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Layers,
      visible: hasAccess('dashboard')
    },
    {
      id: 'dailyStock',
      label: 'Daily Stock',
      icon: ClipboardList,
      visible: isAdminOrManager && hasAccess('dailyStock')
    },
    {
      id: 'allocations',
      label: 'FSC Allocations',
      icon: TrendingUp,
      visible: isAdminOrManager && hasAccess('allocations')
    },
    {
      id: 'sales',
      label: 'Sales Sheets',
      icon: DollarSign,
      visible: hasAccess('sales')
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      visible: (isAdminOrManager || user.role === 'Approver') && hasAccess('reports')
    }
  ];

  const masterItems = [
    {
      id: 'masters-fsc',
      label: 'FSC Custom Fields',
      icon: Settings2,
      visible: isAdminOrManager && hasAccess('masters-fsc')
    },
    {
      id: 'masters-stock',
      label: 'Daily Stock Fields',
      icon: Settings2,
      visible: isAdminOrManager && hasAccess('masters-stock')
    },
    {
      id: 'configurations',
      label: 'Configurations',
      icon: Settings2,
      visible: isAdminOrManager && hasAccess('configurations')
    }
  ];

  const adminItems = [
    {
      id: 'users',
      label: 'Users & Security',
      icon: Users,
      visible: user.role === 'Admin' && hasAccess('users')
    },
    {
      id: 'user-roles',
      label: 'User Roles',
      icon: Shield,
      visible: user.role === 'Admin' && hasAccess('user-roles')
    },
    {
      id: 'admin-tables',
      label: 'Tables',
      icon: Database,
      visible: user.role === 'Admin'
    },
    {
      id: 'audit',
      label: 'Audit Log',
      icon: History,
      visible: isAdminOrManager && hasAccess('audit')
    }
  ];

  const visibleNavItems = navItems.filter(item => item.visible);
  const visibleMasterItems = masterItems.filter(item => item.visible);
  const visibleAdminItems = adminItems.filter(item => item.visible);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Identity */}
      <div className="p-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EE1D23] rounded-full flex items-center justify-center shadow-lg shadow-red-500/25">
            <span className="text-white font-black text-base">A</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
              Airtel <span className="font-light text-slate-500">StockDistro</span>
            </h1>
            <p className="text-[8px] text-slate-400 font-extrabold tracking-widest uppercase mt-1">
              FSC Stock & Sales Portal
            </p>
          </div>
        </div>

        {/* Network status connection indicator */}
        <div className="mt-4 space-y-2">
          {isStandaloneMode ? (
            <div className="bg-sky-50 text-sky-700 border border-sky-200/50 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl flex items-center gap-1.5 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
              Standalone (Local Mode)
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl flex items-center gap-1.5 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Cloud Server Linked
              </div>
              
              {/* Database status details */}
              {dbStatus ? (
                <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-150 text-[10px] leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                    <span>Database: {dbStatus.type}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${dbStatus.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {dbStatus.connected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {dbStatus.url && (
                    <div className="mt-1 font-mono text-[8px] text-slate-500 break-all select-all leading-tight" title="Masked database connection">
                      {dbStatus.url}
                    </div>
                  )}
                  {dbStatus.error && (
                    <div className="mt-1 text-[8px] font-semibold text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-100/50 leading-normal break-words">
                      Error: {dbStatus.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[9px] text-slate-400 italic px-1">
                  Checking database status...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation items lists */}
      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        {/* Core Sections */}
        {visibleNavItems.length > 0 && (
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-3.5 block mb-2">Core Ledger Views</span>
            {visibleNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#EE1D23] text-white shadow-md shadow-red-500/10' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Master configuration items - ALWAYS VISIBLE TO ADMINS/MANAGERS HERE */}
        {visibleMasterItems.length > 0 && (
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-3.5 block mb-2">Master Settings (Fields)</span>
            {visibleMasterItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#EE1D23] text-white shadow-md shadow-red-500/10' 
                      : 'text-slate-600 hover:text-[#EE1D23] hover:bg-red-50/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Users & Administrative Control */}
        {visibleAdminItems.length > 0 && (
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-3.5 block mb-2">Administrator settings</span>
            {visibleAdminItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#EE1D23] text-white shadow-md shadow-red-500/10' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Logged in User Section & Sign out */}
      <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-3">
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
              <Users className="w-4 h-4 text-slate-500" />
            </div>
          )}
          <div className="min-w-0 flex-grow">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight">{user.name}</p>
            <p className="text-[8px] text-[#EE1D23] font-black tracking-widest uppercase mt-0.5">{user.role} Privilege</p>
          </div>
          
          <button
            onClick={onLogOut}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-150 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Log out from system"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP PERMANENT LEFT SIDEBAR */}
      <aside className="w-64 border-r border-slate-200 shrink-0 hidden lg:flex flex-col bg-white h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* 2. MOBILE TOP ACTION BAR */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#EE1D23] rounded-full flex items-center justify-center">
            <span className="text-white font-black text-xs">A</span>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 leading-none">
              Airtel <span className="font-light text-slate-500">StockDistro</span>
            </h1>
            <p className="text-[7px] text-[#EE1D23] font-black uppercase tracking-wider mt-0.5">
              {user.role} account
            </p>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* 3. MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop mask */}
          <div 
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity"
          ></div>

          {/* Drawer sheet content */}
          <div className="relative w-64 bg-white border-r border-slate-200 h-full flex flex-col p-0 z-50 animate-slide-right shadow-2xl">
            <div className="absolute top-4 right-4 z-55">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};
