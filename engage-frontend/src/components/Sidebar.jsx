import { NavLink } from "react-router-dom";
import { useApp } from "../lib/appState";

const linkBase = "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors";
const active = "bg-teal-50 text-teal-700 font-medium hover:bg-teal-100";

export default function Sidebar() {
  const { user } = useApp();

  // Only show sidebar when user is logged in
  if (!user) {
    return null;
  }

  // Authenticated menu items
  const authenticatedMenuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/earn", label: "Earn", icon: "💰" },
    { path: "/promote", label: "Promote", icon: "🚀" },
    { path: "/analytics", label: "Analytics", icon: "📈" },
    { path: "/market", label: "Market", icon: "🛒" },
    { path: "/wallet", label: "Wallet", icon: "💳" },
  ];

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <nav className="space-y-1">
        {authenticatedMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? active : "text-slate-700"}`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Admin link if user is admin */}
        {user.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? active : "text-slate-700"}`
            }
          >
            <span className="text-xl">⚙️</span>
            <span>Admin</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
