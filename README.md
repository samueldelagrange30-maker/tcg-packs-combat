# Arcanes Packs — TCG

Application web de jeu de cartes à collectionner (TCG) : ouverture de packs, collection et combat tour par tour contre une IA.

## Stack

- Vite
- React + TypeScript
- Tailwind CSS
- React Router

Toute l’interface est en **français**.

## Installation

```bash
cd tcg-packs-combat
npm install
```

## Lancer en développement

```bash
npm run dev
```

Ouvre l’URL affichée dans le terminal (souvent `http://localhost:5173`).

## Build de production

```bash
npm run build
```

Les fichiers générés se trouvent dans `dist/`. Pour prévisualiser le build :

```bash
npm run preview
```

## Fonctionnalités

1. **Accueil** — introduction et navigation vers Packs / Collection / Combat.
2. **Packs** — ouverture de packs de 5 cartes avec animation de révélation ; les cartes sont ajoutées à la collection (localStorage).
3. **Collection** — liste des cartes possédées (nom, vie, attaque, effet spécial, rareté).
4. **Combat** — sélection jusqu’à 3 cartes, équipe IA de puissance similaire, combat tour par tour (attaque + effet spécial une fois par carte).
5. **Démarrage** — 5 cartes gratuites à la première visite.

## Cartes & raretés

Environ 20 cartes fantasy originales. Raretés : commune, rare, épique, légendaire (odds orientés commune).

Effets spéciaux : **soin**, **poison**, **bouclier**, **rage**, **drain**, **stun**.

## Licence

Projet MVP éducatif / démo. Cartes originales (pas de franchises protégées).
