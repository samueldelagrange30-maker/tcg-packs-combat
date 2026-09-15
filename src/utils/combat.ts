import { CATALOGUE, getCardById } from '../data/cards';
import type { BattleCard, CardDefinition, EffectType, OwnedCard } from '../types';

let idCounter = 0;
export function newInstanceId(): string {
  idCounter += 1;
  return `inst-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

const PASSIVE_EFFECTS = new Set<EffectType>([
  'last_stand',
  'last_stand_strike',
  'dodge_first',
  'first_double',
  'first_bonus',
  'pierce',
  'pierce_half',
  'thorns',
  'aura_atk_down',
  'atk_per_ally',
  'bonus_vs_stronger',
  'stack_atk_hit',
  'stack_atk_turn',
  'stack_def_hit',
  'lifesteal',
  'taunt',
  'reduce_dmg',
  'regen',
  'shield_turn',
  'crit_chance',
  'cleave',
]);

export function isPassiveEffect(effet: EffectType): boolean {
  return PASSIVE_EFFECTS.has(effet);
}

export function toBattleCard(def: CardDefinition, instanceId?: string): BattleCard {
  const e = def.effet;
  const v = def.effetValeur;
  return {
    instanceId: instanceId ?? newInstanceId(),
    cardId: def.id,
    nom: def.nom,
    emoji: def.emoji,
    image: def.image || '',
    vieMax: def.vie,
    vie: def.vie,
    attaque: def.attaque,
    attaqueBase: def.attaque,
    effet: def.effet,
    effetValeur: def.effetValeur,
    effetDescription: def.effetDescription,
    rarete: def.rarete,
    effetUtilise: isPassiveEffect(e) || e === 'aucun',
    poisonTours: 0,
    poisonDegats: 0,
    bouclier: 0,
    rageActif: false,
    etourdi: false,
    lastStandLeft: e === 'last_stand',
    lastStandStrike: e === 'last_stand_strike',
    dodgeLeft: e === 'dodge_first' ? 1 : 0,
    blockNext: e === 'block_next',
    hasAttacked: false,
    firstDouble: e === 'first_double',
    firstBonus: e === 'first_bonus' ? v : 0,
    pierce: e === 'pierce',
    pierceHalf: e === 'pierce_half',
    thorns: e === 'thorns' ? v : 0,
    reflectNext: 0,
    auraAtkDown: e === 'aura_atk_down' ? v : 0,
    atkPerAlly: e === 'atk_per_ally',
    bonusVsStronger: e === 'bonus_vs_stronger' ? v : 0,
    stackAtkHit: e === 'stack_atk_hit' ? v : 0,
    stackAtkTurn: e === 'stack_atk_turn' ? v : 0,
    stackAtkTurnMax: e === 'stack_atk_turn' ? 7 : 0,
    stackAtkTurnCurrent: 0,
    stackDefHit: e === 'stack_def_hit' ? v : 0,
    lifesteal: e === 'lifesteal' ? v : 0,
    taunt: e === 'taunt',
    marks: 0,
    applyMark: e === 'mark',
    reduceDmg: e === 'reduce_dmg' ? v : 0,
    regen: e === 'regen' ? v : 0,
    shieldTurn: e === 'shield_turn' ? v : 0,
    critChance: e === 'crit_chance',
    cleaveOnAttack: e === 'cleave' ? v : 0,
    tempAtkTurns: 0,
    uniqueOnce: Boolean(def.uniqueOnce),
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

export function applyAuraAndAllyAtk(team: BattleCard[], foes: BattleCard[]): void {
  const enemyAura = foes
    .filter((c) => c.vie > 0)
    .reduce((s, c) => s + c.auraAtkDown, 0);
  const alliesAlive = team.filter((c) => c.vie > 0).length;
  for (const c of team) {
    if (c.vie <= 0) continue;
    let atk = c.attaqueBase;
    if (c.atkPerAlly) atk += Math.max(0, alliesAlive - 1);
    atk += c.stackAtkTurnCurrent;
    if (c.tempAtkTurns > 0) {
      /* temp already baked into attaque via specials; keep attaque as-is for temp */
    } else {
      c.attaque = Math.max(1, atk - enemyAura);
    }
  }
}

export function applyDamage(
  target: BattleCard,
  raw: number,
  opts?: { ignoreShield?: boolean; pierceHalf?: boolean; fromAttacker?: BattleCard | null },
): { dealt: number; absorbed: number; dodged: boolean; messages: string[] } {
  const messages: string[] = [];
  if (target.vie <= 0) return { dealt: 0, absorbed: 0, dodged: false, messages };

  if (target.dodgeLeft > 0) {
    target.dodgeLeft -= 1;
    messages.push(`${target.nom} esquive l'attaque !`);
    return { dealt: 0, absorbed: 0, dodged: true, messages };
  }

  if (target.blockNext) {
    target.blockNext = false;
    messages.push(`${target.nom} annule l'attaque !`);
    return { dealt: 0, absorbed: 0, dodged: true, messages };
  }

  let remaining = Math.max(0, raw - (target.reduceDmg || 0));
  let absorbed = 0;

  if (opts?.ignoreShield) {
    // full pierce
  } else if (opts?.pierceHalf && target.bouclier > 0) {
    const half = Math.ceil(target.bouclier / 2);
    absorbed = Math.min(half, remaining);
    target.bouclier -= absorbed;
    remaining -= absorbed;
  } else if (target.bouclier > 0) {
    absorbed = Math.min(target.bouclier, remaining);
    target.bouclier -= absorbed;
    remaining -= absorbed;
  }

  const before = target.vie;
  target.vie = Math.max(0, target.vie - remaining);

  if (target.vie <= 0 && target.lastStandLeft) {
    target.vie = 1;
    target.lastStandLeft = false;
    messages.push(`${target.nom} refuse d'abandonner et reste à 1 PV !`);
  }

  const dealt = Math.max(0, before - target.vie);

  if (dealt > 0 && target.stackAtkHit > 0) {
    target.attaqueBase += target.stackAtkHit;
    target.attaque += target.stackAtkHit;
    messages.push(`${target.nom} gagne +${target.stackAtkHit} ATQ !`);
  }
  if (dealt > 0 && target.stackDefHit > 0) {
    target.bouclier += target.stackDefHit;
    messages.push(`${target.nom} gagne +${target.stackDefHit} Bouclier !`);
  }

  if (dealt > 0 && target.reflectNext > 0 && opts?.fromAttacker && opts.fromAttacker.vie > 0) {
    const refl = dealt * target.reflectNext;
    target.reflectNext = 0;
    opts.fromAttacker.vie = Math.max(0, opts.fromAttacker.vie - refl);
    messages.push(`${target.nom} renvoie ${refl} dégâts à ${opts.fromAttacker.nom} !`);
  } else if (dealt > 0 && target.thorns > 0 && opts?.fromAttacker && opts.fromAttacker.vie > 0) {
    opts.fromAttacker.vie = Math.max(0, opts.fromAttacker.vie - target.thorns);
    messages.push(`${target.nom} renvoie ${target.thorns} dégâts (épines) !`);
  }

  return { dealt, absorbed, dodged: false, messages };
}

