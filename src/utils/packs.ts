import { CATALOGUE, RARITY_ORDER, RARITY_WEIGHTS, cardsByRarity } from '../data/cards';
import type { CardDefinition, Rarity } from '../types';

function pickRarity(): Rarity {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  // Ascending rarity for weight walk (commun first)
  const order: Rarity[] = [...RARITY_ORDER].reverse();
  for (const r of order) {
    roll -= RARITY_WEIGHTS[r];
    if (roll <= 0) return r;
  }
  return 'commun';
}

function pickCardOfRarity(rarete: Rarity): CardDefinition {
  const pool = cardsByRarity(rarete);
  if (pool.length === 0) {
    return CATALOGUE[Math.floor(Math.random() * CATALOGUE.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function openPack(size = 5): CardDefinition[] {
  return Array.from({ length: size }, () => pickCardOfRarity(pickRarity()));
}
