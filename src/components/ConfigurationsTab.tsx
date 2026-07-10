import React, { useState, useEffect } from 'react';
import { Settings2, Save, RefreshCw, AlertCircle, CheckCircle, Percent, Disc } from 'lucide-react';

interface ConfigurationsTabProps {
  token: string | null;
  onConfigUpdated?: () => void;
}

export const ConfigurationsTab: React.FC<ConfigurationsTabProps> = ({ token, onConfigUpdated }) => {
  const apiFetch = (window as any).appFetch || window.fetch;
  const [commissionPercentage, setCommissionPercentage] = useState<string | number>('3.0');
  const [simAmount, setSimAmount] = useState<string | number>('150.0');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch('/api/configurations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.configurations) {
        setCommissionPercentage(data.configurations.commissionPercentage);
        setSimAmount(data.configurations.simAmount);
      } else {
        setErrorMsg(data.error || 'Failed to fetch global configurations.');
      }
    } catch (e) {
      setErrorMsg('Network error fetching configuration settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const commNum = Number(commissionPercentage);
    const simNum = Number(simAmount);

    if (isNaN(commNum) || commNum < 0 || commNum > 100) {
      setErrorMsg('Commission percentage must be a valid number between 0 and 100.');
      setSaving(false);
      return;
    }

    if (isNaN(simNum) || simNum < 0) {
      setErrorMsg('SIM amount must be a non-negative number.');
      setSaving(false);
      return;
    }

    try {
      const res = await apiFetch('/api/configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          commissionPercentage: commNum,
          simAmount: simNum,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Configurations successfully updated!');
        if (data.configurations) {
          setCommissionPercentage(data.configurations.commissionPercentage);
          setSimAmount(data.configurations.simAmount);
        }
        if (onConfigUpdated) {
          onConfigUpdated();
        }
      } else {
        setErrorMsg(data.error || 'Failed to update configurations.');
      }
    } catch (e) {
      setErrorMsg('Network error saving configuration settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-[#EE1D23] rounded-2xl">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Global Configurations</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Set core metrics for commissions, SIM handovers, and automatic returns
              </p>
            </div>
          </div>
          <button
            onClick={fetchConfig}
            disabled={loading || saving}
            className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            title="Refresh settings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-700 font-semibold flex items-start gap-2.5 mb-4 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-700 font-semibold flex items-start gap-2.5 mb-4 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs font-semibold">
            <RefreshCw className="w-8 h-8 animate-spin text-[#EE1D23]" />
            <span>Loading global parameters...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              {/* Commission Percentage Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-slate-400" />
                    Commission Percentage (%)
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                    Current: {commissionPercentage}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={commissionPercentage}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow empty or partial decimal digits
                      if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                        setCommissionPercentage(val);
                      }
                    }}
                    placeholder="Enter commission rate (e.g. 3.0)"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#EE1D23] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  The commission percentage is automatically applied when FSC agents return their sales sheets. 
                  Allocations represent full amounts with commission, while actual sales are recorded at net return rates.
                </p>
              </div>

              {/* SIM Amount Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 text-slate-400" />
                    SIM Handover Unit Amount (₹)
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                    Current: ₹{simAmount}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={simAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                        setSimAmount(val);
                      }
                    }}
                    placeholder="Enter unit amount per SIM card (e.g. 150)"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#EE1D23] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  The default value per individual SIM card allocated to an FSC coordinator. This amount is automatically populated as a liability calculation or custom visual reference where appropriate.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#EE1D23] hover:bg-red-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Configurations...' : 'Save Configuration Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
