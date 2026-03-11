import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, BriefcaseBusiness, Star, MessageSquare, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification, NotificationType } from '../../types';

// ─── Icon per notification type ───────────────────────────────────────────────
function NotifIcon({ type }: { type: NotificationType }) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center shrink-0';
  if (type === 'job')     return <div className={clsx(base, 'bg-blue-100')}><BriefcaseBusiness className="w-4 h-4 text-blue-700" /></div>;
  if (type === 'bid')     return <div className={clsx(base, 'bg-green-100')}><BriefcaseBusiness className="w-4 h-4 text-green-600" /></div>;
  if (type === 'review')  return <div className={clsx(base, 'bg-amber-100')}><Star className="w-4 h-4 text-amber-600" /></div>;
  if (type === 'message') return <div className={clsx(base, 'bg-blue-100')}><MessageSquare className="w-4 h-4 text-blue-700" /></div>;
  return <div className={clsx(base, 'bg-gray-100')}><Info className="w-4 h-4 text-gray-600" /></div>;
}

// ─── Single notification row ──────────────────────────────────────────────────
function NotifRow({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: (id: string) => void;
}) {
  const navigate = useNavigate();

  function handleClick() {
    if (!notif.isRead) onRead(notif._id);
    if (notif.link) navigate(notif.link);
  }

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0',
        !notif.isRead && 'bg-blue-50/40',
      )}
    >
      <NotifIcon type={notif.type} />
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm leading-snug', !notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
          {notif.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notif.isRead && (
        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
      )}
    </button>
  );
}

// ─── Main dropdown ────────────────────────────────────────────────────────────
export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, isMarkingAll, isClearing } =
    useNotifications();

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-100 bg-white shadow-xl z-50 animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  disabled={isMarkingAll}
                  title="Mark all as read"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearAll()}
                  disabled={isClearing}
                  title="Clear all"
                  className="flex items-center gap-1 p-1.5 rounded-lg text-xs text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifRow key={n._id} notif={n} onRead={markAsRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
