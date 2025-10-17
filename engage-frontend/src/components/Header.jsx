import { useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { useApp } from "../lib/appState";
import { clearToken } from "../lib/api";
import { formatCoinsValue } from "../lib/coins";

const linkBase = "px-3 py-1 rounded hover:bg-slate-100";
const active = "text-teal-700 font-medium";

export default function Header() {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setShowDropdown(false);
    navigate("/login");
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold whitespace-nowrap">
          <span className="text-teal-600">Engage</span>Swap
        </h1>

        <nav className="text-sm flex gap-1">
          <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
            Home
          </NavLink>
          <NavLink to="/earn" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
            Earn
          </NavLink>
          <NavLink to="/promote" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
            Promote
          </NavLink>
          <NavLink to="/market" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
            Market
          </NavLink>
          <NavLink to="/wallet" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
            Wallet
          </NavLink>
          {user && user.is_admin && (
            <NavLink to="/admin" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Coins display - only show when logged in */}
          {user && (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70">
                <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m1 5v2h3v2h-3v2h3v2h-3v2h-2v-2H8v-2h3v-2H8V9h3V7z"/>
              </svg>
              <b>{formatCoinsValue(user.coins || 0)}</b> coins
            </span>
          )}

          {/* Auth UI */}
          {!user ? (
            <div className="flex gap-2 text-sm">
              <Link to="/login" className="px-3 py-1 rounded hover:bg-slate-100">
                Login
              </Link>
              <Link to="/signup" className="px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-700">
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-3 py-1 rounded hover:bg-slate-100 text-sm flex items-center gap-1"
              >
                {user.username || user.email}
                <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70">
                  <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-1 bg-white border rounded shadow-lg z-50 min-w-[150px]">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
