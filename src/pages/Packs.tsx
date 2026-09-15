import { useEffect, useRef, useState } from 'react';
import { CardView } from '../components/CardView';
import { RARITY_LABELS, RARITY_ORDER, RARITY_WEIGHTS } from '../data/cards';
import { useCollection } from '../hooks/useCollection';
import type { CardDefinition, Rarity } from '../types';
import { openPackByKind, type PackKind } from '../utils/packs';

type Phase = 'idle' | 'shaking' | 'reveal' | 'summary';

function oddsLabel(r: Rarity): string {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  const pct = (RARITY_WEIGHTS[r] / total) * 100;
  if (pct < 1) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

function isLegendary(r: Rarity): boolean {
  return r === 'legendaire';
}

function isEpicTier(r: Rarity): boolean {
  return r === 'legendaire' || r === 'dieu';
}

export function Packs() {
  const { addCards, owned } = useCollection();
  const [phase, setPhase] = useState<Phase>('idle');
  const [cards, setCards] = useState<CardDefinition[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showLegendFx, setShowLegendFx] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  useEffect(() => () => clearTimers(), []);

  const finishPack = (pack: CardDefinition[]) => {
    addCards(pack);
    setShowLegendFx(false);
    setPhase('summary');
  };

  const revealAt = (pack: CardDefinition[], i: number) => {
    const card = pack[i];
    setIndex(i);
    setFlipped(false);
    setShowLegendFx(false);
    setPhase('reveal');

    // Flip after a short suspense beat
    const suspense = isLegendary(card.rarete) ? 700 : 350;
    later(() => {
      setFlipped(true);
      if (isLegendary(card.rarete)) {
        setShowLegendFx(true);
      }

      const hold = isLegendary(card.rarete) ? 3200 : isEpicTier(card.rarete) ? 1800 : 1100;
      later(() => {
        setShowLegendFx(false);
        if (i + 1 < pack.length) {
          revealAt(pack, i + 1);
        } else {
          later(() => finishPack(pack), 400);
        }
      }, hold);
    }, suspense);
  };

  const startOpen = (kind: PackKind = 'standard') => {
    clearTimers();
    const pack = openPackByKind(kind, 5);
    setCards(pack);
    setIndex(0);
    setFlipped(false);
    setShowLegendFx(false);
    setPhase('shaking');

    later(() => {
      revealAt(pack, 0);
    }, 650);
  };

  const reset = () => {
    clearTimers();
    setPhase('idle');
    setCards([]);
    setIndex(0);
    setFlipped(false);
    setShowLegendFx(false);
  };

  const current = cards[index];
  const bestRarity =
    cards.length > 0 ? RARITY_ORDER.find((r) => cards.some((c) => c.rarete === r)) : null;

  return (
    <div className="space-y-6 relative">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
          Ouverture de packs
        </h2>
        <p className="text-slate-400 text-sm">
          Une carte après l&apos;autre. Collection :{' '}
          <strong className="text-white">{owned.length}</strong> cartes.
        </p>
      </div>

      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-6 py-8 sm:py-12">
          <div className="flex flex-wrap justify-center gap-5 sm:gap-8">
            <button
              type="button"
              onClick={() => startOpen('standard')}
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

            <button
              type="button"
              onClick={() => startOpen('admin_legendaire')}
              className="group relative w-44 h-64 sm:w-52 sm:h-72 rounded-2xl border-2 border-rose-400/60 bg-gradient-to-br from-rose-950 via-red-950 to-slate-950 shadow-2xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-transform touch-manipulation overflow-hidden"
            >
              <div className="absolute inset-0 foil-shimmer opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 px-3">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-300 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/40 group-hover:scale-110 transition">
                  <span className="font-display text-xl text-black font-bold">A</span>
                </div>
                <span className="font-display font-bold text-rose-300 text-lg text-center leading-tight">
                  Pack Admin
                </span>
                <span className="text-xs text-rose-200/80 tracking-wide uppercase text-center">
                  100% légendaire
                </span>
                <span className="text-[10px] text-slate-400 tracking-widest uppercase">5 cartes</span>
              </div>
              <div className="absolute inset-0 rounded-2xl ring-2 ring-rose-400/25 animate-pulse pointer-events-none" />
            </button>
          </div>
          <p className="text-slate-400 text-sm text-center px-4">
            Choisis un pack pour l&apos;ouvrir
          </p>
        </div>
      )}

      {phase === 'shaking' && (
        <div className="flex justify-center py-16">
          <div className="relative w-40 h-56 sm:w-48 sm:h-64 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-purple-900 to-indigo-950 flex items-center justify-center shadow-lg shadow-amber-500/20 overflow-hidden animate-pack-shake">
            <div className="absolute inset-0 foil-shimmer" />
            <span className="font-display text-amber-300 text-xl z-10">Ouverture…</span>
          </div>
        </div>
      )}

      {phase === 'reveal' && current && (
        <div className="relative flex flex-col items-center gap-5 py-6 min-h-[420px]">
          <p className="text-amber-300/90 font-display font-medium tracking-wide">
            Carte {index + 1} / {cards.length}
          </p>

          <div className="pack-stage relative flex items-center justify-center w-full max-w-md mx-auto">
            <div
              className={`card-flip-scene ${flipped ? 'is-flipped' : ''} ${
                flipped && isLegendary(current.rarete) ? 'legend-pulse' : ''
              }`}
            >
              <div className="card-flip-inner">
                <div className="card-flip-face card-flip-back">
                  <div className="w-48 sm:w-56 aspect-[3/4] rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 shadow-2xl flex flex-col items-center justify-center gap-3 overflow-hidden relative">
                    <div className="absolute inset-0 foil-shimmer opacity-70" />
                    <span className="font-display text-4xl text-amber-300 z-10">?</span>
                    <span className="text-xs text-slate-400 tracking-[0.3em] uppercase z-10">
                      Mystère
                    </span>
                  </div>
                </div>
                <div className="card-flip-face card-flip-front">
                  <CardView card={current} className="!w-48 sm:!w-56 !h-[27rem] sm:!h-[29rem]" />
                </div>
              </div>
            </div>
          </div>

          {flipped && (
            <div className="text-center space-y-1 animate-card-pop">
              <p className="font-display text-lg text-white">{current.nom}</p>
              <p
                className={`text-sm font-semibold tracking-wide ${
                  isLegendary(current.rarete)
                    ? 'text-rose-300 legend-title-glow'
                    : 'text-amber-200/90'
                }`}
              >
                {RARITY_LABELS[current.rarete]}
              </p>
            </div>
          )}

          <div className="mx-auto h-1.5 w-44 sm:w-56 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-500"
              style={{ width: `${((index + (flipped ? 1 : 0)) / cards.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'summary' && (
        <div className="space-y-5">
          <p className="text-center text-emerald-300 font-medium">
            Pack terminé — cartes ajoutées à ta collection !
          </p>
          {bestRarity && bestRarity !== 'commun' && (
            <p className="text-center text-sm text-amber-200/90 font-display">
              Meilleure rareté : {RARITY_LABELS[bestRarity]}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {cards.map((card, i) => (
              <div key={`${card.id}-${i}`} className="animate-card-pop">
                <CardView card={card} />
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={reset}
              className="btn-gold w-full sm:w-auto px-6 py-3 rounded-xl transition touch-manipulation min-h-[44px]"
            >
              Ouvrir un autre pack
            </button>
          </div>
        </div>
      )}

      {showLegendFx && current && (
        <div className="legend-epic-overlay" aria-hidden>
          <div className="legend-epic-flash" />
          <div className="legend-epic-rays" />
          <div className="legend-epic-particles">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} style={{ ['--i' as string]: i }} />
            ))}
          </div>
          <div className="legend-epic-banner">
            <p className="legend-epic-label">✦ LÉGENDAIRE ✦</p>
            <p className="legend-epic-name">{current.nom}</p>
          </div>
        </div>
      )}

      {phase === 'idle' && (
        <div className="rounded-2xl panel-glass p-4 text-sm text-slate-400">
          <p className="font-display font-semibold text-amber-200/90 mb-2">
            Probabilités — Pack Anime
          </p>
          <p className="text-xs text-rose-300/90 mb-3">
            Pack Admin : <strong>100&nbsp;% légendaire</strong> (outil de test).
          </p>
          <ul className="grid sm:grid-cols-2 gap-1.5">
            {[...RARITY_ORDER].reverse().map((r) => (
              <li key={r} className="flex justify-between gap-2 border-b border-white/5 pb-1">
                <span>{RARITY_LABELS[r]}</span>
                <span className="tabular-nums text-slate-300">{oddsLabel(r)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
