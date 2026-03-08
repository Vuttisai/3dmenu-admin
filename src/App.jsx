import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import MenuManagement from "./pages/MenuManagement";
import { LayoutDashboard, UtensilsCrossed, Menu, X } from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const links = [
    { path: "/", label: "Menu Management", icon: <UtensilsCrossed size={20} /> },
    { path: "/analytics", label: "Analytics", icon: <LayoutDashboard size={20} /> },
  ];

  return (
    <>
      {/* Overlay on mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />}

      <div className={`fixed left-0 top-0 bottom-0 w-64 bg-gray-900 text-white p-4 flex flex-col z-50 transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="flex items-center justify-between mb-8">
          <div className="text-xl font-bold flex items-center gap-2 p-2 text-indigo-400">
            ⚙️ Admin Portal
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white md:hidden"><X size={20} /></button>
        </div>
        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <Link key={link.path} to={link.path} onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors no-underline ${
                location.pathname === link.path
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}>
              {link.icon}
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 md:ml-64 bg-gray-50 min-h-screen overflow-x-hidden">
          {/* Mobile top bar */}
          <div className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu size={20} />
            </button>
            <span className="font-bold text-gray-900">Admin Portal</span>
          </div>

          <Routes>
            <Route path="/" element={<MenuManagement />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
