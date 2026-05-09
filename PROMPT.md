# Prompt Cursor — DevBoost (PWA d'entraînement dev)

> Copie-colle ce prompt dans Cursor (Cmd+I en mode Agent recommandé) pour bootstrap le projet.

---

## 🎯 Mission

Tu es un dev senior React. Crée une **PWA d'entraînement pour développeurs** appelée **DevBoost** : sessions courtes de 2-5 min mêlant des cartes Quiz (QCM) et des Challenges (mini-kata de code exécuté en live), avec gamification (XP, streak quotidien, déblocage de thèmes) et répétition espacée SM-2.

## 📦 Stack technique imposée

- **React 18** + **Vite** + **Tailwind CSS** (PWA)
- **vite-plugin-pwa** (Workbox) — manifest + service worker, offline complet, prompt d'install
- **Dexie.js** (IndexedDB) — cartes, progression, stats, paramètres
- **CodeMirror 6** (`@codemirror/state`, `@codemirror/view`, `@codemirror/lang-javascript`) — éditeur léger pour mobile
- **Zustand** — state global (sessions, user, settings)
- **Framer Motion** — animations swipe Tinder-like
- **Web Worker** sandboxé pour l'exécution du code utilisateur (timeout 3s, isolation totale, pas d'`eval` dans le thread principal)
- **React Router 6** pour la navigation
- **Algo SM-2 SuperMemo** pour la répétition espacée (~30 lignes JS)

⚠️ Pas de TypeScript pour le MVP (rapidité). Pur JSX. ESLint + Prettier configurés.

## 🗺 Arborescence d'écrans (React Router)

```
/           → Dashboard (streak, bouton "Démarrer la session du jour")
/session    → Carte courante (Quiz ou Challenge), swipe gestures
/library    → Liste/édition des cartes par thème, formulaire d'ajout
/stats      → Progression, courbes, % réussite par thème
/settings   → Thèmes actifs, durée de session, notifs push
```

## 📁 Structure du projet à générer

```
src/
├── main.jsx
├── App.jsx
├── routes.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── Session.jsx
│   ├── Library.jsx
│   ├── Stats.jsx
│   └── Settings.jsx
├── components/
│   ├── cards/
│   │   ├── Card.jsx          # wrapper swipeable Framer Motion
│   │   ├── QuizCard.jsx      # QCM / réponse rapide
│   │   └── ChallengeCard.jsx # éditeur CodeMirror + Run + résultats tests
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── StreakBadge.jsx
│   │   └── XPBar.jsx
│   └── layout/
│       ├── BottomNav.jsx
│       └── PageWrapper.jsx
├── store/
│   ├── useSessionStore.js    # session courante, index carte, résultats
│   ├── useUserStore.js       # XP, streak, thèmes débloqués
│   └── useSettingsStore.js
├── db/
│   ├── dexie.js              # init Dexie + schémas
│   └── seed.js               # cartes initiales par thème (JS, React, CSS, Algo)
├── lib/
│   ├── sm2.js                # algo SM-2 (~30 lignes)
│   ├── sessionBuilder.js     # tire 7 quiz + 3 challenges selon SM-2
│   └── runner/
│       ├── worker.js         # Web Worker exécuteur
│       └── runChallenge.js   # API : runChallenge(code, tests) → résultats
├── data/
│   └── cards/                # JSON de seed par thème
│       ├── javascript.json
│       ├── react.json
│       └── algo.json
├── hooks/
│   ├── useSwipe.js
│   └── usePWAInstall.js
└── styles/
    └── index.css             # Tailwind directives
```

## 🧩 Modèle de données (Dexie)

```js
// db/dexie.js
db.version(1).stores({
  cards:     '++id, theme, type, difficulty, lastReview',     // type: 'quiz'|'challenge'
  reviews:   '++id, cardId, date, quality, easeFactor, interval, nextReview',
  sessions:  '++id, date, durationSec, cardsCount, passed',
  user:      'id, xp, streak, lastSessionDate, unlockedThemes',
  settings:  'id, sessionDuration, themes, notifyAt'
});
```

**Card schema :**
```js
// Quiz
{ id, theme, type: 'quiz', question, choices: [...], answer: 0, explanation, difficulty }
// Challenge
{ id, theme, type: 'challenge', prompt, starterCode, tests: [{input, expected, label}], hint, difficulty }
```

## ⚙️ Algo SM-2 (lib/sm2.js)

Implémente l'algo SuperMemo-2 standard :

```js
// quality: 0-5 (0=raté, 5=parfait)
// retourne {easeFactor, interval, nextReview}
export function sm2(card, quality) {
  let { easeFactor = 2.5, interval = 0, repetitions = 0 } = card;
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }
  const nextReview = new Date(Date.now() + interval * 86400000);
  return { easeFactor, interval, repetitions, nextReview };
}
```

## 🔒 Web Worker — exécuteur de code (lib/runner/worker.js)

Le worker doit :

1. Recevoir `{ code, tests }` du thread principal via `postMessage`
2. Construire une fonction depuis le code utilisateur (`new Function(...)` dans le worker — isolé)
3. Exécuter chaque test avec un **timeout global de 3 secondes** (annule si dépassé)
4. Renvoyer `{ passed, failed, results: [{label, ok, error?, actual?, expected}] }`
5. Capturer toutes les exceptions (TypeError, RangeError pour les boucles trop profondes, etc.)

API attendue côté UI :
```js
import { runChallenge } from '@/lib/runner/runChallenge';
const result = await runChallenge(userCode, card.tests);
// → { passed: 2, failed: 1, results: [...] }
```

