import { NavLink } from "react-router-dom";
import { useApp } from "../lib/appState";

const linkBase = "px-3 py-1 rounded hover:bg-slate-100";
const active = "text-teal-700 font-medium";

export default function Header() {
  const { coins } = useApp();

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
        </nav>

        <div className="ml-auto">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70">
              <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m1 5v2h3v2h-3v2h3v2h-3v2h-2v-2H8v-2h3v-2H8V9h3V7z"/>
            </svg>
            <b>{coins}</b> coins
          </span>
        </div>
      </div>
    </header>
  );
}
