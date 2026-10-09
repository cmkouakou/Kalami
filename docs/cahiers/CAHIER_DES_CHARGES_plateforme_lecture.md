# Cahier des charges — Kalami, plateforme de lecture en ligne (PWA)

> Document destiné à Claude Code. Il décrit la **version 1** à construire et ce qui est prévu ensuite.
> Marque : **Kalami**. Domaine principal : **https://kalami-livres.com**.
> Toujours passer par les variables `APP_NAME` (valeur par défaut : `Kalami`) et `APP_URL` (valeur par défaut : `https://kalami-livres.com`), jamais de valeur en dur. Prévoir la configuration d'éventuels domaines secondaires en redirection 301 vers le domaine principal (ex. `kalami-books.com`, futur domaine de la version anglaise).

---

## 1. Vision

Une plateforme web **installable (PWA)** où des auteurs publient des ouvrages classés par catégorie. Les lecteurs découvrent gratuitement le sommaire et un extrait, paient par **carte bancaire** ou **Mobile Money**, puis lisent dans une liseuse moderne avec **effet de page tournée**, marque-page, surlignage, notes, citation et partage. Le contenu est protégé contre la copie, l'impression et le téléchargement. Un **PDF filigrané** peut être acheté en option.

Premier ouvrage publié : *La stratégie d'entreprise : analyse et mise en œuvre par l'exemple* (2e édition), de Claude Marcel Kouakou. Un « assistant de stratégie » sera relié à la plateforme plus tard (hors périmètre de ce document).

Public : francophone, principalement Afrique de l'Ouest, Europe et Canada. Interface en **français** (prévoir l'internationalisation pour l'anglais).

---

## 2. Profils et permissions

| Profil | Peut faire |
|---|---|
| **Visiteur** (non connecté) | Parcourir le catalogue, voir les fiches livres, lire le sommaire et l'extrait gratuit |
| **Lecteur** (connecté) | Tout ce qui précède + acheter, lire les livres achetés, annoter, citer, partager, acheter un PDF filigrané |
| **Auteur** | Tout ce que fait un lecteur + déposer des ouvrages, fixer prix et extrait, suivre ventes et revenus, demander un versement |
| **Administrateur** | Valider ou refuser les ouvrages, gérer catégories, commissions, codes promo, utilisateurs, versements aux auteurs, remboursements |

Un même compte peut être lecteur et auteur. L'accès administrateur exige l'authentification à deux facteurs.

---

## 3. Périmètre de la version 1

### 3.1 Catalogue et découverte
- Page d'accueil : nouveautés, sélection mise en avant, catégories.
- Catégories gérées par l'administrateur (ex. Gestion et stratégie, Finance, Informatique, Développement personnel…).
- Recherche par titre, auteur, mot-clé ; filtres par catégorie, langue, prix.
- Fiche livre : couverture, titre, auteur (avec page auteur), résumé, catégorie, nombre de pages/chapitres, prix dans la devise du lecteur, bouton « Lire l'extrait », bouton « Acheter », avis et notes (v1 : note sur 5 + commentaire, modérables).

### 3.2 Accès gratuit et verrouillage
- Sans compte : sommaire complet + extrait défini par l'auteur (par défaut : les sections jusqu'à la fin du premier chapitre ; l'auteur choisit un point de coupure par chapitre).
- À la fin de l'extrait, la liseuse affiche un écran de verrouillage avec le prix et le bouton d'achat. Le contenu au-delà de la coupure **ne doit jamais être envoyé au navigateur** sans droit d'accès vérifié côté serveur.
- Après achat, le lecteur reprend à l'endroit exact où il s'était arrêté.

