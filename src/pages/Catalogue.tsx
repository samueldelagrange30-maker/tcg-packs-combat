import { useMemo, useState } from 'react';
import { CardView } from '../components/CardView';
import { CATALOGUE, RARITY_LABELS, RARITY_ORDER } from '../data/cards';
import { useCollection } from '../hooks/useCollection';
import type { Rarity } from '../types';

const FILTER_ACCENT: Record<Rarity | 'tous', string> = {
  tous: 'bg-amber-500/20 border-amber-400/50 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.15)]',
  commun: 'bg-slate-500/20 border-slate-400/50 text-slate-200',
  peu_commun: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200',
  rare: 'bg-blue-500/20 border-blue-400/50 text-blue-200',
  super_rare: 'bg-purple-500/20 border-purple-400/50 text-purple-200',
  ultra_rare: 'bg-amber-500/20 border-yellow-400/50 text-yellow-200',
  legendaire: 'bg-rose-500/20 border-rose-400/50 text-rose-200',
  dieu: 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-200',
};

export function Catalogue() {
  const { owned } = useCollection();
  const [filter, setFilter] = useState<Rarity | 'tous'>('tous');
  const [query, setQuery] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);

  const ownedIds = useMemo(() => new Set(owned.map((o) => o.cardId)), [owned]);

  const counts = useMemo(() => {
    const c: Record<Rarity, number> = {
      commun: 0,
      peu_commun: 0,
      rare: 0,
      super_rare: 0,
      ultra_rare: 0,
      legendaire: 0,
      dieu: 0,
    };
    for (const card of CATALOGUE) c[card.rarete] += 1;
    return c;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOGUE.filter((card) => {
      if (filter !== 'tous' && card.rarete !== filter) return false;
      if (onlyMissing && ownedIds.has(card.id)) return false;
      if (!q) return true;
      return (
        card.nom.toLowerCase().includes(q) ||
        card.serie.toLowerCase().includes(q) ||
        card.effetDescription.toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      const r = RARITY_ORDER.indexOf(a.rarete) - RARITY_ORDER.indexOf(b.rarete);
      if (r !== 0) return r;
      return a.nom.localeCompare(b.nom, 'fr');
    });
  }, [filter, query, onlyMissing, ownedIds]);

  const ownedCount = ownedIds.size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
            Catalogue
          </h2>
          <p className="text-slate-400 text-sm">
            {CATALOGUE.length} cartes disponibles · {ownedCount} unique
            {ownedCount > 1 ? 's' : ''} dans ta collection
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un perso, une série…"
          className="flex-1 min-h-[44px] rounded-xl bg-white/5 border border-white/15 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
        />
        <label className="flex items-center gap-2 min-h-[44px] px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={(e) => setOnlyMissing(e.target.checked)}
            className="accent-amber-400"
          />
          Manquantes seulement
        </label>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter('tous')}
          className={`px-3 py-2 rounded-xl border transition min-h-[40px] ${
            filter === 'tous'
              ? FILTER_ACCENT.tous
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
        >
          Tous · {CATALOGUE.length}
        </button>
        {RARITY_ORDER.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setFilter(r)}
            className={`px-3 py-2 rounded-xl border transition min-h-[40px] ${
              filter === r
                ? FILTER_ACCENT[r]
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            {RARITY_LABELS[r]} · {counts[r]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl panel-glass p-8 text-center text-slate-400">
          Aucune carte ne correspond à ta recherche.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 justify-items-center">
          {filtered.map((card) => {
            const has = ownedIds.has(card.id);
            return (
              <div key={card.id} className="relative">
                <CardView card={card} className={has ? '' : 'opacity-80'} />
                <span
                  className={`absolute -top-1.5 -left-1.5 z-20 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                    has
                      ? 'bg-emerald-600/90 border-emerald-300/40 text-white'
                      : 'bg-slate-800/90 border-white/20 text-slate-300'
                  }`}
                >
                  {has ? 'Possédée' : 'À obtenir'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
