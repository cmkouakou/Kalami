# Journal des modifications

## [Stratégie v0.6.1] - 2026-10-14 — Pièces jointes du profil, résumé et préremplissage
### Ajouté
- Migration `20261020120000_strategy_attachments.sql` : seau privé `study-attachments`
  (10 Mo par fichier, dossier `etudes/<étude>/`, dépôt par les éditeurs, lecture par les
  membres), table `study_attachments` (aucune écriture directe), fonctions
  `strategy_add_attachment` (chemin vérifié, fichier présent, taille relevée par le stockage,
  10 pièces au plus) et `strategy_delete_attachment`, fonction du coach « extract » sans
  étape (`coach_reserve` à 5 arguments, `coach_complete` enregistre le résumé avec la pièce),
  consigne « extract v1 » en brouillon à relire avant publication.
- Profil : section « Documents de l'organisation » (PDF, Word, Excel, images ; images
  limitées à 5 Mo). Envoi direct du navigateur au stockage, téléchargement par lien signé,
  suppression en deux temps (`attachments-panel.tsx`).
- Bouton « Analyser » par pièce : le coach résume le document et propose des valeurs pour
  le profil (au plus 40, validées par Zod et nettoyées : nombres, années, doublons). Word et
  Excel sont convertis en texte (300 000 caractères au plus) ; PDF et images sont transmis
  tels quels (`coach/extract.ts`, `attachments-text.ts`, `prefill.ts`).
- Revue des propositions (`prefill-review.tsx`) : cases à cocher, badge « déjà dans le
  profil » (décochée par défaut), « Appliquer la sélection » enregistre tout de suite dans
  le profil (listes complétées sans doublon), « Tout écarter ».
- Administration : consigne « Analyse des documents joints » (portée : profil).
- Tests : 18 unitaires (`strategy-attachments.test.ts`) et 6 d'intégration
  (`strategy-attachments-rls.test.ts`).
### Modifié
- Fonctions des consignes réunies dans `PROMPT_FUNCTIONS` (coach, requêtes, administration).

## [Stratégie v0.6.0] - 2026-10-13 — Recherche Web sourcée
### Ajouté
- Migration `20261019120000_strategy_coach_research.sql` : fonction du coach « research »
  (étapes 1 et 2 seulement), réglages `coach_search_price` (0,01 $ par recherche) et
  `coach_search_max_uses` (5, entre 1 et 20), colonnes `search_price` et `web_searches`
  des demandes, table `web_sources` (lecture par les membres, aucune écriture directe),
  `coach_reserve` et `coach_complete` recréées (coût des recherches inclus), consigne
  « research v1 » en brouillon à relire avant publication.
- Coach : onglet Recherche aux étapes 1 et 2. Le modèle cherche sur le Web (outil
  `web_search_20260209`, reprise sur `pause_turn`) puis remet ses faits par l'outil
  `soumettre_faits` validé par Zod. Une source n'est gardée que si son URL figure dans les
  résultats renvoyés par l'API ; titre, site et date viennent de ces résultats. Un fait sans
  source est présenté comme « hypothèse à vérifier ».
- Bouton « Ajouter » : un fait devient un facteur PESTEL (nature et source remplies) ou
  s'ajoute à la justification de la force visée ; « Écarter » le met de côté
  (`coach-research.tsx`, `applyFact`, `formatSource`).
- Administration : prix par recherche et nombre maximal de recherches par demande.
- Tests : 16 unitaires de plus (liste blanche des URL, ajout d'un fait, cibles, étapes
  admises) et 3 d'intégration (`strategy-coach-research-rls.test.ts`).
### Modifié
- `strategy-coach-rls.test.ts` : nouvelle signature de `coach_complete`.

