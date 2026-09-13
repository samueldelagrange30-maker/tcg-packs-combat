export type Rarity = 'commune' | 'rare' | 'epique' | 'legendaire';

export type EffectType = 'soin' | 'poison' | 'bouclier' | 'rage' | 'drain' | 'stun' | 'aucun';

export interface CardDefinition {
  id: string;
  nom: string;
  emoji: string;
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
