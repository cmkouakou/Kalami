# Guide de l'administrateur — Kalami

> Pour qui : toute personne qui reprend l'exploitation ou la maintenance de Kalami (librairie
> `kalami-livres.com` et Kalami Stratégie `/strategie`). À lire avec le [README](../README.md)
> (fonctionnement) et [ARCHITECTURE.md](ARCHITECTURE.md) (décisions techniques).
> Version 1.0 — 2026-10-29.

---

## 1. Les services et ce qu'ils font

| Service | Rôle | Où le gérer |
|---|---|---|
| **GitHub** `cmkouakou/Kalami` | Code source ; la CI (lint, types, tests, build) tourne à chaque push | github.com → Actions |
| **Vercel** | Hébergement ; chaque push sur `main` déploie en production | vercel.com → projet Kalami |
| **Supabase** (projet « Kalami », us-east-1) | Base Postgres + RLS, comptes (Auth), fichiers (Storage), temps réel | supabase.com → Kalami |
| **Stripe** | Paiement par carte (compte partagé : seules les sessions `metadata.app=kalami` sont traitées) | dashboard.stripe.com |
| **Resend** | Courriels (invitations, mentions) | resend.com |
| **Anthropic** | Coach IA de Stratégie et atelier auteur | console.anthropic.com |
| **Porkbun** | DNS du domaine et transfert des adresses @kalami-livres.com | porkbun.com |
| **Google** | Connexion Google (OAuth), Search Console, Analytics (après consentement) | console.cloud.google.com |

Règle d'or : **aucun secret dans le code**. Toutes les clés vivent dans Vercel (production)
et dans `.env.local` (poste de développement, jamais committé).

## 2. Variables d'environnement

La liste complète et commentée est dans [`.env.example`](../.env.example). Un test
(`tests/unit/env-example.test.ts`) échoue si le code lit une variable qui n'y figure pas.

Dans Vercel → Settings → Environment Variables :
- `NEXT_PUBLIC_*` : valeurs publiques (type « Plain »/« Config »).
- `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`,
  `ANTHROPIC_API_KEY`, `CRON_SECRET` : type **« Secret »**, jamais affichés ni copiés ailleurs.
- Après toute modification d'une variable : **redéployer** (Deployments → ⋯ → Redeploy).

