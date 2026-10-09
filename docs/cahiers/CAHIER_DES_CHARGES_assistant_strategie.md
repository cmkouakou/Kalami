# Cahier des charges — Kalami Stratégie, assistant d'analyse stratégique propulsé par Claude

> Document destiné à Claude Code. Il décrit la **version 1**.
> Application rattachée à la plateforme **Kalami** (voir `CAHIER_DES_CHARGES_plateforme_lecture.md`) : même domaine (`https://kalami-livres.com/strategie`), mêmes comptes utilisateurs, même socle technique, mêmes moyens de paiement.
> Toujours utiliser les variables `APP_NAME` et `APP_URL`, jamais de valeur en dur.

---

## 1. Vision

Kalami Stratégie guide un utilisateur, seul ou en équipe, dans l'**analyse stratégique d'une entreprise réelle**, en suivant pas à pas la démarche du livre *La stratégie d'entreprise : analyse et mise en œuvre par l'exemple* (2e édition, Claude Marcel Kouakou).

L'IA (Claude, via l'API d'Anthropic) agit comme un **coach**, pas comme un substitut : elle relit, reformule, signale les erreurs classiques, pose des questions, propose des pistes clairement présentées comme des hypothèses, cherche des informations sur le Web en citant ses sources, et prépare les synthèses. **L'utilisateur valide toujours.** Quand toutes les étapes sont validées, l'assistant génère un **plan stratégique** complet au format du module 10 du livre.

Public : dirigeants de PME, cadres, consultants, étudiants et enseignants en gestion, principalement en Afrique de l'Ouest francophone, en Europe et au Québec. Interface en français (prévoir l'internationalisation).

---

## 2. Profils

| Profil | Rôle |
|---|---|
| **Propriétaire d'étude** | Achète l'étude, la configure, invite des membres, valide les étapes, génère le plan |
| **Contributeur** | Remplit les gabarits, sollicite le coach, commente ; ne valide pas une étape et ne génère pas le plan |
| **Observateur** | Lecture et commentaires seulement |
| **Enseignant** | Crée une classe, distribue des études à ses étudiants, suit leur progression, commente, consulte les plans |
| **Étudiant** | Membre d'une classe ; reçoit une étude préparée par l'enseignant (ex. cas Ajinomoto) |
| **Administrateur Kalami** | Prix, consommation d'IA, consignes du coach, cas d'entraînement, support |

---

## 3. Parcours utilisateur

