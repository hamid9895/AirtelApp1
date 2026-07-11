import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Info, FileText, Calendar, Hash, Type } from 'lucide-react';
import { CustomFieldConfig } from '../types';

interface MastersTabProps {
  target: 'fsc' | 'stock';
  token: string | null;
  showConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export const MastersTab: React.FC<MastersTabProps> = ({ target, token, showConfirm }) => {
  const apiFetch = (window as any).appFetch || window.fetch;
  const [configs, setConfigs] = useState<CustomFieldConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'text' | 'number' | 'date'>('text');

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/custom-fields', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setConfigs(data.customFieldConfigs || []);
      } else {
        setError(data.error || 'Failed to load custom fields configuration');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while loading custom fields');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [target, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a field name');
      return;
    }
    setError(null);
    setSuccess(null);

    try {
      const res = await apiFetch('/api/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          type,
          target
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Custom field config created successfully');
        setName('');
        setType('text');
        fetchConfigs();
      } else {
        setError(data.error || 'Failed to create custom field config');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while saving custom field');
    }
  };

  const handleDelete = async (id: string) => {
    const runDelete = async () => {
      setError(null);
      setSuccess(null);

      try {
        const res = await apiFetch(`/api/custom-fields/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setSuccess('Custom field config removed successfully');
          fetchConfigs();
        } else {
          setError(data.error || 'Failed to delete custom field config');
        }
      } catch (err) {
        console.error(err);
        setError('Connection error while deleting custom field');
      }
    };

    if (showConfirm) {
      showConfirm(
        'Confirm Field Deletion',
        'Are you sure you want to delete this custom field? This will also remove the saved information in existing entries.',
        runDelete
      );
    } else {
      if (window.confirm('Are you sure you want to delete this custom field? This will also remove the saved information in existing entries.')) {
        runDelete();
      }
    }
  };

  const filteredConfigs = configs.filter(c => c.target === target);

  return (
    <div className="flex flex-col gap-6 animate-fade-in" id="masters-tab-root">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950 tracking-tight">
            {target === 'fsc' ? 'FSC Custom Fields' : 'Daily Stock Custom Fields'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure dynamic fields to show in data entry forms and export with data spreadsheets.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
          <Info className="w-3.5 h-3.5" />
          <span>Information Only Fields</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
            Create Custom Field
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1.5">
                Field Name
              </label>
              <input
                type="text"
                placeholder="e.g. Region, Route Code, Vehicle No."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#EE1D23] transition-all"
                id="cf-name-input"
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1.5">
                Field Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType('text')}
                  className={`py-2 px-3 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    type === 'text'
                      ? 'border-[#EE1D23] bg-red-50/50 text-[#EE1D23]'
                      : 'border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setType('number')}
                  className={`py-2 px-3 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    type === 'number'
                      ? 'border-[#EE1D23] bg-red-50/50 text-[#EE1D23]'
                      : 'border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Hash className="w-4 h-4" />
                  Number
                </button>
                <button
                  type="button"
                  onClick={() => setType('date')}
                  className={`py-2 px-3 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    type === 'date'
                      ? 'border-[#EE1D23] bg-red-50/50 text-[#EE1D23]'
                      : 'border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Date
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-2.5 bg-[#EE1D23] hover:bg-[#D0141A] text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              id="cf-submit-button"
            >
              <Plus className="w-4 h-4" />
              Add Custom Field
            </button>
          </form>
        </div>

        {/* Configurations List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
            Active Fields Configuration ({filteredConfigs.length})
          </h3>
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <span className="w-6 h-6 border-2 border-[#EE1D23] border-t-transparent rounded-full animate-spin"></span>
              Synchronizing fields...
            </div>
          ) : filteredConfigs.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2">
              <FileText className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold">No custom fields defined yet</p>
              <p className="text-[10px] text-slate-400">Use the creation panel to add information-only fields</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="custom-fields-table">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-extrabold tracking-wider uppercase">
                    <th className="pb-3 pl-2">Field Name</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Allocation Target</th>
                    <th className="pb-3 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConfigs.map(c => (
                    <tr key={c.id} className="text-xs font-semibold text-slate-800 hover:bg-slate-50/50">
                      <td className="py-3.5 pl-2 font-bold text-slate-950">{c.name}</td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] uppercase font-bold tracking-wide flex items-center gap-1 w-max">
                          {c.type === 'number' && <Hash className="w-3 h-3" />}
                          {c.type === 'date' && <Calendar className="w-3 h-3" />}
                          {c.type === 'text' && <Type className="w-3 h-3" />}
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3.5 capitalize text-slate-500">{c.target === 'fsc' ? 'FSC Allocation' : 'Daily Stock'}</td>
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Remove custom field config"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