export function tickPoison(card: BattleCard): number {
  if (card.poisonTours <= 0 || card.vie <= 0) return 0;
  const dmg = card.poisonDegats;
  card.vie = Math.max(0, card.vie - dmg);
  if (card.vie <= 0 && card.lastStandLeft) {
    card.vie = 1;
    card.lastStandLeft = false;
  }
  card.poisonTours -= 1;
  return dmg;
}

/** Start-of-turn passives: regen, shield_turn, stack_atk_turn */
export function tickStartOfTurn(team: BattleCard[]): string[] {
  const msgs: string[] = [];
  for (const c of team) {
    if (c.vie <= 0) continue;
    if (c.regen > 0) {
      const before = c.vie;
      c.vie = Math.min(c.vieMax, c.vie + c.regen);
      const healed = c.vie - before;
      if (healed > 0) msgs.push(`💚 ${c.nom} régénère ${healed} PV.`);
    }
    if (c.shieldTurn > 0) {
      c.bouclier += c.shieldTurn;
      msgs.push(`🛡 ${c.nom} gagne un Bouclier de ${c.shieldTurn}.`);
    }
    if (c.stackAtkTurn > 0 && c.stackAtkTurnCurrent < c.stackAtkTurnMax) {
      c.stackAtkTurnCurrent = Math.min(
        c.stackAtkTurnMax,
        c.stackAtkTurnCurrent + c.stackAtkTurn,
      );
      c.attaqueBase += c.stackAtkTurn;
      c.attaque += c.stackAtkTurn;
      msgs.push(`☀ ${c.nom} gagne +${c.stackAtkTurn} ATQ (Sunshine).`);
    }
    if (c.tempAtkTurns > 0) {
      c.tempAtkTurns -= 1;
      if (c.tempAtkTurns === 0) {
        c.attaque = c.attaqueBase;
      }
    }
  }
  return msgs;
}

