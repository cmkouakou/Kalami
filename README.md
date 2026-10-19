# Kalami

## 📋 Description
Kalami est une plateforme web installable (PWA) de lecture en ligne. Des auteurs y publient des
ouvrages classés par catégorie ; les lecteurs découvrent gratuitement le sommaire et un extrait,
paient par carte bancaire ou Mobile Money, puis lisent dans une liseuse moderne protégée.
Un assistant d'analyse stratégique (Kalami Stratégie) s'y rattachera ensuite.

## 🚀 Fonctionnalités (v1, en cours — voir [docs/SPRINTS.md](docs/SPRINTS.md))
- Catalogue, fiches livres, pages auteurs, recherche
- Extrait gratuit et verrouillage côté serveur
- Paiement par carte (Stripe) et Mobile Money (validation manuelle en v1)
- Liseuse : effet de page tournée, marque-page, surlignage, notes, citation, partage
- PDF filigrané en option, espace auteur, grand livre et versements
- Deux applications installables (PWA) : « Kalami » et « Kalami Stratégie », lecture du
  catalogue déjà visité hors ligne
- **Kalami Stratégie** (`/strategie`) : assistant d'analyse stratégique en 9 étapes, mêmes
  comptes, parcours et crédits propres — voir [docs/SPRINTS-strategie.md](docs/SPRINTS-strategie.md)

