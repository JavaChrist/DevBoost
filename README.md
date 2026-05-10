# DevBoost

Une **PWA d'entraînement pour développeurs** : sessions courtes de 2 à 5 minutes mêlant **Quiz** (QCM) et **Challenges** (mini-katas de code exécutés en live), gamification (XP, streak quotidien) et **répétition espacée SM-2**.

Local-first : la base de connaissances et toute la progression vivent dans IndexedDB et fonctionnent **offline complet**. L'authentification utilise Supabase pour identifier l'utilisateur (compte requis au lancement).

---

## 🚀 Démarrer

```bash
npm install
cp .env.example .env       # puis colle tes clés Supabase
npm run dev                # http://localhost:5173
```

### `.env` requis

```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

À récupérer dans **Supabase Dashboard → Project Settings → API → anon public** (pas la `service_role`). En dev, pense à désactiver "Confirm email" dans **Authentication → Sign In / Up** pour tester rapidement.

> Au premier lancement, tu seras redirigé vers `/login`. Crée un compte (prénom + email + MDP), puis la base IndexedDB est seedée automatiquement avec **96 cartes** + **24 cours**.

### Build & PWA

```bash
npm run build              # bundle prod + service worker + manifest
npm run preview            # serve le build (utile pour tester l'install PWA)
npm run gen:icons          # régénère logo16…512.png + apple-touch-icon depuis public/logo.svg
```

### Tests

```bash
npm test                   # exécute toute la suite (node --test)
```

> **71 tests** : SM-2, sessionBuilder, streak, runner sandboxé (Web Worker), validation cartes, stats, notifications.

---

## ✨ Fonctionnalités

### Auth & Profil
- **Login obligatoire** au lancement — Supabase Auth (email + MDP + prénom).
- **Onglets Connexion / Inscription** unifiés, animation fluide entre les deux modes.
- **"Voir le mot de passe"** via icône œil Lucide.
- Session **persistée** entre les ouvertures, refresh automatique du token.
- Section **Compte** dans Réglages : avatar (initiale), email, prénom, **se déconnecter**.
- Le Dashboard salue l'utilisateur par son **prénom** (« Salut Léa »).

### Apprentissage
- **Dashboard** : streak (icône Flame animée), barre XP, bouton "Démarrer la session", badge "X cartes à réviser".
- **Session** : 7 quiz + 3 challenges, swipe Tinder-like, flip 3D pour l'explication, animations Framer Motion.
- **Quiz** : QCM, feedback immédiat, explication au dos, badges Check/X Lucide.
- **Challenge** : énoncé + éditeur **CodeMirror 6** + tests qui s'exécutent dans un **Web Worker isolé** (timeout 3 s, pas d'accès au DOM/réseau).
- **Cours** (`/courses`) : 24 cours rich avec sections, snippets de code (highlighting maison), pièges classiques, "à retenir" et **mini-quiz de 5 questions** par cours. Progression persistée par utilisateur.

### Bibliothèque & Stats
- **Library** : liste avec recherche / filtres (thème, type), édition (formulaire structuré ou JSON brut), import JSON en masse, suppression sécurisée.
- **Stats** : KPI (streak, XP, sessions, cartes, taux de réussite), sparkline 30 jours (Recharts), donut par thème.
- **Settings** : thèmes actifs · durée de session (slider 2–10 min) · effets (son Web Audio + vibration) · notification quotidienne · reset complet (double confirmation).

### Polish
- **Toasts** : feedback discret (`+10 XP`, `Streak 5 🔥`, `Carte sauvegardée`).
- **PWA** : installable (Chrome desktop + Android), offline complet, manifest, icônes maskables, set complet 16→512px.
- **Iconographie cohérente** : icônes **Lucide** partout dans l'UI (BottomNav, badges, actions).

---

## 📚 Contenu pédagogique

**6 thèmes**, **24 cours rich** (4 par thème), **96 cartes** (~12 quiz + 4 challenges par thème) :

| Thème | Cours | Couverture |
|---|---|---|
| **HTML** | Bases · Sémantique · Forms · A11y | structure, balises sémantiques, formulaires, ARIA |
| **CSS** | Sélecteurs/box-model · Flexbox · Grid · Responsive/animations | fondations, layouts modernes, mobile-first |
| **JavaScript** | Bases · Tableaux fonctionnels · Async · Objets/modules | langage moderne ES2020+ |
| **React** | Composants/JSX · useState · useEffect · Hooks avancés/perf | core + perf + custom hooks |
| **Algo** | Big O · Recherche · Tri · Récursion/mémoïsation | complexité + structures |
| **IA & Agents** | LLMs · Prompt engineering · Agents · Coder avec une IA | tokens, prompts, RAG, copilots |

Chaque cours = 8–10 sections avec exemples de code, pièges classiques, "à retenir", et 5 questions de quiz à la fin. Tous les **64 challenges** ont été validés via solutions de référence pour garantir qu'aucun test n'est impossible.

---

## 🧠 Algorithmes

- **SM-2 SuperMemo** (`src/lib/sm2.js`) : ajustement de l'`easeFactor`, calcul de l'intervalle, mise à jour de `nextReview`.
- **Session builder** (`src/lib/sessionBuilder.js`) : priorité aux cartes "due", remplissage pondéré, interleaving quiz/challenge.
- **Runner sandboxé** (`src/lib/runner/`) : `new Function()` exécuté dans un Worker dédié, kill du Worker au-delà de 3 s.
- **Sync seed/cours** (`src/db/seed.js`, `src/lib/courses.js`) : ré-injecte le contenu JSON sans toucher au progrès SM-2 ni à la complétion des cours.

Tous les algorithmes sont des **fonctions pures testées** côté Node.

---

## 📁 Arborescence

```
src/
├── pages/         # Login, Dashboard, Session, Library, Stats, Settings, Courses, Course (lazy)
├── components/
│   ├── auth/      # RequireAuth (route guard)
│   ├── cards/     # Card, QuizCard, ChallengeCard, FlipCard, SwipeableCard, CodeEditor, TestList
│   ├── courses/   # CodeBlock (syntax highlighter maison)
│   ├── library/   # CardEditor, QuizEditor, ChallengeEditor, ImportDialog, CardListItem
│   ├── ui/        # Button, ProgressBar, StreakBadge (animée), XPBar, Modal, Toaster, InstallPrompt, Skeleton
│   └── layout/    # PageWrapper, BottomNav (icônes Lucide)
├── store/         # useAuthStore, useSessionStore, useUserStore, useSettingsStore, useToastStore
├── db/            # dexie.js (v2 : courses + courseProgress) + seed.js
├── lib/
│   ├── supabase.js       # client Supabase (stub si non configuré)
│   ├── sm2.js
│   ├── sessionBuilder.js
│   ├── streak.js
│   ├── stats.js
│   ├── cards.js          # validation + import
│   ├── courses.js        # sync + progress
│   ├── notifications.js
│   ├── feedback.js       # son + haptic
│   └── runner/           # worker.js + runChallenge.js + runner.core.js
├── data/
│   ├── cards/     # seed JSON (html, css, javascript, react, algo, ia)
│   └── courses/   # 24 cours rich (html, css, javascript, react, algo, ia)
├── hooks/         # useDbInit, useDailyNotification, useDueCount, useSwipe, usePWAInstall
└── styles/        # index.css (Tailwind + utilitaires 3D + tokens highlight)
```

---

## 🛠 Stack

| Domaine          | Lib                                                |
| ---------------- | -------------------------------------------------- |
| Framework        | React 18 + Vite                                    |
| Styling          | Tailwind CSS (mobile-first, dark, safe-area iOS)   |
| Icônes           | **lucide-react** (tree-shake)                      |
| PWA              | vite-plugin-pwa (Workbox)                          |
| State            | Zustand                                            |
| Auth             | **@supabase/supabase-js** (Supabase Auth)          |
| DB locale        | Dexie.js (IndexedDB) + dexie-react-hooks           |
| Routing          | React Router 6 (lazy pages, route guard)           |
| Animations       | Framer Motion                                      |
| Code editor      | CodeMirror 6                                       |
| Code execution   | Web Worker dédié + timeout                         |
| Charts           | Recharts                                           |
| Tests            | `node --test` natif                                |

**Pas de TypeScript** (MVP rapide). **Pas d'eval/Function dans le thread principal**. **Pas de fetch externe** pour le contenu (uniquement pour Supabase Auth).

---

## 📦 Bundle (build prod)

- Initial JS : **~264 KB gzip** (inclut React, Supabase client, Lucide, Zustand, Dexie, Tailwind).
- CodeMirror, Framer Motion, Recharts, Library, Stats, Settings, Courses, Course, Modal sont **lazy-loadés**.
- 49 entrées précachées par le SW (~3 MB total avec icônes).

---

## 🎨 UX / Polish

- Cartes : flip 3D (rotateY 180°) auto après réponse.
- Swipe : indicateurs Lucide "Check / X", boutons fallback accessibles.
- Streak : icône Flame qui pulse + scale + badge "+1" quand il monte.
- Toasts auto-dismiss + cliquables.
- Vibration (opt-in) au swipe et à la fin d'une carte.
- Sons générés (Web Audio API, opt-in) — léger bip succès / échec.
- Focus rings emerald sur tous les contrôles interactifs.
- Aria-labels sur navigation, boutons icônes, switches.
- Permission Notification demandée **uniquement à l'activation** (best practice).
- Login : toggle "voir le mot de passe" via icône œil, animations entre tabs Connexion/Inscription, messages d'erreur en français.

---

## 🧪 Données

### Format d'une carte (cf. `src/data/cards/*.json`) :

```jsonc
{
  "id": "js-001",
  "type": "quiz",                  // "quiz" | "challenge"
  "theme": "javascript",           // html | css | javascript | react | algo | ia
  "difficulty": 1,                 // 1 | 2 | 3
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

Pour les `challenge`, on a en plus : `prompt`, `starterCode`, `tests: [{ label, input, expected }]`, `hint`.

### Format d'un cours (cf. `src/data/courses/*.json`) :

```jsonc
{
  "slug": "css-flex",
  "theme": "css",
  "title": "Flexbox : la mise en page 1D",
  "summary": "…",
  "level": 2,
  "sections": [
    { "heading": "…", "body": "…", "code": { "lang": "css", "value": "…" } }
  ],
  "quiz": [
    { "question": "…", "choices": ["…"], "answer": 1, "explanation": "…" }
  ]
}
```

L'import JSON dans la Library accepte un tableau ou un objet `{ cards: […] }` ; chaque carte est validée avant insertion. Le sync seed/cours préserve la progression SM-2 et la complétion des cours à chaque release.

---

## ✅ Critères MVP atteints

- [x] PWA installable (Chrome desktop + Android), 100 % offline après 1ʳᵉ visite (sauf login initial).
- [x] Une session complète (10 cartes) sans bug — quiz + challenges.
- [x] Streak qui s'incrémente correctement d'un jour à l'autre.
- [x] Cartes ratées qui reviennent plus vite (SM-2).
- [x] Authentification fonctionnelle (signup + signin + signout) avec session persistée.
- [x] 24 cours pédagogiques rich avec mini-quiz d'évaluation.
- [x] 71 tests, tous verts.

---

## 📝 Licence

MIT.
