// src/App.jsx
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import { Outlet } from "react-router-dom";
import { useApp } from "./lib/appState";

export default function App() {
  const { user } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className={`flex-1 ${user ? 'px-8' : 'mx-auto max-w-5xl px-4'} py-12 overflow-auto`}>
          <div className={user ? 'max-w-6xl mx-auto' : ''}>
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
