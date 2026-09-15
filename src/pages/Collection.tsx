import { useMemo, useState } from 'react';
import { CardView } from '../components/CardView';
import { getCardById, RARITY_LABELS, RARITY_ORDER } from '../data/cards';
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

export function Collection() {
  const { owned, ready, resetCollection } = useCollection();
  const [filter, setFilter] = useState<Rarity | 'tous'>('tous');

  const enriched = useMemo(() => {
    return owned
      .map((o) => {
        const def = getCardById(o.cardId);
        if (!def) return null;
        return { ...def, instanceId: o.instanceId };
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarete) - RARITY_ORDER.indexOf(b.rarete));
  }, [owned]);

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
    for (const card of enriched) c[card.rarete] += 1;
    return c;
  }, [enriched]);

  const filtered = useMemo(() => {
    if (filter === 'tous') return enriched;
    return enriched.filter((c) => c.rarete === filter);
  }, [enriched, filter]);

  if (!ready) {
    return <p className="text-slate-400">Chargement de la collection…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
            Collection
          </h2>
          <p className="text-slate-400 text-sm">
            {enriched.length} carte{enriched.length > 1 ? 's' : ''} possédée
            {enriched.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm('Réinitialiser la collection (5 cartes de démarrage) ?')) {
              resetCollection();
            }
          }}
          className="text-xs text-slate-500 hover:text-rose-300 underline min-h-[44px]"
        >
          Réinitialiser
        </button>
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
          Tous · {enriched.length}
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
          Aucune carte{filter !== 'tous' ? ' pour ce filtre' : ''}. Ouvre des packs pour remplir ta
          collection !
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 justify-items-center">
          {filtered.map((card) => (
            <CardView key={card.instanceId} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
