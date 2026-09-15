/**
 * Fetch character portrait URLs from AniList GraphQL and write cache JSON.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const cachePath = path.join(root, 'src/data/anilist-images.json');
const cardsPath = path.join(root, 'src/data/cards.ts');

const SERIE_ALIASES = {
  Naruto: ['Naruto', 'Naruto Shippuden', 'Boruto'],
  'One Piece': ['One Piece'],
  'Demon Slayer': ['Demon Slayer', 'Kimetsu no Yaiba'],
  'Dragon Ball': ['Dragon Ball', 'Dragon Ball Z', 'Dragon Ball Super', 'Dragon Ball GT'],
  'One Punch Man': ['One Punch Man'],
  "L'Attaque des Titans": ['Attack on Titan', 'Shingeki no Kyojin'],
  'My Hero Academia': ['My Hero Academia', 'Boku no Hero Academia'],
  'Jujutsu Kaisen': ['Jujutsu Kaisen'],
  Bleach: ['Bleach'],
  Avatar: ['Avatar: The Last Airbender', 'Avatar'],
  'Black Clover': ['Black Clover'],
  'Hunter x Hunter': ['Hunter x Hunter'],
  'Chainsaw Man': ['Chainsaw Man'],
  'Yu Yu Hakusho': ['Yu Yu Hakusho'],
  'Solo Leveling': ['Solo Leveling'],
  'The God of High School': ['The God of High School'],
  'That Time I Got Reincarnated as a Slime': [
    'That Time I Got Reincarnated as a Slime',
    'Tensei shitara Slime Datta Ken',
  ],
  'The Seven Deadly Sins': ['The Seven Deadly Sins', 'Nanatsu no Taizai'],
  "JoJo's Bizarre Adventure": ["JoJo's Bizarre Adventure", 'JoJo'],
  'Gurren Lagann': ['Tengen Toppa Gurren Lagann', 'Gurren Lagann'],
  'Sailor Moon': ['Sailor Moon', 'Bishoujo Senshi Sailor Moon'],
  'Mob Psycho 100': ['Mob Psycho 100'],
  'Fullmetal Alchemist': ['Fullmetal Alchemist', 'Fullmetal Alchemist: Brotherhood'],
  Umineko: ['Umineko When They Cry', 'Umineko no Naku Koro ni'],
  'The Melancholy of Haruhi Suzumiya': ['The Melancholy of Haruhi Suzumiya', 'Suzumiya Haruhi no Yuuutsu'],
  'The Misfit of Demon King Academy': ['The Misfit of Demon King Academy', 'Maou Gakuin'],
  'Puella Magi Madoka Magica': ['Puella Magi Madoka Magica', 'Madoka Magica'],
  'Shaman King': ['Shaman King'],
  'Instant Death': ['Instant Death', 'My Instant Death Ability Is So Overpowered'],
  'Demon King Daimao': ['Demon King Daimao', 'Ichiban Ushiro no Daimaou'],
  'The Daily Life of the Immortal King': [
    'The Daily Life of the Immortal King',
    'Xian Wang de Richang Shenghuo',
  ],
};

/** Manual overrides when AniList search is ambiguous */
const SEARCH_OVERRIDES = {
  'sakura-haruno-commun': 'Sakura Haruno',
  'kazuha-commun': 'Koji Koda', // catalogue typo: pet emoji / MHA
  'mumen-rider-commun': 'Mumen Rider',
  'chopper-commun': 'Tony Tony Chopper',
  'doflamingo-rare': 'Donquixote Doflamingo',
  'hisoka-rare': 'Hisoka Morow',
  'all-might-super-rare': 'All Might',
  'shigaraki-tomura-super-rare': 'Tomura Shigaraki',
  'son-goku-super-saiyan-3-ultra-rare': 'Son Goku',
  'son-goku-ultra-instinct-ultra-rare': 'Son Goku',
  'vegeta-ultra-ego-ultra-rare': 'Vegeta',
  'gogeta-super-saiyan-blue-ultra-rare': 'Gogeta',
  'vegito-super-saiyan-blue-ultra-rare': 'Vegito',
  'broly-full-power-ultra-rare': 'Broly',
  'naruto-mode-baryon-ultra-rare': 'Naruto Uzumaki',
  'sasuke-susanoo-parfait-ultra-rare': 'Sasuke Uchiha',
  'luffy-gear-5-ultra-rare': 'Monkey D. Luffy',
  'shanks-haki-des-rois-ultra-rare': 'Shanks',
  'gol-d-roger-ultra-rare': 'Gol D. Roger',
  'edward-newgate-barbe-blanche-ultra-rare': 'Edward Newgate',
  'ichigo-bankai-final-ultra-rare': 'Ichigo Kurosaki',
  'garou-cosmique-ultra-rare': 'Garou',
  'sung-jin-woo-ultra-rare': 'Sung Jinwoo',
  'jin-mori-ultra-rare': 'Jin Mori',
  'arthur-pendragon-chaos-ultra-rare': 'Arthur Pendragon',
  'asta-union-avec-liebe-ultra-rare': 'Asta',
  'son-goku-ultra-instinct-maitrise-legendaire': 'Son Goku',
  'vegeta-ultra-ego-legendaire': 'Vegeta',
  'grand-pretre-legendaire': 'Grand Priest',
  'naruto-mode-baryon-legendaire': 'Naruto Uzumaki',
  'sasuke-rinnegan-complet-legendaire': 'Sasuke Uchiha',
  'madara-jinchuriki-de-jubi-legendaire': 'Madara Uchiha',
  'luffy-gear-5-eveille-legendaire': 'Monkey D. Luffy',
  'barbe-blanche-prime-legendaire': 'Edward Newgate',
  'imu-legendaire': 'Imu',
  'ichigo-veritable-bankai-legendaire': 'Ichigo Kurosaki',
  'aizen-hogyoku-legendaire': 'Sousuke Aizen',
  'garou-cosmique-legendaire': 'Garou',
  'rimuru-tempest-seigneur-demon-legendaire': 'Rimuru Tempest',
  'sung-jin-woo-monarque-des-ombres-legendaire': 'Sung Jinwoo',
  'giorno-giovanna-gold-experience-requiem-legendaire': 'Giorno Giovanna',
  'simon-super-tengen-toppa-gurren-lagann-legendaire': 'Simon',
  'sailor-moon-forme-ultime-legendaire': 'Usagi Tsukino',
  'shigeo-kageyama-legendaire': 'Shigeo Kageyama',
  'le-grand-pretre-dieu': 'Grand Priest',
  'the-truth-dieu': 'Truth',
  'anti-spiral-dieu': 'Anti-Spiral',
  'simon-forme-ultime-dieu': 'Simon',
  'featherine-augustus-aurora-dieu': 'Featherine Augustus Aurora',
  'haruhi-suzumiya-dieu': 'Haruhi Suzumiya',
  'rimuru-tempest-forme-ultime-dieu': 'Rimuru Tempest',
  'goku-ultra-instinct-dieu': 'Son Goku',
  'sailor-cosmos-dieu': 'Sailor Cosmos',
  'madoka-kaname-deesse-dieu': 'Madoka Kaname',
  'hao-asakura-roi-des-esprits-dieu': 'Asakura Hao',
  'giorno-giovanna-gold-experience-requiem-dieu': 'Giorno Giovanna',
  'yogiri-takatou-dieu': 'Yogiri Takatou',
  'akuto-sai-dieu': 'Akuto Sai',
  'wang-ling-dieu': 'Wang Ling',
  'naruto-uzumaki-mode-ermite-super-rare': 'Naruto Uzumaki',
  'sasuke-uchiha-rinnegan-super-rare': 'Sasuke Uchiha',
  'monkey-d-luffy-gear-5-super-rare': 'Monkey D. Luffy',
  'roronoa-zoro-roi-de-l-enfer-super-rare': 'Roronoa Zoro',
  'marshall-d-teach-barbe-noire-super-rare': 'Marshall D. Teach',
  'gon-freecss-adulte-super-rare': 'Gon Freecss',
  'eren-titan-originel-rare': 'Eren Yeager',
  'sosuke-aizen-ultra-rare': 'Sousuke Aizen',
  'portgas-d-ace-rare': 'Portgas D. Ace',
  'trafalgar-law-rare': 'Trafalgar Law',
  'kaguya-otsutsuki-ultra-rare': 'Kaguya Otsutsuki',
  'kaguya-otsutsuki-legendaire': 'Kaguya Otsutsuki',
  'hashirama-senju-ultra-rare': 'Hashirama Senju',
  'mereoleona-vermillion-rare': 'Mereoleona Vermillion',
  'yami-sukehiro-rare': 'Yami Sukehiro',
  'eijiro-kirishima-rare': 'Eijiro Kirishima',
  'katsuki-bakugo-rare': 'Katsuki Bakugo',
  'shoto-todoroki-rare': 'Shoto Todoroki',
  'zenitsu-agatsuma-commun': 'Zenitsu Agatsuma',
  'hinata-hyuga-commun': 'Hinata Hyuga',
  'nobara-kugisaki-commun': 'Nobara Kugisaki',
  'orihime-inoue-commun': 'Orihime Inoue',
  'armin-arlert-commun': 'Armin Arlert',
  'inosuke-hashibira-peu-commun': 'Inosuke Hashibira',
  'tanjiro-kamado-peu-commun': 'Tanjiro Kamado',
  'mikasa-ackerman-peu-commun': 'Mikasa Ackerman',
  'shikamaru-nara-peu-commun': 'Shikamaru Nara',
  'tengen-uzui-peu-commun': 'Tengen Uzui',
  'megumi-fushiguro-peu-commun': 'Megumi Fushiguro',
  'maki-zenin-peu-commun': 'Maki Zenin',
  'killua-zoldyck-peu-commun': 'Killua Zoldyck',
  'kakashi-hatake-rare': 'Kakashi Hatake',
  'chrollo-lucilfer-rare': 'Chrollo Lucilfer',
  'giyu-tomioka-rare': 'Giyu Tomioka',
  'levi-ackerman-rare': 'Levi',
  'itachi-uchiha-super-rare': 'Itachi Uchiha',
  'obito-uchiha-super-rare': 'Obito Uchiha',
  'madara-uchiha-super-rare': 'Madara Uchiha',
  'kenpachi-zaraki-super-rare': 'Kenpachi Zaraki',
  'byakuya-kuchiki-super-rare': 'Byakuya Kuchiki',
  'toshiro-hitsugaya-super-rare': 'Toshiro Hitsugaya',
  'yusuke-urameshi-super-rare': 'Yusuke Urameshi',
  'satoru-gojo-super-rare': 'Satoru Gojo',
  'ryomen-sukuna-super-rare': 'Ryomen Sukuna',
  'yuta-okkotsu-super-rare': 'Yuta Okkotsu',
  'toji-fushiguro-super-rare': 'Toji Fushiguro',
  'muzan-kibutsuji-super-rare': 'Muzan Kibutsuji',
  'anos-voldigoad-legendaire': 'Anos Voldigoad',
  'anos-voldigoad-dieu': 'Anos Voldigoad',
  'zeno-dieu': 'Zen-Oh',
};