### 3.3 Paiement
- **Cartes bancaires** : Stripe Checkout + webhooks (compte Stripe canadien).
- **Mobile Money** (Orange Money, MTN MoMo, Moov Money, Wave) : via un agrégateur ouest-africain. Implémenter derrière une **interface de fournisseur de paiement** commune pour pouvoir brancher CinetPay **ou** PayDunya (choix à confirmer ; commencer par une implémentation pour CinetPay).
- **Prix par région et devise** : l'auteur fixe un prix en XOF (FCFA), EUR et CAD. Devise proposée selon la localisation détectée, modifiable par le lecteur.
- **Codes promotionnels** (pourcentage ou montant, date d'expiration, nombre d'utilisations, portée : un livre ou tout le catalogue).
- Un **achat** donne un droit de lecture permanent sur le livre (pas d'abonnement en v1).
- Factures/reçus PDF envoyés par courriel. Prévoir le calcul des taxes (TPS/TVQ pour les acheteurs au Canada ; TVA pour l'UE) — **ne pas inventer les taux** : utiliser Stripe Tax pour les cartes et une table de configuration administrable pour le reste, à valider avec un comptable.
- Tous les droits d'accès sont accordés **uniquement à la réception du webhook de paiement confirmé**, jamais sur le retour navigateur.

### 3.4 Liseuse
- **Mode « livre »** avec effet de page tournée (bibliothèque `page-flip` / StPageFlip ou équivalent) sur ordinateur et tablette ; **mode défilement continu** proposé par défaut sur téléphone. Le lecteur peut changer de mode.
- Le contenu est du **HTML redistribuable** (pas des images de pages) : la pagination est calculée côté client selon la taille d'écran et la police.
- **Marque-page automatique** : position sauvegardée en continu, synchronisée entre appareils.
- **Signets nommés** ajoutés manuellement.
- **Surlignage** en au moins 5 couleurs ; **notes** rattachées à un passage ; panneau « Mes annotations » listant surlignages et notes par chapitre, avec recherche et filtre par couleur.
- Table des matières cliquable, barre de progression, recherche dans le texte (limitée aux parties autorisées).
- Réglages : taille et famille de police, interligne, thème clair / sépia / sombre.
- Accessibilité : contraste suffisant, navigation clavier, lecture à voix haute via l'API Web Speech du navigateur.
- Les annotations doivent rester correctement ancrées même si la pagination change (ancrage par identifiant de bloc + décalage de caractères, pas par numéro de page).

### 3.5 Protection du contenu
- Contenu servi **par chapitre**, via des routes serveur qui vérifient le droit d'accès ; aucune URL publique vers les fichiers sources.
- Désactiver la sélection pour copie, le clic droit, les raccourcis de copie et d'impression dans la liseuse ; feuille de style `@media print` qui masque le contenu.
- **Filigrane** discret superposé (courriel de l'acheteur + identifiant de commande), légèrement variable en position.
- Limitation de débit sur les routes de contenu ; journalisation des accès anormaux (ex. chargement de tous les chapitres en quelques secondes).
- Exception contrôlée : la sélection reste possible **uniquement** pour surligner, annoter, citer ou partager un extrait court (voir 3.6), sans passer par le presse-papiers natif.
- Documenter dans l'interface (aide/CGU) que la protection décourage mais n'empêche pas une capture d'écran.

### 3.6 Citation et partage
- Bouton **« Citer »** sur une sélection : génère la référence en **APA, MLA et Chicago** (auteur, titre, édition, année, plateforme, chapitre, URL), copiable.
- **Partage d'un extrait** : sélection limitée (paramètre, par défaut 280 caractères) transformée en **carte image** (citation, titre, auteur, couverture, lien) + lien vers la fiche du livre. Partage natif mobile (Web Share API) ou copie du lien.
- Partage simple d'un lien vers la fiche livre.

### 3.7 PDF filigrané (option payante)
- L'auteur active ou non l'option par livre et fixe son prix (en supplément du livre, ou seul).
- Génération **côté serveur** à la demande : chaque page porte nom, courriel et numéro de commande de l'acheteur (pied de page + filigrane diagonal léger) ; métadonnées du PDF également marquées.
- Lien de téléchargement **signé, à durée limitée** (ex. 24 h) et nombre de téléchargements limité (ex. 3).
- Le fichier généré n'est pas stocké de façon permanente sans filigrane.

### 3.8 PWA
- Manifeste, icônes, écran de démarrage ; installable sur Android, iOS et ordinateur.
- Service worker : mise en cache de l'application et des catalogues ; fonctionnement dégradé hors ligne (catalogue consultable, message clair pour le contenu).
- Lecture hors ligne des livres achetés : **prévue en v2** (stockage chiffré dans IndexedDB), ne pas l'implémenter en v1 mais concevoir l'API de contenu pour la permettre.
- Notifications push : prévues en v2.

### 3.9 Espace auteur (inclus dès la v1)
- Inscription comme auteur : profil public (nom, photo, biographie), coordonnées de versement (virement bancaire ou numéro Mobile Money), acceptation du **contrat auteur** (texte fourni par l'administrateur, versionné, avec date d'acceptation).
- Dépôt d'un ouvrage : fichier **DOCX ou EPUB**, couverture, résumé, catégorie, langue, prix par devise, point de coupure de l'extrait, option PDF.
- Conversion automatique en HTML structuré par chapitres (DOCX : `mammoth` ou `pandoc` ; EPUB : extraction des chapitres), avec **aperçu** dans la liseuse avant soumission.
- Workflow : brouillon → soumis → validé/refusé par l'admin (motif obligatoire en cas de refus) → publié. Une nouvelle version d'un livre publié repasse en validation ; les acheteurs gardent l'accès à la dernière version.
- Tableau de bord : ventes par livre, période, devise et région ; revenus nets ; taux de conversion extrait → achat ; passages les plus surlignés (agrégés et anonymes).

### 3.10 Revenus des auteurs et versements
- Commission plateforme configurable (globale + exception par auteur).
- **Grand livre** (ledger) : chaque vente crée des écritures (montant brut, frais de paiement, taxes, commission, part auteur), en devise d'origine.
- Délai de disponibilité configurable (ex. 30 jours) pour couvrir les remboursements.
- v1 : l'auteur demande un versement au-dessus d'un seuil ; l'administrateur l'approuve et l'exécute (manuellement ou via l'API de transfert de l'agrégateur Mobile Money) ; statut et justificatif conservés. Automatisation complète en v2.

### 3.11 Administration
- Gestion des utilisateurs, auteurs, livres (validation), catégories, avis (modération), codes promo, commissions, taux de taxes, versements, remboursements.
- Tableau de bord global : ventes, revenus plateforme, livres et auteurs actifs.
- Journal d'audit des actions sensibles.

### 3.12 Comptes et authentification
- Connexion par courriel (lien magique ou mot de passe) et Google.
- Page « Mon compte » : bibliothèque (livres achetés), achats et reçus, annotations, préférences de lecture, suppression du compte et export des données personnelles (obligations légales).

---

## 4. Hors périmètre de la v1 (prévu ensuite)

- **v2** : lecture hors ligne chiffrée, notifications push, versements automatisés, interface anglaise, statistiques avancées.
- **v3** : abonnement / location, programme de parrainage, intégration de l'**assistant de stratégie** (application distincte reliée par compte unique).

---

## 5. Socle technique

- **Front + back** : Next.js (version stable actuelle, App Router), TypeScript, Tailwind CSS.
- **Base de données, authentification, stockage** : Supabase (Postgres avec **Row Level Security** sur toutes les tables, Auth, Storage privé).
- **Paiements** : Stripe (cartes, Stripe Tax) ; agrégateur Mobile Money derrière une interface commune.
- **Liseuse** : `page-flip` (StPageFlip) pour l'effet livre ; pagination HTML maison.
- **PDF** : génération serveur (ex. Playwright/Chromium headless ou `pdf-lib`).
- **PWA** : Serwist ou équivalent compatible Next.js.
- **Courriels** : fournisseur transactionnel (ex. Resend).
- **Hébergement** : Vercel (front/API) + Supabase.
- Secrets uniquement en variables d'environnement ; fichier `.env.example` documenté.

### Modèle de données (indicatif)
`profiles`, `authors`, `author_contracts`, `categories`, `books`, `book_versions`, `chapters`, `preview_rules`, `prices` (livre × devise), `orders`, `order_items`, `entitlements` (droits de lecture), `pdf_purchases`, `promo_codes`, `reading_positions`, `bookmarks`, `highlights`, `notes`, `reviews`, `ledger_entries`, `payout_requests`, `tax_rates`, `audit_logs`.

---

## 6. Exigences légales et sécurité

- Politique de confidentialité conforme à la **Loi 25 (Québec)** et au **RGPD** ; bandeau de consentement aux témoins (cookies) ; registre des consentements.
- Conditions d'utilisation, conditions de vente, contrat auteur : **pages administrables**, textes fournis par le propriétaire (placeholders en attendant).
- RLS stricte : un lecteur ne lit que ses annotations et ses droits ; un auteur ne voit que ses livres et ses ventes.
- Vérification de signature de tous les webhooks ; idempotence des traitements de paiement.
- Aucune donnée de carte ne transite par nos serveurs (Stripe Checkout).

---

## 7. Méthode de travail attendue de Claude Code

1. Commencer par proposer l'arborescence du projet, le schéma de base de données et le plan des étapes ; attendre validation.
2. Construire par étapes testables : (a) auth + catalogue + fiches ; (b) conversion DOCX/EPUB + liseuse + extrait/verrouillage ; (c) paiements cartes + droits ; (d) Mobile Money ; (e) annotations, citation, partage ; (f) PDF filigrané ; (g) espace auteur + validation admin ; (h) ledger + versements ; (i) PWA et finitions.
3. Écrire des tests pour les règles critiques : verrouillage de l'extrait, octroi des droits après webhook, calcul du ledger, permissions RLS.
4. Ne jamais inventer de clés, de taux de taxes ni d'identifiants de fournisseurs : demander ou utiliser des variables d'environnement.
5. Livrer un `README` d'installation et de déploiement.

---

## 8. Critères d'acceptation de la v1 (extraits)

- Un visiteur lit le sommaire et le premier chapitre d'un livre sans compte ; la page suivante affiche l'écran d'achat ; l'appel direct à l'API du chapitre 2 renvoie une erreur 403.
- Un paiement par carte et un paiement Mobile Money de test débloquent le livre dans les 10 secondes suivant le webhook.
- Le marque-page se retrouve sur un second appareil.
- Un surlignage reste ancré au bon passage après changement de taille de police.
- Ctrl+C, clic droit et impression ne permettent pas d'extraire le texte de la liseuse.
- Le PDF acheté porte le nom, le courriel et le numéro de commande sur chaque page ; le lien expire.
- Un auteur dépose un DOCX, le voit en aperçu, le soumet ; l'admin le valide ; il apparaît au catalogue.
- Chaque vente génère des écritures de ledger cohérentes avec la commission configurée.

---

## Charte graphique et maquettes

- **Charte graphique Kalami** (couleurs des thèmes Papier, Sépia et Nuit, typographies Literata et Source Sans 3, espacements, rayons, logo, règles d'usage) : https://claude.ai/artifact/Qz8Qvsvft89hggJYuJX4EF — lire d'abord son `README` et son fichier `tokens.json`, et transposer les jetons en variables CSS / thème Tailwind. Ne jamais écrire une couleur en dur.
- **Maquettes** (accueil, fiche livre, liseuse ordinateur, liseuse mobile, fin d'extrait et paiement, Kalami Stratégie) : https://claude.ai/artifact/N6dNnfmEzmtBdjdULYxnkE — référence visuelle à reproduire fidèlement, en composants réutilisables.
- **Logos** : fichiers fournis dans le dossier `kalami-logos/` (logo, logo inversé, symbole, icône d'application SVG et PNG 512 px). Générer à partir de l'icône les tailles PWA (192, 512, version « maskable »).
- Polices : servir Literata et Source Sans 3 en auto-hébergement (paquets `@fontsource/literata` et `@fontsource/source-sans-3`), licence SIL OFL.
