# Journal des modifications

## [v0.4.0] - 2026-10-08 — Sprint 3 : contenu protégé
### Ajouté
- Migration `content` : versions converties (`book_versions`), chapitres en blocs HTML
  (`chapters`, illisibles par les clients), droits de lecture (`entitlements`), journal
  d'accès (`content_access_log`), règles de l'extrait sur `books`, seau privé `manuscripts`.
- Fonctions SQL : sommaire public `get_book_toc`, enregistrement atomique d'une conversion,
  octroi / retrait / liste des droits par l'administrateur, limitation de débit
  `register_content_access` (30 chapitres/min, audit des dépassements et des rafales).
- Conversion des manuscrits : DOCX (mammoth, un chapitre par « Titre 1 ») et EPUB (spine +
  table des matières), nettoyage par liste blanche, limites de taille (archive, chapitres).
- API `GET /api/livres/{id}/chapitres/{n}` : 403 hors extrait sans droit, 404, 429, jamais
  mise en cache.
- Administration : dépôt du manuscrit, sommaire converti, règles de l'extrait (nombre de
  chapitres, coupure facultative), droits de lecture manuels.
- Fiche livre : sommaire public avec badge « Extrait gratuit » et nombre de mots.
- Tests : règles d'accès, conversion DOCX/EPUB, validation, route (chapitre 2 → 403) ;
  intégration RLS du contenu (ignorée tant que la migration n'est pas appliquée).

### Modifié
- `audit()` partagé dans `lib/admin/audit.ts` ; `DeleteButton` accepte des libellés.

## [v0.3.0] - 2026-10-07 — Sprint 2 : catalogue
### Ajouté
- Migration `catalog` : catégories (celles du cahier), auteurs, livres, prix par devise
  (XOF, EUR, CAD), recherche plein texte, compartiment d'images `covers`, RLS.
- Migration `covers_admin_select` : l'administrateur peut supprimer les images remplacées.
- Accueil : livres en vedette, nouveautés, catégories ; fiches livre, auteur et catégorie ;
  page de recherche. Données publiques mises en cache (`'use cache'`, étiquette catalogue).
- Choix de la devise (cookie, puis préférence du profil) et affichage des prix.
- Administration du catalogue (`/admin`) : tableau de bord, catégories, auteurs (photo),
  livres (prix, statut, vedette, couverture), suppression confirmée, journal d'audit.
- Composants de formulaire : zone de texte, liste déroulante, texte d'aide.
- Tests : validation des formulaires d'administration, devises, slugs ; intégration RLS
  du catalogue.

### Modifié
- CI : variables publiques Supabase pour le build (variables GitHub).

## [v0.2.0] - 2026-10-06 — Sprint 1 : comptes et rôles
### Ajouté
- Migration `profiles_roles` : profils (créés à l'inscription), rôle administrateur,
  `is_admin()` exigeant la MFA (aal2), journal d'audit, RLS et privilèges de colonnes.
- Connexion par mot de passe, lien magique et Google ; inscription ; mot de passe oublié
  et réinitialisation ; retour `/auth/callback` (PKCE et token_hash).
- Rafraîchissement de la session dans `proxy.ts` et protection de `/compte` et `/admin`.
- Couche d'accès `lib/auth/dal.ts` (`getCurrentUser`, `requireUser`, `requireAdmin`).
- Page « Mon compte » (nom affiché, devise préférée, déconnexion).
- Vérification en deux étapes TOTP de l'administrateur (`/admin/mfa`) et accueil `/admin`.
- Lien de compte dans l'en-tête (session lue en flux, Suspense).
- Tests : chemins protégés et redirections sûres ; tests d'intégration RLS (base de dev).

## [v0.1.0] - 2026-10-06 — Sprint 0 : fondations
### Ajouté
- Projet Next.js 16 (App Router, TypeScript, Tailwind CSS 4), interface en français.
- Configuration centrale `APP_NAME` / `APP_URL` et redirection 301 des domaines secondaires (`proxy.ts`).
- Clients Supabase navigateur, serveur et administrateur ; dossier `supabase/` (CLI, migrations).
- Dictionnaire de langue (fr) prêt pour l'anglais.
- Page d'accueil provisoire, gabarit racine, thème clair/sombre.
- Tests unitaires (Vitest) et intégration continue GitHub Actions (lint, types, tests, build).
- Documentation : README, `.env.example`, architecture, découpage en sprints.
