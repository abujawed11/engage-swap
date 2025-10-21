// import { useState } from "react";
// import { NavLink, useNavigate, Link } from "react-router-dom";
// import { useApp } from "../lib/appState";
// import { clearToken } from "../lib/api";
// import { formatCoinsValue } from "../lib/coins";

// const linkBase = "px-3 py-2 rounded hover:bg-slate-100 transition-colors";
// const active = "text-teal-700 font-medium bg-teal-50";

// export default function Header() {
//   const { user, setUser } = useApp();
//   const navigate = useNavigate();
//   const [showDropdown, setShowDropdown] = useState(false);

//   const handleLogout = () => {
//     clearToken();
//     setUser(null);
//     setShowDropdown(false);
//     navigate("/login");
//   };

//   return (
//     <header className="border-b bg-white">
//       <div className="px-6 py-3 flex items-center justify-between gap-4">
//         <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
//           <img src="/mylogo.png" alt="EngageSwap Logo" className="h-8 w-8" />
//           <h1 className="text-xl font-bold whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity">
//             <span className="text-teal-600">Engage</span>Swap
//           </h1>
//         </Link>

//         {/* Show nav items only when logged out */}
//         {!user && (
//           <nav className="flex gap-1 text-sm">
//             <NavLink to="/" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
//               Home
//             </NavLink>
//             <NavLink to="/about" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
//               About
//             </NavLink>
//             <NavLink to="/guide" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
//               Guide
//             </NavLink>
//             <NavLink to="/market" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
//               Pricing
//             </NavLink>
//             <NavLink to="/contact" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
//               Contact
//             </NavLink>
//           </nav>
//         )}

//         <div className="ml-auto flex items-center gap-3">
//           {/* Coins display - only show when logged in */}
//           {user && (
//             <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm">
//               <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70">
//                 <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m1 5v2h3v2h-3v2h3v2h-3v2h-2v-2H8v-2h3v-2H8V9h3V7z"/>
//               </svg>
//               <b>{formatCoinsValue(user.coins || 0)}</b> coins
//             </span>
//           )}

//           {/* Auth UI */}
//           {!user ? (
//             <div className="flex gap-2 text-sm">
//               <Link to="/login" className="px-3 py-1 rounded hover:bg-slate-100">
//                 Login
//               </Link>
//               <Link to="/signup" className="px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-700">
//                 Sign Up
//               </Link>
//             </div>
//           ) : (
//             <div className="relative">
//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 className="px-3 py-1 rounded hover:bg-slate-100 text-sm flex items-center gap-1"
//               >
//                 {user.username || user.email}
//                 <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70">
//                   <path fill="currentColor" d="M7 10l5 5 5-5z"/>
//                 </svg>
//               </button>

//               {showDropdown && (
//                 <div className="absolute right-0 mt-1 bg-white border rounded shadow-lg z-50 min-w-[150px]">
//                   <button
//                     onClick={handleLogout}
//                     className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
//                   >
//                     Logout
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }


import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { useApp } from "../lib/appState";
import { clearToken } from "../lib/api";
import { formatCoinsValue } from "../lib/coins";

const baseLink = "px-3 py-2 rounded-md transition-colors outline-none";
const idle = "text-slate-700 hover:text-teal-700 hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500";
const active = "text-teal-700 bg-teal-50 font-medium ring-1 ring-teal-200";

export default function Header() {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // JS refs (no generics in .jsx)
  const dropdownRef = useRef(null);
  const mobileRef = useRef(null);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setShowDropdown(false);
    setMobileOpen(false);
    navigate("/login");
  };

  // Close menus on outside click or ESC (JS version)
  useEffect(() => {
    const onClick = (e) => {
      const t = e.target;
      if (dropdownRef.current && t && !dropdownRef.current.contains(t)) {
        setShowDropdown(false);
      }
      if (mobileRef.current && t && !mobileRef.current.contains(t)) {
        setMobileOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const NavItem = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `${baseLink} ${isActive ? active : idle}`}
      onClick={() => setMobileOpen(false)}
    >
      {children}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Teal accent strip */}
      <div className="h-0.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center justify-between gap-3 py-3">
          {/* Brand */}
          <Link
            to={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <img
              src="/mylogo.png"
              alt="EngageSwap logo"
              className="h-8 w-8 rounded-md ring-1 ring-black/5"
              width={32}
              height={32}
              loading="lazy"
            />
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              <span className="text-teal-600">Engage</span>Swap
            </span>
          </Link>

          {/* Desktop nav (only when logged out) */}
          {!user && (
            <nav className="hidden items-center gap-1 md:flex">
              <NavItem to="/">Home</NavItem>
              <NavItem to="/about">About</NavItem>
              <NavItem to="/guide">Guide</NavItem>
              <NavItem to="/market">Pricing</NavItem>
              <NavItem to="/contact">Contact</NavItem>
            </nav>
          )}

          {/* Right side (desktop) */}
          <div className="ml-auto hidden items-center gap-3 md:flex">
            {user && (
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 ring-1 ring-teal-200">
                <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m1 5v2h3v2h-3v2h3v2h-3v2h-2v-2H8v-2h3v-2H8V9h3V7z"
                  />
                </svg>
                <b>{formatCoinsValue(user.coins || 0)}</b> coins
              </span>
            )}

            {!user ? (
              <div className="flex gap-2 text-sm">
                <Link to="/login" className={`${baseLink} ${idle}`}>
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown((v) => !v)}
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  aria-haspopup="menu"
                  aria-expanded={showDropdown}
                >
                  {user.username || user.email}
                  <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70" aria-hidden="true">
                    <path fill="currentColor" d="M7 10l5 5 5-5z" />
                  </svg>
                </button>

                {showDropdown && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 min-w-[180px] overflow-hidden rounded-lg border bg-white shadow-lg ring-1 ring-black/5"
                  >
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 ring-1 ring-teal-200">
                <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-80" aria-hidden="true">
                  <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m1 5v2h3v2h-3v2h3v2h-3v2h-2v-2H8v-2h3v-2H8V9h3V7z" />
                </svg>
                <b>{formatCoinsValue(user.coins || 0)}</b>
              </span>
            )}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-md p-2 text-slate-700 hover:bg-teal-50 hover:text-teal-700 outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {!mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.3 5.71L12 12.01l-6.3-6.3-1.4 1.41 6.29 6.29-6.29 6.3 1.41 1.41L12 14.83l6.3 6.29 1.41-1.41-6.29-6.3 6.29-6.29z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        ref={mobileRef}
        className={`md:hidden overflow-hidden border-t transition-[max-height] duration-300 ease-in-out ${
          mobileOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 py-3">
          {!user ? (
            <>
              <nav className="flex flex-col gap-1">
                <NavItem to="/">Home</NavItem>
                <NavItem to="/about">About</NavItem>
                <NavItem to="/guide">Guide</NavItem>
                <NavItem to="/market">Pricing</NavItem>
                <NavItem to="/contact">Contact</NavItem>
              </nav>
              <div className="mt-3 flex gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className={`${baseLink} ${idle} flex-1 text-center`}>
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-md bg-teal-600 px-3 py-2 text-center text-white hover:bg-teal-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  Sign Up
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <button
                onClick={handleLogout}
                className="mt-1 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
