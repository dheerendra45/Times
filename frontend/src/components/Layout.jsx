import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 font-medium">
              © 2024 HackPortal. AI-Powered Hackathon Management.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 font-medium">
                Built with FastAPI + React + Gemini
              </span>
              <div
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"
                title="System Online"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
