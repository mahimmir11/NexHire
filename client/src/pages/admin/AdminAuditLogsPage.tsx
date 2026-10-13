import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminService } from '../../services/admin.service';
import type { AuditLogItem } from '../../types/admin.types';
import {
  ScrollText,
  Search,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldAlert,
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLogs, setTotalLogs] = useState<number>(0);

  // Inspector Modal
  const [inspectedLog, setInspectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAuditLogs({
        page,
        limit: 15,
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setLogs(res.logs);
      setTotalPages(res.pagination.totalPages);
      setTotalLogs(res.pagination.total);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Failed to retrieve system audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const renderJsonSnapshot = (jsonStr: string | null) => {
    if (!jsonStr) return <span className="text-gray-400 italic">None</span>;
    try {
      const parsed = JSON.parse(jsonStr);
      return (
        <pre className="text-[11px] font-mono bg-gray-900 text-emerald-400 p-3 rounded-xl overflow-x-auto">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <pre className="text-[11px] font-mono bg-gray-100 p-2 rounded">{jsonStr}</pre>;
    }
  };

  return (
    <AdminLayout
      pageTitle="System Audit & Compliance Trail"
      pageSubtitle="Immutable chronological record of administrative actions, status transitions, and data operations"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ScrollText className="w-6 h-6 text-[#2E9D74]" />
              <h1 className="text-xl font-black text-[#143026]">System Audit &amp; Compliance Trail</h1>
            </div>
            <p className="text-xs text-[#4d7565] mt-1">
              Immutable chronological record of administrative actions, status transitions, and data operations
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#EAF6F0] border border-[#A7D6C0] text-xs font-bold text-[#2a4d3e]">
            {totalLogs} Recorded Event{totalLogs !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0] shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action, entity, ID, or user email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#EAF6F0]/40 border border-[#A7D6C0] text-xs text-[#143026] placeholder-[#4d7565] focus:outline-none focus:ring-2 focus:ring-[#2E9D74]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Filter Action (e.g. UPDATE)"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#EAF6F0]/40 border border-[#A7D6C0] text-xs text-[#143026] focus:outline-none"
            />

            <input
              type="text"
              placeholder="Filter Entity (e.g. Placement)"
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#EAF6F0]/40 border border-[#A7D6C0] text-xs text-[#143026] focus:outline-none"
            />

            <div className="flex items-center gap-1.5 bg-[#EAF6F0]/40 px-3 py-1.5 rounded-xl border border-[#A7D6C0]">
              <Calendar className="w-3.5 h-3.5 text-[#2E9D74]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs text-[#143026] focus:outline-none"
                title="Start date"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs text-[#143026] focus:outline-none"
                title="End date"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#A7D6C0] shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs font-semibold text-[#4d7565]">
              Loading audit records...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-600 font-semibold">{error}</div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <ScrollText className="w-10 h-10 text-[#A7D6C0] mx-auto opacity-70" />
              <p className="font-bold text-sm text-[#143026]">No audit logs match criteria</p>
              <p className="text-xs text-[#4d7565]">Adjust your search term or date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#EAF6F0]/80 border-b border-[#A7D6C0] text-[#143026] font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor / User</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Entity ID</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A7D6C0]/30">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#EAF6F0]/40 transition">
                      <td className="py-3 px-4 text-[#4d7565] font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-4">
                        {log.user ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#143026]">{log.user.email}</span>
                            <span className="text-[10px] text-gray-400 block font-semibold">{log.user.role}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic font-medium">System Process</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-[#2E9D74]/15 text-[#2E9D74] font-extrabold text-[10px] border border-[#2E9D74]/30">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-[#143026]">{log.entity}</td>

                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">#{log.entityId}</td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#2E9D74] hover:bg-[#EAF6F0] transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
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

        {/* Audit Inspector Modal */}
        {inspectedLog && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#A7D6C0] shadow-2xl animate-in zoom-in-95 duration-150 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#2E9D74]" />
                  <h2 className="text-base font-black text-[#143026]">
                    Audit Record Inspector (#{inspectedLog.id})
                  </h2>
                </div>
                <button
                  onClick={() => setInspectedLog(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block">Action</span>
                  <span className="font-extrabold text-[#2E9D74]">{inspectedLog.action}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Entity</span>
                  <span className="font-bold text-[#143026]">
                    {inspectedLog.entity} (#{inspectedLog.entityId})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Actor Email</span>
                  <span className="font-bold text-[#143026]">{inspectedLog.user?.email || 'System'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Timestamp</span>
                  <span className="font-mono text-gray-700">{new Date(inspectedLog.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <h3 className="text-xs font-extrabold text-[#143026] mb-1">Previous State (Old Values)</h3>
                  {renderJsonSnapshot(inspectedLog.oldValues)}
                </div>

                <div>
                  <h3 className="text-xs font-extrabold text-[#143026] mb-1">Resulting State (New Values)</h3>
                  {renderJsonSnapshot(inspectedLog.newValues)}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setInspectedLog(null)}
                  className="px-5 py-2 rounded-xl bg-[#2E9D74] text-white text-xs font-bold hover:bg-[#258260] transition cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
