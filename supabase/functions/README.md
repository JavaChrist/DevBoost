# Edge Functions — DevBoost

Trois Edge Functions Supabase (Deno) pour gérer l'abonnement Premium via Mollie.

| Fonction | Rôle |
| --- | --- |
| `create-subscription` | Crée un customer Mollie + first payment, retourne l'URL de checkout |
| `mollie-webhook` | Reçoit les événements Mollie (paiements, renouvellements), met à jour `subscriptions` |
| `cancel-subscription` | Annule l'abonnement Mollie de l'utilisateur courant |

## 1. Créer un compte Mollie

1. Va sur [mollie.com](https://www.mollie.com) → crée ton compte (mode test gratuit)
2. **Dashboard → Developers → API keys** : récupère ta `Test API key` (commence par `test_`)
3. (Plus tard, pour passer en prod : configure tes infos bancaires + ajoute SEPA/cartes en méthodes de paiement, puis utilise la `Live API key`)

## 2. Configurer les variables d'environnement Supabase

**Supabase Dashboard → Project Settings → Edge Functions → Add new secret**

| Variable | Valeur |
| --- | --- |
| `MOLLIE_API_KEY` | `test_xxx` (ou `live_xxx`) |
| `SUPABASE_URL` | déjà disponible (auto-injectée) |
| `SUPABASE_ANON_KEY` | déjà disponible |
| `SUPABASE_SERVICE_ROLE_KEY` | déjà disponible |

> Les 3 dernières sont injectées automatiquement par Supabase, pas besoin de les ajouter.

## 3. Déployer les fonctions

Avec la [Supabase CLI](https://supabase.com/docs/guides/cli) installée :

```bash
# Une seule fois : link au projet
supabase link --project-ref <ton-project-ref>

# À chaque modif des fonctions :
supabase functions deploy create-subscription
supabase functions deploy mollie-webhook --no-verify-jwt
supabase functions deploy cancel-subscription
```

> ⚠️ `--no-verify-jwt` est **obligatoire** pour le webhook : Mollie n'envoie pas de JWT.

Pour déployer les 3 d'un coup :

```bash
supabase functions deploy create-subscription cancel-subscription
supabase functions deploy mollie-webhook --no-verify-jwt
```

## 4. Tester en local (optionnel)

```bash
supabase functions serve create-subscription --env-file .env.local
```

Avec un `.env.local` contenant :

```
MOLLIE_API_KEY=test_xxx
```

## 5. Tester un paiement (mode test)

1. Connecte-toi sur DevBoost
2. **Réglages → Abonnement → S’abonner — 4,99 €/mois**
3. Tu es redirigé sur la page de paiement Mollie
4. Choisis **"iDEAL"** ou **"Cartes bancaires"** :
   - **iDEAL** : sélectionne n'importe quelle banque, puis clique "Paid" (mode test)
   - **Carte de test** : numéro `4543 4744 4977 1133`, CVC `123`, date d'expi future
5. Tu es redirigé sur `/payment-success`
6. Le webhook Mollie est appelé en parallèle → ton abonnement passe en `active` dans la DB

## 6. Configurer le webhook côté Mollie (optionnel)

Le webhook URL est passé dynamiquement à chaque payment via `webhookUrl`. Tu n'as **rien à configurer** dans le dashboard Mollie.

L'URL pour info :

```
https://<project-ref>.supabase.co/functions/v1/mollie-webhook
```

## 7. Voir les logs

**Supabase Dashboard → Edge Functions → [nom] → Logs**

Tu verras chaque invocation, ses erreurs éventuelles, le statut HTTP de retour.

## 8. Cycle de vie d'un abonnement

```
[free / pas connecté]
    │ clic "Démarrer mon mois gratuit"
    ▼
[trialing] (30 jours)
    │ trial_ends_at dépassé → l'helper is_premium() retourne false
    ▼
[expired]
    │ clic "S'abonner"
    │ create-subscription Edge Function → Mollie checkout
    │ user paie
    │ webhook (sequenceType=first, status=paid)
    ▼
[active] (current_period_ends_at = +1 mois)
    │ Mollie crée la Subscription côté Mollie
    │ chaque mois : webhook (sequenceType=recurring, status=paid)
    │ → on étend current_period_ends_at de +1 mois
    │
    │ clic "Résilier"
    │ cancel-subscription Edge Function → Mollie cancel
    ▼
[cancelled] (accès maintenu jusqu'à current_period_ends_at)
    │ période expirée + pas de renouvellement
    ▼
[expired]
```

## 9. Cartes de test Mollie

| Méthode | Identifiant |
| --- | --- |
| **VISA paid** | 4543 4744 4977 1133 |
| **VISA failed** | 4242 4242 4242 4242 (CVC 999) |
| **iDEAL** | choisis "Test Bank" puis "Paid" |
| **SEPA Direct Debit** | IBAN `NL13TEST0123456789` |

Plus de détails : [Mollie test cards](https://docs.mollie.com/overview/testing).