export function useSpecial(
  caster: BattleCard,
  target: BattleCard | null,
  allies?: BattleCard[],
  enemies?: BattleCard[],
): string {
  if (caster.effetUtilise || caster.effet === 'aucun' || caster.vie <= 0) {
    return '';
  }
  if (isPassiveEffect(caster.effet)) {
    return '';
  }
  caster.effetUtilise = true;
  const v = caster.effetValeur;

  switch (caster.effet) {
    case 'soin': {
      const before = caster.vie;
      caster.vie = Math.min(caster.vieMax, caster.vie + v);
      return `${caster.nom} utilise Soin et récupère ${caster.vie - before} PV !`;
    }
    case 'soin_all': {
      const team = allies ?? [caster];
      for (const a of team) {
        if (a.vie > 0) a.vie = Math.min(a.vieMax, a.vie + v);
      }
      return `${caster.nom} soigne toute l'équipe de ${v} PV !`;
    }
    case 'poison':
    case 'burn': {
      if (!target || target.vie <= 0) return `${caster.nom} tente… mais aucune cible.`;
      target.poisonTours = 3;
      target.poisonDegats = v;
      return `${caster.nom} inflige Brûlure/Poison à ${target.nom} (${v}/tour ×3) !`;
    }
    case 'bouclier': {
      caster.bouclier += v;
      return `${caster.nom} active un Bouclier de ${v} !`;
    }
    case 'rage': {
      caster.rageActif = true;
      return `${caster.nom} entre en Rage ! Prochaine attaque doublée.`;
    }
    case 'drain': {
      if (!target || target.vie <= 0) return `${caster.nom} tente Drain… mais aucune cible.`;
      const { dealt } = applyDamage(target, v, { fromAttacker: caster });
      const before = caster.vie;
      caster.vie = Math.min(caster.vieMax, caster.vie + dealt);
      return `${caster.nom} draine ${dealt} PV de ${target.nom} (récupère ${caster.vie - before}) !`;
    }
    case 'stun': {
      if (!target || target.vie <= 0) return `${caster.nom} tente Stun… mais aucune cible.`;
      if (caster.nom.toLowerCase().includes('usopp') && Math.random() >= 0.5) {
        return `${caster.nom} rate Tir Surprise…`;
      }
      target.etourdi = true;
      return `${caster.nom} étourdit ${target.nom} !`;
    }
    case 'degats': {
      if (!target || target.vie <= 0) return `${caster.nom} tente… mais aucune cible.`;
      const { dealt, absorbed, messages } = applyDamage(target, v, { fromAttacker: caster });
      let msg = `${caster.nom} inflige ${dealt} dégâts à ${target.nom}`;
      if (absorbed > 0) msg += ` (${absorbed} absorbés)`;
      msg += ` !`;
      if (messages.length) msg += ' ' + messages.join(' ');
      if (target.vie <= 0) msg += ` ${target.nom} est vaincu !`;
      return msg;
    }
    case 'degats_pierce': {
      if (!target || target.vie <= 0) return `${caster.nom} tente… mais aucune cible.`;
      const { dealt, messages } = applyDamage(target, v, {
        ignoreShield: true,
        fromAttacker: caster,
      });
      let msg = `${caster.nom} inflige ${dealt} dégâts (ignore Bouclier) à ${target.nom} !`;
      if (messages.length) msg += ' ' + messages.join(' ');
      if (target.vie <= 0) msg += ` ${target.nom} est vaincu !`;
      return msg;
    }
    case 'aoe': {
      const foes = (enemies ?? []).filter((c) => c.vie > 0);
      if (foes.length === 0) return `${caster.nom} : aucune cible.`;
      const hits = foes.slice(0, 3);
      for (const f of hits) applyDamage(f, v, { fromAttacker: caster });
      return `${caster.nom} inflige ${v} dégâts à ${hits.map((f) => f.nom).join(', ')} !`;
    }
    case 'aoe_weak': {
      const foes = (enemies ?? []).filter((c) => c.vie > 0 && c.vie < c.vieMax);
      if (foes.length === 0) return `${caster.nom} : aucun ennemi affaibli.`;
      for (const f of foes) applyDamage(f, v, { fromAttacker: caster });
      return `${caster.nom} incinerère les affaiblis (${v} dégâts) !`;
    }
    case 'destroy_shields': {
      if (!target || target.vie <= 0) return `${caster.nom} tente… mais aucune cible.`;
      target.bouclier = 0;
      const dmg = Math.max(v, caster.attaque);
      const { dealt } = applyDamage(target, dmg, { ignoreShield: true, fromAttacker: caster });
      return `${caster.nom} brise les boucliers et inflige ${dealt} dégâts à ${target.nom} !`;
    }
    case 'burn_strike': {
      if (!target || target.vie <= 0) return `${caster.nom} tente… mais aucune cible.`;
      const { dealt } = applyDamage(target, v, { fromAttacker: caster });
      target.poisonTours = Math.max(target.poisonTours, 2);
      target.poisonDegats = Math.max(target.poisonDegats, 2);
      return `${caster.nom} inflige ${dealt} dégâts + Brûlure à ${target.nom} !`;
    }
    case 'ally_atk': {
      const team = allies ?? [caster];
      for (const a of team) {
        if (a.vie > 0) {
          a.attaque += v;
          a.tempAtkTurns = Math.max(a.tempAtkTurns, 1);
        }
      }
      return `${caster.nom} donne +${v} ATQ à toute l'équipe ce tour !`;
    }
    case 'temp_atk': {
      caster.attaque += v;
      caster.tempAtkTurns = Math.max(caster.tempAtkTurns, 1);
      return `${caster.nom} gagne +${v} ATQ ce tour !`;
    }
    case 'temp_atk_cost': {
      caster.attaque += v;
      caster.tempAtkTurns = Math.max(caster.tempAtkTurns, 1);
      caster.vie = Math.max(0, caster.vie - 2);
      return `${caster.nom} ouvre les portes (+${v} ATQ) et subit 2 dégâts !`;
    }
    case 'self_dmg_atk': {
      caster.vie = Math.max(1, caster.vie - 1);
      caster.attaque += v;
      caster.attaqueBase += v;
      return `${caster.nom} sacrifie 1 PV pour +${v} ATQ !`;
    }
    case 'buff_stats': {
      caster.attaque += v;
      caster.attaqueBase += v;
      caster.bouclier += v;
      return `${caster.nom} gagne +${v} ATQ et +${v} Bouclier !`;
    }
    case 'purge': {
      const team = allies ?? [caster];
      for (const a of team) {
        if (a.vie > 0) {
          a.etourdi = false;
          a.poisonTours = 0;
          a.poisonDegats = 0;
        }
      }
      return `${caster.nom} purifie l'équipe (poison/stun retirés) !`;
    }
    case 'purge_enemy': {
      if (!target || target.vie <= 0) return `${caster.nom} tente… mais aucune cible.`;
      target.rageActif = false;
      target.bouclier = 0;
      target.tempAtkTurns = 0;
      target.attaque = target.attaqueBase;
      target.etourdi = true;
      return `${caster.nom} annule les buffs de ${target.nom} et l'étourdit !`;
    }
    case 'atk_down': {
      if (!target || target.vie <= 0) return `${caster.nom} tente… mais aucune cible.`;
      target.attaque = Math.max(1, target.attaque - v);
      return `${caster.nom} réduit l'ATQ de ${target.nom} de ${v} !`;
    }
    case 'steal_atk': {
      if (!target || target.vie <= 0) return `${caster.nom} tente… mais aucune cible.`;
      const stolen = Math.min(v, target.attaque - 1);
      target.attaque = Math.max(1, target.attaque - stolen);
      caster.attaque += stolen;
      caster.attaqueBase += stolen;
      return `${caster.nom} vole ${stolen} ATQ à ${target.nom} !`;
    }
    case 'sacrifice_heal': {
      caster.vie = Math.max(1, caster.vie - 2);
      const team = allies ?? [caster];
      for (const a of team) {
        if (a.vie > 0 && a.instanceId !== caster.instanceId) {
          a.vie = Math.min(a.vieMax, a.vie + v);
        }
      }
      if (team.every((a) => a.instanceId === caster.instanceId)) {
        caster.vie = Math.min(caster.vieMax, caster.vie + v);
      }
      return `${caster.nom} sacrifie 2 PV pour soigner ${v} PV !`;
    }
    case 'block_next': {
      caster.blockNext = true;
      return `${caster.nom} prépare une parade (prochaine attaque annulée) !`;
    }
    case 'reflect': {
      caster.reflectNext = v || 2;
      return `${caster.nom} active Full Counter (×${caster.reflectNext}) !`;
    }
    case 'mark': {
      if (!target || target.vie <= 0) return `${caster.nom} tente… mais aucune cible.`;
      target.marks += 1;
      let msg = `${caster.nom} marque ${target.nom} (${target.marks}/3) !`;
      if (target.marks >= 3) {
        target.vie = 0;
        msg += ` Murasame achève ${target.nom} !`;
      }
      return msg;
    }
    default:
      return '';
  }
}

