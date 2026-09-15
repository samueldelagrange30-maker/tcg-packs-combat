import { CATALOGUE, getCardById } from '../data/cards';
import type { BattleCard, CardDefinition, OwnedCard } from '../types';

let idCounter = 0;
export function newInstanceId(): string {
  idCounter += 1;
  return `inst-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function toBattleCard(def: CardDefinition, instanceId?: string): BattleCard {
  return {
    instanceId: instanceId ?? newInstanceId(),
    cardId: def.id,
    nom: def.nom,
    emoji: def.emoji,
    vieMax: def.vie,
    vie: def.vie,
    attaque: def.attaque,
    attaqueBase: def.attaque,
    effet: def.effet,
    effetValeur: def.effetValeur,
    effetDescription: def.effetDescription,
    rarete: def.rarete,
    effetUtilise: false,
    poisonTours: 0,
    poisonDegats: 0,
    bouclier: 0,
    rageActif: false,
    etourdi: false,
  };
}

export function powerScore(def: CardDefinition): number {
  return def.vie + def.attaque * 2 + (def.effet !== 'aucun' ? def.effetValeur : 0);
}

export function buildAiTeam(playerDefs: CardDefinition[]): BattleCard[] {
  const playerPower = playerDefs.reduce((s, c) => s + powerScore(c), 0);
  const target = playerPower * (0.85 + Math.random() * 0.3);
  const sorted = [...CATALOGUE].sort(() => Math.random() - 0.5);
  const team: CardDefinition[] = [];
  let power = 0;

  for (const card of sorted) {
    if (team.length >= 3) break;
    const next = power + powerScore(card);
    if (team.length < 2 || Math.abs(next - target) < Math.abs(power - target) + 15) {
      team.push(card);
      power = next;
    }
  }

  while (team.length < 3) {
    team.push(CATALOGUE[Math.floor(Math.random() * CATALOGUE.length)]);
  }

  return team.slice(0, 3).map((c) => toBattleCard(c));
}

export function ownedToDefs(owned: OwnedCard[]): CardDefinition[] {
  return owned
    .map((o) => getCardById(o.cardId))
    .filter((c): c is CardDefinition => Boolean(c));
}

export function applyDamage(target: BattleCard, raw: number): { dealt: number; absorbed: number } {
  let absorbed = 0;
  let remaining = raw;
  if (target.bouclier > 0) {
    absorbed = Math.min(target.bouclier, remaining);
    target.bouclier -= absorbed;
    remaining -= absorbed;
  }
  target.vie = Math.max(0, target.vie - remaining);
  return { dealt: remaining, absorbed };
}

export function tickPoison(card: BattleCard): number {
  if (card.poisonTours <= 0 || card.vie <= 0) return 0;
  const dmg = card.poisonDegats;
  card.vie = Math.max(0, card.vie - dmg);
  card.poisonTours -= 1;
  return dmg;
}

export function useSpecial(caster: BattleCard, target: BattleCard | null): string {
  if (caster.effetUtilise || caster.effet === 'aucun' || caster.vie <= 0) {
    return '';
  }
  caster.effetUtilise = true;

  switch (caster.effet) {
    case 'soin': {
      const before = caster.vie;
      caster.vie = Math.min(caster.vieMax, caster.vie + caster.effetValeur);
      const healed = caster.vie - before;
      return `${caster.nom} utilise Soin et récupère ${healed} PV !`;
    }
    case 'poison': {
      if (!target || target.vie <= 0) return `${caster.nom} tente Poison… mais aucune cible.`;
      target.poisonTours = 3;
      target.poisonDegats = caster.effetValeur;
      return `${caster.nom} empoisonne ${target.nom} (${caster.effetValeur} dégâts / tour ×3) !`;
    }
    case 'bouclier': {
      caster.bouclier += caster.effetValeur;
      return `${caster.nom} active un Bouclier de ${caster.effetValeur} !`;
    }
    case 'rage': {
      caster.rageActif = true;
      return `${caster.nom} entre en Rage ! Prochaine attaque doublée.`;
    }
    case 'drain': {
      if (!target || target.vie <= 0) return `${caster.nom} tente Drain… mais aucune cible.`;
      const { dealt } = applyDamage(target, caster.effetValeur);
      const before = caster.vie;
      caster.vie = Math.min(caster.vieMax, caster.vie + dealt);
      return `${caster.nom} draine ${dealt} PV de ${target.nom} (récupère ${caster.vie - before}) !`;
    }
    case 'stun': {
      if (!target || target.vie <= 0) return `${caster.nom} tente Stun… mais aucune cible.`;
      target.etourdi = true;
      return `${caster.nom} étourdit ${target.nom} !`;
    }
    default:
      return '';
  }
}

export function attackDamage(attacker: BattleCard): number {
  return attacker.rageActif ? attacker.attaque * 2 : attacker.attaque;
}

export function effectiveHp(card: BattleCard): number {
  return card.vie + card.bouclier;
}

export function performAttack(attacker: BattleCard, defender: BattleCard): string {
  let dmg = attacker.attaque;
  if (attacker.rageActif) {
    dmg *= 2;
    attacker.rageActif = false;
  }
  const { dealt, absorbed } = applyDamage(defender, dmg);
  let msg = `${attacker.nom} attaque ${defender.nom} pour ${dealt} dégâts`;
  if (absorbed > 0) msg += ` (${absorbed} absorbés par le bouclier)`;
  msg += ` !`;
  if (defender.vie <= 0) msg += ` ${defender.nom} est vaincu !`;
  return msg;
}

export function alive(cards: BattleCard[]): BattleCard[] {
  return cards.filter((c) => c.vie > 0);
}

/** Prefer cards that can secure a kill, then highest attack among ready units. */
export function pickAiAttacker(team: BattleCard[], foes: BattleCard[]): BattleCard | null {
  const ready = alive(team).filter((c) => !c.etourdi);
  if (ready.length === 0) return null;

  const foeList = alive(foes);
  const killers = ready.filter((atk) =>
    foeList.some((f) => attackDamage(atk) >= effectiveHp(f)),
  );
  const pool = killers.length > 0 ? killers : ready;
  return pool.reduce((best, c) => (attackDamage(c) > attackDamage(best) ? c : best), pool[0]);
}

/**
 * Prefer killing blows; otherwise lowest effective HP, tie-break by highest threat (attaque).
 */
export function pickAiTarget(team: BattleCard[], attacker?: BattleCard | null): BattleCard | null {
  const list = alive(team);
  if (list.length === 0) return null;

  if (attacker) {
    const dmg = attackDamage(attacker);
    const killable = list.filter((c) => dmg >= effectiveHp(c));
    if (killable.length > 0) {
      return killable.reduce((best, c) => (c.attaque > best.attaque ? c : best), killable[0]);
    }
  }

  return list.reduce((weakest, c) => {
    const wHp = effectiveHp(weakest);
    const cHp = effectiveHp(c);
    if (cHp < wHp) return c;
    if (cHp === wHp && c.attaque > weakest.attaque) return c;
    return weakest;
  }, list[0]);
}

const SELF_EFFECTS = new Set(['soin', 'bouclier', 'rage']);

export function isSelfEffect(effet: BattleCard['effet']): boolean {
  return SELF_EFFECTS.has(effet);
}

export function needsEnemyTarget(effet: BattleCard['effet']): boolean {
  return effet === 'poison' || effet === 'drain' || effet === 'stun';
}

/** Decide whether the AI should spend its special this turn (useful, not spammy). */
export function shouldAiUseSpecial(
  caster: BattleCard,
  players: BattleCard[],
): { use: boolean; target: BattleCard | null } {
  if (caster.effetUtilise || caster.effet === 'aucun' || caster.vie <= 0) {
    return { use: false, target: null };
  }

  const foes = alive(players);

  switch (caster.effet) {
    case 'soin': {
      const missing = caster.vieMax - caster.vie;
      const useful = missing >= Math.min(8, caster.effetValeur * 0.4);
      const urgent = caster.vie <= caster.vieMax * 0.55;
      return { use: useful && (urgent || missing >= caster.effetValeur * 0.6), target: null };
    }
    case 'bouclier': {
      const noShield = caster.bouclier === 0;
      const hurt = caster.vie <= caster.vieMax * 0.75;
      return { use: noShield && (hurt || foes.some((f) => f.attaque >= 12)), target: null };
    }
    case 'rage': {
      if (foes.length === 0) return { use: false, target: null };
      const withRage = { ...caster, rageActif: true };
      const target = pickAiTarget(players, withRage);
      if (!target) return { use: false, target: null };
      const normal = caster.attaque;
      const doubled = caster.attaque * 2;
      const hp = effectiveHp(target);
      const enablesKill = doubled >= hp && normal < hp;
      const strongTarget = hp > normal;
      return { use: enablesKill || strongTarget, target: null };
    }
    case 'drain': {
      if (foes.length === 0) return { use: false, target: null };
      const target = pickAiTarget(players, null);
      const lowHp = caster.vie <= caster.vieMax * 0.7;
      const canFinish =
        target !== null && caster.effetValeur >= effectiveHp(target);
      return { use: lowHp || canFinish || foes.length === 1, target };
    }
    case 'poison': {
      if (foes.length === 0) return { use: false, target: null };
      const candidates = foes.filter((f) => f.poisonTours === 0 && f.vie > caster.attaque);
      const target =
        candidates.length > 0
          ? candidates.reduce((a, b) => (a.vie > b.vie ? a : b), candidates[0])
          : pickAiTarget(players, null);
      return { use: target !== null && target.poisonTours === 0, target };
    }
    case 'stun': {
      if (foes.length === 0) return { use: false, target: null };
      const threats = foes.filter((f) => !f.etourdi);
      if (threats.length === 0) return { use: false, target: null };
      const target = threats.reduce((a, b) => (a.attaque > b.attaque ? a : b), threats[0]);
      return { use: true, target };
    }
    default:
      return { use: false, target: null };
  }
}
