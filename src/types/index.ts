export type Rarity =
  | 'commun'
  | 'peu_commun'
  | 'rare'
  | 'epique'
  | 'legendaire'
  | 'mythique'
  | 'divine'
  | 'celeste'
  | 'supreme'
  | 'unique';

/** Combat effect kinds — drive specials + passives. Description text is always the French flavor. */
export type EffectType =
  | 'aucun'
  | 'soin'
  | 'soin_all'
  | 'poison'
  | 'burn'
  | 'bouclier'
  | 'rage'
  | 'drain'
  | 'stun'
  | 'degats'
  | 'degats_pierce'
  | 'aoe'
  | 'aoe_weak'
  | 'cleave'
  | 'destroy_shields'
  | 'burn_strike'
  | 'ally_atk'
  | 'temp_atk'
  | 'temp_atk_cost'
  | 'self_dmg_atk'
  | 'buff_stats'
  | 'purge'
  | 'purge_enemy'
  | 'atk_down'
  | 'steal_atk'
  | 'sacrifice_heal'
  | 'last_stand'
  | 'last_stand_strike'
  | 'dodge_first'
  | 'block_next'
  | 'first_double'
  | 'first_bonus'
  | 'pierce'
  | 'pierce_half'
  | 'thorns'
  | 'reflect'
  | 'aura_atk_down'
  | 'atk_per_ally'
  | 'bonus_vs_stronger'
  | 'stack_atk_hit'
  | 'stack_atk_turn'
  | 'stack_def_hit'
  | 'lifesteal'
  | 'taunt'
  | 'mark'
  | 'reduce_dmg'
  | 'regen'
  | 'shield_turn'
  | 'crit_chance';

export interface CardDefinition {
  id: string;
  nom: string;
  serie: string;
  emoji: string;
  /** AniList portrait URL, or empty string for generated fallback */
  image: string;
  vie: number;
  attaque: number;
  effet: EffectType;
  effetValeur: number;
  effetDescription: string;
  rarete: Rarity;
  /** Unique ultimates: one-use special (already enforced via effetUtilise) */
  uniqueOnce?: boolean;
}

export interface OwnedCard {
  instanceId: string;
  cardId: string;
}

export interface BattleCard {
  instanceId: string;
  cardId: string;
  nom: string;
  emoji: string;
  image: string;
  vieMax: number;
  vie: number;
  attaque: number;
  attaqueBase: number;
  effet: EffectType;
  effetValeur: number;
  effetDescription: string;
  rarete: Rarity;
  effetUtilise: boolean;
  poisonTours: number;
  poisonDegats: number;
  bouclier: number;
  rageActif: boolean;
  etourdi: boolean;
  lastStandLeft: boolean;
  lastStandStrike: boolean;
  dodgeLeft: number;
  blockNext: boolean;
  hasAttacked: boolean;
  firstDouble: boolean;
  firstBonus: number;
  pierce: boolean;
  pierceHalf: boolean;
  thorns: number;
  reflectNext: number;
  auraAtkDown: number;
  atkPerAlly: boolean;
  bonusVsStronger: number;
  stackAtkHit: number;
  stackAtkTurn: number;
  stackAtkTurnMax: number;
  stackAtkTurnCurrent: number;
  stackDefHit: number;
  lifesteal: number;
  taunt: boolean;
  marks: number;
  applyMark: boolean;
  reduceDmg: number;
  regen: number;
  shieldTurn: number;
  critChance: boolean;
  cleaveOnAttack: number;
  tempAtkTurns: number;
  uniqueOnce: boolean;
}

export type CombatPhase =
  | 'selection'
  | 'joueur'
  | 'ennemi'
  | 'victoire'
  | 'defaite';