export function attackDamage(attacker: BattleCard): number {
  let dmg = attacker.attaque;
  if (attacker.rageActif) dmg *= 2;
  if (!attacker.hasAttacked && attacker.firstDouble) dmg *= 2;
  if (!attacker.hasAttacked && attacker.firstBonus > 0) dmg += attacker.firstBonus;
  if (attacker.critChance && Math.random() < 0.5) dmg *= 2;
  return dmg;
}

export function effectiveHp(card: BattleCard): number {
  return card.vie + card.bouclier;
}

export function performAttack(
  attacker: BattleCard,
  defender: BattleCard,
  enemies?: BattleCard[],
): string {
  let dmg = attacker.attaque;
  const extras: string[] = [];

  if (attacker.rageActif) {
    dmg *= 2;
    attacker.rageActif = false;
    extras.push('Rage');
  }
  if (!attacker.hasAttacked && attacker.firstDouble) {
    dmg *= 2;
    extras.push('1er éclair ×2');
  }
  if (!attacker.hasAttacked && attacker.firstBonus > 0) {
    dmg += attacker.firstBonus;
    extras.push(`+${attacker.firstBonus}`);
  }
  if (attacker.critChance && Math.random() < 0.5) {
    dmg *= 2;
    extras.push('Black Flash ×2');
  }
  if (attacker.bonusVsStronger > 0 && defender.attaque > attacker.attaqueBase) {
    dmg += attacker.bonusVsStronger;
    extras.push(`+${attacker.bonusVsStronger} sournois`);
  }

  attacker.hasAttacked = true;

  const { dealt, absorbed, dodged, messages } = applyDamage(defender, dmg, {
    ignoreShield: attacker.pierce,
    pierceHalf: attacker.pierceHalf,
    fromAttacker: attacker,
  });

  if (dodged) {
    return `${attacker.nom} attaque ${defender.nom}… ${messages.join(' ')}`;
  }

  if (dealt > 0 && attacker.lifesteal > 0) {
    const before = attacker.vie;
    attacker.vie = Math.min(attacker.vieMax, attacker.vie + attacker.lifesteal);
    extras.push(`+${attacker.vie - before} PV`);
  }

  if (dealt > 0 && attacker.applyMark) {
    defender.marks += 1;
    extras.push(`Marque ${defender.marks}/3`);
    if (defender.marks >= 3) {
      defender.vie = 0;
      extras.push('Murasame !');
    }
  }

  let msg = `${attacker.nom} attaque ${defender.nom} pour ${dealt} dégâts`;
  if (extras.length) msg += ` [${extras.join(', ')}]`;
  if (absorbed > 0) msg += ` (${absorbed} absorbés par le bouclier)`;
  msg += ` !`;
  if (messages.length) msg += ' ' + messages.join(' ');
  if (defender.vie <= 0) msg += ` ${defender.nom} est vaincu !`;

  if (attacker.cleaveOnAttack > 0 && enemies) {
    const second = enemies.find(
      (e) => e.vie > 0 && e.instanceId !== defender.instanceId,
    );
    if (second) {
      const cleaveDmg =
        attacker.cleaveOnAttack >= 10 ? attacker.attaque : attacker.cleaveOnAttack;
      const r = applyDamage(second, cleaveDmg, {
        ignoreShield: attacker.pierce,
        fromAttacker: attacker,
      });
      msg += ` Cleave : ${cleaveDmg} → ${second.nom} (${r.dealt} infligés)!`;
      if (second.vie <= 0) msg += ` ${second.nom} est vaincu !`;
    }
  }

  if (
    defender.vie <= 0 &&
    attacker.lastStandStrike === false &&
    attacker.rageActif === false
  ) {
    // Mikey-style: if card has rage effect unused, optional second — handled via rage special
  }

  return msg;
}

