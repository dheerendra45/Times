import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import {
  HiOutlineHome,
  HiOutlineRectangleStack,
  HiOutlineSparkles,
  HiBars3,
  HiXMark,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUser,
} from "react-icons/hi2";

const navLinks = [
  { to: "/", label: "Dashboard", icon: HiOutlineHome },
  { to: "/projects", label: "Projects", icon: HiOutlineRectangleStack },
  { to: "/chat", label: "AI Chat", icon: HiOutlineSparkles },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            id="nav-logo"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
              <HiOutlineSparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              HackPortal
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                id={`nav-${label.toLowerCase().replace(" ", "-")}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-primary-50 to-purple-50 text-primary-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5" />
                {label}
              </NavLink>
            ))}

            {/* Auth buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50">
                  <HiOutlineUser className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.username || "User"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition-all"
                >
                  <HiOutlineArrowRightOnRectangle className="w-4.5 h-4.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:shadow-lg transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            id="nav-mobile-toggle"
          >
            {mobileOpen ? (
              <HiXMark className="w-6 h-6" />
            ) : (
              <HiBars3 className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-primary-50 to-purple-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}

            {/* Mobile auth buttons */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-3 mb-2 rounded-lg bg-gray-50">
                    <HiOutlineUser className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {user?.username || "User"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full px-4 py-3 mb-2 rounded-xl text-sm font-semibold text-center text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full px-4 py-3 rounded-xl text-sm font-semibold text-center bg-gradient-to-r from-primary-600 to-purple-600 text-white transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
