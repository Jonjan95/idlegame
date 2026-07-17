import { Link, useLocation } from "react-router-dom";

const links = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/woodcutting", label: "Woodcutting", icon: "🪓" },
  { href: "/mining", label: "Mining", icon: "⛏️" },
  { href: "/inventory", label: "Inventory", icon: "🎒" },
  { href: "/shop", label: "Shop", icon: "🏪" },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-10 flex items-center gap-2 border-b border-zinc-700 bg-zinc-950 px-3 py-0 sm:justify-between sm:px-6">
      <span className="shrink-0 font-mono text-xs font-bold uppercase tracking-widest text-white/40">
        ⚔️ IdleGame
      </span>
      <ul className="flex min-w-0 flex-1 items-center overflow-x-auto sm:flex-none sm:overflow-visible">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                to={link.href}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
                  isActive
                    ? "border-white text-white"
                    : "border-transparent text-white/40 hover:border-white/30 hover:text-white/70"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