/** Last stand strike: when Rengoku would die from damage already handled; call if KO with flag */
export function tryLastStandStrike(
  dying: BattleCard,
  foes: BattleCard[],
): string {
  if (!dying.lastStandStrike || dying.vie > 0) return '';
  // triggered when just hit 0 — lastStandLeft already consumed for survive; for strike variant:
  // We use lastStandStrike without surviving: fire one last attack
  const target = pickAiTarget(foes, dying);
  if (!target) return '';
  dying.lastStandStrike = false;
  const dmg = dying.attaque;
  applyDamage(target, dmg, { fromAttacker: dying });
  return `${dying.nom} lance une dernière attaque sur ${target.nom} (${dmg}) !`;
}

export function alive(cards: BattleCard[]): BattleCard[] {
  return cards.filter((c) => c.vie > 0);
}

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

export function pickAiTarget(team: BattleCard[], attacker?: BattleCard | null): BattleCard | null {
  const list = alive(team);
  if (list.length === 0) return null;

  const taunters = list.filter((c) => c.taunt);
  const pool = taunters.length > 0 ? taunters : list;

  if (attacker) {
    const dmg = attackDamage(attacker);
    const killable = pool.filter((c) => dmg >= effectiveHp(c));
    if (killable.length > 0) {
      return killable.reduce((best, c) => (c.attaque > best.attaque ? c : best), killable[0]);
    }
  }

  return pool.reduce((weakest, c) => {
    const wHp = effectiveHp(weakest);
    const cHp = effectiveHp(c);
    if (cHp < wHp) return c;
    if (cHp === wHp && c.attaque > weakest.attaque) return c;
    return weakest;
  }, pool[0]);
}