### 3.1 Créer et payer une étude
- **Paiement par étude** (pas d'abonnement en v1) : carte (Stripe) ou Mobile Money (agrégateur, même interface de fournisseur que la plateforme de lecture). Prix par région et devise (XOF, EUR, CAD).
- Réduction automatique pour les comptes ayant acheté le livre sur Kalami (paramétrable).
- **Lots d'études** pour les enseignants (ex. 30 études pour une classe) avec prix dégressif.
- L'étude est créée après confirmation du paiement par webhook.

### 3.2 Profil de l'entreprise
Questionnaire guidé :
- nom, secteur, taille (effectif, ordre de grandeur du chiffre d'affaires, facultatif), ancienneté ;
- localisations (pays, villes) et marchés servis ;
- organisation (organigramme simplifié : rôles, effectifs par équipe) ;
- offre (produits/services), clients principaux, concurrents connus ;
- **question stratégique** de l'utilisateur (ex. « faut-il croître ? », « comment préparer la relève ? ») ;
- pièces jointes facultatives (PDF, DOCX, XLSX, images) : l'IA en extrait un résumé et propose de préremplir le profil, que l'utilisateur confirme.

### 3.3 Carte des étapes
Tableau de bord affichant les étapes et leurs dépendances (graphe), conformément à la « démarche en une page » du livre :

| # | Étape | Module du livre | Prérequis |
|---|---|---|---|
| 1 | Environnement externe (PESTEL, impact-incertitude, scénarios) | 2 | Profil |
| 2 | Environnement concurrentiel (cinq forces, comparaison) | 3 | Profil |
| 3 | Environnement interne (chaîne de valeur, ressources, VRIO) | 4 | Profil |
| 4 | Parties prenantes (pouvoir-intérêt, engagement) | 6 | Profil |
| 5 | Synthèse (SWOT, TOWS, enjeux) | 5 | 1, 2, 3, 4 validées |
| 6 | Cap (vision, mission, valeurs, objectifs SMART) | 7 | 5 |
| 7 | Choix (stratégies génériques, Ansoff, évaluation pertinence-acceptabilité-faisabilité) | 8 | 6 |
| 8 | Action (feuille de route, tableau de bord équilibré) | 9 | 7 |
| 9 | Plan stratégique | 10 | 8 |

- Les étapes 1 à 4 sont ouvertes **en parallèle** ; l'interface le signale et propose de les répartir entre membres de l'équipe.
- Une étape non accessible affiche ses prérequis manquants et la raison pédagogique.
- Statuts : à faire, en cours, soumise au coach, validée, à revoir (si une étape amont a changé).
- Si une étape validée est modifiée, les étapes aval passent en « à revoir » avec la liste des éléments impactés.

### 3.4 Page d'une étape
- Explication courte de l'outil (texte fourni par l'auteur, administrable) ; lien vers le chapitre correspondant dans la liseuse Kalami si l'utilisateur possède le livre.
- **Exemple Infosystem** affichable en panneau latéral (contenu fourni, administrable).
- **Gabarit interactif** correspondant (voir section 5), sauvegarde automatique, historique des versions.
- Bouton **« Avis du coach »** (voir section 4).
- Commentaires par élément du gabarit (fils de discussion entre membres).
- Bouton **« Valider l'étape »** (propriétaire uniquement), avec liste de contrôle minimale (ex. au moins une opportunité et une menace pour le PESTEL).

### 3.5 Générer la stratégie
- Activé quand les étapes 1 à 8 sont validées.
- Génère le **plan stratégique en huit sections** : 1. Où en sommes-nous ; 2. Nos enjeux ; 3. Notre cap ; 4. Notre stratégie et ce que nous ne ferons pas ; 5. Nos chantiers (responsable, échéance) ; 6. Nos objectifs et indicateurs ; 7. Nos risques (signal d'alerte, réponse prévue) ; 8. Notre suivi.
- **Annexe de traçabilité** : chaque affirmation du plan renvoie à l'étape et à l'élément d'origine.
- Le plan est éditable dans l'application, régénérable par section, exportable en **PDF et DOCX** (contenu propriété de l'utilisateur, export autorisé).

---

## 4. Le coach IA

### 4.1 Principes
- Le coach **ne remplit jamais un gabarit à la place de l'utilisateur sans action explicite** : ses propositions s'affichent comme des suggestions à accepter, modifier ou rejeter, élément par élément.
- Toute affirmation factuelle issue d'une recherche Web est accompagnée de sa **source (titre, site, date, lien)** ; sans source, elle est présentée comme une hypothèse à vérifier.
- Ton : bienveillant, direct, pédagogique, en français ; explique le *pourquoi* en renvoyant à la règle du livre.

### 4.2 Fonctions
1. **Relecture et reformulation** d'un élément ou de tout le gabarit (clarté, précision, concision).
2. **Détection des erreurs classiques** (règles extraites du livre, versionnées et administrables), par exemple :
   - une action placée parmi les opportunités (« signer un partenariat » n'est pas une opportunité) ;
   - un facteur interne dans une case externe, et inversement ;
   - un constat au lieu d'une tendance dans le PESTEL ;
   - une ressource seuil présentée comme une force ;
   - la main-d'œuvre oubliée parmi les fournisseurs (cinq forces) ;
   - confusion concurrent / substitut ;
   - VRIO trop généreux (test « Organisation ») ;
   - vision qui échoue au **test du remplacement du nom** ;
   - objectif non SMART ;
   - option retenue qui ne répond à aucun enjeu (pertinence).
3. **Questions d'approfondissement** adaptées au secteur et au pays.
4. **Recherche Web pour l'étape 1 (PESTEL)**, et facultativement pour l'étape 2 : actualités, réglementation, données sectorielles du pays ou de la région de l'entreprise, avec sources citées. Utiliser l'outil de recherche Web côté serveur de l'API d'Anthropic (vérifier la documentation à jour pour le nom exact de l'outil et ses paramètres) ; limiter le nombre de recherches par demande.
5. **Préremplissage des synthèses** : SWOT construite à partir des étapes 1 à 4 avec étiquette d'origine (« É1 », « É3 »…) ; matrice TOWS proposant des pistes dans les quatre quadrants ; proposition des trois enjeux principaux.
6. **Évaluation de la qualité d'une étape** avant validation : score indicatif et points à améliorer.
7. **Rédaction du plan stratégique** (section 3.5).

### 4.3 Exigences techniques IA
- Appels à l'API d'Anthropic **uniquement côté serveur** ; clé en variable d'environnement.
- Modèle configurable par l'administrateur (ne pas coder un nom de modèle en dur ; consulter la documentation Anthropic à jour).
- **Consignes système versionnées** (une par fonction et par étape) stockées en base, modifiables par l'administrateur, avec historique.
- **Sorties structurées en JSON** validées par schéma (ex. Zod) avant insertion dans les gabarits.
- Le contexte envoyé contient uniquement : profil de l'entreprise, contenu des étapes utiles, règles du livre pertinentes. Jamais les données d'une autre étude.
- **Suivi de la consommation** par étude (jetons, recherches Web, coût estimé) ; **plafond par étude** inclus dans le prix, paramétrable ; message clair à l'approche du plafond ; possibilité d'acheter une recharge.
- Limitation de débit par utilisateur ; gestion propre des erreurs et des délais de l'API.

---

## 5. Gabarits interactifs

Chaque gabarit est un composant éditable, sauvegardé en base sous forme structurée (JSON), correspondant aux gabarits du module 10 :

1. **PESTEL** : lignes (dimension, facteur, effet sur l'entreprise, O/M/O-M, source facultative) + **grille impact-incertitude** (glisser-déposer des facteurs) + **matrice de scénarios 2×2** à partir de deux variables pivots.
2. **Cinq forces** : intensité (faible/moyenne/forte) + justification par force ; tableau de comparaison avec les concurrents (critères × acteurs).
3. **Chaîne de valeur** : activités principales et de soutien adaptables (modèle Porter ou modèle « services »), évaluation point fort / à renforcer / faible / marginal.
4. **VRIO** : ressource × quatre tests (oui/non/partiel) → résultat calculé automatiquement selon l'arbre de décision.
5. **Parties prenantes** : attentes, pouvoir, intérêt → placement automatique dans la matrice pouvoir-intérêt (déplaçable) → approche et actions.
6. **SWOT / TOWS** : quatre listes avec étiquettes d'origine ; matrice croisée ; trois enjeux.
7. **Cap** : vision (avec test du remplacement du nom), mission, valeurs (chacune avec un geste concret), objectifs SMART (vérification critère par critère).
8. **Choix** : position dans les stratégies génériques de Porter, cases d'Ansoff, tableau d'évaluation pertinence/acceptabilité/faisabilité → décision ; énoncé de la stratégie retenue et liste des renoncements.
9. **Action** : feuille de route (chantiers, responsables, phases, échéances, vue Gantt) ; tableau de bord équilibré (quatre perspectives, indicateurs avec définition, cible, fréquence, responsable).

Les schémas (matrices, grilles, Gantt) sont générés à l'écran et repris dans l'export du plan.

---

## 6. Travail en équipe (v1)
- Invitation par courriel avec rôle (contributeur, observateur) ; acceptation obligatoire.
- Attribution d'étapes à des membres ; indicateur de présence et verrouillage doux d'un élément en cours d'édition.
- Commentaires, mentions (@), notifications par courriel.
- Journal d'activité de l'étude.

## 7. Mode enseignant (v1)
- L'enseignant achète un lot d'études, crée une **classe** (nom, établissement, période) et invite ses étudiants (lien ou liste de courriels).
- Il distribue une étude : **cas d'entraînement** préchargé ou entreprise libre ; individuelle ou en équipes.
- Tableau de suivi : progression par étudiant/équipe et par étape, accès en lecture, commentaires, export des plans.
- Paramètres de classe : activer/désactiver le coach IA par étape (ex. sans aide pour une évaluation), date limite, plafond d'IA par étude.

## 8. Cas d'entraînement (v1)
- Le **cas Ajinomoto Afrique de l'Ouest (2012-2021)** du module 11 est chargé comme étude d'entraînement : profil de l'entreprise, récit, annexes (fiche d'identité, zone de vente, marché des bouillons, organisation commerciale, bilan de la vente directe 2015-2016) et questions. **Contenu fourni par l'auteur sous forme de fichier de données** ; ne rien inventer.
- Le cas **Infosystem** est disponible comme étude d'exemple entièrement remplie, en lecture seule.
- Prévoir l'ajout ultérieur d'autres cas et d'un **corrigé** visible selon des règles fixées par l'enseignant ou l'administrateur.
- Prix du cas d'entraînement paramétrable (peut être inclus avec l'achat du livre).

---

## 9. Confidentialité et sécurité
- Données des études visibles uniquement par leurs membres (et l'enseignant de la classe) ; **Row Level Security** Supabase sur toutes les tables.
- Pièces jointes dans un stockage privé ; liens signés.
- Chiffrement au repos (Supabase) ; journal d'audit des accès sensibles.
- Engagement affiché : les données des études ne servent qu'à l'étude et ne sont pas utilisées pour entraîner des modèles ; préciser dans la politique de confidentialité le recours à l'API d'Anthropic comme sous-traitant.
- Suppression d'une étude et de ses pièces jointes à la demande ; export des données personnelles.
- Conformité **Loi 25** et **RGPD**.

## 10. Socle technique
Identique à la plateforme de lecture : Next.js (version stable actuelle, App Router), TypeScript, Tailwind, Supabase (Postgres, Auth, Storage, Realtime pour la collaboration), Stripe, agrégateur Mobile Money, génération PDF/DOCX côté serveur, déploiement Vercel. SDK Anthropic officiel côté serveur.

### Modèle de données (indicatif)
`studies`, `study_members`, `study_payments`, `company_profiles`, `attachments`, `steps` (étude × étape, statut), `step_versions`, `step_payloads` (JSON du gabarit), `comments`, `coach_requests` (fonction, consigne utilisée, entrée, sortie, jetons, coût), `coach_prompts` (versionnées), `coach_rules` (erreurs classiques), `web_sources`, `strategic_plans`, `plan_versions`, `classes`, `class_members`, `class_assignments`, `study_packs`, `practice_cases`, `ai_usage_limits`, `audit_logs`.

## 11. Méthode de travail attendue de Claude Code
1. Proposer l'arborescence, le schéma de données et le découpage ; attendre validation.
2. Étapes : (a) création et paiement d'une étude ; (b) profil + carte des étapes et dépendances ; (c) gabarits 1 à 4 ; (d) coach IA (relecture, règles, questions) ; (e) recherche Web sourcée ; (f) synthèse SWOT/TOWS préremplie ; (g) gabarits 6 à 8 ; (h) génération et export du plan ; (i) collaboration ; (j) mode enseignant ; (k) cas d'entraînement ; (l) suivi de consommation et finitions.
3. Tests sur les règles critiques : dépendances entre étapes, invalidation en cascade, permissions par rôle, plafonds d'IA, validation des sorties JSON du coach.
4. Ne jamais inventer de clés, de noms de modèles, de prix ni de contenu pédagogique : utiliser des variables et des fichiers de contenu fournis.

## 12. Critères d'acceptation (extraits)
- L'étape SWOT reste verrouillée tant que les étapes 1 à 4 ne sont pas validées, avec un message indiquant les étapes manquantes.
- Saisir « signer un partenariat » dans les opportunités déclenche une remarque du coach expliquant qu'il s'agit d'une action.
- Une recherche Web du coach pour le PESTEL renvoie au moins une source datée et cliquable par fait proposé.
- Modifier une étape validée fait passer les étapes aval en « à revoir ».
- Deux membres éditent la même étude simultanément sans perte de données.
- Un enseignant distribue le cas Ajinomoto à une classe de 30 étudiants et suit leur progression.
- Le plan généré contient les huit sections et une annexe de traçabilité ; il s'exporte en PDF et DOCX.
- La consommation d'IA d'une étude est visible par l'administrateur et bloquée au-delà du plafond, avec proposition de recharge.

---

## Charte graphique et maquettes

- **Charte graphique Kalami** (couleurs des thèmes Papier, Sépia et Nuit, typographies Literata et Source Sans 3, espacements, rayons, logo, règles d'usage) : https://claude.ai/artifact/Qz8Qvsvft89hggJYuJX4EF — lire d'abord son `README` et son fichier `tokens.json`, et transposer les jetons en variables CSS / thème Tailwind. Ne jamais écrire une couleur en dur.
- **Maquettes** (accueil, fiche livre, liseuse ordinateur, liseuse mobile, fin d'extrait et paiement, Kalami Stratégie) : https://claude.ai/artifact/N6dNnfmEzmtBdjdULYxnkE — référence visuelle à reproduire fidèlement, en composants réutilisables.
- **Logos** : fichiers fournis dans le dossier `kalami-logos/` (logo, logo inversé, symbole, icône d'application SVG et PNG 512 px). Générer à partir de l'icône les tailles PWA (192, 512, version « maskable »).
- Polices : servir Literata et Source Sans 3 en auto-hébergement (paquets `@fontsource/literata` et `@fontsource/source-sans-3`), licence SIL OFL.
