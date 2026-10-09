# Journal des modifications

## [v0.6.0] - 2026-10-10 — Sprint 7 : annotations
### Ajouté
- Migration `annotations` : table `highlights` (surlignage en 5 couleurs, note facultative
  ≤ 2000 caractères, passage cité ≤ 1000 caractères), ancrée par chapitre + bloc + décalage
  de caractères ; 2000 annotations au plus par livre ; RLS réservée au propriétaire.
- Liseuse : sélection d'un passage → menu (5 couleurs, note, citer, partager, supprimer) ;
  visiteurs invités à se connecter pour annoter.
- Surlignages peints après la pagination : ils restent en place quand la police, la taille
  ou l'écran changent (mode page tournée et mode défilement).
- Panneau « Annotations » : regroupement par chapitre, recherche (sans accents), filtre par
  couleur, accès direct au passage, suppression.
- « Citer » : références APA, MLA et Chicago, copiables.
- « Partager » : carte image 1080 × 1080 d'un extrait (≤ 280 caractères) avec couverture,
  titre, auteur et lien ; partage du lien du livre (partage natif ou copie).
- Tests unitaires (annotations, repagination, citations) et test d'intégration RLS.

### Modifié
- Protection : la sélection est permise dans le texte (≤ 1000 caractères), la copie reste
  bloquée sauf pour les références à citer.
- Mode page tournée : le clic ne tourne plus la page (`disableFlipByClick`), pour permettre
  la sélection.


## [v0.5.1] - 2026-10-09 — Sprint 4b : design
### Ajouté
- Charte Kalami : jetons de couleur des thèmes Papier, Sépia et Nuit dans `globals.css`
  (thème sombre du système compris), échelle typographique, rayons, ombres, mesure de lecture.
- Polices Literata (lecture, titres) et Source Sans 3 (interface) via next/font.
- Logos (`public/brand/`), icône du site (`src/app/icon.svg`), composant `Logo` qui bascule
  sur la version inversée en thème sombre.
- `components/ui/styles.ts` (boutons primaire, secondaire, tertiaire et d'icône, pastilles,
  badges, cartes, panneaux sable, champs) et `components/ui/icons.tsx` (icônes au trait).
- Test de contraste WCAG AA (4,5:1) des paires texte / fond dans les trois thèmes.

### Modifié
- En-tête (logo, catalogue, recherche, devise, compte) et pied de page sombre.
- Accueil : présentation avec vitrine de couvertures, catégories, sélection, nouveautés,
  avantages.
- Fiche livre : fil d'Ariane, carte de prix, tuiles d'informations, sommaire avec chapitres
  gratuits ou inclus à l'achat, carte de l'auteur.
- Pages catégorie (pastilles), recherche et auteur alignées sur la charte.
- Liseuse : thèmes branchés sur les jetons, barre d'outils à icônes, barre de progression
  encre, ombre de livre, réglages et panneaux harmonisés, animations réduites respectées.
- Fin d'extrait : feuille « Vous avez terminé l'extrait gratuit » avec le prix et un retour
  à la fiche du livre (aucun paiement avant les sprints dédiés).
- Authentification, compte et administration : couleurs d'état, messages et boutons sur
  les jetons (plus aucune couleur Tailwind en dur, hormis le fond blanc du QR code MFA).

### Supprimé
- `src/app/favicon.ico`, remplacé par `icon.svg`.

## [v0.5.0] - 2026-10-09 — Sprint 4 : liseuse
### Ajouté
- Migration `reader` : position de lecture (`reading_positions`) et signets nommés
  (`bookmarks`, 200 au plus par livre), RLS réservée au propriétaire.
- Liseuse plein écran `/livres/{slug}/lire` : mode page tournée (page-flip, par défaut sur
  ordinateur et tablette) et mode défilement (par défaut sur téléphone), commutables.
- Pagination mesurée (coupure aux limites de mots, intertitres jamais seuls en bas de page).
- Réglages enregistrés sur l'appareil : mode, thème (clair, sépia, sombre), police, taille,
  interligne.
- Marque-page automatique : synchronisé au serveur pour un lecteur connecté
  (`PUT /api/livres/{id}/position`, protection CSRF), sur l'appareil pour un visiteur.
- Signets nommés, sommaire cliquable, barre de progression, navigation au clavier,
  lecture à voix haute (synthèse vocale du navigateur).
- Recherche `GET /api/livres/{id}/recherche` limitée aux parties autorisées (extrait coupé
  compris), insensible aux accents.
- Écran de fin d'extrait : prix et bouton « Acheter » (inactif jusqu'au sprint 5).
- Freins à la copie et à l'impression ; filigrane (courriel du lecteur connecté et
  identifiant court de son droit de lecture).
- Fiche livre : bouton « Lire l'extrait » / « Lire » / « Reprendre (x %) », liens du sommaire.
- Tests : pagination, position, recherche, routes position et recherche ; intégration RLS
  de la liseuse (ignorée tant que la migration n'est pas appliquée).

### Modifié
- Réponses JSON partagées dans `lib/content/responses.ts`.

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
