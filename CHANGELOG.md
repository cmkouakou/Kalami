# Journal des modifications

## [v0.13.1] - 2026-10-22 — Durcissement sécurité, 2e partie (Sprint 11s-2)
### Sécurité
- Audit des droits de la base : RLS sur toutes les tables, `search_path` fixé sur toutes les
  fonctions SECURITY DEFINER ; 4 écarts corrigés (migration `20261112120000_security_audit.sql`) :
  - `record_consent` réservée au rôle service (elle était appelable avec la clé publique, ce
    qui permettait de remplir le registre des consentements) ; l'action serveur passe le compte
    et limite les choix à 30 par heure et par adresse IP (`consent_ip`) ;
  - `strategy_attachment_objects` renvoie 0 à un non-membre de l'étude ;
  - `strategy_profile_complete` et `strategy_missing_prerequisites` retirées aux comptes
    (elles révélaient l'avancement de n'importe quelle étude) ;
  - fonctions de déclencheur retirées à `anon` et `authenticated`.
- Export PDF : JavaScript désactivé dans la page d'impression (l'interception des requêtes ne
  couvre pas les WebSockets).
### Ajouté
- Rapport d'audit `docs/SECURITE.md` (droits, secrets, journaux, SSRF, sondes en production).
- Tests d'intégration `security-audit-rls.test.ts` ; `legal-rls.test.ts` adapté à la nouvelle
  signature de `record_consent`.

## [v0.13.0] - 2026-10-22 — Durcissement sécurité, 1re partie (Sprint 11s-1)
### Sécurité
- Next.js 16.4.2 (faille critique de l'optimiseur d'images et déni de service des actions
  serveur corrigés) ; `npm audit fix`. Restent 3 alertes modérées sans correctif (sprintf-js
  via mammoth, outil en ligne de commande seulement).
- En-têtes HTTP sur toutes les pages : CSP stricte sans nonce (rendu statique conservé ; seules
  origines tierces : le projet Supabase et Google pour la connexion), HSTS 2 ans, X-Frame-Options
  DENY, nosniff, Referrer-Policy, Cross-Origin-Opener-Policy, Permissions-Policy.
- CSRF : le proxy refuse toute requête qui modifie des données venant d'un autre site (Origin ou
  Sec-Fetch-Site) et toute action serveur sans en-tête Origin (403). Webhook Stripe exclu.
- Limitation du débit (table `rate_limit_hits`, fonction `hit_rate_limit`) : connexion par IP
  et par courriel (empreinte, jamais en clair), inscription, lien magique, mot de passe oublié,
  aperçu des codes promo, export des données du compte, export du plan stratégique. Chaque
  dépassement est inscrit une fois par fenêtre au journal d'audit (`security.rate_limited`).
- Fichiers déposés : la signature (premiers octets) des couvertures, photos et pièces jointes
  doit correspondre à l'extension ; un fichier forgé (ex. page HTML renommée en .png) est
  supprimé du seau et refusé.
- Tâches planifiées : secret CRON_SECRET comparé en temps constant.
### Ajouté
- Webhook Stripe `charge.refunded` : un remboursement total fait dans le tableau de bord
  Stripe retire les droits automatiquement (fonction `stripe_process_refund`, idempotente) ;
  un remboursement partiel est seulement inscrit au journal (`order.partial_refund`).
- Le bouton « Rembourser » reconnaît une commande déjà remboursée par le webhook.
- Migration `20261111120000_security.sql` ; purge quotidienne des compteurs de débit (cron
  commandes).
- Migration `20261111130000_refund_audit.sql` : le remboursement reçu du webhook écrit son
  entrée au journal directement (write_audit exige un administrateur et le faisait échouer).
- Tests : 24 unitaires (`security.test.ts`), 6 d'intégration (`security-rls.test.ts`) ;
  unitaires 660/660, build OK.
### Déploiement
- Migrations `20261111120000_security.sql` et `20261111130000_refund_audit.sql` appliquées le
  2026-10-22 (historique réparé) ; intégration security-rls 6/6, paiements et grand livre sans
  régression.

### Prévu
- Sprint 11s-2 (v0.13.1) : audit des politiques RLS et des droits d'exécution, secrets et
  journaux, tests d'intrusion de base (IDOR, accès sans droits, webhook non signé), rapport.

## [v0.12.2] - 2026-10-22 — Remboursement fait dans Stripe
### Corrigé
- `/admin/commandes` : si une commande par carte a déjà été remboursée dans le tableau de bord
  Stripe, le bouton « Rembourser » enregistre ce remboursement existant (paiement remboursé en
  entier seulement) et retire les droits, au lieu d'échouer avec « échec Stripe ».
### Modifié
- Le lien « Rembourser » devient un vrai bouton bordé, plus visible.
### Prévu
- Sprint 11s (v0.13.0) : durcissement sécurité (OWASP Top 10), dont l'écoute de
  `charge.refunded` pour les remboursements faits dans Stripe.

## [v0.12.1] - 2026-10-19 — Versements, tableau de bord et journal d'audit (Sprint 10b)
### Ajouté
- Demandes de versement dans `/auteur/revenus` : un bouton par devise verse tout le
  disponible (seuils 5 000 FCFA / 10 € / 15 $ CA, coordonnées de versement obligatoires, une
  seule demande ouverte par devise). Le montant est retenu tant que la demande est ouverte.
  L'auteur peut annuler une demande pas encore approuvée. Historique des demandes et motifs.
