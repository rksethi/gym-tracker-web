import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconHome, IconLibrary, IconHistory, IconSettings, IconDumbbell } from "./Icons";
import type { ReactNode } from "react";

type NavItem = { to: string; label: string; icon: ReactNode };

const baseLinks: NavItem[] = [
  { to: "/", label: "Home", icon: <IconHome size={20} /> },
  { to: "/library", label: "Library", icon: <IconLibrary size={20} /> },
  { to: "/history", label: "History", icon: <IconHistory size={20} /> },
  { to: "/settings", label: "Settings", icon: <IconSettings size={20} /> },
];

export default function Layout() {
  const { user, logout } = useAuth();

  const links: NavItem[] = user?.is_admin
    ? [...baseLinks.filter((l) => l.to !== "/admin"), { to: "/admin", label: "Admin", icon: <IconSettings size={20} /> }]
    : baseLinks;

  return (
    <div className="min-h-screen flex flex-col max-w-[100vw]">
      <header className="bg-surface border-b border-surface-300 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-accent-400 flex items-center gap-1.5">
            <IconDumbbell size={22} /> GymTracker
          </span>
          <div className="flex items-center gap-3">
            <nav className="hidden sm:flex gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      isActive ? "bg-accent-500/15 text-accent-400" : "text-gray-400 hover:bg-surface-200"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            {user && (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-gray-500 hidden sm:inline">{user.email}</span>
                <button
                  onClick={logout}
                  className="text-xs text-gray-500 hover:text-red-400 font-medium px-2 py-1 rounded-lg hover:bg-surface-200 transition"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-surface-300 z-30">
        <div className="flex justify-around py-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-xs ${isActive ? "text-accent-400" : "text-gray-500"}`
              }
            >
              {l.icon}
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
