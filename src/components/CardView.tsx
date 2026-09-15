import { RARITY_COLORS, RARITY_GLOW, RARITY_LABELS } from '../data/cards';
import type { BattleCard, CardDefinition, Rarity } from '../types';

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

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={`
        relative text-left rounded-xl border-2 bg-gradient-to-br p-3
        transition-all duration-200 shadow-lg
        ${RARITY_COLORS[rarete]} ${RARITY_GLOW[rarete]}
        ${selected ? 'ring-4 ring-amber-300 scale-105' : ''}
        ${dead ? 'opacity-40 grayscale' : ''}
        ${onClick && !disabled ? 'cursor-pointer hover:scale-105 hover:brightness-110' : 'cursor-default'}
        ${compact ? 'w-28 sm:w-32' : 'w-36 sm:w-44'}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className={`text-3xl sm:text-4xl ${compact ? 'text-2xl' : ''}`}>{card.emoji}</span>
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-white/90 bg-black/40 px-1.5 py-0.5 rounded">
          {RARITY_LABELS[rarete]}
        </span>
      </div>
      <h3 className={`font-bold text-white leading-tight ${compact ? 'text-xs' : 'text-sm sm:text-base'}`}>
        {card.nom}
      </h3>
      {serie && !compact && (
        <p className="text-[10px] text-white/70 mb-2 truncate">{serie}</p>
      )}
      {(!serie || compact) && <div className="mb-2" />}
      <div className={`space-y-1 text-white/95 ${compact ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>
        <div className="flex justify-between">
          <span>❤️ Vie</span>
          <span className="font-semibold">
            {showHp && isBattle(card) ? `${vie}/${vieMax}` : vieMax}
          </span>
        </div>
        {showHp && isBattle(card) && (
          <div className="h-1.5 bg-black/40 rounded overflow-hidden">
            <div
              className="h-full bg-rose-400 transition-all"
              style={{ width: `${Math.max(0, (vie / vieMax) * 100)}%` }}
            />
          </div>
        )}
        <div className="flex justify-between">
          <span>⚔️ Attaque</span>
          <span className="font-semibold">{attaque}</span>
        </div>
        {!compact && (
          <p className="text-white/80 text-[10px] sm:text-xs mt-1 border-t border-white/20 pt-1">
            ✨ {card.effetDescription}
          </p>
        )}
        {isBattle(card) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {card.bouclier > 0 && (
              <span className="text-[9px] bg-sky-600/80 px-1 rounded">🛡 {card.bouclier}</span>
            )}
            {card.poisonTours > 0 && (
              <span className="text-[9px] bg-lime-700/80 px-1 rounded">☠ {card.poisonTours}</span>
            )}
            {card.rageActif && (
              <span className="text-[9px] bg-orange-600/80 px-1 rounded">💢 Rage</span>
            )}
            {card.etourdi && (
              <span className="text-[9px] bg-yellow-600/80 px-1 rounded">💫 Stun</span>
            )}
            {!card.effetUtilise && card.effet !== 'aucun' && card.vie > 0 && (
              <span className="text-[9px] bg-fuchsia-700/80 px-1 rounded">✨ Effet dispo</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