- Administration `/admin/versements` : demandes à traiter (les plus anciennes d'abord),
  coordonnées figées au moment de la demande, approbation, refus avec motif, paiement marqué
  avec la référence de la transaction et un reçu facultatif (PDF ou image, 5 Mo, seau privé
  `payout-proofs`). Kalami paie les frais du virement. Courriel à l'admin à chaque demande,
  courriel à l'auteur au paiement ou au refus.
- Journal d'audit consultable `/admin/journal` : filtre par catégorie, pages de 50 entrées.
- Tableau de bord admin : sections « À traiter » (soumissions, versements, Mobile Money à
  valider), « Ventes du mois » par devise (encaissé, commission, part des auteurs) et
  « Catalogue ». Liens Versements et Journal dans le menu.
- Migration `20261110120000_payouts.sql` : table `payout_requests`, seau `payout-proofs`,
  fonctions `author_request_payout`, `author_cancel_payout`, `admin_payout_approve`,
  `admin_payout_reject`, `admin_payout_mark_paid`, `admin_audit_log`,
  `admin_audit_categories` ; `author_ledger_balances` renvoie aussi le montant demandé et le
  déjà versé. Chaque étape est inscrite au journal d'audit.
- Tests : 12 unitaires (`payouts.test.ts`) ; 6 d'intégration (`payouts-rls.test.ts`, ignorés
  tant que la migration n'est pas appliquée).

### Déploiement
- Migration `20261110120000_payouts.sql` appliquée le 2026-10-19 (seau, 3 politiques, 8 fonctions
  vérifiés) ; intégration payouts-rls 6/6, ledger-rls 4/4.

## [v0.12.0] - 2026-10-19 — Grand livre et commissions (Sprint 10a)
### Ajouté
- Grand livre des ventes (`ledger_entries`) : une écriture par article à chaque paiement,
  posée par la base elle-même (déclencheur sur `orders`), pour Stripe comme pour Mobile Money.
  - Brut = frais de paiement + taxes + commission Kalami + part de l'auteur (contrainte SQL).
  - Part de l'auteur : 70 % du net (après frais et taxes) ; 0 % pour les articles sans auteur
    (Stratégie). Disponible 30 jours après le paiement.
  - Remboursement : écriture inverse, disponible tout de suite ; les frais ne sont pas rendus
    (Kalami les absorbe).
  - Rattrapage : écritures créées pour les commandes déjà payées ou remboursées (frais à 0).
- Frais Stripe lus dans la transaction de solde (convertis dans la devise de la commande) et
  taxes Stripe Tax, transmis par le webhook. Frais Mobile Money : pourcentage par opérateur,
  réglable sur `/admin/mobile-money` (0 % par défaut).
- Espace auteur `/auteur/revenus` : part appliquée, délai, seuils de versement, soldes par
  devise (disponible, en attente, total) et dernières écritures. Encart des revenus sur le
  tableau de bord auteur (remplace « bientôt »).
- Administration `/admin/revenus` : totaux par devise (brut, frais, taxes, commission,
  auteurs), réglages (part, délai, seuils 5 000 FCFA / 10 € / 15 $ CA), part propre par auteur,
  dernières écritures. Chaque changement est inscrit au journal d'audit.
- Migration `20261109120000_ledger.sql` : tables `revenue_settings`, `author_commissions`,
  `ledger_entries` ; colonnes `orders.fee_minor`, `orders.tax_minor`,
  `mobile_money_operators.fee_bps` ; fonctions `author_ledger_balances`,
  `admin_ledger_totals`, `admin_set_revenue_settings`, `admin_set_author_commission`,
  `admin_mm_set_fee` ; `stripe_process_event` reçoit les frais et les taxes.
- Tests : 8 unitaires (`ledger.test.ts`) ; 4 d'intégration (`ledger-rls.test.ts`, ignorés tant
  que la migration n'est pas appliquée).

### Modifié
- Les tests d'intégration qui payent une commande effacent ses écritures en fin de test.

### Déploiement
- Migration `20261109120000_ledger.sql` appliquée le 2026-10-19 ; intégration `ledger-rls` 4/4.

### Reste (Sprint 10b, v0.12.1)
- Demandes de versement, traitement par l'administrateur, journal d'audit consultable.

## [v0.11.0] - 2026-10-19 — Mobile Money manuel (Sprint 6)
### Ajouté
- Paiement Mobile Money en FCFA (XOF) seulement, pour le livre et Kalami Stratégie.
  - Sous le bouton d'achat : « Payer par Mobile Money », choix de l'opérateur et du pays.
  - Page de la commande `/compte/achats/[commande]` : montant, numéro marchand, référence
    `KAL-XXXXXXXX` et échéance (24 h). L'acheteur paie hors de l'app, puis déclare son numéro
    de transaction et le numéro payeur.
  - Un numéro de transaction ne sert qu'une fois (toutes commandes confondues).
- Validation par l'administrateur seulement (test critique du Sprint 6) :
  - `/admin/commandes`, filtre « À valider » : Valider (livre l'achat par `fulfil_order`)
    ou Refuser avec un motif. Tout est consigné au journal d'audit.
  - Courriel d'alerte aux administrateurs à chaque déclaration ; courriel à l'acheteur
    à la validation ou au refus (avec le motif).
- Administration `/admin/mobile-money` : opérateurs à activer ou éteindre (Wave et Orange
  actifs ; MTN, Moov et Free éteints), numéros marchands par opérateur et par pays.
- Tâche quotidienne `/api/cron/commandes` (5 h UTC, `CRON_SECRET`) : les commandes non
  déclarées après 24 h passent en « expirée ».
- Interface de fournisseur commune (`mobile-money-provider.ts`) pour brancher CinetPay plus tard.
- Migration `20261108120000_mobile_money.sql` : tables `mobile_money_operators` et
  `mobile_money_accounts`, colonnes `mm_*` sur `orders`, fonctions `mm_*` et `admin_mm_*`.
- Tests : 12 unitaires (`mobile-money.test.ts`) ; 5 d'intégration
  (`mobile-money-rls.test.ts`, ignorés tant que la migration n'est pas appliquée).

### Modifié
- Une commande Mobile Money ne se rembourse pas par le bouton Stripe (remboursement manuel).
- `/compte/achats` : état des commandes Mobile Money et lien « Voir la commande ».

### À faire avant le déploiement
- Appliquer la migration `20261108120000_mobile_money.sql` **avant** de pousser.
- Saisir les numéros marchands Wave et Orange dans `/admin/mobile-money`.

### Notes
- La validation admin exige le MFA (aal2) : elle ne peut pas être testée en intégration.
- Lancée en parallèle, la suite d'intégration complète sature la base (connexions) : des
  fichiers échouent au hasard, mais passent lancés seuls.

## [v0.10.4] - 2026-10-19 — Remise enseignant du Forfait Essentiel
### Corrigé
- Migration `20261107120000_fix_teacher_discount.sql` : remise enseignant de 20 % sur le
  Forfait Essentiel. La migration 20261105 cherchait un nom commençant par « essentiel » et
  n'avait modifié aucune ligne.
- Historique des migrations de la base réparé : 16 migrations appliquées à la main
  (20261008 à 20261106) y sont maintenant inscrites, après vérification de leur contenu.

## [v0.10.3] - 2026-10-19 — Codes promo et Stripe Tax (Sprint 5c)
### Ajouté
- Codes promo vérifiés par la base, ce qui les rend utilisables plus tard pour Mobile Money :
  tables `promo_codes` et `promo_redemptions`.
  - Portée : un livre, tous les livres, Kalami Stratégie (études, lots, forfaits) ou tout.
  - Réduction : pourcentage de 1 à 90 OU montant par devise.
  - Limites : date d'expiration, nombre maximal d'utilisations, une fois par compte.
- `create_book_order` et `create_strategy_order` acceptent `p_promo_code`.
  - La réduction s'applique après la remise enseignant.
  - Le total ne descend pas sous 500 FCFA, 0,50 € ou 0,50 $ CA.
  - Le libellé indique le code ; `orders.promo_code_id` et `orders.discount_minor` sont
    renseignés.
- L'utilisation est comptée au paiement par un déclencheur sur `orders`. Un remboursement ne
  rend pas l'utilisation.
- Bouton d'achat : lien « J'ai un code promo ». L'aperçu (`/api/paiement/promo`, fonction
  `promo_preview`) affiche le prix réduit et le prix d'origine barré, avec un message si le
  code ne vaut pas dans la devise choisie.
- Administration `/admin/codes-promo` :
  - création d'un code ;
  - liste avec les utilisations et l'expiration ;
  - désactivation et réactivation ;
  - interrupteur **Stripe Tax** (éteint par défaut). Tout est consigné au journal d'audit.
- Stripe Tax, une fois allumé : `automatic_tax` et `tax_behavior = inclusive`. La taxe est
  comprise dans le prix, donc le montant payé ne change pas et le contrôle du webhook reste
  valable.
- Tests : 13 unitaires (`promo.test.ts`, plus Stripe Tax dans `payments.test.ts`) ;
  4 d'intégration (`promo-codes-rls.test.ts`, ignorés tant que la migration n'est pas
  appliquée).

### À faire avant le déploiement
- Appliquer la migration `20261106120000_promo_codes.sql` **avant** de pousser : le paiement
  appelle les nouvelles signatures des fonctions de commande.
- Avant d'allumer Stripe Tax :
  - inscrire les juridictions dans le tableau de bord Stripe (Tax → Registrations) ;
  - choisir le code fiscal par défaut des produits (livres numériques, services).

### Notes
- La limite d'utilisations ne compte que les commandes payées. Des commandes en attente
  peuvent donc la dépasser légèrement.
- L'aperçu d'un code n'est pas limité en fréquence : préférez des codes non triviaux.

## [v0.10.2] - 2026-10-19 — Paiements Kalami Stratégie et remboursements (Sprint 5b)
### Ajouté
- Achat par carte d'une étude et des lots de 10 et 30 études, pour tous les comptes : section
  « Acheter des études » sur `/strategie` et sous « Aucun crédit » dans `/strategie/nouvelle`,
  avec le prix par étude des lots. Prix dans la table `strategy_offers`.
- Achat par carte des forfaits du coach depuis la page du coach d'une étude, pour le
  propriétaire et pour l'enseignant d'une étude de classe. L'enseignant paie avec une remise
  (`coach_packs.teacher_discount_pct`, 20 % sur Essentiel). Un forfait acheté par l'enseignant
  n'est pas borné par le plafond de la classe.
- `create_strategy_order` : commande au prix de la base (offre, forfait, remise), droits
  vérifiés (propriétaire ou enseignant), au plus 10 commandes par heure. `fulfil_order` livre
  les crédits (`source = purchase`) et les forfaits (`coach_allowances.order_id`).
- Administration `/admin/commandes` : prix de l'étude et des lots, commandes filtrées par
  statut, lien Stripe et reçu, bouton « Rembourser ». Le remboursement passe par l'API Stripe
  (clé d'idempotence par commande), puis `admin_refund_order` passe la commande en
  « remboursée », révoque le livre et le PDF, retire les crédits non utilisés et les forfaits
  achetés, et écrit le journal d'audit. Une étude déjà créée reste.
- Forfaits du coach (admin) : champ « Remise enseignant (%) ».
- « Mes achats » et page « Merci » : commandes remboursées, liens vers Kalami Stratégie ou
  vers le coach selon l'article.
- Tests : 15 unitaires (`payments-strategy.test.ts`) ; 5 d'intégration
  (`strategy-orders-rls.test.ts`, ignorés tant que la migration n'est pas appliquée).

### Modifié
- `/api/paiement/checkout` accepte `item: book | study_offer | coach_pack` ; un corps
  `{ bookId }` sans `item` reste compris comme un livre.
- « Paiement bientôt » n'apparaît plus que pour un forfait sans prix.

### À faire avant le déploiement
- Appliquer la migration `20261105120000_strategy_orders.sql` **avant** de pousser : les pages
  `/strategie` et du coach lisent les nouvelles fonctions.
- Vérifier dans Vercel les variables `STRIPE_PRICE_ETUDE`, `STRIPE_PRICE_LOT_10`,
  `STRIPE_PRICE_LOT_30` et `STRIPE_PRICE_COACH_*` (facultatives : sans elles, l'article
  Stripe est créé à la volée avec le libellé de la commande).

### Note
- Un remboursement lancé depuis le tableau de bord Stripe ne retire toujours pas les droits :
  rembourser depuis `/admin/commandes`.

## [v0.10.1] - 2026-10-19 — Sommaire de la fiche après achat
### Corrigé
- Fiche du livre : le sommaire affichait encore les cadenas « Inclus à l'achat » après l'achat.
  Pour qui possède le livre, tous les chapitres sont maintenant des liens, sans cadenas.

### Note
- Un remboursement fait dans Stripe ne retire pas encore les droits dans Kalami (Sprint 10).

## [v0.10.0] - 2026-10-18 — Paiement par carte (Sprint 5a)
### Ajouté
- Achat d'un livre par carte bancaire avec Stripe Checkout (mode réel), en FCFA, € ou $ CAD
  selon les prix du livre : bouton « Acheter » sur la fiche et sur l'écran de fin d'extrait.
- Commandes (`orders`, `order_items`, `stripe_events`) : la commande est créée au prix de la
  base ; Stripe n'en est jamais la source. Livraison par le seul webhook signé
  (`/api/stripe/webhook`) : montant et devise contrôlés, chaque événement traité une fois ;
  livre, PDF et étude Kalami Stratégie offerte (achats seulement) accordés une seule fois.
- Compte Stripe partagé : seules les sessions marquées `metadata.app=kalami` sont traitées.
- Page « Merci » (`/compte/achats/merci`) qui attend la confirmation du paiement, et page
  « Mes achats » (`/compte/achats`) avec les reçus Stripe ; lien depuis « Mon compte ».
- Variables `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `STRIPE_PRICE_*` (`.env.example`).
- Étude des prix (`docs/ETUDE-PRIX.md`).
- Tests : paiement (15 unitaires), commandes et RLS (7 d'intégration).

### Modifié
- La mention « Paiement bientôt disponible » est remplacée par le bouton d'achat.

### À faire après déploiement
- Migration `20261104120000_orders.sql` : déjà appliquée, historique réparé.
- Mettre le prix CAD du livre guide à 12,99 dans l'administration.
- Vérifier les variables Stripe dans Vercel (Production), puis faire un achat réel et le
  rembourser depuis Stripe.

## [v0.9.8] - 2026-10-17 — Couvertures dans la liseuse et encart Kalami Stratégie
### Ajouté
- Quatrième de couverture : nouvelle image du livre (colonne `books.back_cover_path`),
  téléversée depuis la fiche admin ou la fiche auteur, à côté de la couverture.
- Liseuse : le livre s'ouvre sur sa couverture (page rigide, seule sur sa double page) et se
  termine sur sa quatrième de couverture ; en défilement, couverture au-dessus du premier
  chapitre et quatrième sous le dernier. « Début du livre » ramène à la couverture.
- Encart Kalami Stratégie, pour le livre guide seulement (`lib/reader/promo.ts`,
  `components/reader/strategy-promo.tsx`) : sur la fiche du livre, à la fin de l'extrait
  gratuit et à la fin de chaque module qui contient « À vous de jouer » (page dédiée en mode
  livre, sous le texte en défilement). Jamais à la fin du livre. Aucun bloc ajouté : positions,
  surlignages et lecture à voix haute inchangés.
- Tests unitaires : encart Kalami Stratégie (6 tests).

### À faire après déploiement
- Appliquer la migration `20261103120000_back_cover.sql` (éditeur SQL), puis la réparation
  de l'historique (`20261103120000`) — AVANT le déploiement : la fiche et la liseuse lisent
  la nouvelle colonne.
- Téléverser la quatrième de couverture du livre guide (fiche admin ou auteur).

## [v0.9.7] - 2026-10-17 — Liens du sommaire au bon endroit
### Corrigé
- Table des matières du livre : un clic ouvrait le chapitre plusieurs pages trop loin. La
  cible de l'entrée (data-bloc) était écrasée par l'indice que la liseuse pose sur chaque
  bloc affiché ; elle porte désormais ses propres attributs (data-vers-chapitre,
  data-vers-bloc).

### À faire après déploiement
- Réimporter le manuscrit (V5) pour régénérer les liens du sommaire.

## [v0.9.6] - 2026-10-17 — Ouvertures de module, sommaire cliquable et accès rapide
### Ajouté
- Accès rapide dans la liseuse (`components/reader/seek-bar.tsx`) : curseur sur tout le livre
  (le chapitre visé s'affiche pendant le glissement, saut au relâchement), boutons « Début du
  livre » et « Fin du livre ».
- Table des matières du livre cliquable : chaque entrée mène à son chapitre ou à son
  intertitre (`lib/content/contents-links.ts`) ; les « À vous de jouer » répétés restent dans
  leur module. Le surtitre « MODULE N » précède l'entrée du module.
- Mode livre : un clic dans la marge tourne la page ; glisser sur la première ou la dernière
  double page ouvre le chapitre voisin.
- Tests unitaires : ouvertures de chapitre, sommaire, liste blanche, accès rapide (7 tests).

### Corrigé
- Import Word : le titre « MODULE N », qui terminait le module précédent sans mise en forme,
  ouvre désormais son module (surtitre au-dessus du titre) ; le résumé en italique qui suit
  le titre devient un chapeau mis en valeur (liseuse et PDF).
- Table des matières : numéros de page Word retirés (ils ne correspondaient pas aux pages de
  la liseuse), entrées alignées et hiérarchisées.
- Mode livre : certaines pages ne tournaient qu'avec la flèche du bas (aux limites du
  chapitre, et en cliquant sur le texte).

### À faire après déploiement
- Réimporter le manuscrit V5 pour appliquer les surtitres, chapeaux et liens du sommaire.

## [v0.9.5] - 2026-10-17 — Schémas à la bonne taille en mode livre
### Corrigé
- Liseuse (mode livre) : les images sont décodées avant la pagination ; un schéma ne déborde
  plus en bas de sa page (il mesurait 0 px au moment de la mesure).
- Administration : l'aide du dépôt de manuscrit indique que les schémas et encadrés Word
  sont conservés.

## [v0.9.4] - 2026-10-17 — Schémas, encadrés et lecture complète par l'auteur
### Ajouté
- Images des manuscrits Word conservées (`lib/content/docx-images.ts`, bibliothèque `sharp`) :
  recompressées en WebP (largeur 1 200 px, 400 Ko au plus, 200 images par livre) et intégrées
  au texte ; elles suivent donc les droits de lecture et la lecture hors ligne. Les formats
  Word non lisibles (EMF, WMF) sont ignorés.
- Illustrations : une image seule sur sa ligne devient une figure ; le paragraphe suivant
  « Figure 2.1 – … » (ou « Schéma », « Graphique »…) devient sa légende et son texte de
  remplacement (`lib/content/docx-layout.ts`).
- Encadrés : paragraphes ombrés (« SUR LE TERRAIN ») ou seulement bordés repérés dans le
  Word et regroupés en un seul cadre (début, fin, titre, étiquette). Un encadré coupé entre
  deux pages reste ouvert en bas puis en haut de la page suivante.
- Liseuse et PDF filigrané : styles des encadrés, des figures et des tableaux (en-tête bleu
  nuit, lignes alternées), adaptés aux thèmes Papier, Sépia et Nuit.
- Administration : lien « Lire le livre complet (aperçu) » sur la fiche d'un livre, publié ou
  non (`/apercu/{id}`, version en attente comprise).
- Tests unitaires `content-docx-layout.test.ts` (14 tests).

### Modifié
- Liste blanche du texte : images intégrées (WebP, PNG, JPEG uniquement), classes des encadrés
  et des figures ; la limite de taille du livre ne compte que le texte, une limite par chapitre
  (3,5 Mo) borne les images.

## [v0.9.3] - 2026-10-16 — Manuscrits PDF et belle mise en page
### Ajouté
- Dépôt de manuscrits PDF (`lib/content/convert-pdf.ts`, bibliothèque `unpdf`), en plus
  du Word et de l'EPUB :
  - pages de titre, en-têtes, pieds de page et numéros de page retirés ;
  - titres repérés par leur taille de police : chapitres (taille répétée sur plusieurs
    pages) et intertitres ;
  - lignes recollées en paragraphes, mots coupés en fin de ligne réunis ;
  - notes de bas de page placées après leur paragraphe, numérotées ;
  - changement de récit (texte qui reprend plus bas sur une nouvelle page) → ornement ;
  - PDF numérisé (sans texte) refusé avec un message clair (`scanned`).
- Migration `20261102120000_pdf_manuscripts.sql` : format `pdf` accepté pour les versions
  de livre et dans le dépôt de stockage `manuscripts`.
- Finition commune à tous les formats (`lib/content/typography.ts`) :
  - typographie française (guillemets « », espaces insécables avant : ; ! ?, tiret de
    dialogue, points de suspension, apostrophe courbe) ou anglaise (“ ”) selon la langue ;
  - « *** » et autres séparateurs → ornement ⁂ ;
  - poèmes repérés (lignes courtes) et gardés vers par vers ;
  - retraits et espaces tapés au clavier retirés, titre répété en tête de chapitre retiré.
- Repérage des titres des Word sans styles (`lib/content/headings.ts`) : « Chapitre 3 »,
  « Prologue », « IV » ouvrent un chapitre ; lignes courtes en gras ou en capitales →
  intertitres (sauf si elles sont trop nombreuses, comme dans un poème).
- Tests unitaires `content-layout.test.ts` (PDF d'essai construits avec pdf-lib).

### Corrigé
- Liseuse : les pages ne tournaient plus en mode livre (marges déplacées sur la zone de
  texte, que page-flip ne réécrit pas).
- Liseuse : styles des poèmes, des notes et de l'ornement de scène ; pas de retrait après
  un ornement.


## [v0.9.2] - 2026-10-16 — Dépôt fermé aux auteurs externes
### Ajouté
- Interrupteur « Ouvrir le dépôt aux auteurs externes » dans Administration → Auteurs.
  Il est fermé par défaut : Kalami publie d'abord les livres de son fondateur.
- Migration `20261101120000_authors_switch.sql` :
  - table `platform_settings` (ligne unique), lisible par tous ;
  - fonctions `authors_open()`, `author_deposit_allowed()` et
    `admin_set_authors_open(boolean)`, réservée à l'administrateur (aal2), avec journal
    d'audit (`platform.authors.open` / `platform.authors.close`).

### Modifié
- Quand le dépôt est fermé (sauf pour l'administrateur) :
  - `author_register` et `author_submit_book` refusent avec `authors_closed` ;
  - la politique `books_author_insert` refuse la création d'un livre ;
  - la page d'inscription affiche un avis au lieu du formulaire ;
  - le lien « Devenir auteur » disparaît de « Mon compte » ;
  - l'espace auteur masque « Nouveau livre » et affiche un avis.
- Tests d'intégration de l'espace auteur : dépôt ouvert pendant les tests, état d'origine
  rétabli à la fin, refus vérifiés dépôt fermé.


## [v0.9.1] - 2026-10-16 — PWA et accessibilité (S11a-2)
### Ajouté
- Deux applications installables :
  - « Kalami » (`app/manifest.ts`, portée `/`) ;
  - « Kalami Stratégie » (`/strategie/manifest.webmanifest`, portée et démarrage
    `/strategie`), qui ne passe jamais par la librairie.
  - Icônes 192, 512, masquable et Apple générées par `scripts/generer-icones.mjs`.
- Service worker maison (`public/sw.js`, règles dans `public/sw-routes.js`), en
  production seulement, construit sur une liste blanche :
  - fichiers statiques et charte : cache d'abord ;
  - couvertures (`/_next/image`) : copie servie puis rafraîchie ;
  - pages publiques du catalogue visitées : réseau d'abord, avec copie de secours ;
  - tout le reste (liseuse, études, comptes, administration, API) : réseau seul, jamais
    conservé sur l'appareil ;
  - page de repli propre à chaque espace (`/hors-ligne`, `/strategie/hors-ligne`) ;
  - pages gardées effacées à la déconnexion (formulaires `data-deconnexion`).
- Bandeau « hors ligne » (`experimental.useOffline`) : navigations et actions relancées
  au retour de la connexion.
- Bouton discret « Installer l'application » dans les deux pieds de page :
  - invite native sur Chrome, Edge et Android ;
  - consigne « Partager → Sur l'écran d'accueil » sur iPhone et iPad ;
  - masqué une fois l'application installée.
- Lien « Aller au contenu » sur toutes les pages, avec focus sur `#contenu`.
- Pages 404 en français dans un repère `<main>` :
  - celle de la librairie ;
  - celle de Kalami Stratégie, y compris pour les adresses inconnues sous `/strategie`.
- En-têtes `X-Content-Type-Options` et `Referrer-Policy` sur tout le site ; `sw.js`
  jamais mis en cache par le navigateur.
- Tests unitaires `sw-routes.test.ts` (12) : liste blanche, replis, manifestes.
### Modifié
- Le proxy ignore les fichiers `.js` et `.webmanifest` : ni le service worker ni les
  manifestes ne rafraîchissent la session.
### Vérifié
- Audit axe (WCAG 2.1 AA et bonnes pratiques) : 0 violation sur les pages suivantes :
  - accueil, catégorie, connexion, inscription, recherche, confidentialité ;
  - `/strategie`, `/strategie/connexion`, les pages hors ligne et les 404.
- Contrastes des jetons déjà couverts dans les trois thèmes (`contrast.test.ts`).
- Fiche livre et liseuse non auditées : aucun livre n'est publié pour l'instant.

## [v0.9.0] - 2026-10-16 — Textes légaux, consentement, données du compte (S11a-1)
### Ajouté
- Migration `20261031120000_legal_privacy.sql` :
  - table `legal_documents` (confidentialité, conditions d'utilisation, conditions de
    vente), versionnée, lisible par tous ; publication par `admin_publish_legal_document`
    (journalisée) ; trois textes provisoires en version 1 ;
  - registre `consent_records` alimenté par `record_consent` (visiteurs et membres,
    20 choix par heure au plus) ;
  - `account_deletion_requests` : suppression du compte 30 jours après la demande,
    annulable (`request_account_deletion`, `cancel_account_deletion`), et
    `account_deletion_impact` (études possédées et partagées, classes, fiche auteur).
- Pages publiques `/confidentialite`, `/conditions`, `/conditions-de-vente` et leurs
  équivalents `/strategie/...` (habillage de Kalami Stratégie) ; liens dans les deux
  pieds de page.
- Bandeau des témoins « Accepter / Refuser » (Loi 25 / RGPD) sur tout le site, rouvert
  par « Gérer les témoins » ; choix mémorisé dans le témoin `kalami_consent` (version
  de la liste de témoins + identifiant du visiteur).
- Administration `/admin/textes-legaux` : version en vigueur, nouvelle version
  préremplie, compteurs du registre et des suppressions en attente.
- Compte (`/compte` et nouvelle page `/strategie/compte`) : « Mes données »
  (téléchargement JSON par `GET /api/compte/export`) et « Supprimer mon compte »
  (impact affiché, saisie de SUPPRIMER, annulation).
- Tâche quotidienne `/api/cron/comptes` (vercel.json, 4 h 45) : supprime les fichiers
  (pièces jointes des études possédées, PDF filigranés) puis le compte Auth ; les lignes
  suivent par cascade.
- Mention d'acceptation des conditions et de la politique sous l'inscription.
- Tests unitaires `legal.test.ts` (10).
### Modifié
- `/strategie/compte` ajouté aux chemins protégés (`auth/routes.ts`) ; lien « Mon
  compte » dans l'en-tête de Kalami Stratégie.

## [Stratégie v0.11.4] - 2026-10-16 — Refonte des exports Word et PDF du plan
### Modifié
- Export Word (`plan-export-docx.ts` v2.0) entièrement remis en page :
  - couverture à bandeau vert pleine largeur, question stratégique en exergue ocre ;
  - sommaire Word pré-rempli (numéros de page après « Mettre à jour les champs ») ;
  - titres numérotés (numéro en ocre, filet sous le titre), en-tête au nom de
    l'organisation, pied « Kalami Stratégie · Page X sur Y » ;
  - vraies listes à puces, précisions (cible, échéance, responsable…) en retrait, une par
    ligne, au lieu de longues lignes « - … (cible : … ; échéance : …) » ;
  - vision, mission et énoncé de stratégie en encadré vert ; « Ce que nous ne ferons
    pas » en encadré ocre ;
  - forces, faiblesses, opportunités et menaces en grille SWOT 2 × 2 colorée ;
  - Gantt en paysage avec ligne des années, responsable sous chaque chantier ;
  - tableau de bord : vue d'ensemble 2 × 2 par perspective, puis tableaux détaillés à
    en-tête coloré et lignes alternées ; traçabilité en liste compacte.
- Export PDF (`plan-export-html.ts` v2.0) aligné sur le même design (mêmes blocs,
  couleurs et pages ; pied « Page X sur Y » par les marges de page CSS).
### Ajouté
- `plan-export.ts` v1.1 : découpage de chaque paragraphe pour l'impression
  (`paragraphLayout`, `splitDetails`) et ton (simple, encadré, réserve), partagés par
  les deux formats ; le texte du plan n'est jamais modifié, seulement mis en forme.
- 7 tests unitaires (découpage, précisions, tons, couverture et pied du PDF).

## [Stratégie v0.11.3] - 2026-10-16 — Export PDF réparé, navigation entre les étapes
### Corrigé
- Export PDF du plan (et PDF filigrané des livres) en erreur 500 sur Vercel : le binaire
  compressé de Chromium (`@sparticuz/chromium/bin`) n'était pas inclus dans la fonction.
  Il est désormais ajouté par `outputFileTracingIncludes` (`next.config.ts`).
### Ajouté
- Bas de chaque étape : liens « Étape précédente », « Retour à la carte » et « Étape
  suivante » (`step-nav.tsx`) ; plus besoin de remonter en haut de la page.

## [Stratégie v0.11.2] - 2026-10-16 — Diagnostic des courriels d'invitation
### Corrigé
- Invitation créée mais courriel non envoyé sans explication : `email/send.ts` note
  désormais dans les journaux du serveur (Vercel) la raison du refus de Resend (code HTTP,
  nom et message de l'erreur) ou la variable absente (`RESEND_API_KEY`, `EMAIL_FROM`),
  sans jamais écrire la clé.
- Équipe : message distinct si l'envoi de courriels n'est pas configuré ou si le service
  d'envoi a refusé le courriel (`team-actions.ts`, `fr-strategy.ts`).
### Ajouté
- Tests unitaires `email-send.test.ts` (4).

## [Stratégie v0.11.1] - 2026-10-16 — Forfaits du coach
### Ajouté
- Migration `20261030120000_strategy_coach_packs.sql` :
  - table `coach_packs` (nom, coût couvert, prix facultatifs en FCFA, euros et dollars
    canadiens, état, ordre) et colonne `coach_allowances.pack_id` ;
  - coach verrouillé par étude tant qu'aucun forfait n'est ouvert (refus `coach_locked`) ;
    forfait de l'étude = somme de ses crédits, limitée par le plafond de la classe ;
    recharges illimitées, partagées par toute l'équipe ;
  - `coach_study_usage` renvoie un pourcentage et un nombre approximatif de relectures,
    jamais de dollars ; nouvelles fonctions `coach_study_breakdown`,
    `coach_function_estimates`, `coach_pack_offers` ;
  - administration : `admin_save_coach_pack`, `admin_grant_coach_pack` ;
    `admin_coach_usage` liste aussi les études ouvertes sans demande ;
  - prix, jetons et coûts des demandes, crédits et forfaits illisibles par les membres ;
  - forfaits de départ Essentiel, Approfondi et Intensif (prix à saisir) ; les études qui
    ont déjà utilisé le coach reçoivent le forfait Essentiel.
- Page `/strategie/etudes/[id]/coach` : état du forfait, consommation par étape et par
  fonction (en %), forfaits proposés (« Paiement bientôt » tant que le paiement n'existe pas).
- Panneaux du coach, pièces jointes et plan : bloc « coach verrouillé », estimation
  « ≈ N % du forfait » près des boutons, renvoi vers la page du coach si le forfait manque
  ou est épuisé.
- Administration : page `/admin/strategie/coach/forfaits` (créer, modifier, accorder un
  forfait à une étude).
- Mémoire des relectures : la relance d'une relecture ou des questions reçoit les
  propositions précédentes et les décisions de l'équipe.
### Modifié
- `coach/context.ts`, `coach/run.ts`, `coach/queries.ts`, `coach/actions.ts`,
  `attachment-actions.ts`, `admin/strategy-actions.ts`, `fr-strategy.ts` (blocs
  `coachPage`, `admin.coachPacks`), page admin du coach (le plafond par étude disparaît).
- Tests : intégration du coach (verrou, recharge, forfaits sans coût, coûts illisibles) et
  crédit ajouté aux tests qui réservent ; unitaires (historique, `needsPack`).

## [Stratégie v0.11.0] - 2026-10-16 — Mode enseignant (S10a)
### Ajouté
- Migration `20261029120000_strategy_classes.sql` :
  - statut enseignant accordé par l'administrateur (`strategy_teachers`) ;
  - tables `classes`, `class_members`, `class_invitations` et colonne `studies.class_id` ;
  - fonctions : créer et modifier une classe, lien de classe (régénérable, désactivable),
    invitations par courriel (renouveler, révoquer), inscription, départ ou retrait d'un
    étudiant, distribution d'une étude par groupe, suivi, classes de l'étudiant ;
  - chaque étude distribuée consomme un crédit de l'enseignant (tout ou rien) ; le premier
    membre du groupe est propriétaire, les autres contributeurs, l'enseignant observateur
    d'office, non retirable ; coach coupable par étape (`coach_disabled_step`).
- Pages `/strategie/classes` (mes classes, crédits, création, archives),
  `/strategie/classes/[id]` (onglets suivi, étudiants, distribuer, réglages) et
  `/strategie/classe/[jeton]` (inscription par lien ou invitation).
- Accueil : section « Mes classes » de l'étudiant (études reçues, date de remise, quitter) ;
  badge de classe et « en retard » (indicatif, sans blocage) sur la page d'étude.
- Administration : section « Enseignants » (accorder ou retirer le statut).
- Tests : unitaires `strategy-classes.test.ts` (20), intégration
  `strategy-classes-rls.test.ts` (11).
### Modifié
- `team.ts`, `member-list.tsx` et page équipe (enseignant), `coach/queries.ts`,
  `coach/run.ts`, `coach-panel.tsx` (coach coupé par l'enseignant), `fr-strategy.ts`
  (blocs `classes`, `admin.teachers`), `admin/strategy-actions.ts`.

## [Stratégie v0.10.2] - 2026-10-16 — Présence et verrouillage doux (S9c)
### Ajouté
- Migration `20261028120000_strategy_realtime.sql` :
  - canal Realtime privé `study:<uuid>` par étude : fonction `strategy_topic_role`,
    politiques sur `realtime.messages` (lecture et présence pour les membres, diffusion
    réservée au propriétaire et aux contributeurs) ;
  - raison de version `conflict` et fonction `strategy_save_conflict_copy` (éditeurs,
    une copie par personne toutes les 10 s au plus).
- Présence (`presence/`) : barre « Aussi sur cette étape » et « Aussi dans l'étude »,
  avatars des membres sur les cartes d'étape, indicateur « X modifie cet élément » à côté de
  la pastille de commentaire (avertissement seul, les champs restent modifiables).
- Travail simultané sans perte : chaque enregistrement est diffusé ; la page se met à jour
  si rien n'est en attente, sinon la saisie refusée est gardée en « Copie de secours
  (conflit) », restaurable depuis l'historique des versions.
- Tests : unitaires `strategy-presence.test.ts` (11), intégration
  `strategy-realtime-rls.test.ts` (6/6 sur la base de développement).
### Modifié
- `use-autosave.ts` (diffusion, mise à jour, copie de secours), `comments-context.tsx`
  (repère d'élément), `step-card.tsx`, pages de l'étude et de l'étape, `actions.ts`
  (`saveConflictCopy`), `queries.ts`, `fr-strategy.ts` (bloc `presence`).

## [Stratégie v0.10.1] - 2026-10-15 — Commentaires, mentions et notifications (S9b)
### Ajouté
- Migration `20261027120000_strategy_comments.sql` :
  - tables `study_comments` (fils d'un niveau, élément visé facultatif), mentions et
    `notifications` (une par personne et par commentaire : mention, puis réponse, puis
    commentaire sur une étape confiée) ; colonne `profiles.notify_email` ;
  - fonctions : ajouter, modifier (auteur), supprimer (auteur ou propriétaire ; une racine
    avec réponses garde sa place, sans texte), résoudre ou rouvrir un fil, lire une étape,
    notifications paginées, nombre non lu, marquer comme lu ;
  - limites : 2 000 caractères, 10 mentions, 30 commentaires par 10 minutes ; aucun accès
    direct aux tables ; ajout consigné au journal (`comment_added`).
- Section **Discussion** sous chaque étape déverrouillée : filtre par élément, fils résolus
  repliés, réponse, modification, suppression confirmée, ancres `#commentaire-…`.
- Pastilles de commentaires sur les éléments des étapes 1 à 9 (facteurs, forces, activités,
  ressources, parties prenantes, SWOT, TOWS, enjeux, vision, mission, valeurs, objectifs,
  choix, chantiers, indicateurs, risques, sections du plan).
- Mentions `@Nom` avec autocomplétion des membres ; courriel de mention par Resend (texte
  échappé), désactivable.
- Cloche dans l'en-tête (nombre non lu) et page **Notifications**
  (`/strategie/notifications`) : pages de 30, « Tout marquer comme lu », préférence de
  courriel.
- Tests : unitaires `strategy-comments.test.ts` (19), intégration
  `strategy-comments-rls.test.ts` (11, ignorée tant que la migration n'est pas appliquée).
### Modifié
- `team.ts` (membres mentionnables), `icons.tsx` (cloche, bulle), `fr-strategy.ts`
  (commentaires, notifications), `.env.example` (courriels de mention).

## [Stratégie v0.10.0] - 2026-10-15 — Équipe et invitations (S9a)
### Ajouté
- Migration `20261026120000_strategy_team.sql` :
  - tables `study_invitations` (seule l'empreinte SHA-256 du jeton est gardée, validité de
    14 jours, une seule invitation en attente par courriel) et `study_activity` (journal) ;
  - fonctions d'équipe : inviter, renvoyer, annuler, présenter un lien, invitations reçues,
    accepter ou refuser (courriel confirmé et identique exigé), membres, changer de rôle,
    retirer un membre ou partir, confier une étape, lire le journal ;
  - limites : 10 invitations par heure et 30 en attente par étude ;
  - déclencheur qui consigne les changements de statut des étapes.
- Courriels par Resend (`lib/email/send.ts`, API REST, sans dépendance) : `RESEND_API_KEY`
  et `EMAIL_FROM`. Sans configuration ou en cas d'échec, le lien d'invitation s'affiche à
  copier.
- Page **Équipe** (`/strategie/etudes/[id]/equipe`) : rôles expliqués, membres, invitation,
  invitations en attente, responsables des étapes, nom affiché.
- Page **Journal** (`/strategie/etudes/[id]/journal`), par pages de 50 entrées, sans courriel.
- Page du lien d'invitation (`/strategie/invitation/[jeton]`, protégée) : lien inconnu,
  échu ou déjà utilisé, autre compte (« Changer de compte »), accepter ou refuser.
- « Invitations reçues » sur l'accueil Stratégie.
- Carte de l'étude : liens Équipe et Journal, responsable sur chaque étape, accès au plan
  stratégique quand les étapes 1 à 8 sont validées.
- Tests : unitaires `strategy-team.test.ts` (15), intégration `strategy-team-rls.test.ts`
  (ignorée tant que la migration n'est pas appliquée).
### Modifié
- `queries.ts` : `assignee_id` lu pour chaque étape ; `routes.ts` : `/strategie/invitation`
  protégé ; `.env.example` : section Courriels (Resend).

## [Stratégie v0.9.1] - 2026-10-15 — Export du plan (S8b)
### Ajouté
- Export du plan stratégique en **PDF** et en **DOCX**, pour tous les membres de l'étude
  (observateurs compris). Fichier produit à la demande et téléchargé, sans stockage ni
  compteur (route `POST /api/strategie/etudes/[id]/plan/[format]`) :
  - page de titre (organisation, question, date d'export), sommaire, 8 sections avec le
    numéro de paragraphe (§ n) cohérent avec l'annexe, pied de page avec pagination ;
  - annexe A : feuille de route en Gantt (page paysage) ; annexe B : tableau de bord
    équilibré par perspective ; annexe C : traçabilité des sources ;
  - modèle commun (`plan-export.ts`), mise en page PDF (`plan-export-html.ts`, Chromium) et
    Word (`plan-export-docx.ts`, bibliothèque `docx` 9.8.1) ; métadonnées PDF renseignées ;
  - boutons « Exporter en PDF / DOCX » dans l'éditeur du plan, inactifs tant qu'une
    modification n'est pas enregistrée.
- Tests unitaires `strategy-plan-export.test.ts` (10).
### Modifié
- `lib/pdf/generate.ts` : `loadFonts` exporté, impression HTML → PDF générique
  (`printHtmlToPdf`), réutilisée par le PDF filigrané des livres.
- `next.config.ts` : polices incluses dans la fonction d'export du plan.
- Texte « Le plan ne se valide pas : modifiez-le librement. »

## [Stratégie v0.9.0] - 2026-10-15 — Plan stratégique (S8a)
### Ajouté
- Migration `20261025120000_strategy_plan.sql` :
  - `strategy_save_step` accepte l'étape 9 (sinon `invalid_step`) ;
  - `strategy_validate_step` refuse toujours l'étape 9 (`plan_step`) : le plan ne se valide pas ;
  - fonction de coach « plan », admise seulement à l'étape 9 et sans pièce jointe ;
  - consigne « plan v1 » en brouillon, à relire et publier.
- Plan stratégique, étape 9 (`templates/plan.ts`, `components/strategy/plan/`) :
  - 8 sections (situation, enjeux, cap, stratégie et renoncements, chantiers, objectifs et
    indicateurs, risques, suivi), assemblées depuis le profil et les étapes 5 à 8, **sans IA**
    (`plan-assemble.ts`) ; rien n'est inventé si une étape est vide ;
  - chaque paragraphe garde ses sources (étape et élément) ; annexe de traçabilité
    (`plan-trace.ts`) qui signale un élément supprimé depuis ;
  - sections éditables (ajout, retrait de paragraphes), régénérables une à une ou en bloc,
    après confirmation ; enregistrement automatique et historique des versions ;
  - « Rédiger avec le coach » par section : le coach cite le catalogue des éléments ; les
    sources inconnues sont rejetées et les paragraphes sans source écartés
    (`coach/plan-output.ts`). L'équipe choisit « Remplacer la section » ou « Ignorer ».
- Tests : unitaires `strategy-plan.test.ts` (16) et intégration `strategy-plan-rls.test.ts`
  (5, ignorée tant que la migration n'est pas appliquée).
### Modifié
- `StepActions` : la prop `isPlan` disparaît, le plan a son propre éditeur.
- Coach : balises `<sources>`, `<section>`, `<brouillon>` neutralisées dans les données.
- Administration des consignes : fonction « plan » (étape 9 seulement).

## [Stratégie v0.8.1] - 2026-10-15 — Action (S7b)
### Ajouté
- Migration `20261024120000_strategy_action.sql` : liste de contrôle de l'étape 8 dans
  `strategy_checklist_ok` (mois AAAA-MM vérifiés, fin ≥ début). Étapes 1 à 7 inchangées.
- Gabarit de l'étape 8, « Action » (`templates/action.ts`, `components/strategy/action/`) :
  - chantiers (nom, responsable, début et fin au mois), avec phases facultatives et liens
    indicatifs aux options retenues (étape 7) et aux objectifs (étape 6). Alertes sans
    blocage : dates inversées, phase hors du chantier, aucune option liée ;
  - vue Gantt en grille CSS au mois, avec les phases en sous-barres, une coupure à 60 mois
    signalée et une liste équivalente pour les lecteurs d'écran ;
  - tableau de bord équilibré en 4 perspectives (financière, clients, processus internes,
    apprentissage). Chaque indicateur a une définition, une cible, une fréquence, un
    responsable, un type (résultat ou avancé) et les objectifs qu'il suit ;
  - risques facultatifs (signal d'alerte, réponse prévue, chantier exposé), source de la
    section « Nos risques » du plan au S8.
  - Minimums : 1 chantier complet et 1 indicateur nommé par perspective.
- Tests : unitaires `strategy-action.test.ts` et intégration `strategy-action-rls.test.ts`
  (ignorée tant que la migration n'est pas appliquée).
### Modifié
- Coach : libellés de la liste de contrôle de l'étape 8 ; contexte amont relu (étapes 5 à 7).
- `strategy-templates.test.ts` : l'étape 8 a désormais un gabarit.

## [Stratégie v0.8.0] - 2026-10-15 — Cap et Choix (S7a)
### Ajouté
- Migration `20261023120000_strategy_direction_choice.sql` : listes de contrôle des étapes 6
  et 7 dans `strategy_checklist_ok`. Étapes 1 à 5 inchangées.
- Gabarit de l'étape 6, « Cap » (`templates/direction.ts`, `components/strategy/direction/`) :
  vision avec test du remplacement du nom (vision réécrite au nom d'un concurrent du profil
  ou saisi ; réussi si « la phrase reste vraie » reçoit « non » ; à refaire si la vision
  change), mission, valeurs avec geste concret, objectifs (indicateur, cible, échéance au
  mois) cochés critère par critère SMART et liés aux enjeux de l'étape 5.
  Minimums : vision et test réussi, mission, 2 valeurs avec geste, 1 objectif SMART.
- Gabarit de l'étape 7, « Choix » (`templates/choice.ts`, `components/strategy/choice/`) :
  grille de Porter 2 × 2, matrice d'Ansoff qui montre et accueille les options, évaluation
  pertinence, acceptabilité, faisabilité (oui / partiel / non) et décision de l'équipe
  (retenue ou écartée ; option retenue malgré un « non » ou sans enjeu lié signalée),
  énoncé de la stratégie avec rappel des options retenues, renoncements. Minimums :
  position, 2 options évaluées, 1 retenue, énoncé, 1 renoncement.
- Tests : unitaires `strategy-direction-choice.test.ts` et intégration
  `strategy-direction-choice-rls.test.ts` (ignorée tant que la migration n'est pas
  appliquée).
### Modifié
- Coach : libellés des listes de contrôle des étapes 6 et 7 ; contexte amont relu (étape 5
  pour l'étape 6, étapes 5 et 6 pour l'étape 7).
- `LinkPicker` : limite et message vide paramétrables (liens aux enjeux, 3 au plus).
### Corrigé
- `strategy-rls.test.ts` : l'étape 5 reçoit une synthèse complète avant validation
  (échec depuis la liste de contrôle de S6a).

## [Stratégie v0.7.1] - 2026-10-14 — Synthèse : propositions du coach (S6b)
### Ajouté
- Migration `20261022120000_strategy_coach_synthesis.sql` : fonction du coach « synthesize »
  (réservée à l'étape 5 dans `coach_reserve`, consigne admise pour l'étape 5 seulement),
  `coach_decide_many` (décisions groupées, 50 au plus, membres éditeurs seulement) et
  consigne « synthesize v1 » en brouillon à relire avant publication.
- Onglet « Propositions » du coach à l'étape 5 : le coach lit les étapes 1 à 4 et le profil,
  puis propose des éléments de SWOT, des pistes TOWS et des enjeux. Revue par cases à cocher
  (`coach-synthesis.tsx`) : étiquette É1 à É4 pour un élément repris d'une étape, mention
  « à vérifier » pour un élément tiré du profil seul, doublons signalés et décochés.
  « Appliquer la sélection » complète la synthèse sans rien remplacer (nouveaux
  identifiants, liens convertis, plafonds respectés, enjeu vide rempli en premier).
- `synthesis-proposals.ts` : identifiants connus, numérotation, doublons, application.
- Nettoyage des propositions (`sanitizeSynthesize`) : origine vérifiée contre les étapes,
  refs invalides ou en double neutralisées, liens limités aux éléments existants ou proposés.
- Tests : 16 unitaires (`strategy-coach-synthesis.test.ts`) et 4 d'intégration
  (`strategy-coach-synthesis-rls.test.ts`, ignorés tant que la migration n'est pas appliquée).
### Modifié
- Message du coach : bloc `<etapes>` (contenu relu des étapes 1 à 4) à l'étape 5, pour
  toutes les fonctions.
- Administration des consignes : libellé de la nouvelle fonction ; consigne synthesize
  refusée pour une autre étape que la 5.

## [Stratégie v0.7.0] - 2026-10-14 — Synthèse : SWOT, TOWS et enjeux (S6a)
### Ajouté
- Migration `20261021120000_strategy_synthesis.sql` : liste de contrôle de l'étape 5 dans
  `strategy_checklist_ok` (un élément rédigé par case de la SWOT, une piste TOWS rédigée,
  deux ou trois enjeux nommés). Étapes 1 à 4 inchangées.
- Gabarit de l'étape 5 (`templates/synthesis.ts`, `components/strategy/synthesis/`) :
  matrice SWOT (30 éléments par case), matrice TOWS en quatre quadrants (SO, ST, WO, WT,
  40 pistes) liées aux deux cases qu'elles croisent, deux ou trois enjeux liés aux éléments
  de la SWOT ou aux pistes. Supprimer un élément retire aussi les liens qui le visaient.
- Reprise des étapes 1 à 3 vers la SWOT, sans IA (`synthesis-sources.ts`,
  `swot-import.tsx`) : cases à cocher regroupées par case, étiquette d'origine (É1, É2,
  É3), éléments déjà repris signalés et jamais ajoutés deux fois. Règles : O = facteurs
  PESTEL opportunité ou les deux ; M = facteurs menace ou les deux et forces d'intensité
  forte ; F = activités « force » et ressources VRIO avantage temporaire, durable ou
  inexploité ; Fb = activités « faiblesse » ou « à améliorer » et ressources désavantage.
- `getSourcePayloads` (queries.ts) : contenu des étapes sources lu pour la page de l'étape.
- Tests : 12 unitaires (`strategy-synthesis.test.ts`) et 8 d'intégration
  (`strategy-synthesis-rls.test.ts`, ignorés tant que la migration n'est pas appliquée).
### Modifié
- Coach : libellés de la liste de contrôle de l'étape 5 ajoutés.
- `strategy-templates.test.ts` : l'étape 5 a désormais un gabarit.

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
