import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Upload, Package, LogOut, Moon, Sun } from "lucide-react";

const NAVIGATION = [
  { id: "dashboard", label: "Data Upload", href: "/dashboard", icon: Upload },
  { id: "items", label: "Items", href: "/items", icon: Package },
];

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : prefersDark;
    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);
  }, []);

  const applyTheme = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
      html.style.colorScheme = "dark";
    } else {
      html.classList.remove("dark");
      html.style.colorScheme = "light";
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    applyTheme(newDark);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <header className={`w-full transition-colors duration-300 ${
      isDark
        ? "bg-slate-900 text-white border-b border-slate-700"
        : "bg-white text-slate-900 border-b border-slate-200"
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-xl font-bold">Data Portal</h1>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          {NAVIGATION.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded transition ${
                  isActive
                    ? isDark
                      ? "bg-blue-600 text-white"
                      : "bg-blue-600 text-white"
                    : isDark
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Theme Toggle & Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              isDark
                ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="text-sm font-semibold">{isDark ? "Light" : "Dark"}</span>
          </button>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-3 py-2 rounded transition ${
              isDark
                ? "text-slate-300 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
