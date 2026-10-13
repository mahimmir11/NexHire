import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationClientService } from '../services/notification.service';
import type { AppNotification } from '../types/notification.types';
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const isReadParam = activeTab === 'unread' ? false : activeTab === 'read' ? true : undefined;
      const res = await notificationClientService.getNotifications(page, 12, isReadParam);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationClientService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationClientService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationClientService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      if (notifications.length <= 1 && page > 1) {
        setPage((p) => p - 1);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleItemClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getDashboardBackLink = () => {
    if (user?.role === 'STUDENT') return '/student/dashboard';
    if (user?.role === 'RECRUITER') return '/recruiter/dashboard';
    return '/admin/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#EAF6F0] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-[#A7D6C0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(getDashboardBackLink())}
              className="p-2 rounded-xl bg-[#EAF6F0] hover:bg-[#A7D6C0]/40 text-[#2E9D74] transition cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#143026]">Notification Center</h1>
                {unreadCount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#2E9D74] text-white">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-[#4d7565] mt-0.5">
                Stay informed on applications, interviews, offers, and placement updates
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-sm transition cursor-pointer self-start sm:self-auto"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Filters Tabs */}
        <div className="flex items-center justify-between border-b border-[#A7D6C0]/60 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('all');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#2E9D74] text-white shadow-xs'
                  : 'bg-white text-[#2a4d3e] hover:bg-white/80 border border-[#A7D6C0]/60'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => {
                setActiveTab('unread');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-[#2E9D74] text-white shadow-xs'
                  : 'bg-white text-[#2a4d3e] hover:bg-white/80 border border-[#A7D6C0]/60'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('read');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'read'
                  ? 'bg-[#2E9D74] text-white shadow-xs'
                  : 'bg-white text-[#2a4d3e] hover:bg-white/80 border border-[#A7D6C0]/60'
              }`}
            >
              Read
            </button>
          </div>

          <div className="text-xs text-[#4d7565] font-semibold hidden sm:block">
            Showing {totalCount} notification{totalCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#A7D6C0] shadow-sm divide-y divide-[#A7D6C0]/30 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-[#4d7565]">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF6F0] text-[#2E9D74] flex items-center justify-center mx-auto border border-[#A7D6C0]">
                <Bell className="w-7 h-7" />
              </div>
              <p className="font-bold text-sm text-[#143026]">No notifications found</p>
              <p className="text-xs text-[#4d7565] max-w-sm mx-auto">
                {activeTab === 'unread'
                  ? 'You are all caught up! No unread notifications.'
                  : 'When campus activity happens, you will receive updates here.'}
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-4 sm:p-5 flex items-start gap-4 transition cursor-pointer ${
                  !notif.isRead
                    ? 'bg-[#2E9D74]/5 hover:bg-[#2E9D74]/10'
                    : 'hover:bg-[#EAF6F0]/40'
                }`}
              >
                <div className="mt-1">
                  {!notif.isRead ? (
                    <span className="block w-2.5 h-2.5 rounded-full bg-[#2E9D74] ring-4 ring-[#2E9D74]/20" />
                  ) : (
                    <span className="block w-2.5 h-2.5 rounded-full bg-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-sm font-bold text-[#143026]">{notif.title}</span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(notif.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-[#2a4d3e] mt-1 whitespace-pre-wrap">{notif.message}</p>

                  <div className="mt-2.5 flex items-center gap-3">
                    {notif.actionUrl && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2E9D74] hover:underline">
                        Navigate to record <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {notif.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Mark as read"
                      className="p-2 rounded-xl text-gray-400 hover:text-[#2E9D74] hover:bg-[#EAF6F0] transition"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(notif.id, e)}
                    title="Dismiss"
                    className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white/80 rounded-2xl border border-[#A7D6C0]/60">
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
  );
};
