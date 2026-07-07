import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, AlertCircle, FileText, Download, Calendar, Eye } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  targetType: 'dailyStock' | 'allocation' | 'sale' | 'customField' | 'rolePermission';
  details: string;
}

interface AuditLogTabProps {
  token: string | null;
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ token }) => {
  const apiFetch = (window as any).appFetch || window.fetch;
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.auditLogs);
      } else {
        setErrorMsg(data.error || 'Failed to fetch transaction audits.');
      }
    } catch (e) {
      setErrorMsg('Network error compiling transaction audit ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  // Filter logs based on inputs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter ? log.action === actionFilter : true;
    const matchesTarget = targetFilter ? log.targetType === targetFilter : true;

    return matchesSearch && matchesAction && matchesTarget;
  });

  const getActionStyles = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'UPDATE':
        return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200/50';
      case 'SUBMIT':
        return 'bg-sky-50 text-sky-700 border-sky-200/50';
      case 'APPROVE':
        return 'bg-teal-50 text-teal-700 border-teal-200/50';
      case 'REJECT':
        return 'bg-red-50 text-red-700 border-red-200/50';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/50';
    }
  };

  const getTargetLabel = (type: string) => {
    switch (type) {
      case 'dailyStock':
        return 'Daily Stock';
      case 'allocation':
        return 'Allocation';
      case 'sale':
        return 'Sales Sheet';
      case 'customField':
        return 'Custom Fields';
      case 'rolePermission':
        return 'Role Permission';
      default:
        return type;
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Timestamp', 'Operator Name', 'Operator Email', 'Operator Role', 'Action', 'Target Ledger', 'Activity Details'];
    const rows = filteredLogs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.userName,
      log.userEmail,
      log.userRole,
      log.action,
      getTargetLabel(log.targetType),
      log.details,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((val) => {
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `airtel_stockdistro_audit_trail.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BLOCK */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-none">Security & Transaction Audit Trail</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-1.5 leading-relaxed">
              Read-only immutable sequence logs of ledger mutations, inventory alterations, allocations, and status updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Logs Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0 || loading}
            className="px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-slate-900/10 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Audit Trail (CSV)
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-semibold text-rose-800 flex items-center gap-2.5">
          <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by details, operator name or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-1 focus:ring-[#EE1D23] focus:border-[#EE1D23] rounded-xl text-xs font-semibold outline-none transition-all"
          />
        </div>

        <div className="flex gap-3 shrink-0">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-[#EE1D23] focus:border-[#EE1D23] rounded-xl text-xs font-bold text-slate-700 outline-none transition-all cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="SUBMIT">SUBMIT</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
          </select>

          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-[#EE1D23] focus:border-[#EE1D23] rounded-xl text-xs font-bold text-slate-700 outline-none transition-all cursor-pointer"
          >
            <option value="">All Ledger Targets</option>
            <option value="dailyStock">Daily Stock</option>
            <option value="allocation">Allocation</option>
            <option value="sale">Sales Sheet</option>
            <option value="customField">Custom Fields</option>
            <option value="rolePermission">Role Permission</option>
          </select>
        </div>
      </div>

      {/* LOGS TABLE LIST */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#EE1D23]" />
          <p className="text-xs text-slate-400 font-extrabold tracking-wider uppercase">Compiling transaction history...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
          <FileText className="w-10 h-10 text-slate-300" />
          <h4 className="text-xs font-extrabold text-slate-700 uppercase mt-2">No transaction logs match search</h4>
          <p className="text-[11px] text-slate-400">Try loosening your filtering terms or refreshing the audit ledger.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider min-w-[140px]">Date & Time</th>
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider min-w-[180px]">Operator Profile</th>
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-center min-w-[100px]">Action</th>
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider min-w-[120px]">Target Ledger</th>
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">Activity Details</th>
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 transition-all">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500 font-semibold">{new Date(log.timestamp).toLocaleDateString()}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-extrabold leading-tight">{log.userName}</span>
                        <span className="text-[10px] text-slate-400 font-semibold leading-tight mt-0.5">{log.userEmail}</span>
                        <span className="text-[8px] text-[#EE1D23] uppercase tracking-widest font-black mt-1">
                          {log.userRole} privilege
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border ${getActionStyles(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="text-slate-800 font-extrabold">{getTargetLabel(log.targetType)}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium leading-relaxed max-w-[300px] truncate block" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedAuditLog(log)}
                        title="View Full Details"
                        className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-all inline-flex items-center cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL popup */}
      {selectedAuditLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="audit-log-detail-modal">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Security Ledger Log</span>
                <h3 className="text-sm font-extrabold mt-1">Audit Entry: {selectedAuditLog.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedAuditLog(null)}
                className="text-white hover:bg-white/10 p-1.5 rounded-xl transition-all font-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Timestamp:</span>
                  <span className="font-extrabold text-slate-800">{new Date(selectedAuditLog.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Operator:</span>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-800">{selectedAuditLog.userName}</p>
                    <p className="text-[10px] text-slate-400">{selectedAuditLog.userEmail} ({selectedAuditLog.userRole})</p>
                  </div>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Action:</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold border uppercase tracking-wider ${getActionStyles(selectedAuditLog.action)}`}>
                    {selectedAuditLog.action}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Target Ledger:</span>
                  <span className="font-extrabold text-slate-800">{getTargetLabel(selectedAuditLog.targetType)}</span>
                </div>
                <div className="pt-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px] block mb-1">Details & Payload:</span>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-semibold text-slate-700 leading-relaxed text-[11px] whitespace-pre-wrap">
                    {selectedAuditLog.details}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 flex justify-end border-t border-slate-100">
              <button 
                onClick={() => setSelectedAuditLog(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-5 py-2 rounded-xl transition-all cursor-pointer shadow"
              >
                Close Audit details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
