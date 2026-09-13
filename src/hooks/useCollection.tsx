import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STARTER_CARD_IDS } from '../data/cards';
import type { CardDefinition, OwnedCard } from '../types';
import { newInstanceId } from '../utils/combat';

const STORAGE_KEY = 'tcg-arcanes-collection';
const STARTER_FLAG = 'tcg-arcanes-starter-granted';

function loadOwned(): OwnedCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OwnedCard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOwned(owned: OwnedCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(owned));
}

function grantStarters(): OwnedCard[] {
  return STARTER_CARD_IDS.map((cardId) => ({
    instanceId: newInstanceId(),
    cardId,
  }));
}

type CollectionContextValue = {
  owned: OwnedCard[];
  ready: boolean;
  addCards: (defs: CardDefinition[]) => void;
  resetCollection: () => void;
};

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [owned, setOwned] = useState<OwnedCard[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let current = loadOwned();
    const granted = localStorage.getItem(STARTER_FLAG);
    if (!granted || current.length === 0) {
      if (current.length === 0) {
        current = grantStarters();
        saveOwned(current);
      }
      localStorage.setItem(STARTER_FLAG, '1');
    }
    setOwned(current);
    setReady(true);
  }, []);

  const addCards = useCallback((defs: CardDefinition[]) => {
    const additions: OwnedCard[] = defs.map((d) => ({
      instanceId: newInstanceId(),
      cardId: d.id,
    }));
    setOwned((prev) => {
      const next = [...prev, ...additions];
      saveOwned(next);
      return next;
    });
  }, []);

  const resetCollection = useCallback(() => {
    const starters = grantStarters();
    setOwned(starters);
    saveOwned(starters);
    localStorage.setItem(STARTER_FLAG, '1');
  }, []);

  const value = useMemo(
    () => ({ owned, ready, addCards, resetCollection }),
    [owned, ready, addCards, resetCollection],
  );

  return (
    <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
  );
}

export function useCollection(): CollectionContextValue {
  const ctx = useContext(CollectionContext);
  if (!ctx) {
    throw new Error('useCollection doit être utilisé dans CollectionProvider');
  }
  return ctx;
}
