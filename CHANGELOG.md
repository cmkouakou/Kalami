# Journal des modifications

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
