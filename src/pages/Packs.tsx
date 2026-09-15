import { useState } from 'react';
import { CardView } from '../components/CardView';
import { RARITY_LABELS, RARITY_ORDER, RARITY_WEIGHTS } from '../data/cards';
import { useCollection } from '../hooks/useCollection';
import type { CardDefinition, Rarity } from '../types';
import { openPack } from '../utils/packs';

type Phase = 'idle' | 'opening' | 'revealed';

const HIGHLIGHT: Rarity[] = ['super_rare', 'ultra_rare', 'legendaire', 'dieu'];

function oddsLabel(r: Rarity): string {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  const pct = (RARITY_WEIGHTS[r] / total) * 100;
  if (pct < 1) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

function highlightMsg(r: Rarity): string | null {
  switch (r) {
    case 'dieu':
      return 'DIEU !!!';
    case 'legendaire':
      return 'Légendaire !';
    case 'ultra_rare':
      return 'Ultra rare !';
    case 'super_rare':
      return 'Super rare !';
    default:
      return null;
  }
}

export function Packs() {
  const { addCards, owned } = useCollection();
  const [phase, setPhase] = useState<Phase>('idle');
  const [cards, setCards] = useState<CardDefinition[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [burstIndex, setBurstIndex] = useState<number | null>(null);

  const startOpen = () => {
    const pack = openPack(5);
    setCards(pack);
    setRevealedCount(0);
    setBurstIndex(null);
    setShake(true);
    setPhase('opening');

    setTimeout(() => setShake(false), 500);

    pack.forEach((card, i) => {
      setTimeout(() => {
        setRevealedCount(i + 1);
        if (HIGHLIGHT.includes(card.rarete)) {
          setBurstIndex(i);
          setTimeout(() => setBurstIndex(null), 700);
        }
        if (i === pack.length - 1) {
          setTimeout(() => {
            addCards(pack);
            setPhase('revealed');
          }, 450);
        }
      }, 400 + i * 520);
    });
  };

  const reset = () => {
    setPhase('idle');
    setCards([]);
    setRevealedCount(0);
    setShake(false);
    setBurstIndex(null);
  };

  const bestRarity =
    cards.length > 0 ? RARITY_ORDER.find((r) => cards.some((c) => c.rarete === r)) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
          Ouverture de packs
        </h2>
        <p className="text-slate-400 text-sm">
          Chaque pack contient 5 cartes anime. Collection :{' '}
          <strong className="text-white">{owned.length}</strong> cartes.
        </p>
      </div>

      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-6 py-8 sm:py-12">
          <button
            type="button"
            onClick={startOpen}
            className="group relative w-44 h-64 sm:w-52 sm:h-72 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 shadow-2xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-transform touch-manipulation overflow-hidden"
          >
            <div className="absolute inset-0 foil-shimmer opacity-50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40 group-hover:scale-110 transition">
                <span className="font-display text-2xl text-black font-bold">P</span>
              </div>
              <span className="font-display font-bold text-amber-300 text-lg">Pack Anime</span>
              <span className="text-xs text-slate-400 tracking-widest uppercase">5 cartes</span>
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
                className={`relative w-40 h-56 sm:w-48 sm:h-64 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-purple-900 to-indigo-950 flex items-center justify-center shadow-lg shadow-amber-500/20 overflow-hidden ${
                  shake ? 'animate-pack-shake' : ''
                }`}
              >
                <div className="absolute inset-0 foil-shimmer" />
                <span className="font-display text-amber-300 text-xl z-10">Ouverture…</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 min-h-[220px]">
            {cards.map((card, i) => {
              const shown = i < revealedCount;
              const msg = HIGHLIGHT.includes(card.rarete) ? highlightMsg(card.rarete) : null;
              return (
                <div
                  key={`${card.id}-${i}`}
                  className={`relative transition-all duration-500 ease-out ${
                    shown
                      ? 'opacity-100 scale-100 translate-y-0 rotate-0'
                      : 'opacity-0 scale-75 translate-y-4 rotate-6'
                  }`}
                >
                  {shown ? (
                    <div className="animate-card-pop relative">
                      {burstIndex === i && <div className="rarity-burst" />}
                      <CardView card={card} />
                      {msg && (
                        <p className="text-center text-[10px] mt-1.5 font-display font-semibold text-amber-300 animate-pulse tracking-wide">
                          {msg}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="w-40 sm:w-48 h-56 rounded-xl bg-slate-900/60 border border-dashed border-amber-500/20" />
                  )}
                </div>
              );
            })}
          </div>

          {phase === 'opening' && (
            <div className="text-center space-y-2">
              <p className="text-amber-300/90 animate-pulse font-medium font-display">
                Révélation… {revealedCount}/{cards.length}
              </p>
              <div className="mx-auto h-1.5 w-44 sm:w-56 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-300"
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
                Cartes ajoutées à ta collection !
              </p>
              {bestRarity && bestRarity !== 'commun' && (
                <p className="text-sm text-amber-200/90 font-display">
                  Meilleure rareté : {RARITY_LABELS[bestRarity]}
                </p>
              )}
              <button
                type="button"
                onClick={reset}
                className="btn-gold w-full sm:w-auto px-6 py-3 rounded-xl transition touch-manipulation min-h-[44px]"
              >
                Ouvrir un autre pack
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl panel-glass p-4 text-sm text-slate-400">
        <p className="font-display font-semibold text-amber-200/90 mb-2">Probabilités</p>
        <ul className="grid sm:grid-cols-2 gap-1.5">
          {[...RARITY_ORDER].reverse().map((r) => (
            <li key={r} className="flex justify-between gap-2 border-b border-white/5 pb-1">
              <span>{RARITY_LABELS[r]}</span>
              <span className="tabular-nums text-slate-300">{oddsLabel(r)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
