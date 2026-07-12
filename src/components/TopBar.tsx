import React from 'react';
import { Sun, Moon, Sparkles, Receipt } from 'lucide-react';

interface TopBarProps {
  activeTab: string;
  themePreset: 'modern' | 'classic';
  themeMode: 'light' | 'dark';
  onSetThemePreset: (preset: 'modern' | 'classic') => void;
  onSetThemeMode: (mode: 'light' | 'dark') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  themePreset,
  themeMode,
  onSetThemePreset,
  onSetThemeMode
}) => {
  // Get formatted Title based on active tab
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'dashboard-config': return 'Configure Dashboard Allocation';
      case 'dailyStock': return 'Daily Stock Management';
      case 'allocations': return 'FSC Distributions';
      case 'sales': return 'FSC Sales Sheets';
      case 'reports': return 'Ledgers & Reports';
      case 'users': return 'Users & Security';
      case 'masters-fsc': return 'FSC Custom Fields';
      case 'masters-stock': return 'Daily Stock Fields';
      case 'configurations': return 'Global Configurations';
      case 'user-roles': return 'User Roles & Access';
      case 'admin-tables': return 'System Database Tables';
      case 'audit': return 'Security Audit Log';
      default: return 'Airtel Portal';
    }
  };

  return (
    <div className="bg-white border-b border-slate-150 px-8 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 transition-all select-none">
      {/* Title block */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
          {getTabTitle()}
        </h2>
        <p className="text-[9px] text-[#EE1D23] font-black tracking-wider uppercase mt-1.5">
          Airtel StockDistro Portal &bull; System Active
        </p>
      </div>

      {/* Theme selector controls */}
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-sm w-full md:w-auto justify-between md:justify-start">
        {/* Preset switch: Modern vs Classic */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
          <button
            onClick={() => onSetThemePreset('modern')}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              themePreset === 'modern'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Modern UI</span>
          </button>
          
          <button
            onClick={() => onSetThemePreset('classic')}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              themePreset === 'classic'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-3 h-3" />
            <span>Classic</span>
          </button>
        </div>

        {/* Mode switch: Light vs Dark */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSetThemeMode('light')}
            className={`p-1.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              themeMode === 'light'
                ? 'bg-[#EE1D23] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Switch to Light Theme"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => onSetThemeMode('dark')}
            className={`p-1.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              themeMode === 'dark'
                ? 'bg-[#EE1D23] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Switch to Dark Theme"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
