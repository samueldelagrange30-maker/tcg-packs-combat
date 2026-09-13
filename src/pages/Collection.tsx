import { useMemo } from 'react';
import { CardView } from '../components/CardView';
import { getCardById, RARITY_LABELS } from '../data/cards';
import { useCollection } from '../hooks/useCollection';
import type { Rarity } from '../types';

const ORDER: Rarity[] = ['legendaire', 'epique', 'rare', 'commune'];

export function Collection() {
  const { owned, ready, resetCollection } = useCollection();

  const enriched = useMemo(() => {
    return owned
      .map((o) => {
        const def = getCardById(o.cardId);
        if (!def) return null;
        return { ...def, instanceId: o.instanceId };
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .sort((a, b) => ORDER.indexOf(a.rarete) - ORDER.indexOf(b.rarete));
  }, [owned]);

  const counts = useMemo(() => {
    const c: Record<Rarity, number> = {
      commune: 0,
      rare: 0,
      epique: 0,
      legendaire: 0,
    };
    for (const card of enriched) c[card.rarete] += 1;
    return c;
  }, [enriched]);

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
        {ORDER.map((r) => (
          <span
            key={r}
            className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300"
          >
            {RARITY_LABELS[r]} : {counts[r]}
          </span>
        ))}
      </div>

      {enriched.length === 0 ? (
        <p className="text-slate-400">
          Aucune carte. Ouvre des packs pour remplir ta collection !
        </p>
      ) : (
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start">
          {enriched.map((card) => (
            <CardView key={card.instanceId} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
