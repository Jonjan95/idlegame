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
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-700 bg-zinc-950 px-6 py-0">
      <span className="font-mono text-xs font-bold tracking-widest text-white/40 uppercase">
        ⚔️ IdleGame
      </span>
      <ul className="flex items-center">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                to={link.href}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
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
