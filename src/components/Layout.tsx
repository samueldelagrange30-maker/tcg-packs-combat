import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/packs', label: 'Packs' },
  { to: '/collection', label: 'Collection' },
  { to: '/combat', label: 'Combat' },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0b0618] via-[#120a2a] to-[#0a1628] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-amber-500/30 bg-[#0b0618]/95 backdrop-blur-md safe-top">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🎌
            </span>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-amber-300 tracking-wide">
                Anime Packs Combat
              </h1>
              <p className="text-[11px] text-slate-400">TCG fan · Packs & Combat</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] flex items-center touch-manipulation ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                      : 'text-slate-300 hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-5 sm:py-6">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 py-3 sm:py-4 text-center text-xs text-slate-500 px-3">
        Anime Packs Combat — contenu fan non officiel · personnages © leurs ayants droit
      </footer>
    </div>
  );
}
