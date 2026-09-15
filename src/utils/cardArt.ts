import type { Rarity } from '../types';

const RARITY_GRADIENT: Record<Rarity, [string, string, string]> = {
  commun: ['#334155', '#1e293b', '#0f172a'],
  peu_commun: ['#065f46', '#064e3b', '#022c22'],
  rare: ['#1e3a8a', '#1e40af', '#0c1a4a'],
  super_rare: ['#581c87', '#6b21a8', '#2e1065'],
  ultra_rare: ['#92400e', '#b45309', '#451a03'],
  legendaire: ['#9f1239', '#be123c', '#4c0519'],
  dieu: ['#7c3aed', '#db2777', '#ca8a04'],
};

export function initialsFromName(nom: string): string {
  const base = nom.split(' — ')[0].trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Stylish SVG fallback: gradient + initials + rarity frame */
export function fallbackArtDataUrl(nom: string, rarete: Rarity): string {
  const [c1, c2, c3] = RARITY_GRADIENT[rarete];
  const initials = initialsFromName(nom);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="50%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="v" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#ffffff22"/>
      <stop offset="100%" stop-color="#00000055"/>
    </radialGradient>
  </defs>
  <rect width="400" height="560" fill="url(#g)"/>
  <rect width="400" height="560" fill="url(#v)"/>
  <rect x="14" y="14" width="372" height="532" rx="18" fill="none" stroke="#fbbf2488" stroke-width="3"/>
  <rect x="28" y="28" width="344" height="504" rx="12" fill="none" stroke="#ffffff22" stroke-width="1"/>
  <circle cx="200" cy="240" r="78" fill="#00000044" stroke="#fbbf2466" stroke-width="2"/>
  <text x="200" y="255" text-anchor="middle" font-family="Georgia, serif" font-size="52" font-weight="700" fill="#fef3c7">${initials}</text>
  <text x="200" y="480" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" letter-spacing="3" fill="#fbbf24aa">ANIME TCG</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function resolveCardImage(image: string | undefined, nom: string, rarete: Rarity): string {
  if (image && image.startsWith('http')) return image;
  return fallbackArtDataUrl(nom, rarete);
}
