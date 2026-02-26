import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/library", label: "Library", icon: "📚" },
  { to: "/history", label: "History", icon: "🕐" },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-accent-600">🏋️ GymTracker</span>
          <div className="flex items-center gap-3">
            <nav className="hidden sm:flex gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      isActive ? "bg-accent-100 text-accent-700" : "text-gray-600 hover:bg-gray-100"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            {user && (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-gray-400 hidden sm:inline">{user.email}</span>
                <button
                  onClick={logout}
                  className="text-xs text-gray-500 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
        <div className="flex justify-around py-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center text-xs ${isActive ? "text-accent-600" : "text-gray-500"}`
              }
            >
              <span className="text-lg">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
