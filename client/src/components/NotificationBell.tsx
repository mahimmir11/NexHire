import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { notificationClientService } from '../services/notification.service';
import type { AppNotification } from '../types/notification.types';

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnread = async () => {
    try {
      const count = await notificationClientService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Ignore background badge error
    }
  };

  const fetchRecent = async () => {
    try {
      setLoading(true);
      const res = await notificationClientService.getNotifications(1, 5);
      setRecentNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('Failed to load recent notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRecent();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationClientService.markAsRead(id);
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationClientService.markAllAsRead();
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      try {
        await notificationClientService.markAsRead(notif.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    setIsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationClientService.deleteNotification(id);
      setRecentNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchUnread();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white hover:bg-[#EAF6F0] text-[#2a4d3e] border border-[#A7D6C0] shadow-xs transition cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#2E9D74]/30"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-[#2E9D74]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-[#A7D6C0] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#A7D6C0]/40 bg-[#EAF6F0]/60">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[#143026]">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#2E9D74] text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#2E9D74] hover:text-[#1e6f51] flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#A7D6C0]/20">
            {loading ? (
              <div className="p-6 text-center text-xs text-gray-500">Loading notifications...</div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-[#A7D6C0] mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold text-[#2a4d3e]">No notifications yet</p>
                <p className="text-[11px] text-[#4d7565] mt-0.5">We'll alert you about interviews, offers, and placements.</p>
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 hover:bg-[#EAF6F0]/50 transition cursor-pointer flex gap-3 text-left ${
                    !notif.isRead ? 'bg-[#2E9D74]/5' : ''
                  }`}
                >
                  <div className="mt-1">
                    {!notif.isRead ? (
                      <span className="block w-2 h-2 rounded-full bg-[#2E9D74] ring-2 ring-[#2E9D74]/20" />
                    ) : (
                      <span className="block w-2 h-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-bold truncate ${!notif.isRead ? 'text-[#143026]' : 'text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatTime(notif.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-[#3e5f51] mt-0.5 line-clamp-2">{notif.message}</p>
                    {notif.actionUrl && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2E9D74] mt-1 hover:underline">
                        View details <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-center justify-center">
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        title="Mark as read"
                        className="p-1 text-gray-400 hover:text-[#2E9D74] rounded transition"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notif.id, e)}
                      title="Dismiss"
                      className="p-1 text-gray-400 hover:text-rose-500 rounded transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer View All */}
          <div className="p-2.5 bg-gray-50/80 border-t border-[#A7D6C0]/30 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-bold text-[#2E9D74] hover:text-[#1e6f51] transition cursor-pointer"
            >
              View all notifications &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
