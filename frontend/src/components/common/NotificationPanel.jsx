import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../lib/api";

const TYPE_DOT = {
  application: "#f4c542",
  accepted:    "#22c55e",
  content:     "#e63946",
  approved:    "#22c55e",
  revision:    "#f4c542",
  info:        "#7a7466",
};

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function load() {
    try { setNotifs(await getNotifications()); } catch {}
  }

  const unread = notifs.filter((n) => !n.read).length;

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) load();
  };

  const handleClick = async (n) => {
    if (!n.read) {
      try { await markNotificationRead(n.id); } catch {}
      setNotifs((ns) => ns.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    try { await markAllNotificationsRead(); } catch {}
    setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-10 h-10 border border-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-[#efe8d8] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#e63946] text-[#efe8d8] text-[9px] font-bold rounded-full flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-[#efe8d8] border border-[#0a0a0a] shadow-[6px_6px_0_0_#0a0a0a] z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8]">
            <div className="flex items-center gap-2">
              <Bell size={12} />
              <span className="mono text-[10px] uppercase tracking-[0.25em]">Notifications</span>
              {unread > 0 && <span className="bg-[#e63946] text-[#efe8d8] mono text-[9px] px-1.5 py-0.5 rounded-full">{unread}</span>}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={handleMarkAll} className="mono text-[9px] uppercase tracking-widest text-[#efe8d8]/60 hover:text-[#efe8d8] transition">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-[#efe8d8]/60 hover:text-[#efe8d8]">
                <X size={13} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-[#0a0a0a]/10">
            {notifs.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={24} className="mx-auto text-[#5c5650] mb-3" />
                <div className="mono text-[10px] uppercase tracking-widest text-[#5c5650]">All caught up</div>
              </div>
            ) : notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-[#e8e0cd] transition-colors ${!n.read ? "bg-[#e8e0cd]/50" : ""}`}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: n.read ? "#0a0a0a20" : TYPE_DOT[n.type] || "#7a7466" }}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold leading-snug ${n.read ? "text-[#5c5650]" : "text-[#0a0a0a]"}`}>
                    {n.title}
                  </div>
                  <div className="mono text-[9px] text-[#5c5650] mt-0.5 leading-snug line-clamp-2">{n.body}</div>
                  <div className="mono text-[8px] uppercase tracking-widest text-[#5c5650]/60 mt-1">{timeAgo(n.created_at)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
