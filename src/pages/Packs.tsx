import { useState } from 'react';
import { CardView } from '../components/CardView';
import { useCollection } from '../hooks/useCollection';
import type { CardDefinition } from '../types';
import { openPack } from '../utils/packs';

type Phase = 'idle' | 'opening' | 'revealed';

export function Packs() {
  const { addCards, owned } = useCollection();
  const [phase, setPhase] = useState<Phase>('idle');
  const [cards, setCards] = useState<CardDefinition[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);

  const startOpen = () => {
    const pack = openPack(5);
    setCards(pack);
    setRevealedCount(0);
    setPhase('opening');

    pack.forEach((_, i) => {
      setTimeout(() => {
        setRevealedCount(i + 1);
        if (i === pack.length - 1) {
          setTimeout(() => {
            addCards(pack);
            setPhase('revealed');
          }, 400);
        }
      }, 350 + i * 450);
    });
  };

  const reset = () => {
    setPhase('idle');
    setCards([]);
    setRevealedCount(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-amber-300 mb-1">Ouverture de packs</h2>
        <p className="text-slate-400 text-sm">
          Chaque pack contient 5 cartes. Collection actuelle :{' '}
          <strong className="text-white">{owned.length}</strong> cartes.
        </p>
      </div>

      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-6 py-10">
          <button
            type="button"
            onClick={startOpen}
            className="group relative w-40 h-56 sm:w-48 sm:h-64 rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-900 shadow-2xl shadow-amber-500/20 hover:scale-105 transition-transform"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="text-5xl group-hover:animate-bounce">🎁</span>
              <span className="font-bold text-amber-300">Pack Arcanes</span>
              <span className="text-xs text-slate-400">5 cartes</span>
            </div>
            <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/20 animate-pulse pointer-events-none" />
          </button>
          <p className="text-slate-400 text-sm">Clique sur le pack pour l&apos;ouvrir</p>
        </div>
      )}

      {(phase === 'opening' || phase === 'revealed') && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 min-h-[220px]">
            {cards.map((card, i) => (
              <div
                key={`${card.id}-${i}`}
                className={`transition-all duration-500 ${
                  i < revealedCount
                    ? 'opacity-100 scale-100 rotate-0'
                    : 'opacity-0 scale-50 rotate-12'
                }`}
              >
                {i < revealedCount ? (
                  <CardView card={card} />
                ) : (
                  <div className="w-36 sm:w-44 h-48 rounded-xl bg-purple-900/50 border border-dashed border-purple-500/40" />
                )}
              </div>
            ))}
          </div>

          {phase === 'opening' && (
            <p className="text-center text-amber-300/80 animate-pulse">
              Révélation en cours…
            </p>
          )}

          {phase === 'revealed' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-emerald-300 font-medium">
                ✓ Cartes ajoutées à ta collection !
              </p>
              <button
                type="button"
                onClick={reset}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-purple-950 font-bold hover:bg-amber-400 transition"
              >
                Ouvrir un autre pack
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
        <p className="font-semibold text-slate-300 mb-1">Probabilités</p>
        <p>Commune 70% · Rare 20% · Épique 8% · Légendaire 2%</p>
      </div>
    </div>
  );
}
