import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Compass, LayoutDashboard, User, Wrench } from "lucide-react";
import { getUser } from "../../lib/mockAuth";

export default function BottomNav() {
  const location = useLocation();
  const user = getUser();

  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/discover", icon: Compass, label: "Discover" },
    { to: "/services", icon: Wrench, label: "Services" },
    {
      to: user ? (user.role === "brand" ? "/dashboard/brand" : "/dashboard/creator") : "/auth",
      icon: LayoutDashboard,
      label: "Studio",
    },
    { to: user ? "#" : "/auth", icon: User, label: user ? user.name.split(" ")[0] : "Sign in" },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-[#efe8d8] border border-[#0a0a0a] rounded-full shadow-[4px_4px_0_0_#0a0a0a]"
      data-testid="bottom-nav"
    >
      <div className="grid grid-cols-5 px-1 py-1">
        {items.map((item) => {
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
              <Icon size={16} strokeWidth={2.2} />
              <span className="text-[9px] font-semibold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
