export type Rarity =
  | 'commun'
  | 'peu_commun'
  | 'rare'
  | 'super_rare'
  | 'ultra_rare'
  | 'legendaire'
  | 'dieu';

export type EffectType = 'soin' | 'poison' | 'bouclier' | 'rage' | 'drain' | 'stun' | 'aucun';

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
}

export type CombatPhase =
  | 'selection'
  | 'joueur'
  | 'ennemi'
  | 'victoire'
  | 'defaite';