const SELF_EFFECTS = new Set<EffectType>([
  'soin',
  'soin_all',
  'bouclier',
  'rage',
  'ally_atk',
  'temp_atk',
  'temp_atk_cost',
  'self_dmg_atk',
  'buff_stats',
  'purge',
  'block_next',
  'reflect',
  'sacrifice_heal',
]);

const ENEMY_EFFECTS = new Set<EffectType>([
  'poison',
  'burn',
  'drain',
  'stun',
  'degats',
  'degats_pierce',
  'destroy_shields',
  'burn_strike',
  'atk_down',
  'steal_atk',
  'purge_enemy',
  'mark',
  'aoe',
  'aoe_weak',
]);

export function isSelfEffect(effet: BattleCard['effet']): boolean {
  return SELF_EFFECTS.has(effet);
}

export function needsEnemyTarget(effet: BattleCard['effet']): boolean {
  return ENEMY_EFFECTS.has(effet) && effet !== 'aoe' && effet !== 'aoe_weak';
}

export function needsEnemyTeam(effet: BattleCard['effet']): boolean {
  return effet === 'aoe' || effet === 'aoe_weak';
}

export function shouldAiUseSpecial(
  caster: BattleCard,
  players: BattleCard[],
  allies?: BattleCard[],
): { use: boolean; target: BattleCard | null } {
  if (caster.effetUtilise || caster.effet === 'aucun' || caster.vie <= 0) {
    return { use: false, target: null };
  }
  if (isPassiveEffect(caster.effet)) return { use: false, target: null };

  const foes = alive(players);

  switch (caster.effet) {
    case 'soin':
    case 'soin_all':
    case 'sacrifice_heal': {
      const missing = caster.vieMax - caster.vie;
      const useful = missing >= Math.min(6, caster.effetValeur * 0.4);
      const urgent = caster.vie <= caster.vieMax * 0.55;
      return { use: useful && (urgent || missing >= caster.effetValeur * 0.5), target: null };
    }
    case 'bouclier':
    case 'buff_stats':
    case 'block_next':
    case 'reflect':
      return { use: caster.bouclier === 0 || caster.vie <= caster.vieMax * 0.7, target: null };
    case 'rage':
    case 'temp_atk':
    case 'temp_atk_cost':
    case 'self_dmg_atk':
    case 'ally_atk':
      return { use: foes.length > 0, target: null };
    case 'purge':
      return {
        use: (allies ?? [caster]).some((a) => a.etourdi || a.poisonTours > 0),
        target: null,
      };
    case 'drain':
    case 'degats':
    case 'degats_pierce':
    case 'destroy_shields':
    case 'burn_strike':
    case 'mark': {
      const target = pickAiTarget(players, null);
      return { use: target !== null, target };
    }
    case 'poison':
    case 'burn': {
      const candidates = foes.filter((f) => f.poisonTours === 0);
      const target =
        candidates.length > 0
          ? candidates.reduce((a, b) => (a.vie > b.vie ? a : b), candidates[0])
          : pickAiTarget(players, null);
      return { use: target !== null, target };
    }
    case 'stun':
    case 'atk_down':
    case 'steal_atk':
    case 'purge_enemy': {
      const threats = foes.filter((f) => !f.etourdi);
      if (threats.length === 0) return { use: false, target: null };
      const target = threats.reduce((a, b) => (a.attaque > b.attaque ? a : b), threats[0]);
      return { use: true, target };
    }
    case 'aoe':
    case 'aoe_weak':
      return { use: foes.length >= 1, target: null };
    default:
      return { use: false, target: null };
  }
}