Dans GitHub → Settings → Secrets and variables → Actions → **Variables** :
`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (le build de la CI en a besoin).

## 3. Poste de développement

1. Node.js 24, Git, Chrome.
2. `npm install`, puis copier `.env.example` en `.env.local` et le remplir.
3. `npm run dev` → http://localhost:3000

Avant **chaque** commit, les quatre vérifications de la CI doivent passer :

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Les tests d'intégration (RLS) tournent sur la base de développement :
`npx vitest run --project integration`. Lancés plusieurs fois de suite, ils peuvent
atteindre la limite de connexions de Supabase Auth (faux échecs `42501`) : attendre
quelques minutes avant de relancer.

## 4. Déployer

1. Créer une branche ou travailler sur `main`, committer.
2. `git push` → la CI GitHub vérifie, Vercel déploie automatiquement.
3. Contrôler le déploiement dans Vercel (statut « Ready »), puis ouvrir le site.
4. En cas de problème : Vercel → Deployments → choisir le déploiement précédent →
   **Promote to Production** (retour arrière immédiat, sans toucher au code).

⚠ Une migration de base doit être appliquée **avant** de pousser le code qui en dépend
(voir §5), sinon les pages concernées tombent en erreur.

## 5. Migrations de la base (procédure sûre)

Les fichiers sont dans `supabase/migrations/` (un fichier par changement, horodaté,
jamais modifié une fois appliqué).

**Créer** : `npm run db:new nom_de_la_migration`, écrire le SQL (tables en anglais,
commentaires en français, RLS activée sur toute nouvelle table).

**Appliquer** — méthode A, recommandée (éditeur SQL) :
1. Supabase → SQL Editor → coller le contenu du fichier → Run.
2. Inscrire la migration dans l'historique, depuis le poste (remplacer la version et l'URL) :
   ```bash
   npx supabase migration repair --status applied 20261120120000 --db-url "<URL du pooler>"
   ```
   L'URL du pooler (session, port 5432) se trouve dans Supabase → Connect ; le mot de passe
   est `SUPABASE_DB_PASSWORD`, **encodé pour une URL** s'il contient des caractères spéciaux.
   Ne jamais committer cette URL.

**Appliquer** — méthode B (CLI) : `npx supabase db push --db-url "<URL du pooler>"`.
Ne l'utiliser que si l'historique est à jour (sinon la CLI rejoue d'anciennes migrations).

**Vérifier** : relancer les tests d'intégration du domaine touché
(ex. `npx vitest run tests/integration/orders-rls.test.ts`).

## 6. Tâches planifiées (crons)

Déclarées dans `vercel.json`, appelées par Vercel avec `CRON_SECRET` (heures UTC = Abidjan).

| Heure | Route | Rôle |
|---|---|---|
| 04:30 | `/api/cron/pdf` | Supprime les PDF filigranés de plus de 24 h |
| 04:45 | `/api/cron/comptes` | Exécute les suppressions de compte demandées il y a 30 jours |
| 05:00 | `/api/cron/commandes` | Expire les commandes Mobile Money non déclarées (24 h) |
| 05:15 | `/api/cron/statistiques` | Résume les statistiques de plus de 12 mois, efface le détail |

Suivi : Vercel → projet → Settings → Cron Jobs (dernière exécution, journaux).

## 7. Administration courante (`/admin`)

L'accès exige un compte administrateur **et** la double authentification (application
TOTP, page `/admin/mfa` à la première connexion). Les administrateurs sont fixés par la
migration `20261118120000_admins.sql` ; pour en changer, écrire une nouvelle migration
(même modèle), jamais modifier l'ancienne.

| Tâche | Où |
|---|---|
| Valider ou refuser un paiement Mobile Money (rapprocher du relevé de l'opérateur) | `/admin/commandes`, filtre « À valider » |
| Rembourser (Stripe) — jamais depuis Stripe directement, sinon les droits restent | `/admin/commandes` |
| Numéros marchands et frais Mobile Money | `/admin/mobile-money` |
| Valider un livre ou une nouvelle version d'auteur | `/admin/soumissions` |
| Livres, catégories, auteurs | `/admin/livres`, `/admin/categories`, `/admin/auteurs` |
| Contrat d'auteur (sans contrat publié, l'inscription auteur est fermée) | `/admin/contrat` |
| Textes légaux (confidentialité, conditions) | `/admin/textes-legaux` |
| Codes promo, Stripe Tax | `/admin/codes-promo` |
| Revenus, part des auteurs, versements | `/admin/revenus`, `/admin/versements` |
| Crédits d'étude, coach IA (modèle, consignes, règles), guide des étapes | `/admin/strategie` |
| Statistiques de lecture et de visite | `/admin/audience` |
| Journal d'audit (qui a fait quoi) | `/admin/journal` |

## 8. Dépannage

| Symptôme | Piste |
|---|---|
| Page « Un incident est survenu » avec une **référence** | Vercel → Logs, rechercher la référence (digest) : l'erreur complète y est |
| Tout le site en erreur après un déploiement | Promote to Production sur le déploiement précédent (§4), puis chercher la cause |
| Erreur après une migration | La migration n'est pas appliquée, ou le code est arrivé avant elle (§5) |
| Paiement carte réussi mais pas de droit de lecture | Stripe → Webhooks → destination « kalami-paiements » : événements en échec ? `STRIPE_WEBHOOK_SECRET` à jour ? |
| Le coach répond « non configuré » | `ANTHROPIC_API_KEY` absente dans Vercel, ou crédit épuisé chez Anthropic |
| Aucun courriel d'invitation | `RESEND_API_KEY` absente ou domaine non vérifié chez Resend (le lien reste à copier) |
| Connexion Google refusée | Supabase → Authentication → URL Configuration (Site URL et redirections) |
| Ancienne version affichée sur mobile | Service worker : changer `VERSION` dans `public/sw.js` et redéployer |
| Dates ou heures décalées | Tout l'affichage passe par `src/lib/format/date.ts` (fuseau d'Abidjan) |

## 9. Se repérer dans le code

| Dossier | Contenu |
|---|---|
| `src/app/(site)/` | Librairie, compte, espace auteur, administration |
| `src/app/strategie/` | Kalami Stratégie (en-tête et connexion propres) |
| `src/app/api/` | Routes serveur : chapitres, PDF, paiements, webhooks, crons |
| `src/lib/` | Logique métier, une famille par dossier (`catalog`, `payments`, `strategy`…) |
| `src/components/` | Composants d'interface, rangés comme `lib` ; styles communs dans `components/ui/styles.ts` |
| `src/i18n/` | **Tous** les textes affichés (aucun texte en dur dans les composants) |
| `src/lib/format/date.ts` | Formats de date (un seul fuseau pour serveur et navigateur) |
| `supabase/migrations/` | Schéma, RLS et fonctions SQL |
| `tests/unit/`, `tests/integration/` | Tests (Vitest) |

Conventions : code et tables en anglais ; interface, commentaires et documentation en
français ; en-tête de description en haut de chaque fichier ; version de l'application dans
`package.json` et `CHANGELOG.md` (format « vX.Y.Z »).
