import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  Columns3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  StickyNote,
  Sun,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/applications", label: "Applications", icon: Briefcase },
  { to: "/board", label: "Pipeline board", icon: Columns3 },
  { to: "/interviews", label: "Interviews", icon: CalendarDays },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/notes", label: "Career notes", icon: StickyNote },
  { to: "/documents", label: "CV library", icon: FileText },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem("careerflow.theme") || "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("careerflow.theme", theme);
  }, [theme]);

  function submitSearch(event) {
    event.preventDefault();
    const query = search.trim();
    navigate("/applications" + (query ? "?search=" + encodeURIComponent(query) : ""));
    setMenuOpen(false);
  }

  async function signOut() {
    await logout();
    navigate("/login");
  }

  function SidebarLinks() {
    return (
      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="nav-caption">WORKSPACE</p>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
        <p className="nav-caption nav-caption-bottom">PERSONAL</p>
        <NavLink
          to="/settings"
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
        >
          <Settings size={18} strokeWidth={1.8} />
          <span>Profile & settings</span>
        </NavLink>
      </nav>
    );
  }

  const initials = ((user?.first_name || user?.username || "C").slice(0, 1) +
    (user?.last_name || "").slice(0, 1)).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">C</div>
          <div>
            <strong>careerflow</strong>
            <span>JOB SEARCH, IN FOCUS</span>
          </div>
        </div>
        <SidebarLinks />
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon"><Activity size={17} /></div>
            <div>
              <strong>One step at a time</strong>
              <span>Your next role is taking shape.</span>
            </div>
          </div>
          <div className="sidebar-user">
            <div className="avatar">{initials}</div>
            <div className="sidebar-user-copy">
              <strong>{user?.first_name || user?.username}</strong>
              <span>{user?.email || "CareerFlow member"}</span>
            </div>
            <button className="icon-button sidebar-logout" onClick={signOut} aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {menuOpen && <button className="mobile-scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <aside className={"mobile-sidebar" + (menuOpen ? " open" : "")}>
        <div className="brand-lockup">
          <div className="brand-mark">C</div>
          <div><strong>careerflow</strong><span>JOB SEARCH, IN FOCUS</span></div>
          <button className="icon-button mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <SidebarLinks />
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <form className="global-search" onSubmit={submitSearch}>
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles, companies, locations..."
                aria-label="Search applications"
              />
              <kbd>Enter</kbd>
            </form>
          </div>
          <div className="topbar-actions">
            <button className="icon-button theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Toggle color theme">
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="icon-button notification-button" onClick={() => navigate("/reminders")} aria-label="Open reminders">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>
            <button className="profile-chip" onClick={() => navigate("/settings")}>
              <span className="avatar avatar-small">{initials}</span>
              <span>{user?.first_name || user?.username}</span>
            </button>
            <button className="button button-primary quick-add" onClick={() => navigate("/applications?create=1")}>
              <Plus size={17} /> <span>Add application</span>
            </button>
          </div>
        </header>
        <main className="page-area">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span><span className="footer-dot" /> Your search, organized.</span>
          <span>CareerFlow <span className="footer-separator">/</span> Keep moving forward</span>
        </footer>
      </div>
    </div>
  );
}