## 🎮 Comportements clés du MVP

1. **Dashboard** : grosse card "Démarrer ta session", streak en flammes 🔥, XP du jour, prochaine session due (badge sur le bouton si cartes en retard SM-2).
2. **Session** : 10 cartes (7 quiz + 3 challenges) tirées par `sessionBuilder.js` qui priorise les cartes dont `nextReview <= aujourd'hui` puis comble avec aléatoire pondéré difficulté.
3. **Swipe** :
   - Droite (vert) = "OK" → quality 4
   - Gauche (rouge) = "à revoir" → quality 2
   - Boutons aussi cliquables (accessibilité)
4. **Challenge** : énoncé en haut, éditeur CodeMirror au milieu, bouton "Run" en bas, panneau de tests verts/rouges en dessous. Tant que tous les tests ne passent pas, on ne peut pas valider la carte.
5. **Library** : table des cartes filtrable par thème, modal d'édition (form ou JSON brut au choix). Bouton "Importer JSON".
6. **Stats** : streak en cours + max, XP cumulée, sparkline des 30 derniers jours, % réussite par thème (donut). Recharts ou Chart.js.
7. **Settings** : toggles thèmes (JS, React, CSS, Algo, Git…), durée cible de session (2-10 min), heure de notif quotidienne (Notification API + service worker).
8. **PWA** : manifest.json complet (icônes 192/512), `vite-plugin-pwa` avec stratégie `CacheFirst` pour assets et `NetworkFirst` pour les éventuelles fetch. Pas de fetch externe requis pour le MVP.

## 🌱 Données de seed (data/cards/*.json)

Génère **5 cartes par thème** pour 3 thèmes (JavaScript, React, Algo) :
- 3 quiz (QCM 4 choix avec `explanation` qui apparaît après réponse)
- 2 challenges avec 3 tests chacun

Exemple de challenge JS :
```json
{
  "theme": "javascript",
  "type": "challenge",
  "prompt": "Inverse une chaîne sans utiliser .reverse()",
  "starterCode": "function reverse(str) {\n  // ton code\n}",
  "tests": [
    { "label": "hello → olleh", "input": ["hello"], "expected": "olleh" },
    { "label": "vide → vide",   "input": [""],      "expected": "" },
    { "label": "a → a",         "input": ["a"],     "expected": "a" }
  ],
  "difficulty": 1
}
```

## 🎨 Design system (Tailwind)

- Palette : `bg-slate-950`, accents `emerald-400` (succès) / `rose-400` (échec) / `amber-400` (streak)
- Typo : `font-sans` système, titres en `font-extrabold tracking-tight`
- Cards arrondies `rounded-2xl`, ombres `shadow-xl shadow-black/40`
- Mobile-first, max-width `max-w-md` centré, padding safe-area iOS
- Animations Framer Motion : entrée `spring`, swipe `drag`, sortie translate+rotate
- Mode dark par défaut (PWA → installable, look "app native")

## ✅ Critères d'acceptation MVP (4-5 soirées)

- [ ] L'app s'installe sur écran d'accueil (Chrome desktop + Android)
- [ ] Fonctionne 100 % offline après première visite
- [ ] Une session complète de 10 cartes tourne sans bug
- [ ] Le challenge "reverse" passe en vert avec une solution correcte
- [ ] Le streak s'incrémente d'une session par jour, se reset si on saute un jour
- [ ] Les cartes ratées reviennent plus vite (SM-2 visible dans la console pour debug)
- [ ] Lighthouse PWA ≥ 90, Performance ≥ 85 sur mobile

## 🚀 Étapes d'exécution séquentielles

**Important : exécute UNE étape à la fois. Après chaque étape, montre les fichiers créés/modifiés et attends ma validation avant de passer à la suivante.**

1. **Bootstrap** : `npm create vite@latest devboost -- --template react`, installe Tailwind + toutes les deps ci-dessus, configure `vite.config.js` avec `vite-plugin-pwa`.
2. **Squelette** : crée toute l'arborescence ci-dessus avec les fichiers vides + imports/exports cohérents.
3. **Dexie + seed** : implémente la DB, le seed initial au premier lancement.
4. **SM-2 + sessionBuilder** : code l'algo et le tirage de session.
5. **Pages basiques** : Dashboard + Session avec navigation entre cartes (sans swipe encore).
6. **QuizCard** : QCM fonctionnel + feedback visuel.
7. **Web Worker runner** : worker.js + runChallenge.js + tests unitaires.
8. **ChallengeCard** : CodeMirror + bouton Run + panneau de résultats.
9. **Swipe + animations** : Framer Motion par-dessus Card.jsx.
10. **PWA + manifest + offline** : finalise vite-plugin-pwa.
11. **Library + Stats + Settings** : CRUD cartes, charts, options.
12. **Polish** : empty states, loading states, micro-interactions, sons optionnels.

**Commence par l'étape 1.**

---

## 💡 Conseils additionnels

- Le runner Web Worker est le composant le plus délicat → teste-le isolément avec 3 cas (succès, échec, boucle infinie) avant de l'intégrer dans la carte.
- Pour les notifications : `Notification.requestPermission()` au moment où l'utilisateur active l'option, jamais au démarrage.
- Stocke l'easeFactor sur la carte directement plutôt que dans `reviews` — beaucoup plus simple à lire au moment du tirage.
- Pour le seed initial : flag `db.user.get(1)` → si absent, exécute `seed.js`.
- Lighthouse aime : `<meta name="theme-color">`, icône maskable, `display: standalone`, `start_url: "/"`.