## [Stratégie v0.5.1] - 2026-10-13 — Coach IA, partie b (questions, score, administration)
### Ajouté
- Migration `20261018120000_strategy_coach_admin.sql` : consignes en brouillon puis publiées
  (`published_at`), historique des erreurs classiques (`coach_rule_versions`, lisible par
  l'administrateur seulement), fonctions `admin_save_coach_prompt_draft`,
  `admin_publish_coach_prompt`, `admin_discard_coach_prompt_draft`,
  `admin_restore_coach_prompt` et `admin_save_coach_rule` ; brouillons de consignes
  « relecture v2 », « questions v1 » et « évaluation v1 » à relire avant publication.
- Coach : onglets Relecture, Questions et Évaluation. Questions d'approfondissement avec leur
  « pourquoi », à traiter ou écarter (`coach-questions.tsx`). Évaluation indicative sur 100
  selon quatre critères (complétude, précision, règles, cohérence), points forts et points à
  améliorer (`coach-score.tsx`) ; la liste de contrôle de l'étape est transmise au modèle.
  La note ne bloque jamais la validation.
- Page `/admin/strategie/coach/consignes` : version en vigueur, brouillon comparé ligne à
  ligne (`lib/strategy/coach/diff.ts`), publication, abandon, restauration d'une ancienne
  version comme brouillon.
- Page `/admin/strategie/coach/regles` : titre, étape, ordre, activation et explication
  « selon le livre » modifiables, création d'une erreur (code définitif), historique.
- Profil : périmètre de l'étude (entreprise entière, ou division et département avec son
  entreprise mère), transmis au coach.
- Tests : 11 unitaires de plus (questions, évaluation, message, comparaison, périmètre) et 3
  d'intégration (`strategy-coach-admin-rls.test.ts`).
### Modifié
- Textes neutres : l'outil sert à étudier toute organisation ; le livre est présenté comme un
  guide, et « Selon le livre » ne s'affiche que si une explication existe.
- Erreurs du coach rendues génériques ; nouvelle erreur `not_published` (aucune consigne
  publiée pour la fonction).

## [Stratégie v0.5.0] - 2026-10-13 — Coach IA, partie a (relecture)
### Ajouté
- Migration `20261017120000_strategy_coach.sql` : réglages du coach dans `strategy_settings`
  (activation, modèle, prix par million de jetons, plafond par étude, débit), consignes
  système versionnées (`coach_prompts`), 10 erreurs classiques (`coach_rules`), demandes avec
  prix figés, jetons et coût (`coach_requests`), suppléments de plafond (`coach_allowances`).
  Fonctions `coach_reserve` (rôle, prérequis, débit, plafond, audit), `coach_complete`
  (rôle service), `coach_decide`, `coach_study_usage` et fonctions d'administration.
- Coach IA dans les gabarits 1 à 4 (`components/strategy/coach-panel.tsx`) : relecture du
  contenu enregistré par Claude (sortie structurée validée par Zod, repli automatique de
  modèle), appréciation d'ensemble, suggestions liées aux erreurs classiques ; chaque
  suggestion s'accepte, se modifie ou se rejette, et passe par la sauvegarde automatique.
  Jauge du budget de l'étude, alerte à 80 %.
- Page `/admin/strategie/coach` : réglages, supplément de plafond, consommation par étude
  (chiffres seulement).
- Tests : 16 unitaires (nettoyage, application des suggestions, message, coût) et 7
  d'intégration (rôles, prérequis, débit, plafond, fin de demande, décisions, lecture).
### Modifié
- `TemplateFrame` devient générique et reçoit l'état du coach ; la page d'une étape le
  charge et autorise 300 s d'exécution (`maxDuration`).
- Dépendance `@anthropic-ai/sdk` ^0.133.0 (clé lue dans `ANTHROPIC_API_KEY`).

## [Stratégie v0.4.2] - 2026-10-11 — Accès direct à l'application
### Ajouté
- Pages de connexion propres à l'application : `/strategie/connexion`, `/strategie/inscription`,
  `/strategie/mot-de-passe-oublie`, `/strategie/reinitialiser-mot-de-passe` (mêmes formulaires
  que le site, partagés par `components/auth/auth-pages.tsx`).
- En-tête et pied de page de Kalami Stratégie (`components/strategy/strategy-chrome.tsx`) :
  marque, navigation, connexion ou déconnexion qui ramènent à `/strategie`, et un seul lien
  discret vers le livre guide, affiché seulement s'il est publié.
- Accueil `/strategie` : « Créer un compte pour commencer » et « J'ai déjà un compte ».
- `authPath` et `isStrategyPath` (`lib/auth/routes.ts`) : un chemin de `/strategie` mène
  toujours aux pages de connexion de l'application ; 4 tests unitaires.
