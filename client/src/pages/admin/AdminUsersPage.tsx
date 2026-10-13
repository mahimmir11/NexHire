import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminService } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';
import type { AdminUser } from '../../types/admin.types';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const isActiveParam = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      const res = await adminService.getUsers(page, 12, roleFilter || undefined, search || undefined, isActiveParam);
      setUsers(res.users);
      setTotalPages(res.pagination.totalPages);
      setTotalUsers(res.pagination.total);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to retrieve users.');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      setActionFeedback({
        type: 'error',
        message: 'Security protection: You cannot deactivate your own administrative account.',
      });
      return;
    }

    try {
      setUpdatingUserId(user.id);
      setActionFeedback(null);
      const updated = await adminService.updateUserStatus(user.id, !user.isActive);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: updated.isActive } : u)));
      setActionFeedback({
        type: 'success',
        message: `Account for ${user.email} is now ${updated.isActive ? 'Active' : 'Deactivated'}.`,
      });
    } catch (err: any) {
      console.error('Status update failed:', err);
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to update account status.',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PLACEMENT_ADMIN':
        return 'bg-[#2E9D74]/15 text-[#2E9D74] border-[#2E9D74]/30';
      case 'RECRUITER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STUDENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AdminLayout
      pageTitle="Platform User Directory"
      pageSubtitle="Search, filter, inspect profiles, and manage access statuses across institutional accounts"
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-[#2E9D74]" />
              <h1 className="text-xl font-black text-[#143026]">Platform User Management</h1>
            </div>
            <p className="text-xs text-[#4d7565] mt-1">
              Search, filter, inspect profiles, and manage access statuses across institutional accounts
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#EAF6F0] border border-[#A7D6C0] text-xs font-bold text-[#2a4d3e]">
            {totalUsers} Registered User{totalUsers !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Action feedback */}
        {actionFeedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}
          >
            <span>{actionFeedback.message}</span>
            <button
              onClick={() => setActionFeedback(null)}
              className="font-bold underline text-xs cursor-pointer ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0] shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by email, student name, roll number, or company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#EAF6F0]/40 border border-[#A7D6C0] text-xs text-[#143026] placeholder-[#4d7565] focus:outline-none focus:ring-2 focus:ring-[#2E9D74]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#EAF6F0]/40 px-3 py-1.5 rounded-xl border border-[#A7D6C0]">
              <Filter className="w-3.5 h-3.5 text-[#2E9D74]" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-[#143026] focus:outline-none cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="RECRUITER">Recruiters</option>
                <option value="PLACEMENT_ADMIN">Placement Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#EAF6F0]/40 px-3 py-1.5 rounded-xl border border-[#A7D6C0]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-[#143026] focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#A7D6C0] shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs font-semibold text-[#4d7565]">
              Loading platform accounts...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-600 font-semibold">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <Users className="w-10 h-10 text-[#A7D6C0] mx-auto opacity-70" />
              <p className="font-bold text-sm text-[#143026]">No users found</p>
              <p className="text-xs text-[#4d7565]">Try changing your search term or role filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#EAF6F0]/80 border-b border-[#A7D6C0] text-[#143026] font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">User ID &amp; Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Associated Profile</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A7D6C0]/30">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isSuper = currentUser?.role === 'SUPER_ADMIN';

                    return (
                      <tr key={u.id} className="hover:bg-[#EAF6F0]/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-gray-400">#{u.id}</span>
                            <span className="font-bold text-[#143026]">{u.email}</span>
                          </div>
                          {u.lastLoginAt && (
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              Last login: {new Date(u.lastLoginAt).toLocaleDateString()}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getRoleBadge(
                              u.role
                            )}`}
                          >
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {u.student ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-[#143026]">
                                <GraduationCap className="w-3.5 h-3.5 text-[#2E9D74]" />
                                <span>{u.student.fullName}</span>
                                <span className="font-mono text-[10px] text-[#4d7565]">({u.student.studentId})</span>
                              </div>
                              <div className="text-[10px] text-[#4d7565]">
                                {u.student.course} &bull; {u.student.department?.code || 'Dept N/A'}
                              </div>
                            </div>
                          ) : u.recruiter ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-[#143026]">
                                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>{u.recruiter.fullName}</span>
                                {u.recruiter.designation && (
                                  <span className="text-[10px] text-gray-500 font-normal">({u.recruiter.designation})</span>
                                )}
                              </div>
                              <div className="text-[10px] text-blue-700 font-semibold">
                                {u.recruiter.company?.name || 'Independent Recruiter'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">System Administrator</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Deactivated</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[#4d7565]">
                          {new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isSuper ? (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSelf || updatingUserId === u.id}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                u.isActive
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                              title={isSelf ? 'Cannot deactivate self' : u.isActive ? 'Deactivate user' : 'Activate user'}
                            >
                              {u.isActive ? (
                                <>
                                  <ToggleRight className="w-4 h-4 text-rose-600" />
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-4 h-4 text-emerald-600" />
                                  <span>Activate</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Managed by Super Admin</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-[#EAF6F0]/40 border-t border-[#A7D6C0]">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs font-bold text-[#2a4d3e] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EAF6F0] transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs font-semibold text-[#4d7565]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs font-bold text-[#2a4d3e] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EAF6F0] transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
