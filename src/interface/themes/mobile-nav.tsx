import { Link, useLocation } from "react-router";
import { Home, Plus, User } from "lucide-react";
import { useAuthStore } from "@/src/store/use-auth-store";

export default function MobileFloatingNav() {
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-between gap-6 px-6 py-3 rounded-full bg-white/30 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200/30 dark:border-neutral-800/50 shadow-lg z-50">
      <NavItem to="/" active={pathname === "/"} icon={<Home />} label="Home" />
      <Link
        to="/create-poem"
        className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl -mt-7 hover:scale-110 transition-transform relative group"
      >
        <Plus className="w-6 h-6" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Create Poem
        </span>
      </Link>
      <NavItem
        to="/profile"
        active={pathname === "/profile"}
        icon={
          <img
            src={user?.image || "/default-avatar.png"}
            alt={user?.name}
            className="w-6 h-6 rounded-full"
          />
        }
        label="Profile"
      />
    </nav>
  );
}

function NavItem({ to, active, icon, label }: any) {
  return (
    <Link
      to={to}
      className={`relative text-neutral-500 dark:text-neutral-400 transition-colors ${
        active ? "text-primary" : "hover:text-primary"
      }`}
    >
      {icon}
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </Link>
  );
}
