import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-purple-950/80 to-indigo-950/60 p-6 sm:p-10 shadow-xl shadow-purple-900/40">
        <p className="text-amber-400/90 text-sm font-semibold tracking-widest uppercase mb-2">
          Bienvenue, invocateur
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ouvre des packs. Construis ta légende. Domine le combat.
        </h2>
        <p className="text-slate-300 max-w-2xl leading-relaxed mb-6">
          <strong className="text-amber-300">Arcanes Packs</strong> est un TCG fantasy
          où tu ouvres des packs de 5 cartes, enrichis ta collection et affrontes une IA
          en combat tour par tour. Chaque carte possède de la <em>Vie</em>, une{' '}
          <em>Attaque</em> et parfois un <em>effet spécial</em> unique (soin, poison,
          bouclier, rage, drain, stun…).
        </p>
        <p className="text-slate-400 text-sm mb-8">
          À ta première visite, 5 cartes de démarrage te sont offertes pour combattre
          immédiatement. Ta collection est sauvegardée automatiquement.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/packs"
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-purple-950 font-bold hover:bg-amber-400 transition shadow-lg shadow-amber-500/30"
          >
            Ouvrir des packs
          </Link>
          <Link
            to="/collection"
            className="px-5 py-2.5 rounded-xl border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 transition"
          >
            Voir la collection
          </Link>
          <Link
            to="/combat"
            className="px-5 py-2.5 rounded-xl border border-rose-400/40 text-rose-200 hover:bg-rose-500/20 transition"
          >
            Entrer en combat
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Packs',
            icon: '🎁',
            text: 'Ouvre un pack de 5 cartes avec animation de révélation. Les communes sont fréquentes ; les légendaires sont rares.',
          },
          {
            title: 'Collection',
            icon: '📚',
            text: 'Consulte toutes tes cartes : vie, attaque, effet spécial et rareté.',
          },
          {
            title: 'Combat',
            icon: '⚔️',
            text: 'Choisis jusqu\'à 3 cartes, affronte une équipe IA de puissance similaire et utilise tes effets spéciaux.',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-amber-500/30 transition"
          >
            <div className="text-3xl mb-2">{item.icon}</div>
            <h3 className="font-bold text-amber-300 mb-2">{item.title}</h3>
            <p className="text-sm text-slate-400">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
