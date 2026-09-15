import { useEffect, useState } from 'react';
import { RARITY_COLORS, RARITY_GLOW, RARITY_LABELS } from '../data/cards';
import type { BattleCard, CardDefinition, Rarity } from '../types';
import { fallbackArtDataUrl, resolveCardImage } from '../utils/cardArt';

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

  const w = compact ? 'w-[7.5rem] sm:w-36' : 'w-44 sm:w-52';

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={`
        group relative text-left overflow-hidden rounded-xl border-2
        transition-all duration-300 shadow-xl card-frame bg-slate-950/90
        ${RARITY_COLORS[rarete]} ${RARITY_GLOW[rarete]}
        ${selected ? 'ring-4 ring-amber-300/90 scale-[1.04] selected-ring' : ''}
        ${dead ? 'opacity-40 grayscale' : ''}
        ${onClick && !disabled ? 'cursor-pointer hover:scale-[1.02] hover:brightness-110' : 'cursor-default'}
        ${w}
        ${className}
      `}
    >
      {/* Cover fills the frame; object-top keeps faces in view on tall portraits */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-black">
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
        {rarete === 'dieu' || rarete === 'legendaire' || rarete === 'ultra_rare' ? (
          <div className="pointer-events-none absolute inset-0 foil-shimmer opacity-35" />
        ) : null}
      </div>

      <div className={`relative px-2.5 pb-2.5 pt-2 ${compact ? 'px-2 pb-2 pt-1.5' : ''}`}>
        <h3
          className={`font-display font-bold text-white leading-tight drop-shadow-md line-clamp-2 ${
            compact ? 'text-[11px]' : 'text-sm sm:text-base'
          }`}
        >
          {card.nom}
        </h3>
        {serie && !compact && (
          <p className="text-[10px] text-amber-200/70 mb-1.5 truncate font-medium tracking-wide">
            {serie}
          </p>
        )}
        {(!serie || compact) && <div className="mb-1" />}

        <div className={`space-y-1 text-white/95 ${compact ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>
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
          {!compact && (
            <p className="text-white/75 text-[10px] sm:text-[11px] mt-1.5 border-t border-white/15 pt-1.5 leading-snug">
              {card.effetDescription}
            </p>
          )}
          {isBattle(card) && (
            <div className="flex flex-wrap gap-1 mt-1">
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
              {!card.effetUtilise && card.effet !== 'aucun' && card.vie > 0 && (
                <span className="text-[9px] bg-fuchsia-700/80 px-1 rounded">Effet dispo</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
