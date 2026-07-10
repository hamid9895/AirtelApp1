import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Search, Database, ArrowUpDown, ChevronDown, RefreshCw, X, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface TablesTabProps {
  token: string | null;
}

interface TableMetadata {
  name: string;
  label: string;
  count: number;
  primaryKey: string;
}

export const TablesTab: React.FC<TablesTabProps> = ({ token }) => {
  const apiFetch = (window as any).appFetch || window.fetch;
  
  const [tables, setTables] = useState<TableMetadata[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string>('users');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Search and Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Edit Modal States
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [editingRowKey, setEditingRowKey] = useState<string>(''); // primary key value
  
  const activeTable = tables.find(t => t.name === selectedTableName) || {
    name: selectedTableName,
    label: selectedTableName,
    primaryKey: selectedTableName === 'rolePermissions' ? 'role' : 'id',
    count: 0
  };

  const fetchTablesList = async () => {
    try {
      const res = await apiFetch('/api/admin/tables', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
      }
    } catch (err) {
      console.error('Failed to load table list', err);
    }
  };

  const fetchTableRows = async (tableName: string) => {
    setLoading(true);
    setError(null);
    setSelectedIds([]);
    try {
      const res = await apiFetch(`/api/admin/tables/${tableName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
      } else {
        setError(data.error || `Failed to fetch rows for ${tableName}`);
      }
    } catch (err) {
      console.error(err);
      setError(`Connection error while loading table '${tableName}'`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesList();
  }, [token]);

  useEffect(() => {
    if (selectedTableName) {
      fetchTableRows(selectedTableName);
    }
  }, [selectedTableName, token]);

  const handleRefresh = () => {
    fetchTablesList();
    fetchTableRows(selectedTableName);
  };

  // Extract all unique columns dynamically from rows
  const getColumns = () => {
    if (rows.length === 0) return [];
    const keysSet = new Set<string>();
    rows.forEach(row => {
      Object.keys(row).forEach(k => {
        // Hide password hash for simple UI safety, allow editing it inside form modal
        if (k !== 'passwordHash') {
          keysSet.add(k);
        }
      });
    });
    return Array.from(keysSet);
  };

  const columns = getColumns();

  // Filter rows based on search query
  const filteredRows = rows.filter(row => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(row).some(val => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'object') {
        return JSON.stringify(val).toLowerCase().includes(query);
      }
      return String(val).toLowerCase().includes(query);
    });
  });

  // Toggle selection for bulk actions
  const handleToggleRow = (rowKey: string) => {
    setSelectedIds(prev => 
      prev.includes(rowKey) ? prev.filter(id => id !== rowKey) : [...prev, rowKey]
    );
  };

  const handleToggleAll = () => {
    const keyName = activeTable.primaryKey;
    if (selectedIds.length === filteredRows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map(r => r[keyName]));
    }
  };

  // Delete actions
  const handleDeleteRow = async (rowId: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete this row from '${activeTable.label}'? This bypasses standard referential checks!`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const res = await apiFetch(`/api/admin/tables/${selectedTableName}/${rowId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Row deleted successfully');
        handleRefresh();
      } else {
        setError(data.error || 'Failed to delete row');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while deleting row');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you absolutely sure you want to BULK DELETE ${selectedIds.length} rows from '${activeTable.label}'? This is irreversible and can impact ledger balances.`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const res = await apiFetch(`/api/admin/tables/${selectedTableName}/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rowIds: selectedIds })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Successfully deleted ${data.deletedCount} rows.`);
        setSelectedIds([]);
        handleRefresh();
      } else {
        setError(data.error || 'Failed to perform bulk deletion');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while bulk deleting rows');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (row: any) => {
    const keyName = activeTable.primaryKey;
    setEditingRow(row);
    setEditingRowKey(row[keyName]);
    setEditFormData({ ...row });
  };

  const handleFieldChange = (key: string, value: any, type: string) => {
    let finalVal = value;
    if (type === 'number') {
      finalVal = value === '' ? 0 : Number(value);
    } else if (type === 'boolean') {
      finalVal = value === 'true';
    } else if (type === 'object') {
      try {
        finalVal = JSON.parse(value);
      } catch {
        finalVal = value; // keep as text if invalid json during typing
      }
    }
    setEditFormData(prev => ({
      ...prev,
      [key]: finalVal
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Ensure nested objects are parsed correctly if edited as JSON text
    const payload = { ...editFormData };
    
    try {
      const res = await apiFetch(`/api/admin/tables/${selectedTableName}/${editingRowKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Row updated successfully');
        setEditingRow(null);
        handleRefresh();
      } else {
        setError(data.error || 'Failed to update row');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while updating row');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-[#EE1D23]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Database Table Inspector</h2>
              <p className="text-xs text-slate-500 font-medium">Administrator Settings &bull; Live row level CRUD and bulk-cleanup tools</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Refresh tables data"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/50 rounded-2xl p-4 flex items-start gap-3 text-rose-700 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="text-xs font-bold leading-relaxed">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200/50 rounded-2xl p-4 flex items-start gap-3 text-emerald-700 animate-fade-in">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div className="text-xs font-bold leading-relaxed">{success}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table Selector Panel */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Select Application Table</span>
          <div className="space-y-1.5">
            {tables.map(tbl => {
              const isSelected = selectedTableName === tbl.name;
              return (
                <button
                  key={tbl.name}
                  onClick={() => {
                    setSelectedTableName(tbl.name);
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Database className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{tbl.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tbl.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rows Grid / View Panel */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          {/* Filtering bar */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="relative flex-grow max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder={`Search rows in ${activeTable.label}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-slate-900 focus:outline-none placeholder-slate-400"
              />
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 shrink-0 animate-fade-in">
                <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {selectedIds.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 transition-all text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-rose-200/55 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bulk Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="flex-grow overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-slate-500 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                <p className="text-xs font-bold">Querying {activeTable.label} ledger...</p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
                <Database className="w-10 h-10 text-slate-200" />
                <p className="text-xs font-bold text-slate-500">No matching records found</p>
                <p className="text-[10px] text-slate-400">The table is empty or search filters yielded zero rows.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-4 w-12 text-center select-none">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredRows.length && filteredRows.length > 0}
                        onChange={handleToggleAll}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer w-3.5 h-3.5"
                      />
                    </th>
                    {columns.map(col => (
                      <th key={col} className="p-4 font-black tracking-widest text-slate-500">
                        {col}
                      </th>
                    ))}
                    <th className="p-4 w-24 text-right pr-6 font-black tracking-widest text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                  {filteredRows.map((row, rIdx) => {
                    const rowKey = row[activeTable.primaryKey];
                    const isSelected = selectedIds.includes(rowKey);
                    return (
                      <tr 
                        key={rowKey || rIdx} 
                        className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-slate-50/70' : ''}`}
                      >
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(rowKey)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer w-3.5 h-3.5"
                          />
                        </td>
                        {columns.map(col => {
                          const val = row[col];
                          let displayVal = '';
                          if (val === null || val === undefined) {
                            displayVal = '-';
                          } else if (typeof val === 'object') {
                            displayVal = JSON.stringify(val);
                          } else if (typeof val === 'boolean') {
                            displayVal = val ? 'TRUE' : 'FALSE';
                          } else {
                            displayVal = String(val);
                          }
                          return (
                            <td key={col} className="p-4 font-medium max-w-xs truncate" title={displayVal}>
                              {col === activeTable.primaryKey ? (
                                <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                                  {displayVal}
                                </span>
                              ) : (
                                <span className="text-slate-600">{displayVal}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-4 text-right pr-6 shrink-0">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(row)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Edit Row"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(rowKey)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Row Edit Dialog Overlay */}
      {editingRow && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-800">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Edit Row in '{activeTable.label}'</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{activeTable.primaryKey}: {editingRowKey}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-grow overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(editingRow).map(key => {
                  const val = editFormData[key];
                  const valType = typeof val;
                  const isPrimaryKey = key === activeTable.primaryKey;
                  
                  return (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                        {key} {isPrimaryKey && <span className="text-[#EE1D23] font-bold">(Key - Read Only)</span>}
                      </label>
                      {isPrimaryKey ? (
                        <div className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-mono text-slate-500 select-all font-bold">
                          {String(val)}
                        </div>
                      ) : valType === 'boolean' ? (
                        <select
                          value={String(val)}
                          onChange={e => handleFieldChange(key, e.target.value, 'boolean')}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none"
                        >
                          <option value="true">TRUE</option>
                          <option value="false">FALSE</option>
                        </select>
                      ) : valType === 'object' && val !== null ? (
                        <textarea
                          value={typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                          onChange={e => handleFieldChange(key, e.target.value, 'object')}
                          rows={3}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                          placeholder="{}"
                        />
                      ) : (
                        <input
                          type={valType === 'number' ? 'number' : 'text'}
                          step={valType === 'number' ? 'any' : undefined}
                          value={val === null || val === undefined ? '' : String(val)}
                          onChange={e => handleFieldChange(key, e.target.value, valType)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-slate-900/10 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
