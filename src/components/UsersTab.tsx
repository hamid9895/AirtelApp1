import React, { useState, useEffect } from 'react';
import { Users, Plus, ChevronLeft } from 'lucide-react';
import { UserDto } from '../types';
import { DataGrid, GridColumn } from './DataGrid';

interface UsersTabProps {
  allUsers: UserDto[];
  user: UserDto;
  onDeleteUser: (id: string) => void;
  onSubmitUser: (e: React.FormEvent) => void;
  userName: string;
  setUserName: (v: string) => void;
  userEmail: string;
  setUserEmail: (v: string) => void;
  userRole: 'Admin' | 'Manager' | 'Approver' | 'FSC';
  setUserRole: (v: 'Admin' | 'Manager' | 'Approver' | 'FSC') => void;
  userPassword: string;
  setUserPassword: (v: string) => void;

  // Edit Hooks passed from parent
  onEditUserClick: (targetUser: UserDto) => void;
  editingUserId: string | null;
  onCancelEdit: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  allUsers,
  user,
  onDeleteUser,
  onSubmitUser,
  userName,
  setUserName,
  userEmail,
  setUserEmail,
  userRole,
  setUserRole,
  userPassword,
  setUserPassword,
  onEditUserClick,
  editingUserId,
  onCancelEdit
}) => {
  // --- LOCAL NAVIGATION STATE ---
  // List-first separated screen
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');

  // Sync component view if central edit states change
  useEffect(() => {
    if (editingUserId) {
      setViewMode('edit');
    } else if (viewMode === 'edit') {
      setViewMode('list');
    }
  }, [editingUserId]);

  // --- SEPARATED HANDLER FUNCTIONS ---

  /**
   * Initializes editing session by prefilling input states and shifting screens.
   */
  const handleEditTrigger = (target: UserDto) => {
    onEditUserClick(target);
    setViewMode('edit');
  };

  /**
   * Clears forms and safely returns user back to list screen.
   */
  const handleReturnToList = () => {
    onCancelEdit();
    setViewMode('list');
  };

  /**
   * Dispatches user registry requests and resets local view upon success.
   */
  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitUser(e);
    setViewMode('list');
  };

  // --- DATA GRID COLUMN SCHEMA ---
  const userColumns: GridColumn<UserDto>[] = [
    { 
      key: 'name', 
      label: 'Staff Name', 
      type: 'string', 
      sortable: true,
      render: (r) => (
        <span className="font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#EE1D23]" />
          {r.name}
        </span>
      )
    },
    { key: 'email', label: 'Email Address', type: 'string', sortable: true },
    { 
      key: 'role', 
      label: 'Airtel System Role', 
      type: 'string', 
      sortable: true,
      render: (r) => (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
          r.role === 'Admin' ? 'bg-red-50 text-red-700 border-red-100' :
          r.role === 'Manager' ? 'bg-slate-900 text-slate-100 border-slate-950' :
          r.role === 'Approver' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
          'bg-slate-50 text-slate-600 border-slate-200'
        }`}>
          {r.role}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. LIST SCREEN (Main registry roster) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          
          {/* Header row layout with action trigger */}
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-[#EE1D23]" />
                Airtel Security & Accounts Registry
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Manage administrative credentials, regional managers, and FSC personnel</p>
            </div>

            {user.role === 'Admin' && (
              <button
                onClick={() => {
                  onCancelEdit(); // Clear forms
                  setViewMode('add');
                }}
                className="bg-[#EE1D23] hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer select-none"
              >
                <Plus className="w-4 h-4" />
                <span>Register Staff Account</span>
              </button>
            )}
          </div>

          {/* Interactive Data Grid */}
          <DataGrid
            data={allUsers}
            columns={userColumns}
            searchPlaceholder="Search staff by name or email address..."
            searchKeys={['name', 'email', 'role']}
            onEdit={user.role === 'Admin' ? handleEditTrigger : undefined}
            onDelete={user.role === 'Admin' ? (row) => onDeleteUser(row.id) : undefined}
            canDelete={(row) => row.id !== user.id} // Cannot delete yourself
            exportFilename="airtel_staff_accounts_registry"
          />

        </div>
      )}

      {/* 2. MANAGE SCREEN (Used for Add & Edit operations) */}
      {(viewMode === 'add' || viewMode === 'edit') && (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col gap-6 animate-fade-in">
          
          {/* Header block with cancel navigate action */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleReturnToList}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer"
                title="Go back to roster list"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  {viewMode === 'edit' ? 'Modify Staff Credentials' : 'Register New Staff Account'}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {viewMode === 'edit' ? 'Update name, roles, or reset password' : 'Create login credentials'}
                </p>
              </div>
            </div>
            
            <div className="p-2 rounded-2xl bg-red-50 text-[#EE1D23]">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Registration Input Form */}
          <form onSubmit={handleFormSubmission} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Full Name</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Rajesh Kumar"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Email Address</label>
              <input
                type="email"
                required
                disabled={viewMode === 'edit'} // Lock email during edits for identity persistence
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="rajesh@airtel.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23] disabled:opacity-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Airtel System Role</label>
              <select
                required
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#EE1D23]"
              >
                <option value="FSC">FSC (Field Sales Coordinator)</option>
                <option value="Approver">Approver (Regional Approver)</option>
                <option value="Manager">Manager (Distribution Manager)</option>
                <option value="Admin">Admin (Full System Admin)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">
                {viewMode === 'edit' ? 'New Password (leave blank to keep current)' : 'Account Password'}
              </label>
              <input
                type="password"
                required={viewMode === 'add'} // Password optional during updates
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReturnToList}
                className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-5 py-2.5 rounded-2xl text-xs transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#EE1D23] hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md cursor-pointer select-none"
              >
                {viewMode === 'edit' ? 'Update user properties' : 'Register Account'}
              </button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
};
