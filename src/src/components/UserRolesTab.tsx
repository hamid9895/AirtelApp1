import React, { useState, useEffect } from 'react';
import { Shield, Check, Save, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface RolePermission {
  role: 'Admin' | 'Manager' | 'Approver' | 'FSC';
  allowedTabs: string[];
}

interface UserRolesTabProps {
  token: string | null;
  onPermissionsUpdated?: () => void;
}

const AVAILABLE_TABS = [
  { id: 'dashboard', label: 'Dashboard Overview', category: 'Core Views' },
  { id: 'dailyStock', label: 'Daily Stock Ledger', category: 'Core Views' },
  { id: 'allocations', label: 'FSC Allocations Ledger', category: 'Core Views' },
  { id: 'sales', label: 'Sales Sheets', category: 'Core Views' },
  { id: 'reports', label: 'Reports & Reconciliation', category: 'Core Views' },
  { id: 'masters-fsc', label: 'FSC Custom Fields config', category: 'Master Fields' },
  { id: 'masters-stock', label: 'Daily Stock Fields config', category: 'Master Fields' },
  { id: 'users', label: 'Users & Security', category: 'Users & Controls' },
  { id: 'user-roles', label: 'User Roles Configuration', category: 'Users & Controls' },
  { id: 'audit', label: 'Audit Log Transactions Ledger', category: 'Users & Controls' },
];

const ROLES_LIST: ('Admin' | 'Manager' | 'Approver' | 'FSC')[] = ['Admin', 'Manager', 'Approver', 'FSC'];

export const UserRolesTab: React.FC<UserRolesTabProps> = ({ token, onPermissionsUpdated }) => {
  const apiFetch = (window as any).appFetch || window.fetch;
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPermissions = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch('/api/role-permissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const fetchedPerms: RolePermission[] = data.permissions || [];
        const fullPerms = ROLES_LIST.map((role) => {
          const existing = fetchedPerms.find((p) => p.role === role);
          if (existing) {
            return {
              role,
              allowedTabs: existing.allowedTabs || [],
            };
          }
          // Default fallback permissions if missing entirely in API
          let allowedTabs: string[] = [];
          if (role === 'Admin') {
            allowedTabs = ['dashboard', 'dailyStock', 'allocations', 'sales', 'reports', 'users', 'user-roles', 'masters-fsc', 'masters-stock', 'audit'];
          } else if (role === 'Manager') {
            allowedTabs = ['dashboard', 'dailyStock', 'allocations', 'sales', 'reports', 'masters-fsc', 'masters-stock', 'audit'];
          } else if (role === 'Approver') {
            allowedTabs = ['dashboard', 'sales', 'reports'];
          } else if (role === 'FSC') {
            allowedTabs = ['dashboard', 'sales'];
          }
          return { role, allowedTabs };
        });
        setPermissions(fullPerms);
      } else {
        setErrorMsg(data.error || 'Failed to fetch role permissions.');
      }
    } catch (e) {
      setErrorMsg('Network error fetching role permissions matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [token]);

  const handleCheckboxChange = (role: 'Admin' | 'Manager' | 'Approver' | 'FSC', tabId: string, checked: boolean) => {
    // Admin is always fully authorized and cannot be edited
    if (role === 'Admin') return;

    setPermissions((prev) =>
      prev.map((p) => {
        if (p.role === role) {
          const updatedTabs = checked
            ? [...p.allowedTabs, tabId]
            : p.allowedTabs.filter((t) => t !== tabId);
          return { ...p, allowedTabs: updatedTabs };
        }
        return p;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await apiFetch('/api/role-permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Role access permissions updated successfully.');
        if (onPermissionsUpdated) {
          onPermissionsUpdated();
        }
      } else {
        setErrorMsg(data.error || 'Failed to save permissions.');
      }
    } catch (e) {
      setErrorMsg('Network error updating role permissions configuration.');
    } finally {
      setSaving(false);
    }
  };

  const rolesList = ROLES_LIST;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#EE1D23]/10 text-[#EE1D23] rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">Role Access Permissions Matrix</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Configure layout views and ledger page visibility privileges for each user tier.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPermissions}
            disabled={loading || saving}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Permissions Grid"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="px-4 py-2.5 bg-[#EE1D23] text-white hover:bg-red-700 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-red-500/10 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Permissions
          </button>
        </div>
      </div>

      {/* FEEDBACK LABELS */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-semibold text-rose-800 flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] font-semibold text-emerald-800 flex items-center gap-2.5 animate-fade-in">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* INFO NOTIFICATION */}
      <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2.5">
        <Info className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold uppercase tracking-wide">Administrator Privilege Enforcement:</span>
          <p className="mt-0.5 text-[11px] text-amber-800 leading-normal">
            The <strong>Admin</strong> tier is hardcoded as always fully authorized for all ledgers and masters to ensure access is never locked. Other roles can have their page lists adjusted dynamically below.
          </p>
        </div>
      </div>

      {/* PERMISSIONS TABLE */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#EE1D23]" />
          <p className="text-xs text-slate-400 font-extrabold tracking-wider uppercase">Loading role permissions matrix...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden select-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Page / Access View</th>
                  {rolesList.map((role) => (
                    <th key={role} className="py-4 px-6 text-center text-xs font-black text-slate-500 uppercase tracking-wider min-w-[120px]">
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {AVAILABLE_TABS.map((tab) => {
                  return (
                    <tr key={tab.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="py-3.5 px-6">
                        <div className="flex flex-col">
                          <span className="text-slate-800 text-xs font-bold">{tab.label}</span>
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">
                            {tab.category}
                          </span>
                        </div>
                      </td>
                      {rolesList.map((role) => {
                        const rolePerm = permissions.find((p) => p.role === role);
                        const isChecked = role === 'Admin' || (rolePerm?.allowedTabs.includes(tab.id) ?? false);
                        const isDisabled = role === 'Admin';

                        return (
                          <td key={role} className="py-3.5 px-6 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={(e) => handleCheckboxChange(role, tab.id, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  isDisabled
                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                    : isChecked
                                    ? 'bg-[#EE1D23] border-[#EE1D23] text-white shadow-sm'
                                    : 'border-slate-300 bg-white hover:border-[#EE1D23]'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
