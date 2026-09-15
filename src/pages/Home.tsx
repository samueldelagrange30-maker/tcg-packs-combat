import { Link } from 'react-router-dom';
import { CATALOGUE } from '../data/cards';
import { resolveCardImage } from '../utils/cardArt';

const showcase = [
  CATALOGUE.find((c) => c.id.includes('luffy') && c.rarete === 'legendaire'),
  CATALOGUE.find((c) => c.id.includes('goku') && c.rarete === 'dieu'),
  CATALOGUE.find((c) => c.id.includes('gojo')),
].filter(Boolean) as typeof CATALOGUE;

export function Home() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl panel-glass p-6 sm:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl animate-[hero-glow_4s_ease-in-out_infinite]" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-fuchsia-600/20 blur-3xl" />

        <div className="relative grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          <div>
            <p className="text-amber-400/90 text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase mb-3">
              Bienvenue, collectionneur
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Ouvre des packs.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-rose-300">
                Domine le combat.
              </span>
            </h2>
            <p className="text-slate-300 max-w-xl leading-relaxed mb-4">
              <strong className="text-amber-300">Anime Packs Combat</strong> est un TCG fan-made
              non officiel : packs de 5 cartes, collection de personnages d&apos;anime et combat
              tour par tour. Chaque carte a de la <em>Vie</em>, une <em>Attaque</em> et parfois un{' '}
              <em>effet spécial</em>.
            </p>
            <p className="text-slate-500 text-sm mb-8">
              5 cartes de démarrage offertes · sauvegarde locale · contenu fan sans affiliation
              officielle.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/packs"
                className="btn-gold px-6 py-3 rounded-xl min-h-[44px] inline-flex items-center transition"
              >
                Ouvrir des packs
              </Link>
              <Link
                to="/collection"
                className="px-5 py-3 rounded-xl border border-amber-400/30 text-amber-100 hover:bg-amber-500/10 transition min-h-[44px] inline-flex items-center"
              >
                Collection
              </Link>
              <Link
                to="/combat"
                className="px-5 py-3 rounded-xl border border-rose-400/40 text-rose-100 hover:bg-rose-500/10 transition min-h-[44px] inline-flex items-center"
              >
                Combat
              </Link>
            </div>
          </div>

          <div className="relative h-56 sm:h-72 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent rounded-full blur-2xl" />
            {showcase.map((card, i) => (
              <div
                key={card.id}
                className={`absolute w-28 sm:w-36 rounded-xl overflow-hidden border-2 border-amber-400/40 shadow-2xl shadow-black/60 ${
                  i === 0
                    ? 'z-20 animate-float-card -rotate-6'
                    : i === 1
                      ? 'z-10 translate-x-16 sm:translate-x-20 animate-float-card-2'
                      : 'z-0 -translate-x-14 sm:-translate-x-16 rotate-12 opacity-90'
                }`}
                style={{ animationDelay: `${i * 0.4}s` }}
              >
                <img
                  src={resolveCardImage(card.image, card.nom, card.rarete)}
                  alt=""
                  className="aspect-[3/4] h-auto w-full object-contain object-top bg-black"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-2">
                  <p className="font-display text-[10px] sm:text-xs text-amber-200 truncate">
                    {card.nom}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Packs cinématiques',
            text: 'Foil shimmer, révélations progressives et rafale de rareté pour les ultra / légendaires / dieux.',
          },
          {
            title: 'Collection premium',
            text: 'Grille de cartes illustrées, filtres par rareté et portraits AniList avec fallback élégant.',
          },
          {
            title: 'Combat tactique',
            text: "Jusqu'à 3 cartes, barres de vie, anneaux de sélection et journal de combat clair.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl panel-glass p-5 hover:border-amber-400/40 transition group"
          >
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 mb-4 group-hover:w-20 transition-all" />
            <h3 className="font-display font-bold text-amber-300 mb-2">{item.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
