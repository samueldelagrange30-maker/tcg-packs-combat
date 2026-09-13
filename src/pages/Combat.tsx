import { useCallback, useMemo, useState } from 'react';
import { CardView } from '../components/CardView';
import { getCardById } from '../data/cards';
import { useCollection } from '../hooks/useCollection';
import type { BattleCard, CombatPhase } from '../types';
import {
  alive,
  buildAiTeam,
  performAttack,
  pickAiAttacker,
  pickAiTarget,
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
    setLog((prev) => [...msgs].reverse().concat(prev).slice(0, 50));
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
      `Tu affrontes : ${eTeam.map((c) => c.nom).join(', ')}.`,
      'Le combat commence !',
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

      const attackerRef = pickAiAttacker(enemies);
      if (!attackerRef) {
        enemies = enemies.map((c) => ({ ...c, etourdi: false }));
        msgs.push("L'ennemi est étourdi et passe son tour…");
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

      // Chance to use special before attacking
      if (!caster.effetUtilise && caster.effet !== 'aucun' && Math.random() < 0.4) {
        const selfEffects = ['soin', 'bouclier', 'rage'];
        if (selfEffects.includes(caster.effet)) {
          const msg = useSpecial(caster, null);
          if (msg) msgs.push(`🤖 ${msg}`);
        } else {
          const target = pickAiTarget(players);
          if (target) {
            const tIdx = players.findIndex((c) => c.instanceId === target.instanceId);
            const msg = useSpecial(caster, players[tIdx]);
            if (msg) msgs.push(`🤖 ${msg}`);
          }
        }
      }

      if (caster.vie > 0) {
        const target = pickAiTarget(players);
        if (target) {
          const tIdx = players.findIndex((c) => c.instanceId === target.instanceId);
          const msg = performAttack(caster, players[tIdx]);
          msgs.push(`🤖 ${msg}`);
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
    }, 650);
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
      msgs.push(`${ally.nom} ne peut pas agir.`);
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
      const needsTarget = ['poison', 'drain', 'stun'].includes(ally.effet);
      let target: BattleCard | null = null;
      if (needsTarget) {
        if (!enemyId) return;
        const tIdx = enemies.findIndex((c) => c.instanceId === enemyId);
        if (tIdx < 0 || enemies[tIdx].vie <= 0) return;
        target = enemies[tIdx];
      }
      if (ally.effetUtilise || ally.effet === 'aucun') {
        msgs.push(`${ally.nom} n'a plus d'effet disponible.`);
        pushLogs(msgs);
        return;
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
      const selfEffects = ['soin', 'bouclier', 'rage'];
      if (card.effetUtilise || card.effet === 'aucun') return;
      if (selfEffects.includes(card.effet)) {
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

  if (!ready) return <p className="text-slate-400">Chargement…</p>;

  if (phase === 'selection') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-amber-300 mb-1">Combat</h2>
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
            <div className="flex justify-center">
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={startBattle}
                className="px-6 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-rose-900/40"
              >
                Lancer le combat ({selectedIds.length})
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const selectedAttacker = playerTeam.find((c) => c.instanceId === attackerId);
  const enemyTargetable =
    phase === 'joueur' &&
    Boolean(attackerId) &&
    (mode === 'attaque' ||
      (mode === 'effet' &&
        selectedAttacker &&
        ['poison', 'drain', 'stun'].includes(selectedAttacker.effet)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-amber-300">
          {phase === 'victoire' && '🏆 Victoire'}
          {phase === 'defaite' && '💀 Défaite'}
          {phase === 'joueur' && 'Ton tour'}
          {phase === 'ennemi' && 'Tour ennemi…'}
        </h2>
        <button
          type="button"
          onClick={resetToSelection}
          className="text-sm px-3 py-1.5 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5"
        >
          Nouveau combat
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-rose-300 mb-2">Équipe ennemie</h3>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {enemyTeam.map((card) => (
            <CardView
              key={card.instanceId}
              card={card}
              showHp
              compact
              disabled={!enemyTargetable || card.vie <= 0}
              onClick={
                enemyTargetable && card.vie > 0
                  ? () => onSelectEnemy(card)
                  : undefined
              }
              className={enemyTargetable && card.vie > 0 ? 'ring-2 ring-rose-400/60' : ''}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-sky-300 mb-2">Ton équipe</h3>
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
        <div className="flex flex-wrap gap-2 items-center justify-center">
          <button
            type="button"
            onClick={() => {
              setMode('attaque');
              setAttackerId(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              mode === 'attaque'
                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                : 'border-white/20 text-slate-400'
            }`}
          >
            ⚔️ Attaquer
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('effet');
              setAttackerId(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              mode === 'effet'
                ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200'
                : 'border-white/20 text-slate-400'
            }`}
          >
            ✨ Effet spécial
          </button>
          <p className="text-xs text-slate-400 w-full text-center sm:w-auto sm:ml-2">
            {mode === 'attaque'
              ? 'Sélectionne un allié, puis une cible ennemie.'
              : 'Sélectionne un allié (effet auto si soin/bouclier/rage, sinon choisis une cible).'}
          </p>
        </div>
      )}

      {(phase === 'victoire' || phase === 'defaite') && (
        <div className="text-center">
          <button
            type="button"
            onClick={resetToSelection}
            className="px-6 py-3 rounded-xl bg-amber-500 text-purple-950 font-bold hover:bg-amber-400"
          >
            Rejouer
          </button>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-black/30 p-3 max-h-48 overflow-y-auto">
        <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
          Journal de combat
        </h3>
        <ul className="space-y-1 text-sm text-slate-300">
          {log.map((line, i) => (
            <li key={`${i}-${line.slice(0, 20)}`} className="border-b border-white/5 pb-1">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
