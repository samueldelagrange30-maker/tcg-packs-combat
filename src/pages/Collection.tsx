import { useMemo, useState } from 'react';
import { CardView } from '../components/CardView';
import { getCardById, RARITY_LABELS, RARITY_ORDER } from '../data/cards';
import { useCollection } from '../hooks/useCollection';
import type { Rarity } from '../types';

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
          <h2 className="text-2xl font-bold text-amber-300 mb-1">Collection</h2>
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
          className="text-xs text-slate-500 hover:text-rose-300 underline"
        >
          Réinitialiser
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter('tous')}
          className={`px-2 py-1 rounded-lg border transition ${
            filter === 'tous'
              ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
        >
          Tous : {enriched.length}
        </button>
        {RARITY_ORDER.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setFilter(r)}
            className={`px-2 py-1 rounded-lg border transition ${
              filter === r
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            {RARITY_LABELS[r]} : {counts[r]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-400">
          Aucune carte{filter !== 'tous' ? ' pour ce filtre' : ''}. Ouvre des packs pour
          remplir ta collection !
        </p>
      ) : (
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start">
          {filtered.map((card) => (
            <CardView key={card.instanceId} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