function baseSearchName(nom) {
  const cut = nom.split(' — ')[0].trim();
  return cut
    .replace(/^Le Grand Prêtre$/i, 'Grand Priest')
    .replace(/^Grand Prêtre$/i, 'Grand Priest')
    .replace(/^Barbe Blanche.*$/i, 'Edward Newgate')
    .replace(/^Sailor Moon.*$/i, 'Usagi Tsukino')
    .replace(/^Eren Titan Originel$/i, 'Eren Yeager')
    .replace(/^Garou Cosmique$/i, 'Garou')
    .replace(/^The Truth$/i, 'Truth');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function anilistSearch(search) {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 8) {
        characters(search: $search) {
          id
          name { full alternative }
          image { large medium }
          media(page: 1, perPage: 8, sort: POPULARITY_DESC) {
            nodes {
              title { romaji english native }
            }
          }
        }
      }
    }
  `;
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables: { search } }),
  });
  if (res.status === 429) {
    const retry = Number(res.headers.get('Retry-After') || 5);
    await sleep((retry + 1) * 1000);
    return anilistSearch(search);
  }
  if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
  const json = await res.json();
  return json?.data?.Page?.characters || [];
}

function mediaMatchesSerie(nodes, serie) {
  const aliases = (SERIE_ALIASES[serie] || [serie]).map((s) => s.toLowerCase());
  return nodes.some((n) => {
    const titles = [n.title?.romaji, n.title?.english, n.title?.native]
      .filter(Boolean)
      .map((t) => t.toLowerCase());
    return aliases.some((a) => titles.some((t) => t.includes(a.toLowerCase()) || a.toLowerCase().includes(t)));
  });
}

function pickBest(characters, serie, search) {
  if (!characters.length) return null;
  const withSerie = characters.filter((c) => mediaMatchesSerie(c.media?.nodes || [], serie));
  const pool = withSerie.length ? withSerie : characters;
  const searchLower = search.toLowerCase();
  const exact = pool.find((c) => c.name?.full?.toLowerCase() === searchLower);
  if (exact) return exact;
  const starts = pool.find((c) => c.name?.full?.toLowerCase().startsWith(searchLower.split(' ')[0]));
  return starts || pool[0];
}

function parseCards(src) {
  const cards = [];
  const re =
    /\{\s*id: '([^']+)',\s*nom: '((?:\\'|[^'])*)',\s*serie: '((?:\\'|[^'])*)',\s*emoji: '((?:\\'|[^'])*)',/g;
  let m;
  while ((m = re.exec(src))) {
    cards.push({
      id: m[1],
      nom: m[2].replace(/\\'/g, "'"),
      serie: m[3].replace(/\\'/g, "'"),
      emoji: m[4],
    });
  }
  return cards;
}

async function main() {
  const src = fs.readFileSync(cardsPath, 'utf8');
  const cards = parseCards(src);
  console.log(`Parsed ${cards.length} cards`);

  let cache = {};
  if (fs.existsSync(cachePath)) {
    cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }

  const results = { ...(cache.byId || {}) };
  let matched = 0;
  let failed = 0;
  let i = 0;

  for (const card of cards) {
    i += 1;
    if (results[card.id]?.image && results[card.id]?.matched) {
      matched += 1;
      continue;
    }
    const search = SEARCH_OVERRIDES[card.id] || baseSearchName(card.nom);
    process.stdout.write(`[${i}/${cards.length}] ${card.id} ← "${search}" ... `);
    try {
      const chars = await anilistSearch(search);
      const best = pickBest(chars, card.serie, search);
      if (best?.image?.large || best?.image?.medium) {
        results[card.id] = {
          image: best.image.large || best.image.medium,
          anilistId: best.id,
          anilistName: best.name?.full,
          search,
          matched: true,
        };
        matched += 1;
        console.log(`OK ${best.name?.full}`);
      } else {
        results[card.id] = { image: null, search, matched: false };
        failed += 1;
        console.log('MISS');
      }
    } catch (e) {
      results[card.id] = { image: null, search, matched: false, error: String(e) };
      failed += 1;
      console.log('ERR', e.message);
    }
    await sleep(700); // stay under rate limit
    if (i % 10 === 0) {
      fs.writeFileSync(
        cachePath,
        JSON.stringify(
          { generatedAt: new Date().toISOString(), matched, failed, byId: results },
          null,
          2,
        ),
      );
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    total: cards.length,
    matched: Object.values(results).filter((r) => r.matched).length,
    failed: Object.values(results).filter((r) => !r.matched).length,
    byId: results,
  };
  fs.writeFileSync(cachePath, JSON.stringify(out, null, 2));
  console.log(`\nDone. matched=${out.matched} failed=${out.failed} → ${cachePath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
