import React from 'react';
import { LockOpen, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface LoginViewProps {
  loginEmail: string;
  setLoginEmail: (email: string) => void;
  loginPassword: string;
  setLoginPassword: (password: string) => void;
  loading: boolean;
  errorMsg: string | null;
  successMsg: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loading,
  errorMsg,
  successMsg,
  onSubmit
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-red-500/10 selection:text-red-950 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden animate-fade-in p-8">
        
        {/* Top Header Section */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#EE1D23] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/25">
            <span className="text-white font-black text-lg">A</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Airtel <span className="font-light text-slate-500">StockDistro</span>
          </h1>
          <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">
            FSC Stock & Sales Management
          </p>
        </div>

        {/* Error Alert Display */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-xs animate-slide-down">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-bold">Authentication failed:</span> {errorMsg}
            </div>
          </div>
        )}

        {/* Success Alert Display */}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3 text-xs animate-slide-down">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>{successMsg}</div>
          </div>
        )}

        {/* Login Credentials Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Staff Email Address
            </label>
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="manager@airtel.com"
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#EE1D23]/50 focus:outline-none rounded-2xl px-4 py-3 text-sm text-slate-800 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Security Password
            </label>
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#EE1D23]/50 focus:outline-none rounded-2xl px-4 py-3 text-sm text-slate-800 transition-colors"
            />
          </div>

          {/* Form Submit Button with Loading Indicator */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#EE1D23] hover:bg-red-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-red-500/15 flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                Verifying Security Tokens...
              </>
            ) : (
              <>
                <LockOpen className="w-4 h-4" />
                Authenticate Staff Account
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts Helper block */}
        <div className="mt-8 border-t border-slate-150 pt-6 text-center text-xs text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-500 mb-2">Predefined Accounts for Testing & User Management:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-left">
            <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
              <p className="font-extrabold text-red-700">Admin Account</p>
              <p className="font-mono text-slate-600 mt-0.5">admin@airtel.com</p>
              <p className="font-mono text-slate-400">pwd: admin123</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <p className="font-extrabold text-slate-700">Manager Account</p>
              <p className="font-mono text-slate-600 mt-0.5">manager@airtel.com</p>
              <p className="font-mono text-slate-400">pwd: manager123</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <p className="font-extrabold text-slate-700">FSC Agent Account</p>
              <p className="font-mono text-slate-600 mt-0.5">rajesh@airtel.com</p>
              <p className="font-mono text-slate-400">pwd: fsc123</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
