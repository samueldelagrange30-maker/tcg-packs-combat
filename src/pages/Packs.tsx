import { useState } from 'react';
import { CardView } from '../components/CardView';
import { RARITY_LABELS } from '../data/cards';
import { useCollection } from '../hooks/useCollection';
import type { CardDefinition, Rarity } from '../types';
import { openPack } from '../utils/packs';

type Phase = 'idle' | 'opening' | 'revealed';

const RARITY_ORDER: Rarity[] = ['legendaire', 'epique', 'rare', 'commune'];

export function Packs() {
  const { addCards, owned } = useCollection();
  const [phase, setPhase] = useState<Phase>('idle');
  const [cards, setCards] = useState<CardDefinition[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [shake, setShake] = useState(false);

  const startOpen = () => {
    const pack = openPack(5);
    setCards(pack);
    setRevealedCount(0);
    setShake(true);
    setPhase('opening');

    setTimeout(() => setShake(false), 500);

    pack.forEach((_, i) => {
      setTimeout(() => {
        setRevealedCount(i + 1);
        if (i === pack.length - 1) {
          setTimeout(() => {
            addCards(pack);
            setPhase('revealed');
          }, 450);
        }
      }, 400 + i * 480);
    });
  };

  const reset = () => {
    setPhase('idle');
    setCards([]);
    setRevealedCount(0);
    setShake(false);
  };

  const bestRarity =
    cards.length > 0
      ? RARITY_ORDER.find((r) => cards.some((c) => c.rarete === r))
      : null;

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
        <div className="flex flex-col items-center gap-6 py-8 sm:py-10">
          <button
            type="button"
            onClick={startOpen}
            className="group relative w-40 h-56 sm:w-48 sm:h-64 rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-900 shadow-2xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-transform touch-manipulation"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="text-5xl group-hover:animate-bounce">🎁</span>
              <span className="font-bold text-amber-300">Pack Arcanes</span>
              <span className="text-xs text-slate-400">5 cartes</span>
            </div>
            <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/20 animate-pulse pointer-events-none" />
          </button>
          <p className="text-slate-400 text-sm text-center px-4">
            Appuie sur le pack pour l&apos;ouvrir
          </p>
        </div>
      )}

      {(phase === 'opening' || phase === 'revealed') && (
        <div className="space-y-5">
          {phase === 'opening' && revealedCount === 0 && (
            <div className="flex justify-center">
              <div
                className={`w-36 h-48 sm:w-44 sm:h-56 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-purple-800 to-indigo-950 flex items-center justify-center text-5xl shadow-lg shadow-amber-500/20 ${
                  shake ? 'animate-pack-shake' : ''
                }`}
              >
                🎁
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 min-h-[200px]">
            {cards.map((card, i) => {
              const shown = i < revealedCount;
              return (
                <div
                  key={`${card.id}-${i}`}
                  className={`transition-all duration-500 ease-out ${
                    shown
                      ? 'opacity-100 scale-100 translate-y-0 rotate-0'
                      : 'opacity-0 scale-75 translate-y-4 rotate-6'
                  }`}
                >
                  {shown ? (
                    <div className="animate-card-pop">
                      <CardView card={card} />
                      {(card.rarete === 'epique' || card.rarete === 'legendaire') && (
                        <p className="text-center text-[10px] mt-1 font-semibold text-amber-300 animate-pulse">
                          {card.rarete === 'legendaire' ? '✨ Légendaire !' : '💜 Épique !'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="w-36 sm:w-44 h-48 rounded-xl bg-purple-900/40 border border-dashed border-purple-500/30" />
                  )}
                </div>
              );
            })}
          </div>

          {phase === 'opening' && (
            <div className="text-center space-y-1">
              <p className="text-amber-300/90 animate-pulse font-medium">
                Révélation… {revealedCount}/{cards.length}
              </p>
              <div className="mx-auto h-1.5 w-40 sm:w-56 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{
                    width: `${cards.length ? (revealedCount / cards.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {phase === 'revealed' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-emerald-300 font-medium text-center">
                ✓ Cartes ajoutées à ta collection !
              </p>
              {bestRarity && bestRarity !== 'commune' && (
                <p className="text-sm text-amber-200/90">
                  Meilleure rareté : {RARITY_LABELS[bestRarity]}
                </p>
              )}
              <button
                type="button"
                onClick={reset}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 text-purple-950 font-bold hover:bg-amber-400 transition touch-manipulation min-h-[44px]"
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