## 🛠️ Technologies utilisées
- Next.js 16 (App Router), TypeScript, Tailwind CSS 4 (jetons de la charte Kalami)
- Polices Literata (lecture, titres) et Source Sans 3 (interface) via next/font
- Supabase (Postgres + RLS, Auth, Storage)
- Stripe, Resend, Vercel
- mammoth, JSZip, sanitize-html (conversion DOCX/EPUB en chapitres nettoyés)
- page-flip (effet de page tournée de la liseuse), synthèse vocale du navigateur
- Vitest (tests unitaires et d'intégration)

## 📁 Structure des fichiers
```
kalami/
├── docs/                 → cahiers des charges, architecture, sprints
├── public/brand/         → logos Kalami (normal, inversé, monogramme)
├── supabase/
│   ├── config.toml       → configuration de la CLI Supabase
│   ├── migrations/       → schéma SQL + politiques RLS versionnés
│   └── tests/            → tests RLS
├── src/
│   ├── app/              → pages et routes (App Router) ; globals.css = jetons
│   ├── components/ui/    → styles partagés (boutons, pastilles, cartes) et icônes
│   ├── i18n/             → textes de l'interface (fr ; en prévu en v2)
│   ├── lib/              → configuration, clients Supabase, logique métier
│   │   └── strategy/     → assistant stratégie : étapes, profil, lectures, actions
│   └── proxy.ts          → traitement avant requête (redirections 301, session)
├── tests/unit/           → tests unitaires
├── tests/integration/    → tests RLS sur la base de développement
├── .env.example          → variables d'environnement à définir
├── CHANGELOG.md  PROJECT-TRACKER.md
```

## ⚙️ Installation (développement)
1. Prérequis : Node.js 24 et un projet Supabase de développement.
2. `npm install`
3. Copier `.env.example` en `.env.local` et renseigner les valeurs (Supabase → Project Settings → API Keys).
4. Appliquer les migrations : `npx supabase link --project-ref <ref>` puis `npm run db:push`.
5. `npm run dev` puis ouvrir http://localhost:3000

### Commandes utiles
| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run lint` / `npm run typecheck` | Qualité du code |
| `npm test` | Tests unitaires |
| `npm run build` | Build de production |
| `npm run db:new <nom>` | Nouvelle migration SQL |

## 🚢 Déploiement
- Vercel importe le dépôt GitHub `cmkouakou/Kalami` ; chaque push sur `main` déploie en production.
- Définir dans Vercel les variables de `.env.example` (Preview et Production).
- Domaine principal : `kalami-livres.com` ; domaines secondaires listés dans `REDIRECT_DOMAINS`.

## 📌 Notes importantes
- Aucun secret dans le code : tout passe par les variables d'environnement.
- `SUPABASE_SECRET_KEY` contourne la RLS : uniquement côté serveur (`src/lib/supabase/admin.ts`).
- Next.js 16 : l'ancien `middleware.ts` s'appelle désormais `proxy.ts`.
- Le texte des livres n'est servi que par `/api/livres/{id}/chapitres/{n}` (clé serveur) :
  la table `chapters` est illisible par les clients ; le seau `manuscripts` est privé.
- Charte : couleurs uniquement par jetons (`globals.css`, thèmes Papier, Sépia, Nuit) ;
  contraste AA 4,5:1 vérifié par `tests/unit/contrast.test.ts`.
- La liseuse (`/livres/{slug}/lire`) décourage la copie et l'impression et affiche un
  filigrane : ce sont des freins, pas une protection absolue (le texte est affiché).
- Annotations : ancrées par bloc + décalage de caractères (comme la position de lecture),
  peintes après la pagination ; la sélection est permise (≤ 1000 caractères) mais pas la copie.
- Espace auteur (`/auteur`) : inscription libre après acceptation du contrat en vigueur ;
  chaque livre (et chaque nouvelle version) passe par la validation de l'administration
  (`/admin/soumissions`). Tant qu'aucun contrat n'est publié (`/admin/contrat`),
  l'inscription est fermée. Les droits sont appliqués par la base (RLS + déclencheurs).
- Aperçu (`/apercu/{id}`) : version en attente lisible par l'auteur et l'administration
  seulement, sans enregistrement de position ni d'annotations.
- PDF filigrané : généré à la demande par Chromium (`src/lib/pdf/`), gardé 24 h dans le
  seau privé `pdf-exports` puis supprimé (tâche `/api/cron/pdf`, `CRON_SECRET` requis dans
  Vercel). 3 téléchargements par droit. En local, définir `CHROME_EXECUTABLE_PATH`
  (Chrome installé) dans `.env.local`.
- Textes légaux : publiés et versionnés depuis `/admin/textes-legaux` (table
  `legal_documents`) ; les textes livrés sont provisoires, à faire relire avant la mise
  en production. Bandeau des témoins : choix consigné dans `consent_records`.
- Suppression de compte : exécutée 30 jours après la demande par `/api/cron/comptes`
  (même `CRON_SECRET`). Elle emporte les études dont l'utilisateur est propriétaire,
  même partagées (avertissement affiché avant la confirmation).
- Paiement par carte (v0.10.0) : `/api/paiement/checkout` crée la commande au prix de la
  base (`create_book_order`) puis une session Stripe Checkout ; seul le webhook signé
  `/api/stripe/webhook` livre l'achat (`stripe_process_event` : montant contrôlé, événement
  traité une fois). Le compte Stripe est partagé : seules les sessions `metadata.app=kalami`
  sont traitées. Variables `STRIPE_*` : voir `.env.example`. Historique : `/compte/achats`.
- Paiements Stratégie (v0.10.2) : même route avec `item: study_offer | coach_pack`
  (`create_strategy_order` : prix de `strategy_offers` ou du forfait, remise enseignant).
  Remboursement depuis `/admin/commandes` seulement : API Stripe (clé d'idempotence), puis
  `admin_refund_order` retire les droits. Un remboursement fait dans Stripe ne les retire pas.
- Codes promo (v0.10.3) : créés dans `/admin/codes-promo`, vérifiés par la base
  (`promo_check` dans les fonctions de commande, aperçu `/api/paiement/promo`). Une fois par
  compte, compté au paiement. Le même écran porte l'interrupteur Stripe Tax (éteint par
  défaut ; prix taxes comprises une fois allumé).
- Mobile Money (v0.11.0) : FCFA seulement, manuel. L'acheteur paie hors de l'app puis
  déclare sa transaction sur `/compte/achats/[commande]` ; l'admin valide ou refuse dans
  `/admin/commandes` (filtre « À valider »). Numéros marchands : `/admin/mobile-money`.
  Les commandes non déclarées expirent après 24 h (`/api/cron/commandes`, `CRON_SECRET`).
- Grand livre (v0.12.0) : la base écrit une ligne par article payé ou remboursé
  (`ledger_entries`, brut = frais + taxes + commission + part auteur). Part de l'auteur 70 %
  du net, disponible après 30 jours ; réglages et part propre par auteur dans
  `/admin/revenus`, revenus de l'auteur dans `/auteur/revenus`. Frais Mobile Money par
  opérateur dans `/admin/mobile-money`.
- Service worker (`public/sw.js`) actif en production seulement. Liste blanche dans
  `public/sw-routes.js` : seuls les fichiers statiques, les couvertures et les pages publiques
  du catalogue sont gardés sur l'appareil ; liseuse, études, comptes et API jamais. Changer
  `VERSION` dans `sw.js` vide les anciens caches. Icônes : `node scripts/generer-icones.mjs`.

## 📅 Historique des versions
Voir [CHANGELOG.md](CHANGELOG.md).

## 👤 Auteur
Claude Marcel
