import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/packs', label: 'Packs' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/collection', label: 'Collection' },
  { to: '/combat', label: 'Combat' },
];

export function Layout() {
  return (
    <div className="site-bg site-vignette relative min-h-screen flex flex-col text-slate-100">
      <header className="sticky top-0 z-40 border-b border-amber-500/25 bg-[#05080f]/80 backdrop-blur-xl">
        <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-rose-700 shadow-lg shadow-amber-500/30 flex items-center justify-center border border-amber-200/30">
              <span className="font-display text-lg text-black font-bold">A</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-base sm:text-lg text-amber-300 tracking-wide">
                Anime Packs Combat
              </h1>
              <p className="text-[11px] text-slate-400 tracking-wider uppercase">
                TCG fan · Packs & Combat
              </p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] flex items-center touch-manipulation ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
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
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <Outlet />
      </main>
      <footer className="relative z-10 border-t border-white/5 py-4 text-center text-[11px] sm:text-xs text-slate-500 px-3 space-y-1">
        <p>Anime Packs Combat — projet fan non officiel, sans affiliation aux ayants droit.</p>
        <p className="text-slate-600">Portraits via AniList · personnages © leurs propriétaires respectifs</p>
      </footer>
    </div>
  );
}
