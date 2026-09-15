import { useCallback, useMemo, useState } from 'react';
import { CardView } from '../components/CardView';
import { getCardById } from '../data/cards';
import { useCollection } from '../hooks/useCollection';
import type { BattleCard, CombatPhase } from '../types';
import {
  alive,
  buildAiTeam,
  isSelfEffect,
  needsEnemyTarget,
  performAttack,
  pickAiAttacker,
  pickAiTarget,
  shouldAiUseSpecial,
  tickPoison,
  toBattleCard,
  useSpecial,
} from '../utils/combat';

function cloneTeam(team: BattleCard[]): BattleCard[] {
  return team.map((c) => ({ ...c }));
}

function applyPoisonTicks(team: BattleCard[]): { team: BattleCard[]; messages: string[] } {
  const next = cloneTeam(team);
  const messages: string[] = [];
  for (const c of next) {
    const dmg = tickPoison(c);
    if (dmg > 0) {
      messages.push(`☠ Le poison inflige ${dmg} dégâts à ${c.nom}.`);
      if (c.vie <= 0) messages.push(`${c.nom} succombe au poison !`);
    }
  }
  return { team: next, messages };
}

function phaseLabel(phase: CombatPhase): string {
  switch (phase) {
    case 'victoire':
      return 'Victoire';
    case 'defaite':
      return 'Défaite';
    case 'joueur':
      return 'Ton tour';
    case 'ennemi':
      return 'Tour ennemi…';
    default:
      return 'Combat';
  }
}

function phaseHint(
  phase: CombatPhase,
  mode: 'attaque' | 'effet',
  attacker: BattleCard | undefined,
): string {
  if (phase === 'ennemi') return "L'adversaire réfléchit et agit…";
  if (phase === 'victoire') return 'Tous les ennemis sont vaincus.';
  if (phase === 'defaite') return 'Ton équipe est hors combat.';
  if (phase !== 'joueur') return '';

  if (!attacker) {
    return mode === 'attaque'
      ? '① Choisis un allié prêt à attaquer.'
      : '① Choisis un allié avec un effet disponible.';
  }
  if (mode === 'attaque') {
    return `② ${attacker.nom} attaque — choisis une cible ennemie.`;
  }
  if (isSelfEffect(attacker.effet)) {
    return `${attacker.nom} peut lancer son effet immédiatement.`;
  }
  return `② ${attacker.nom} — choisis une cible pour l'effet.`;
}

