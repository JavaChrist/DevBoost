# DevBoost

Une **PWA d'entraînement pour développeurs** : sessions courtes de 2 à 5 minutes mêlant **Quiz** (QCM) et **Challenges** (mini-katas de code exécutés en live), gamification (XP, streak quotidien) et **répétition espacée SM-2**.

100 % offline-first. 100 % local. Aucune API externe.

---

## 🚀 Démarrer

```bash
npm install
npm run dev          # http://localhost:5173
```

Premier lancement → la base IndexedDB est seedée automatiquement (15 cartes : JS / React / Algo).

### Build & PWA

```bash
npm run build        # bundle prod + service worker + manifest
npm run preview      # serve le build (utile pour tester l'install PWA)
npm run gen:icons    # régénère les icônes PWA depuis public/logo.svg
```

### Tests

```bash
npm test             # exécute toute la suite (node --test)
```

> 63 tests : SM-2, sessionBuilder, streak, runner sandboxé (Web Worker), validation cartes, stats, notifications.

---

## ✨ Fonctionnalités

- **Dashboard** : streak 🔥, barre XP, bouton "Démarrer la session", badge "X cartes à réviser".
- **Session** : 7 quiz + 3 challenges, swipe Tinder-like, flip 3D pour l'explication, animations Framer Motion.
- **Quiz** : QCM, feedback immédiat, explication au dos.
- **Challenge** : énoncé + éditeur **CodeMirror 6** + tests qui s'exécutent dans un **Web Worker isolé** (timeout 3 s, pas d'accès au DOM/réseau).
- **Library** : liste avec recherche / filtres (thème, type), édition (formulaire structuré ou JSON brut), import JSON en masse, suppression sécurisée.
- **Stats** : KPI (streak, XP, sessions, cartes, taux de réussite), sparkline 30 jours (Recharts), donut taux de succès par thème.
- **Settings** :
  - thèmes actifs,
  - durée cible de session (slider 2–10 min ↔ nb de cartes),
  - effets (son via Web Audio API, vibration via Vibration API),
  - notification quotidienne (Notification API + permission demandée à l'activation),
  - reset complet de la base (double confirmation).
- **Toasts** : feedback discret (`+10 XP`, `Streak 5 🔥`, `Carte sauvegardée`, `3 cartes importées`…).
- **PWA** : installable (Chrome desktop + Android), offline complet, manifest, icônes maskables.

---

## 🧠 Algorithmes

- **SM-2 SuperMemo** (`src/lib/sm2.js`) : ajustement de l'`easeFactor`, calcul de l'intervalle, mise à jour de `nextReview`.
- **Session builder** (`src/lib/sessionBuilder.js`) : priorité aux cartes "due", remplissage pondéré, interleaving quiz/challenge.
- **Runner sandboxé** (`src/lib/runner/`) : `new Function()` exécuté dans un Worker dédié, kill du Worker au-delà de 3 s.

Tous les algorithmes sont des **fonctions pures testées** côté Node.

---

## 📁 Arborescence

```
src/
├── pages/         # Dashboard, Session, Library, Stats, Settings (lazy)
├── components/
│   ├── cards/     # Card, QuizCard, ChallengeCard, FlipCard, SwipeableCard, CodeEditor, TestList
│   ├── library/   # CardEditor, QuizEditor, ChallengeEditor, ImportDialog, CardListItem
│   ├── ui/        # Button, ProgressBar, StreakBadge (animée), XPBar, Modal, Toaster, InstallPrompt
│   └── layout/    # PageWrapper, BottomNav
├── store/         # useSessionStore, useUserStore, useSettingsStore, useToastStore
├── db/            # dexie.js + seed.js
├── lib/
│   ├── sm2.js
│   ├── sessionBuilder.js
│   ├── streak.js
│   ├── stats.js
│   ├── cards.js          # validation + import
│   ├── notifications.js
│   ├── feedback.js       # son + haptic
│   └── runner/           # worker.js + runChallenge.js + runner.core.js
├── data/cards/    # seed JSON (javascript, react, algo)
├── hooks/         # useDbInit, useDailyNotification, useDueCount, useSwipe, usePWAInstall
└── styles/        # index.css (Tailwind + utilitaires 3D)
```

---

## 🛠 Stack

| Domaine          | Lib                                                |
| ---------------- | -------------------------------------------------- |
| Framework        | React 18 + Vite                                    |
| Styling          | Tailwind CSS (mobile-first, dark, safe-area iOS)   |
| PWA              | vite-plugin-pwa (Workbox)                          |
| State            | Zustand                                            |
| DB               | Dexie.js (IndexedDB) + dexie-react-hooks           |
| Routing          | React Router 6 (lazy pages)                        |
| Animations       | Framer Motion                                      |
| Code editor      | CodeMirror 6                                       |
| Code execution   | Web Worker dédié + timeout                         |
| Charts           | Recharts                                           |
| Tests            | `node --test` natif                                |

**Pas de TypeScript** (MVP rapide). **Pas d'eval/Function dans le thread principal**. **Pas de fetch externe**.

---

## 📦 Bundle (build prod)

- Initial JS : **~97 KB gzip** (sous le seuil mobile-first).
- CodeMirror, Framer Motion, Recharts, Library, Stats, Settings, Modal sont **lazy-loadés**.

---

## 🎨 UX / Polish

- Cartes : flip 3D (rotateY 180°) auto après réponse.
- Swipe : indicateurs visuels "OK ✓ / À revoir ✗", boutons fallback accessibles.
- Streak : animation pulse + scale + badge "+1" quand il monte.
- Toasts auto-dismiss + cliquables.
- Vibration (opt-in) au swipe et à la fin d'une carte.
- Sons générés (Web Audio API, opt-in) — léger bip succès / échec.
- Focus rings emerald sur tous les contrôles interactifs.
- Aria-labels sur navigation, boutons icônes, switches.
- Permission Notification demandée **uniquement à l'activation** (best practice).

---

## 🧪 Données

Format d'une carte (cf. `src/data/cards/*.json`) :

```jsonc
{
  "id": "js-001",
  "type": "quiz",                  // "quiz" | "challenge"
  "theme": "javascript",           // "javascript" | "react" | "algo"
  "difficulty": 1,
  "question": "…",
  "choices": ["A", "B"],
  "answer": 0,
  "explanation": "…",
  "easeFactor": 2.5,
  "interval": 0,
  "repetitions": 0,
  "nextReview": null,
  "lastReview": null
}
```

Pour les `challenge`, on a en plus : `prompt`, `starterCode`, `tests: [{ input, expected }]`, `hint`.

L'import JSON dans la Library accepte un tableau ou un objet `{ cards: […] }` ; chaque carte est validée avant insertion.

---

## ✅ Critères MVP atteints

- [x] PWA installable (Chrome desktop + Android), 100 % offline après 1ʳᵉ visite.
- [x] Une session complète (10 cartes) sans bug — quiz + challenges.
- [x] Streak qui s'incrémente correctement d'un jour à l'autre.
- [x] Cartes ratées qui reviennent plus vite (SM-2).
- [x] Bundle initial ~97 KB gzip.
- [x] 63 tests, tous verts.

---

## 📝 Licence

MIT.
