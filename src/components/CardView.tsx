import { useEffect, useState } from 'react';
import { RARITY_COLORS, RARITY_GLOW, RARITY_LABELS } from '../data/cards';
import type { BattleCard, CardDefinition, Rarity } from '../types';
import { fallbackArtDataUrl, resolveCardImage } from '../utils/cardArt';
import { isPassiveEffect } from '../utils/combat';

type Props = {
  card: CardDefinition | BattleCard;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  showHp?: boolean;
  disabled?: boolean;
  className?: string;
};

function isBattle(card: CardDefinition | BattleCard): card is BattleCard {
  return 'vieMax' in card;
}

function hasSerie(card: CardDefinition | BattleCard): card is CardDefinition {
  return 'serie' in card && typeof (card as CardDefinition).serie === 'string';
}

function getImage(card: CardDefinition | BattleCard): string {
  return 'image' in card ? (card as CardDefinition).image || '' : '';
}

export function CardView({
  card,
  selected,
  onClick,
  compact,
  showHp,
  disabled,
  className = '',
}: Props) {
  const rarete: Rarity = card.rarete;
  const vie = isBattle(card) ? card.vie : card.vie;
  const vieMax = isBattle(card) ? card.vieMax : card.vie;
  const attaque = isBattle(card) ? card.attaque : card.attaque;
  const dead = isBattle(card) && card.vie <= 0;
  const serie = hasSerie(card) ? card.serie : undefined;
  const fallback = fallbackArtDataUrl(card.nom, rarete);
  const [src, setSrc] = useState(() => resolveCardImage(getImage(card), card.nom, rarete));

  const imageField = getImage(card);
  useEffect(() => {
    setSrc(resolveCardImage(imageField, card.nom, rarete));
  }, [imageField, card.nom, rarete]);

  const size = compact
    ? 'w-[7.5rem] sm:w-36 h-[15.5rem] sm:h-[17.5rem]'
    : 'w-44 sm:w-52 h-[26.5rem] sm:h-[28.5rem]';

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={`
        group relative text-left overflow-hidden rounded-xl border-2
        transition-all duration-300 shadow-xl card-frame bg-slate-950/90
        flex flex-col shrink-0
        ${RARITY_COLORS[rarete]} ${RARITY_GLOW[rarete]}
        ${selected ? 'ring-4 ring-amber-300/90 scale-[1.04] selected-ring' : ''}
        ${dead ? 'opacity-40 grayscale' : ''}
        ${onClick && !disabled ? 'cursor-pointer hover:scale-[1.02] hover:brightness-110' : 'cursor-default'}
        ${size}
        ${className}
      `}
    >
      <div
        className={`relative w-full shrink-0 overflow-hidden bg-black ${
          compact ? 'h-[8.25rem] sm:h-[9.5rem]' : 'h-[14.5rem] sm:h-[15.5rem]'
        }`}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[center_15%] origin-top transition-transform duration-500 group-hover:scale-[1.04]"
          onError={() => setSrc(fallback)}
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
        <span className="absolute top-1.5 right-1.5 z-10 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-white/95 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/15">
          {RARITY_LABELS[rarete]}
        </span>
        {rarete === 'legendaire' || rarete === 'mythique' || rarete === 'divine' || rarete === 'celeste' || rarete === 'supreme' || rarete === 'unique' ? (
          <div className="pointer-events-none absolute inset-0 foil-shimmer opacity-35" />
        ) : null}
      </div>

      <div
        className={`relative flex-1 min-h-0 flex flex-col ${
          compact ? 'px-2 py-1.5 gap-0.5' : 'px-2.5 py-2 gap-1'
        }`}
      >
        <h3
          className={`font-display font-bold text-white leading-tight drop-shadow-md line-clamp-2 shrink-0 ${
            compact ? 'text-[11px] h-7' : 'text-sm sm:text-base h-10'
          }`}
          title={card.nom}
        >
          {card.nom}
        </h3>

        {!compact && (
          <p
            className="text-[10px] text-amber-200/70 truncate font-medium tracking-wide h-4 shrink-0"
            title={serie || undefined}
          >
            {serie || '\u00A0'}
          </p>
        )}

        <div
          className={`space-y-0.5 text-white/95 shrink-0 ${
            compact ? 'text-[10px]' : 'text-xs sm:text-sm'
          }`}
        >
          <div className="flex justify-between items-center gap-1">
            <span className="text-rose-200/90">Vie</span>
            <span className="font-semibold tabular-nums text-rose-300">
              {showHp && isBattle(card) ? `${vie}/${vieMax}` : vieMax}
            </span>
          </div>
          {showHp && isBattle(card) && (
            <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300"
                style={{ width: `${Math.max(0, (vie / vieMax) * 100)}%` }}
              />
            </div>
          )}
          <div className="flex justify-between items-center gap-1">
            <span className="text-sky-200/90">Attaque</span>
            <span className="font-semibold tabular-nums text-sky-300">{attaque}</span>
          </div>
        </div>

        {!compact && (
          <p
            className="text-white/75 text-[10px] sm:text-[11px] border-t border-white/15 pt-1.5 leading-snug line-clamp-2 h-9 shrink-0"
            title={card.effetDescription}
          >
            {card.effetDescription}
          </p>
        )}

        {isBattle(card) && (
          <div className="flex flex-wrap gap-1 mt-auto min-h-[1.1rem] content-start">
            {card.bouclier > 0 && (
              <span className="text-[9px] bg-sky-600/80 px-1 rounded">Bouclier {card.bouclier}</span>
            )}
            {card.poisonTours > 0 && (
              <span className="text-[9px] bg-lime-700/80 px-1 rounded">Poison {card.poisonTours}</span>
            )}
            {card.rageActif && (
              <span className="text-[9px] bg-orange-600/80 px-1 rounded">Rage</span>
            )}
            {card.etourdi && (
              <span className="text-[9px] bg-yellow-600/80 px-1 rounded">Étourdi</span>
            )}
            {card.marks > 0 && (
              <span className="text-[9px] bg-rose-800/90 px-1 rounded">Marque {card.marks}/3</span>
            )}
            {card.dodgeLeft > 0 && (
              <span className="text-[9px] bg-cyan-700/80 px-1 rounded">Esquive</span>
            )}
            {card.blockNext && (
              <span className="text-[9px] bg-indigo-700/80 px-1 rounded">Parade</span>
            )}
            {card.taunt && card.vie > 0 && (
              <span className="text-[9px] bg-amber-700/80 px-1 rounded">Provocation</span>
            )}
            {!card.effetUtilise &&
              card.effet !== 'aucun' &&
              !isPassiveEffect(card.effet) &&
              card.vie > 0 && (
              <span className="text-[9px] bg-fuchsia-700/80 px-1 rounded">Effet dispo</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
