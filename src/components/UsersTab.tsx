import React, { useState, useEffect } from 'react';
import { Users, Plus, ChevronLeft, Upload, RefreshCw, Sparkles, CheckCircle, AlertCircle, Camera } from 'lucide-react';
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

  // Custom photo upload hooks
  userPhoto: string | null;
  setUserPhoto: (photo: string | null) => void;
  token: string | null;
  onProfileUpdate?: (updatedUser: UserDto) => void;
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
  onCancelEdit,
  userPhoto,
  setUserPhoto,
  token,
  onProfileUpdate
}) => {
  // --- LOCAL NAVIGATION STATE ---
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');

  // --- MY PROFILE STATE ---
  const [myPhoto, setMyPhoto] = useState<string | null>(user.photo || null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Sync component view if central edit states change
  useEffect(() => {
    if (editingUserId) {
      setViewMode('edit');
    } else if (viewMode === 'edit') {
      setViewMode('list');
    }
  }, [editingUserId]);

  // Sync personal photo state
  useEffect(() => {
    setMyPhoto(user.photo || null);
  }, [user]);

  // --- FILE HANDLING ---
  const handlePhotoReader = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAdminPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoReader(file, (base64) => {
        setUserPhoto(base64);
      });
    }
  };

  const handleMyPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileError(null);
      setProfileSuccess(null);
      setProfileSaving(true);
      handlePhotoReader(file, async (base64) => {
        setMyPhoto(base64);
        try {
          const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ photo: base64 })
          });
          const data = await res.json();
          if (data.success) {
            setProfileSuccess('Your profile photo has been updated!');
            if (onProfileUpdate) {
              onProfileUpdate(data.user);
            }
          } else {
            setProfileError(data.error || 'Failed to update photo');
          }
        } catch (err) {
          setProfileError('Network error connecting with profile server');
        } finally {
          setProfileSaving(false);
        }
      });
    }
  };

  const handleEditTrigger = (target: UserDto) => {
    onEditUserClick(target);
    setViewMode('edit');
  };

  const handleReturnToList = () => {
    onCancelEdit();
    setViewMode('list');
  };

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
        <span className="font-extrabold text-slate-900 flex items-center gap-3">
          {r.photo ? (
            <img 
              src={r.photo} 
              alt={r.name} 
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <Users className="w-4 h-4 text-slate-500" />
            </div>
          )}
          <span>{r.name}</span>
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
    <div className="space-y-6" id="users-tab-container">
      
      {/* 1. MY PROFILE CARD (Shows on top of roster list) */}
      {viewMode === 'list' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-5 flex-col md:flex-row text-center md:text-left">
            <div className="relative group">
              {myPhoto ? (
                <img 
                  src={myPhoto} 
                  alt={user.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#EE1D23] shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-300">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-[#EE1D23] text-white p-1.5 rounded-full cursor-pointer shadow-md hover:bg-red-700 transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleMyPhotoChange} 
                  className="hidden" 
                />
              </label>
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h3 className="text-sm font-extrabold text-slate-950">Your Profile Setting</h3>
                <Sparkles className="w-3.5 h-3.5 text-[#EE1D23]" />
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Upload a professional picture. Any change here propagates to your logs instantly.
              </p>
              {profileSaving && (
                <p className="text-[10px] text-[#EE1D23] font-bold mt-1 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Uploading profile picture...
                </p>
              )}
              {profileError && (
                <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {profileError}
                </p>
              )}
              {profileSuccess && (
                <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {profileSuccess}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col text-xs font-semibold text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-200/50 w-full md:w-auto min-w-[200px]">
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-400">Account:</span>
              <span className="text-slate-800 font-bold">{user.name}</span>
            </div>
            <div className="flex justify-between py-1 mt-1">
              <span className="text-slate-400">Privileges:</span>
              <span className="text-[#EE1D23] font-black uppercase tracking-wider text-[10px]">{user.role}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. LIST SCREEN (Main registry roster) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-[#EE1D23]" />
                Airtel Security & Accounts Registry
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Manage administrative credentials, regional managers, and FSC personnel
              </p>
            </div>

            {user.role === 'Admin' && (
              <button
                onClick={() => {
                  onCancelEdit(); // Clear forms
                  setUserPhoto(null);
                  setViewMode('add');
                }}
                className="bg-[#EE1D23] hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer select-none"
              >
                <Plus className="w-4 h-4" />
                <span>Register Staff Account</span>
              </button>
            )}
          </div>

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

      {/* 3. MANAGE SCREEN (Used for Add & Edit operations) */}
      {(viewMode === 'add' || viewMode === 'edit') && (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col gap-6 animate-fade-in">
          
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

          <form onSubmit={handleFormSubmission} className="space-y-4">
            
            {/* PROFILE PHOTO FIELD */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Profile Image</label>
              <div className="flex items-center gap-4">
                {userPhoto ? (
                  <img 
                    src={userPhoto} 
                    alt="Preview" 
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAdminPhotoChange} 
                      className="hidden" 
                    />
                  </label>
                  {userPhoto && (
                    <button
                      type="button"
                      onClick={() => setUserPhoto(null)}
                      className="text-xs text-rose-600 font-bold ml-3 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

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
                disabled={viewMode === 'edit'}
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
                required={viewMode === 'add'}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#EE1D23]"
              />
            </div>

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