### Modifié
- Gabarits : la racine ne garde que la langue, les polices et les métadonnées ; l'en-tête et
  le pied de page de la librairie passent dans le groupe `(site)` (pages déplacées, adresses
  inchangées).
- Proxy, `requireUser` et `/auth/callback` (erreur de lien) redirigent vers la connexion de
  l'espace d'origine.
### Corrigé
- L'inscription par courriel ignorait la page d'origine : le lien de confirmation menait à
  `/compte` (compte lecteur) au lieu de `/strategie`.
- Mot de passe oublié et nouveau mot de passe gardent la page d'origine.
- La déconnexion depuis l'application ramène à `/strategie` au lieu de l'accueil des livres.

## [Stratégie v0.4.1] - 2026-10-11 — Textes du guide, modèle services, nouveaux minimums
### Ajouté
- Migration `20261016120000_strategy_guides_content.sql` : explication et exemple Infosystem
  des 9 étapes (textes de l'auteur, mot pour mot), chapitre de « La stratégie d'entreprise »
  de chaque étape (module N = chapitre N + 5) et choix de ce livre comme livre guide.
- Étape 3 : choix du modèle de chaîne de valeur au début (Porter pour l'industrie, ou
  services d'après Stabell et Fjeldstad, 1998 : attirer, diagnostiquer, mettre en place,
  soutenir au quotidien, intervenir en urgence ; soutien : direction et administration,
  RH, technologie, approvisionnement), avec la question d'aide et le conseil pour le cas
  mixte. Changement de modèle possible ; confirmation dans la page si des activités ont
  déjà été évaluées ou décrites (les ressources VRIO sont gardées).
- Étape 4 : question « Vraiment personne n'a de pouvoir sur votre entreprise ? … » quand
  aucune partie prenante placée n'est à « Gérer de près » ou « Satisfaire ».
### Modifié
- Listes de contrôle (code et `strategy_checklist_ok`) : étape 3 = modèle choisi, au moins
  4 activités nommées et évaluées (les autres peuvent rester sans évaluation), au moins 3
  ressources passées au VRIO, les quatre réponses pour chaque ressource nommée ; étape 4 =
  au moins 5 parties prenantes nommées, toutes placées, au moins une à pouvoir fort
  (l'approche n'est plus exigée).
- Évaluations : « Point faible » et « Marginal (ne s'applique pas) ».
- Un ancien contenu de l'étape 3 sans modèle mais avec des activités reste sur Porter.
- Tests unitaires et d'intégration adaptés (migration appliquée le 2026-10-11 : 342/342).


## [Stratégie v0.4.0] - 2026-10-11 — S3 : analyse interne, parties prenantes, guide des étapes
### Ajouté
- Migration `20261015120000_strategy_guides.sql` : colonnes `explanation`, `example` et
  `chapter_position` dans `strategy_steps`, table `strategy_settings` (livre guide,
  lecture réservée à l'administrateur), fonctions `admin_update_strategy_step` et
  `admin_set_strategy_guide_book` (administrateur aal2, journal d'audit) et
  `strategy_step_reading` (lien « Lire le chapitre » seulement avec un droit d'accès actif).
- Gabarit de l'étape 3 : chaîne de valeur (modèle de Porter de départ, activités
  renommables, ajout et retrait, évaluation force / à améliorer / faiblesse / marginale) et
  tableau VRIO (arbre de décision ; « partiel » compte comme « non », résultat à confirmer).
- Gabarit de l'étape 4 : fiches des parties prenantes (attentes, pouvoir et intérêt de 1 à
  5, engagement actuel et souhaité, approche, actions) et matrice pouvoir-intérêt (fort à
  partir de 3, placement automatique, déplacement à la main par glisser-déposer ou liste,
  retour au placement automatique).
- Guide d'étape sur la page d'étape : explication et exemple Infosystem fournis par
  l'auteur (masqués quand ils sont vides) et lien vers le chapitre du livre guide.
- Administration : page `/admin/strategie/etapes` (livre guide, explication, exemple,
  raison du verrou et chapitre de chaque étape).
- Tests : `tests/unit/strategy-templates-s3.test.ts` et
  `tests/integration/strategy-guides-rls.test.ts` (ignoré tant que la migration n'est pas
  appliquée).
### Modifié
- `strategy_checklist_ok` : étape 3 = au moins une activité nommée, toutes évaluées, et une
  ressource nommée avec ses quatre réponses VRIO ; étape 4 = au moins une partie prenante
  nommée avec pouvoir, intérêt et approche.
- La référence des étapes ne s'écrit plus directement (politique de mise à jour retirée) :
  tout passe par la fonction d'administration.
- `tests/integration/strategy-rls.test.ts` remplit aussi les gabarits 3 et 4.

## [Stratégie v0.3.0] - 2026-10-11 — S2 : gabarits PESTEL et cinq forces
### Ajouté
- Migration `20261014120000_strategy_templates.sql` : révision par étape (`revision`),
  historique `study_step_versions` (50 versions gardées par étape, lecture réservée aux
  membres), fonctions `strategy_save_step` (refus si étape validée ou révision périmée,
  256 Ko au plus, une version automatique par tranche de 15 minutes) et
  `strategy_restore_version` (l'état courant est gardé avant restauration).
- Liste de contrôle avant validation, vérifiée aussi en SQL (`strategy_checklist_ok`) :
  étape 1 = au moins une opportunité et une menace (« les deux » compte pour chacune),
  étape 2 = intensité et justification des cinq forces.
- Gabarit PESTEL (étape 1) : facteurs par dimension, grille impact-incertitude par
  glisser-déposer (avec liste de placement pour le clavier et le tactile), matrice de
  scénarios 2 × 2 sur deux variables pivots.
- Gabarit des cinq forces (étape 2) : intensité et justification avec question d'aide,
  tableau de comparaison (entreprise et concurrents du profil en colonnes, note de 1 à 5
  et commentaire par case, moyenne par acteur).
- Sauvegarde automatique (1,5 s après la dernière frappe, à la sortie de l'onglet et de la
  page), état affiché, alerte avant de fermer avec des modifications en attente ;
  historique des versions avec restauration confirmée.
- Tests : `tests/unit/strategy-templates.test.ts` et
  `tests/integration/strategy-templates-rls.test.ts` (ignoré tant que la migration n'est
  pas appliquée).
### Modifié
- `strategy_validate_step` refuse une liste de contrôle incomplète et garde une version
  du contenu validé.
- Page d'étape : gabarit interactif pour les étapes 1 et 2 ; bouton « Valider » désactivé
  (avec la raison) tant que la liste n'est pas complète ou qu'un enregistrement est en cours.
- `tests/integration/strategy-rls.test.ts` remplit les gabarits 1 et 2 avant de les valider.

## [Stratégie v0.2.0] - 2026-10-11 — S0 + S1 : fondations, profil et carte des étapes
Module Kalami Stratégie (`/strategie`), versionné à part de l'application (v0.8.3).
### Ajouté
- Migration `20261013120000_strategy_core.sql` : référence des 9 étapes (`strategy_steps`,
  raisons de verrou modifiables par l'admin), études, membres (propriétaire, contributeur,
  observateur), crédits d'étude, profil de l'entreprise, étapes de l'étude ; RLS réservée
  aux membres, aucune écriture directe, toutes les écritures par fonctions SQL.
- Fonctions : création d'une étude (consomme un crédit, `no_credit` sinon), profil,
  démarrer / valider (propriétaire seulement) / rouvrir une étape avec passage « à revoir »
  des étapes commencées en aval ; octroi de crédits et liste des études pour l'admin (aal2).
- Pages : accueil public et « Mes études », nouvelle étude, carte de l'étude (maquette 06 :
  4 phases, progression, cartes verrouillées en pointillés), profil (questionnaire ou
  lecture seule), page d'étape (prérequis manquants, raisons « à revoir », actions).
- Administration `/admin/strategie` : accorder des crédits par courriel, liste des études
  (métadonnées seulement, jamais leur contenu).
- Règles partagées TS/SQL (`lib/strategy/steps.ts`, `profile.ts` avec Zod), textes
  `i18n/fr-strategy.ts`, icônes Check, Clock, Alert, Circle, Plus.
- Tests : `tests/unit/strategy.test.ts` (graphe, cascade, profil) et
  `tests/integration/strategy-rls.test.ts` (ignoré tant que la migration n'est pas appliquée).
### Modifié
- `/strategie/etudes` et `/strategie/nouvelle` ajoutés aux chemins protégés du proxy.
- Dépendance ajoutée : `zod`.

## [v0.8.3] - 2026-10-09 — Filet de sécurité de la connexion Google
### Corrigé
- Si Supabase renvoie le code de connexion sur l'accueil (`/?code=…`, adresse de retour non
  autorisée), le proxy le transmet à `/auth/callback` : la session est ouverte au lieu
  d'être perdue.
- Configuration Supabase : Site URL `https://www.kalami-livres.com`, adresses de retour
  `www` et `localhost` ajoutées.

## [v0.8.2] - 2026-10-09 — Connexion et inscription en onglets
### Modifié
- `/connexion` et `/inscription` réunies sous deux onglets (« Se connecter », « Créer un
  compte ») ; la page de retour (`suivant`) est conservée d'un onglet à l'autre.
- « Continuer avec Google » (avec le logo) proposé en premier sur les deux pages, avant
  le courriel et le mot de passe.

## [v0.8.1] - 2026-10-09 — Sprint 8 : PDF filigrané
### Ajouté
- Migration `pdf` : option `books.pdf_enabled`, droits PDF (`pdf_purchases`, référence
  KAL-XXXXXXXX, 3 téléchargements), fichiers générés (`pdf_exports`, 24 h), seau privé
  `pdf-exports`, fonctions d'administration (accorder, retirer, remettre à 3) et
  `consume_pdf_download` (serveur uniquement, décompte atomique).
- Génération Chromium (puppeteer-core + @sparticuz/chromium) au format A5 : page de titre,
  sommaire cliquable, police Literata intégrée ; nom, courriel et référence de l'acheteur en
  pied de page, en filigrane diagonal léger sur chaque page et dans les métadonnées du PDF.
- Fiche du livre : bloc « Version PDF » (préparer, télécharger, essais restants, expiration).
  Le téléchargement passe par un lien signé de 60 s ; le fichier ne transite pas par Vercel.
- Administration : case « Proposer aussi en PDF » (aussi côté auteur), carte des droits PDF
  sur la fiche du livre (accorder par courriel, retirer, remettre les téléchargements).
- Tâche quotidienne Vercel `/api/cron/pdf` (protégée par `CRON_SECRET`) et purge à chaque
  génération : aucun fichier n'est conservé au-delà de 24 h.
- Tests unitaires (gabarit, échappement, option PDF) et test d'intégration RLS.

### Modifié
- Vérification de même origine (`isSameOrigin`) partagée entre les routes POST.


## [v0.8.0] - 2026-10-09 — Sprint 9 : espace auteur
### Ajouté
- Migration `author_space` : contrat auteur versionné (`author_contracts`) et acceptations,
  coordonnées de versement (virement ou Mobile Money, privées), demandes de validation
  (`book_submissions`), déclencheurs interdisant aux auteurs les champs réservés (statut,
  mise en avant, versions, extrait), fonctions `author_register`, `author_submit_book`,
  `admin_review_submission`, `admin_publish_contract`, aperçu et statistiques.
- Inscription auteur libre (`/auteur/inscription`) avec acceptation du contrat en vigueur ;
  lien depuis « Mon compte ».
- Tableau de bord auteur : livres, statut, lecteurs, surlignages, encart « ventes bientôt
  disponibles ».
- Profil public (nom, biographie, photo) et coordonnées de versement.
- Livre : création en brouillon, fiche et prix modifiables tant qu'il n'est pas soumis,
  couverture, dépôt du manuscrit (DOCX/EPUB), aperçu dans la liseuse, demande de validation,
  historique des décisions, passages les plus surlignés une fois publié.
- Administration : file des soumissions, décision (validation ou refus motivé) sur la fiche
  du livre, publication d'une nouvelle version du contrat ; tuile « Soumissions ».
- Tests unitaires (validation auteur, choix de version) et test d'intégration RLS.

### Modifié
- Téléversement d'image et de manuscrit : action serveur injectable (réutilisés côté auteur).


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
