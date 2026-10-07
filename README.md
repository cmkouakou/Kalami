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

## 🛠️ Technologies utilisées
- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- Supabase (Postgres + RLS, Auth, Storage)
- Stripe, Resend, Vercel
- mammoth, JSZip, sanitize-html (conversion DOCX/EPUB en chapitres nettoyés)
- page-flip (effet de page tournée de la liseuse), synthèse vocale du navigateur
- Vitest (tests unitaires et d'intégration)

## 📁 Structure des fichiers
```
kalami/
├── docs/                 → cahiers des charges, architecture, sprints
├── public/               → fichiers statiques (icônes PWA)
├── supabase/
│   ├── config.toml       → configuration de la CLI Supabase
│   ├── migrations/       → schéma SQL + politiques RLS versionnés
│   └── tests/            → tests RLS
├── src/
│   ├── app/              → pages et routes (App Router)
│   ├── i18n/             → textes de l'interface (fr ; en prévu en v2)
│   ├── lib/              → configuration, clients Supabase, logique métier
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
- La liseuse (`/livres/{slug}/lire`) décourage la copie et l'impression et affiche un
  filigrane : ce sont des freins, pas une protection absolue (le texte est affiché).

## 📅 Historique des versions
Voir [CHANGELOG.md](CHANGELOG.md).

## 👤 Auteur
Claude Marcel