export function Combat() {
  const { owned, ready } = useCollection();
  const [phase, setPhase] = useState<CombatPhase>('selection');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [playerTeam, setPlayerTeam] = useState<BattleCard[]>([]);
  const [enemyTeam, setEnemyTeam] = useState<BattleCard[]>([]);
  const [attackerId, setAttackerId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [mode, setMode] = useState<'attaque' | 'effet'>('attaque');

  const ownedDefs = useMemo(() => {
    return owned
      .map((o) => {
        const def = getCardById(o.cardId);
        if (!def) return null;
        return { instanceId: o.instanceId, def };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [owned]);

  const pushLogs = useCallback((msgs: string[]) => {
    if (msgs.length === 0) return;
    setLog((prev) => [...msgs].reverse().concat(prev).slice(0, 60));
  }, []);

  const toggleSelect = (instanceId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(instanceId)) return prev.filter((id) => id !== instanceId);
      if (prev.length >= 3) return prev;
      return [...prev, instanceId];
    });
  };

  const startBattle = () => {
    const defs = selectedIds
      .map((id) => ownedDefs.find((o) => o.instanceId === id))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    if (defs.length === 0) return;

    const pTeam = defs.map((d) => toBattleCard(d.def, d.instanceId));
    const eTeam = buildAiTeam(defs.map((d) => d.def));
    setPlayerTeam(pTeam);
    setEnemyTeam(eTeam);
    setAttackerId(null);
    setMode('attaque');
    setLog([
      `Adversaires : ${eTeam.map((c) => c.nom).join(' · ')}.`,
      'Le combat commence — à toi de jouer !',
    ]);
    setPhase('joueur');
  };

  const finishIfOver = (players: BattleCard[], enemies: BattleCard[]): boolean => {
    if (alive(enemies).length === 0) {
      setPlayerTeam(players);
      setEnemyTeam(enemies);
      setPhase('victoire');
      pushLogs(['🏆 Victoire ! Tous les ennemis sont vaincus.']);
      return true;
    }
    if (alive(players).length === 0) {
      setPlayerTeam(players);
      setEnemyTeam(enemies);
      setPhase('defaite');
      pushLogs(['💀 Défaite… Ton équipe est hors combat.']);
      return true;
    }
    return false;
  };

  const runEnemyTurn = (pTeam: BattleCard[], eTeam: BattleCard[]) => {
    setPhase('ennemi');
    setAttackerId(null);
    setTimeout(() => {
      const msgs: string[] = [];
      let players = cloneTeam(pTeam);
      let enemies = cloneTeam(eTeam);

      const poisonP = applyPoisonTicks(players);
      players = poisonP.team;
      msgs.push(...poisonP.messages);

      if (alive(players).length === 0) {
        setPlayerTeam(players);
        setEnemyTeam(enemies);
        setPhase('defaite');
        msgs.push('💀 Défaite… Ton équipe est hors combat.');
        pushLogs(msgs);
        return;
      }

      const attackerRef = pickAiAttacker(enemies, players);
      if (!attackerRef) {
        enemies = enemies.map((c) => ({ ...c, etourdi: false }));
        msgs.push("💫 L'ennemi est étourdi et passe son tour…");
        setPlayerTeam(players);
        setEnemyTeam(enemies);
        setAttackerId(null);
        setMode('attaque');
        setPhase('joueur');
        msgs.push('— À toi de jouer —');
        pushLogs(msgs);
        return;
      }

      const eIdx = enemies.findIndex((c) => c.instanceId === attackerRef.instanceId);
      const caster = enemies[eIdx];

      const special = shouldAiUseSpecial(caster, players);
      if (special.use) {
        let target: BattleCard | null = null;
        if (special.target) {
          const tIdx = players.findIndex((c) => c.instanceId === special.target!.instanceId);
          if (tIdx >= 0) target = players[tIdx];
        }
        const msg = useSpecial(caster, target);
        if (msg) msgs.push(`🤖 ${msg}`);
      }

      if (caster.vie > 0 && !caster.etourdi) {
        const targetRef = pickAiTarget(players, caster);
        if (targetRef) {
          const tIdx = players.findIndex((c) => c.instanceId === targetRef.instanceId);
          if (tIdx >= 0 && players[tIdx].vie > 0) {
            const msg = performAttack(caster, players[tIdx]);
            msgs.push(`🤖 ${msg}`);
          }
        }
      }

      enemies[eIdx] = { ...caster, etourdi: false };

      if (finishIfOver(players, enemies)) {
        pushLogs(msgs);
        return;
      }

      setPlayerTeam(players);
      setEnemyTeam(enemies);
      setAttackerId(null);
      setMode('attaque');
      setPhase('joueur');
      msgs.push('— À toi de jouer —');
      pushLogs(msgs);
    }, 700);
  };

  const resolvePlayerAction = (
    action: 'attaque' | 'effet',
    allyId: string,
    enemyId: string | null,
  ) => {
    if (phase !== 'joueur') return;

    const msgs: string[] = [];
    let players = cloneTeam(playerTeam);
    let enemies = cloneTeam(enemyTeam);

    const poisonE = applyPoisonTicks(enemies);
    enemies = poisonE.team;
    msgs.push(...poisonE.messages);

    if (alive(enemies).length === 0) {
      pushLogs(msgs);
      finishIfOver(players, enemies);
      return;
    }

    const aIdx = players.findIndex((c) => c.instanceId === allyId);
    if (aIdx < 0) return;
    const ally = players[aIdx];
    if (ally.vie <= 0 || ally.etourdi) {
      msgs.push(`${ally.nom} ne peut pas agir (KO ou étourdi).`);
      pushLogs(msgs);
      return;
    }

    if (action === 'attaque') {
      if (!enemyId) return;
      const tIdx = enemies.findIndex((c) => c.instanceId === enemyId);
      if (tIdx < 0 || enemies[tIdx].vie <= 0) return;
      const msg = performAttack(ally, enemies[tIdx]);
      msgs.push(msg);
    } else {
      if (ally.effetUtilise || ally.effet === 'aucun') {
        msgs.push(`${ally.nom} n'a plus d'effet disponible.`);
        pushLogs(msgs);
        return;
      }
      let target: BattleCard | null = null;
      if (needsEnemyTarget(ally.effet)) {
        if (!enemyId) return;
        const tIdx = enemies.findIndex((c) => c.instanceId === enemyId);
        if (tIdx < 0 || enemies[tIdx].vie <= 0) return;
        target = enemies[tIdx];
      }
      const msg = useSpecial(ally, target);
      if (msg) msgs.push(msg);
    }

    players[aIdx] = { ...ally, etourdi: false };
    pushLogs(msgs);

    if (finishIfOver(players, enemies)) return;

    setPlayerTeam(players);
    setEnemyTeam(enemies);
    setAttackerId(null);
    runEnemyTurn(players, enemies);
  };

  const onSelectAlly = (card: BattleCard) => {
    if (phase !== 'joueur' || card.vie <= 0 || card.etourdi) return;

    if (mode === 'effet') {
      if (card.effetUtilise || card.effet === 'aucun') return;
      if (isSelfEffect(card.effet)) {
        resolvePlayerAction('effet', card.instanceId, null);
        return;
      }
      setAttackerId(card.instanceId);
      return;
    }

    setAttackerId(card.instanceId);
  };

  const onSelectEnemy = (card: BattleCard) => {
    if (phase !== 'joueur' || !attackerId || card.vie <= 0) return;
    if (mode === 'attaque') {
      resolvePlayerAction('attaque', attackerId, card.instanceId);
    } else {
      resolvePlayerAction('effet', attackerId, card.instanceId);
    }
  };

  const resetToSelection = () => {
    setPhase('selection');
    setSelectedIds([]);
    setPlayerTeam([]);
    setEnemyTeam([]);
    setAttackerId(null);
    setLog([]);
    setMode('attaque');
  };

  const selectedAttacker = playerTeam.find((c) => c.instanceId === attackerId);
  const canUseEffectMode = playerTeam.some(
    (c) => c.vie > 0 && !c.etourdi && !c.effetUtilise && c.effet !== 'aucun',
  );
  const canAttackMode = playerTeam.some((c) => c.vie > 0 && !c.etourdi);

  const enemyTargetable =
    phase === 'joueur' &&
    Boolean(attackerId) &&
    (mode === 'attaque' ||
      (mode === 'effet' && selectedAttacker && needsEnemyTarget(selectedAttacker.effet)));

  if (!ready) return <p className="text-slate-400">Chargement…</p>;

  if (phase === 'selection') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-amber-300 mb-1">Combat</h2>
          <p className="text-slate-400 text-sm">
            Choisis jusqu&apos;à 3 cartes ({selectedIds.length}/3). L&apos;IA composera
            une équipe de puissance similaire.
          </p>
        </div>

        {ownedDefs.length === 0 ? (
          <p className="text-rose-300">Aucune carte — ouvre des packs d&apos;abord.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {ownedDefs.map(({ instanceId, def }) => (
                <CardView
                  key={instanceId}
                  card={def}
                  selected={selectedIds.includes(instanceId)}
                  onClick={() => toggleSelect(instanceId)}
                  compact
                />
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sticky bottom-3 z-10">
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={startBattle}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-rose-900/40 min-h-[44px]"
              >
                Lancer le combat ({selectedIds.length}/3)
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-amber-300">{phaseLabel(phase)}</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {phaseHint(phase, mode, selectedAttacker)}
          </p>
        </div>
        <button
          type="button"
          onClick={resetToSelection}
          className="text-sm px-3 py-1.5 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5 shrink-0"
        >
          Nouveau combat
        </button>
      </div>

      {(phase === 'victoire' || phase === 'defaite') && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 text-center shadow-xl ${
            phase === 'victoire'
              ? 'border-emerald-400/40 bg-emerald-950/40'
              : 'border-rose-400/40 bg-rose-950/40'
          }`}
        >
          <h3 className="font-display text-2xl font-bold text-white mb-1">
            {phase === 'victoire' ? 'Victoire !' : 'Défaite…'}
          </h3>
          <p className="text-sm text-slate-300 mb-4">
            {phase === 'victoire'
              ? 'Tu as vaincu toute l’équipe adverse.'
              : 'Toutes tes cartes sont hors combat.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={resetToSelection}
              className="btn-gold px-6 py-3 rounded-xl transition min-h-[44px]"
            >
              Rejouer
            </button>
          </div>
        </div>
      )}

      <div
        className={`rounded-2xl border p-3 sm:p-5 transition-all battlefield ${
          phase === 'ennemi' ? 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]' : 'border-white/10'
        }`}
      >
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="text-sm font-display font-semibold text-rose-300 tracking-wide uppercase">Équipe ennemie</h3>
          {phase === 'ennemi' && (
            <span className="text-[10px] uppercase tracking-wide text-rose-200/80 animate-pulse">
              Action en cours…
            </span>
          )}
          {enemyTargetable && (
            <span className="text-[10px] uppercase tracking-wide text-rose-200/80">
              Choisis une cible
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {enemyTeam.map((card) => (
            <CardView
              key={card.instanceId}
              card={card}
              showHp
              compact
              disabled={!enemyTargetable || card.vie <= 0}
              onClick={
                enemyTargetable && card.vie > 0 ? () => onSelectEnemy(card) : undefined
              }
              className={
                enemyTargetable && card.vie > 0
                  ? 'ring-4 ring-rose-400/80 animate-pulse-soft'
                  : ''
              }
            />
          ))}
        </div>
      </div>

      <div
        className={`rounded-2xl border p-3 sm:p-5 battlefield ${
          phase === 'joueur' ? 'border-sky-500/50 shadow-[0_0_30px_rgba(56,189,248,0.12)]' : 'border-white/10'
        }`}
      >
        <h3 className="text-sm font-display font-semibold text-sky-300 mb-3 tracking-wide uppercase">Ton équipe</h3>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {playerTeam.map((card) => {
            const canPick =
              phase === 'joueur' &&
              card.vie > 0 &&
              !card.etourdi &&
              (mode === 'attaque' ||
                (mode === 'effet' && !card.effetUtilise && card.effet !== 'aucun'));
            return (
              <CardView
                key={card.instanceId}
                card={card}
                showHp
                compact
                selected={attackerId === card.instanceId}
                disabled={!canPick}
                onClick={canPick ? () => onSelectAlly(card) : undefined}
              />
            );
          })}
        </div>
      </div>

      {phase === 'joueur' && (
        <div className="rounded-2xl panel-glass p-3 sm:p-4 space-y-2">
          <div className="flex flex-wrap gap-2 items-center justify-center">
            <button
              type="button"
              disabled={!canAttackMode}
              onClick={() => {
                setMode('attaque');
                setAttackerId(null);
              }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border min-h-[44px] disabled:opacity-40 ${
                mode === 'attaque'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                  : 'border-white/20 text-slate-400'
              }`}
            >
              Attaquer
            </button>
            <button
              type="button"
              disabled={!canUseEffectMode}
              onClick={() => {
                setMode('effet');
                setAttackerId(null);
              }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border min-h-[44px] disabled:opacity-40 ${
                mode === 'effet'
                  ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200'
                  : 'border-white/20 text-slate-400'
              }`}
            >
              Effet spécial
            </button>
            {attackerId && (
              <button
                type="button"
                onClick={() => setAttackerId(null)}
                className="px-3 py-2 rounded-lg text-xs border border-white/15 text-slate-400 hover:bg-white/5 min-h-[44px]"
              >
                Annuler sélection
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 text-center">
            {mode === 'attaque'
              ? 'Sélectionne un allié, puis une cible ennemie.'
              : 'Effet auto si soin / bouclier / rage ; sinon choisis une cible ennemie.'}
          </p>
        </div>
      )}

      <div className="rounded-2xl panel-glass p-3 max-h-48 sm:max-h-56 overflow-y-auto">
        <h3 className="text-xs font-display font-semibold text-amber-200/80 mb-2 uppercase tracking-wider sticky top-0 bg-[#05080f]/90 backdrop-blur-sm py-1">
          Journal de combat
        </h3>
        <ul className="space-y-1 text-sm text-slate-300">
          {log.map((line, i) => {
            const isAi = line.startsWith('🤖');
            const isSep = line.startsWith('—');
            const isWin = line.includes('Victoire');
            const isLose = line.includes('Défaite');
            return (
              <li
                key={`${i}-${line.slice(0, 24)}`}
                className={`border-b border-white/5 pb-1 ${
                  isAi
                    ? 'text-rose-200/90'
                    : isSep
                      ? 'text-amber-300/90 font-medium'
                      : isWin
                        ? 'text-emerald-300 font-semibold'
                        : isLose
                          ? 'text-rose-300 font-semibold'
                          : ''
                }`}
              >
                {line}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
