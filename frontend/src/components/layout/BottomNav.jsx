import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, LayoutDashboard, Bell, Wrench, X } from "lucide-react";
import { getUser } from "../../lib/auth";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../lib/api";

const TYPE_DOT = {
  application: "#f4c542",
  accepted:    "#22c55e",
  content:     "#e63946",
  approved:    "#22c55e",
  revision:    "#f4c542",
  info:        "#7a7466",
};

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const panelRef = useRef(null);

  useEffect(() => {
    if (user) loadNotifs();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  async function loadNotifs() {
    try { setNotifs(await getNotifications()); } catch {}
  }

  const unread = notifs.filter((n) => !n.read).length;

  const handleNotifClick = async (n) => {
    if (!n.read) {
      try { await markNotificationRead(n.id); } catch {}
      setNotifs((ns) => ns.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    setNotifOpen(false);
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

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/discover", icon: Compass, label: "Discover" },
    { to: "/services", icon: Wrench, label: "Services" },
    {
      to: user ? (user.role === "brand" ? "/dashboard/brand" : "/dashboard/creator") : "/auth",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
  ];

  return (
    <>
      {/* Notification slide-up panel for mobile */}
      {notifOpen && user && (
        <div ref={panelRef} className="lg:hidden fixed bottom-[72px] left-3 right-3 z-50 bg-[#efe8d8] border border-[#0a0a0a] shadow-[0_-4px_0_0_#0a0a0a] max-h-[60vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#0a0a0a] bg-[#0a0a0a] text-[#efe8d8] shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={12} />
              <span className="mono text-[10px] uppercase tracking-[0.25em]">Notifications</span>
              {unread > 0 && <span className="bg-[#e63946] text-[#efe8d8] mono text-[9px] px-1.5 py-0.5 rounded-full">{unread}</span>}
            </div>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button onClick={handleMarkAll} className="mono text-[9px] uppercase tracking-widest text-[#efe8d8]/60 hover:text-[#efe8d8]">
                  Mark all read
                </button>
              )}
              <button onClick={() => setNotifOpen(false)} className="text-[#efe8d8]/60 hover:text-[#efe8d8]">
                <X size={13} />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto divide-y divide-[#0a0a0a]/10 flex-1">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={20} className="mx-auto text-[#5c5650] mb-2" />
                <div className="mono text-[10px] uppercase tracking-widest text-[#5c5650]">All caught up</div>
              </div>
            ) : notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-[#e8e0cd] transition-colors ${!n.read ? "bg-[#e8e0cd]/50" : ""}`}
              >
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: n.read ? "#0a0a0a20" : TYPE_DOT[n.type] || "#7a7466" }} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold leading-snug ${n.read ? "text-[#5c5650]" : "text-[#0a0a0a]"}`}>{n.title}</div>
                  <div className="mono text-[9px] text-[#5c5650] mt-0.5 leading-snug line-clamp-2">{n.body}</div>
                  <div className="mono text-[8px] uppercase tracking-widest text-[#5c5650]/60 mt-1">{timeAgo(n.created_at)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-[#efe8d8] border border-[#0a0a0a] rounded-full shadow-[4px_4px_0_0_#0a0a0a]"
        data-testid="bottom-nav"
      >
        <div className={`grid ${user ? "grid-cols-5" : "grid-cols-4"} px-1 py-1`}>
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-full transition ${
                  active ? "bg-[#e63946] text-[#efe8d8]" : "text-[#0a0a0a]"
                }`}
                data-testid={`bottom-nav-${item.label.toLowerCase()}`}
              >
                <Icon size={18} strokeWidth={2} />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}

          {/* Bell — only for logged-in users */}
          {user && (
            <button
              onClick={() => { setNotifOpen((v) => !v); if (!notifOpen) loadNotifs(); }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-full transition relative ${
                notifOpen ? "bg-[#e63946] text-[#efe8d8]" : "text-[#0a0a0a]"
              }`}
              data-testid="bottom-nav-notifications"
            >
              <div className="relative">
                <Bell size={18} strokeWidth={2} />
                {unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-[#e63946] text-[#efe8d8] text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Alerts</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
