/**
 * =============================================================
 *  Fichier    : sprint-1.ts
 *  Projet     : Kalami Données
 *  Description: Chantier BRVM Power BI — sprint 1 : Vue d'ensemble & premier chargement.
 *               Repris du guide d'origine « Chantier BRVM Power BI » (powerbi4you),
 *               sans modification du fond. Les identifiants des cases à cocher sont ceux
 *               du guide d'origine : ne jamais les renommer.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/content.ts
 * =============================================================
 */

import type { Sprint } from "../types";

export const sprint1: Sprint = {
  numero: 1,
  slug: "sprint-1",
  titre: "Vue d'ensemble & premier chargement",
  lede: "Objectif de cette session : savoir exactement quelles données on va utiliser et " +
    "pourquoi, puis faire entrer les bonnes tables dans Power BI. On ne nettoie rien encore — " +
    "ça, c'est le sprint 2.",
  contenu: [
    {
      kind: "titre",
      texte: "Le dashboard qu'on construit",
      numero: "1.1",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "Pour que chaque sprint ait un but concret, on vise un dashboard à 3 pages, un " +
        "par axe de données disponible dans le schéma `reporting` :",
    },
    {
      kind: "cartes",
      cartes: [
        {
          titre: "Marché",
          points: [
            "Cours et évolution par titre",
            "Répartition par secteur / pays",
            "BNA, DPA, VCA par exercice",
          ],
        },
        {
          titre: "Utilisateurs",
          points: [
            "Profils investisseurs (risque, horizon)",
            "Analyses lancées par jour",
            "Titres les plus consultés",
          ],
        },
        {
          titre: "Revenus",
          points: [
            "Abonnements par plan / statut",
            "Montant total par période",
            "Évolution mensuelle",
          ],
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "On affinera ces listes en sprint 6 — pour l'instant elles servent juste à " +
        "choisir les bonnes tables.",
      discret: true,
    },
    {
      kind: "titre",
      texte: "Comment Power BI s'organise en entreprise",
      numero: "1.2",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "Avant d'ouvrir Power BI Desktop, une clarification qui évite un contresens " +
        "fréquent chez les étudiants : on ne reçoit jamais un identifiant unique et on " +
        "\"commence à travailler\" comme sur un tableur personnel. Dans une vraie entreprise, " +
        "l'accès aux données est **découpé en couches**, chacune avec son propriétaire, sa " +
        "raison d'être et son processus de création — le rôle `powerbi_reader` que tu " +
        "utiliseras au sprint 1.6 n'est qu'**une seule de ces couches**. Voici les quatre, " +
        "dans l'ordre où les données te parviennent.",
    },
    {
      kind: "tableau",
      entetes: [
        "Couche",
        "Qui la crée",
        "Pourquoi elle existe",
      ],
      lignes: [
        [
          "Rôle base de données — `powerbi_reader`",
          "DBA / dev backend",
          "Contrôle ce que la **requête SQL** a le droit de lire — indépendamment de qui " +
            "l'exécute. Créé une seule fois par migration versionnée (ici " +
            "`072_reporting_powerbi.sql`), jamais à la main en production.",
        ],
        [
          "Passerelle / connexion — `gateway, identifiants`",
          "Admin infra / IT",
          "Transporte les identifiants `powerbi_reader` de façon sécurisée jusqu'au service " +
            "Power BI, sans que chaque analyste les tape lui-même. Un seul compte de service, " +
            "jamais un mot de passe personnel.",
        ],
        [
          "Espace de travail — `workspace`",
          "Admin Power BI / BI lead",
          "Regroupe les jeux de données, rapports et dashboards d'une équipe ou d'un projet. " +
            "Détermine **qui peut publier** (Contributeur/Membre) contre **qui peut seulement " +
            "consulter** (Lecteur/Viewer) — voir le tableau des rôles ci-dessous.",
        ],
        [
          "Sécurité au niveau ligne — `RLS`",
          "Concepteur du rapport",
          "Filtre les **lignes** qu'un utilisateur voit dans un rapport déjà publié (ex. : un " +
            "directeur régional ne voit que sa région) — s'ajoute par-dessus tout le reste, " +
            "définie dans Power BI Desktop avant publication.",
        ],
      ],
    },
    {
      kind: "paragraphe",
      texte: "**Les 4 rôles à l'intérieur d'un espace de travail Power BI** — c'est la couche " +
        "que les étudiants découvrent en premier en entreprise, et celle qui décide " +
        "concrètement ce qu'on a le droit de cliquer :",
    },
    {
      kind: "tableau",
      entetes: [
        "Rôle",
        "Peut consulter",
        "Peut publier / modifier",
        "Peut gérer les accès",
      ],
      lignes: [
        [
          "Viewer (Lecteur)",
          "Oui",
          "Non",
          "Non",
        ],
        [
          "Contributor (Contributeur)",
          "Oui",
          "Oui (rapports/datasets)",
          "Non",
        ],
        [
          "Member (Membre)",
          "Oui",
          "Oui",
          "Oui (ajouter des membres)",
        ],
        [
          "Admin",
          "Oui",
          "Oui",
          "Oui + supprimer l'espace, changer sa licence",
        ],
      ],
    },
    {
      kind: "notion",
      titre: "Notion — Qui crée un rôle, et pourquoi jamais \"à la main\" en production ?",
      etiquette: "Gouvernance",
      contenu: [
        {
          kind: "paragraphe",
          texte: "**Qui crée `powerbi_reader` (le rôle base de données)** — un développeur " +
            "backend ou un DBA, via un script SQL versionné dans le dépôt de code (une " +
            "migration), jamais en tapant une commande directement sur la base de production. " +
            "Raison : si le rôle doit être recréé (nouvel environnement, restauration après " +
            "incident), le script garantit qu'il aura exactement les mêmes droits — ni plus, " +
            "ni moins — sans dépendre de la mémoire de quelqu'un.",
        },
        {
          kind: "paragraphe",
          texte: "**Qui crée un espace de travail et y assigne les rôles " +
            "Viewer/Contributor/Member/Admin** — un administrateur Power BI (souvent le \"BI " +
            "lead\" ou l'équipe IT), généralement après une demande formelle (\"j'ai besoin " +
            "d'accès au dashboard Ventes\") passant par un processus d'approbation, pas par un " +
            "email direct entre collègues. Raison : chaque accès accordé doit pouvoir être " +
            "justifié et retiré plus tard (départ d'un employé, changement de poste) — c'est " +
            "ce qu'un auditeur vérifie lors d'un contrôle de conformité.",
        },
        {
          kind: "paragraphe",
          texte: "**Pourquoi cette séparation stricte entre les 4 couches** (et non un seul " +
            "accès global) — parce qu'un même besoin change de couche selon la situation : " +
            "donner à un analyste le droit de *publier* un rapport (couche espace de travail) " +
            "ne doit jamais lui donner accès aux tables brutes de production (couche base de " +
            "données) ; et donner à toute l'équipe Marketing le droit de *voir* le dashboard " +
            "Ventes ne doit pas leur montrer les chiffres de chaque vendeur individuellement " +
            "(couche RLS). Trois besoins différents, trois couches, trois responsables.",
        },
        {
          kind: "paragraphe",
          texte: "**Le principe qui chapeaute tout ça** s'appelle le **principe du moindre " +
            "privilège** : chaque compte — humain ou technique — ne reçoit que les droits " +
            "strictement nécessaires à sa tâche, jamais \"au cas où\". C'est exactement " +
            "pourquoi `powerbi_reader` ne voit que 13 vues nettoyées du schéma `reporting`, et " +
            "rien du schéma `public` où vivent les vraies tables applicatives.",
        },
      ],
    },
    {
      kind: "titre",
      texte: "Panorama des 13 vues disponibles",
      numero: "1.3",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "Le rôle `powerbi_reader` voit exactement 13 vues dans le schéma `reporting`, " +
        "déjà nettoyées de toute donnée personnelle (voir migration " +
        "`072_reporting_powerbi.sql`). Chacune est soit une dimension (elle décrit un objet — " +
        "un titre, un utilisateur, une date) soit une table de faits (elle enregistre un " +
        "événement daté — un cours, une transaction).",
    },
    {
      kind: "notion",
      titre: "Notion — Qu'est-ce qu'une \"vue\" (et pourquoi on en crée) ?",
      etiquette: "SQL",
      contenu: [
        {
          kind: "paragraphe",
          texte: "Une **vue** (`VIEW`) est une requête SQL enregistrée sous un nom, que la " +
            "base traite comme une table à chaque fois qu'on la lit. Elle ne stocke aucune " +
            "donnée elle-même — elle recalcule le résultat à la volée à partir des vraies " +
            "tables.",
        },
        {
          kind: "paragraphe",
          texte: "**Pourquoi le schéma `reporting` passe par des vues plutôt que de connecter " +
            "Power BI directement aux tables applicatives ?** Trois raisons concrètes, toutes " +
            "vérifiées sur ce projet :",
        },
        {
          kind: "paragraphe",
          texte: "1. **Confidentialité** — les vues excluent d'office les colonnes sensibles " +
            "(email, notes libres, référence de paiement) et remplacent `user_id` par un " +
            "hachage irréversible. Power BI ne voit jamais ce qu'une table brute contiendrait.",
        },
        {
          kind: "paragraphe",
          texte: "2. **Stabilité** — si la structure interne d'une table applicative change, " +
            "on ajuste la vue une seule fois ; le modèle Power BI, lui, continue de voir les " +
            "mêmes noms de colonnes.",
        },
        {
          kind: "paragraphe",
          texte: "3. **Droits d'accès** — le rôle `powerbi_reader` n'a de permission que sur " +
            "le schéma `reporting`, jamais sur `public` où vivent les vraies tables. Une vue " +
            "est donc aussi une frontière de sécurité.",
        },
      ],
    },
    {
      kind: "tableau",
      entetes: ["Vue", "Rôle", "Contient"],
      lignes: [
        [
          "v_stocks",
          "dimension",
          "ticker, nom, pays, secteur, devise, actions en circulation, indices",
        ],
        [
          "v_quotes_history",
          "fait",
          "cours de clôture, variation %, volume, valeur transigée — par titre et par jour",
        ],
        [
          "v_fundamentals",
          "fait",
          "BNA, DPA, VCA et états financiers par titre et par exercice",
        ],
        [
          "v_analyst_forecasts",
          "fait",
          "prévisions PE / PB / DY issues des rapports SGI",
        ],
        [
          "v_evenements_titres",
          "fait",
          "événements sur titres (dividendes, AG, opérations)",
        ],
      ],
      legende: "Axe marché BRVM",
    },
    {
      kind: "tableau",
      entetes: ["Vue", "Rôle", "Contient"],
      lignes: [
        [
          "v_user_profiles",
          "dimension",
          "profil investisseur, horizon, budget, profil de risque (utilisateur pseudonymisé)",
        ],
        [
          "v_analytics_events",
          "fait",
          "événements applicatifs (type, titre consulté, horodatage)",
        ],
        [
          "v_analyses_quota_daily",
          "fait",
          "analyses lancées par jour et par utilisateur",
        ],
        [
          "v_blog_page_views",
          "fait",
          "lectures d'articles du blog (déjà anonyme par design)",
        ],
      ],
      legende: "Axe usage applicatif",
    },
    {
      kind: "tableau",
      entetes: ["Vue", "Rôle", "Contient"],
      lignes: [
        [
          "v_abonnements",
          "fait",
          "plan, montant, devise, statut, période — par utilisateur pseudonymisé",
        ],
        [
          "v_academie_acces",
          "fait",
          "achats d'accès à l'Académie",
        ],
        [
          "v_portfolio_transactions",
          "fait",
          "achats/ventes déclarés en portefeuille",
        ],
      ],
      legende: "Axe revenus",
    },
    {
      kind: "tableau",
      entetes: ["Vue", "Rôle", "Contient"],
      lignes: [
        [
          "v_dim_date",
          "dimension",
          "calendrier 2010-2031 (année, trimestre, mois, jour de semaine) pour la " +
            "time-intelligence DAX",
        ],
      ],
      legende: "Dimension transversale",
    },
    {
      kind: "titre",
      texte: "Les 7 vues retenues pour ce chantier",
      numero: "1.4",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "13 vues d'un coup, c'est trop pour apprendre proprement. On en choisit **7** — " +
        "assez pour construire un vrai schéma en étoile sur les 3 axes, sans se noyer :",
    },
    {
      kind: "tableau",
      entetes: [
        "Vue",
        "Rôle",
        "Pourquoi elle est retenue",
      ],
      lignes: [
        [
          "v_dim_date",
          "dimension",
          "calendrier commun aux 3 axes",
        ],
        [
          "v_stocks",
          "dimension",
          "décrit les titres utilisés par les deux tables de faits marché",
        ],
        [
          "v_user_profiles",
          "dimension",
          "décrit les utilisateurs utilisés par les faits usage et revenus",
        ],
        [
          "v_quotes_history",
          "fait",
          "le plus gros volume de lignes — bon cas d'école pour le nettoyage",
        ],
        [
          "v_fundamentals",
          "fait",
          "ratios financiers, complète la page Marché",
        ],
        [
          "v_analyses_quota_daily",
          "fait",
          "le plus simple des faits usage, bon point de départ",
        ],
        [
          "v_abonnements",
          "fait",
          "alimente la page Revenus",
        ],
      ],
    },
    {
      kind: "paragraphe",
      texte: "Les 6 vues restantes (`v_analyst_forecasts`, `v_evenements_titres`, " +
        "`v_analytics_events`, `v_blog_page_views`, `v_academie_acces`, " +
        "`v_portfolio_transactions`) restent disponibles — tu pourras les ajouter toi-même une " +
        "fois les sprints terminés, en répétant exactement la même méthode.",
      discret: true,
    },
    {
      kind: "titre",
      texte: "Pourquoi ce schéma tient debout",
      numero: "1.5",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "Les 3 dimensions rayonnent vers les 4 tables de faits — c'est la forme \"en " +
        "étoile\" qu'on construira formellement au sprint 4, mais autant voir la cible dès " +
        "maintenant :",
    },
    {
      kind: "notion",
      titre: "Notion — Le schéma en étoile : explication, utilité, contexte",
      etiquette: "Modélisation",
      contenu: [
        {
          kind: "paragraphe",
          texte: "**Explication.** Un schéma en étoile organise les données autour d'une " +
            "**table de faits** centrale (les événements mesurables — un cours, une " +
            "transaction, une analyse lancée) reliée à plusieurs **tables de dimensions** qui " +
            "décrivent le contexte de ces événements (quel titre, quel utilisateur, quelle " +
            "date). Vu de haut, ça dessine une étoile : les dimensions rayonnent depuis les " +
            "faits.",
        },
        {
          kind: "paragraphe",
          texte: "**Utilité.** C'est la forme que **DAX** et le moteur de calcul de Power BI " +
            "attendent pour être rapides et pour que les relations filtrent correctement d'une " +
            "table à l'autre — filtrer sur une date dans `v_dim_date` doit automatiquement " +
            "restreindre les cours dans `v_quotes_history`. Une seule grande table plate (tout " +
            "mélangé) casse ce comportement et rend les mesures fausses ou lentes.",
        },
        {
          kind: "paragraphe",
          texte: "**Contexte dans ce chantier.** Nos 3 dimensions (`v_dim_date`, `v_stocks`, " +
            "`v_user_profiles`) rayonnent vers 4 tables de faits couvrant marché, usage et " +
            "revenus. Le sprint 4 formalise ces relations dans Power BI ; le sprint 4.7 " +
            "précisera même qu'avec plusieurs faits partageant les mêmes dimensions, on parle " +
            "plus justement de **schéma en galaxie** — une étoile qui s'est multipliée.",
        },
      ],
    },
    {
      kind: "schema",
      gauche: ["v_dim_date", "v_stocks", "v_user_profiles"],
      droite: ["v_quotes_history", "v_fundamentals", "v_analyses_quota_daily", "v_abonnements"],
      liens: [
        { de: 0, vers: 0 },
        { de: 0, vers: 2 },
        { de: 0, vers: 3 },
        { de: 1, vers: 0 },
        { de: 1, vers: 1 },
        { de: 2, vers: 2 },
        { de: 2, vers: 3 },
      ],
      legende: "dimensions → faits",
    },
    {
      kind: "titre",
      texte: "Premier chargement dans Power BI Desktop",
      numero: "1.6",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Get data from relational data sources",
          url: "https://learn.microsoft.com/fr-ca/training/modules/get-data/3-relational-data",
        },
        {
          texte: "Select a storage mode",
          url: "https://learn.microsoft.com/fr-ca/training/modules/get-data/6-storage-mode",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Les identifiants du rôle `powerbi_reader` sont prêts à l'emploi — mais Power BI " +
        "redemande quand même la chaîne de connexion complète à la première ouverture d'un " +
        "nouveau rapport :",
    },
    {
      kind: "liste",
      items: [
        "Ouvre Power BI Desktop → onglet **Accueil** → **Obtenir les données** → cherche et " +
          "choisis **PostgreSQL database**.",
        {
          texte: "Une boîte **« Connect to data source »** s'ouvre en premier (pas encore le " +
            "Navigateur) :",
          sous: [
            "**Server** : `aws-0-eu-west-1.pooler.supabase.com:5432`",
            "**Database** : `postgres`",
            "**Connectivity mode** : c'est *ici*, pas plus tard dans le Navigateur, que tu " +
              "choisis **Import** — pas *DirectQuery*. Le pooler Supabase n'est pas " +
              "dimensionné pour des requêtes répétées en direct depuis Power BI ; Import " +
              "rapatrie les données une fois et les stocke dans le fichier `.pbix`.",
          ],
        },
        "Toujours dans la même boîte, sous **Connection credentials** : **Authentication " +
          "kind** = `Basic`, puis le `Username`/`Password` du rôle `powerbi_reader`. Clique " +
          "**OK** — le Navigateur s'ouvre alors.",
        "Dans le **Navigateur**, déplie uniquement le schéma `reporting` (jamais `public` — le " +
          "rôle n'y a de toute façon aucun accès). Il liste une quinzaine d'objets ; coche " +
          "seulement les **7 vues** listées en 1.4 (et elles seules, pour ce chantier).",
        "Clique sur **Transform data** (pas *Load*) — ça ouvre l'éditeur Power Query, où on " +
          "travaillera aux sprints 2 et 3 avant de charger quoi que ce soit dans le modèle.",
      ],
      ordonnee: true,
    },
    {
      kind: "encadre",
      ton: "attention",
      texte: "**Pourquoi \"Transform data\" et pas \"Load\" ?** Une fois chargées telles " +
        "quelles, corriger un type de colonne ou renommer un champ oblige à tout " +
        "retélécharger. Passer par Power Query d'abord permet de préparer les données une " +
        "bonne fois, avant qu'elles n'entrent dans le modèle.",
    },
    {
      kind: "encadre",
      ton: "attention",
      texte: "**Le mode Import ne se choisit qu'une fois.** Il est associé à la connexion, pas " +
        "à chaque vue : tu ne le reverras plus après cette étape, même en ajoutant d'autres " +
        "tables plus tard depuis la même source.",
    },
    {
      kind: "notion",
      titre: "Dépannage — « too many connections for role powerbi_reader »",
      etiquette: "Dépannage",
      contenu: [
        {
          kind: "paragraphe",
          texte: "**Ce qui se passe** — au clic sur **Charger**, Power BI ouvre plusieurs " +
            "connexions en parallèle (jusqu'à 10 par défaut) pour charger les 7 vues en même " +
            "temps. Le pooler Supabase limite le nombre de connexions simultanées autorisées " +
            "pour le rôle `powerbi_reader`, et ce parallélisme le dépasse — d'où l'erreur " +
            "PostgreSQL `53300`.",
        },
        {
          kind: "paragraphe",
          texte: "**Correctif immédiat** — `Fichier > Options et paramètres > Options > " +
            "Fichier actuel > Chargement des données` → dans la section **« Parallel loading " +
            "of tables »**, sélectionne le bouton radio **« One (disable parallel loading) »** " +
            "(au lieu de « Default »). Clique **OK**. Ça force un chargement séquentiel des " +
            "vues, une par une, au lieu d'un chargement en rafale. Relance ensuite **Charger**.",
        },
        {
          kind: "paragraphe",
          texte: "**Si l'erreur persiste** — ferme complètement Power BI Desktop (et tout " +
            "autre client comme pgAdmin ou DBeaver connecté avec le même rôle) pour libérer " +
            "les connexions restées ouvertes, patiente quelques secondes, puis rouvre et " +
            "réessaie.",
        },
        {
          kind: "paragraphe",
          texte: "**Si ça revient souvent même à 1 connexion** — le rôle a probablement une " +
            "limite de connexion basse côté PostgreSQL ; un administrateur peut l'augmenter " +
            "depuis l'éditeur SQL Supabase : `ALTER ROLE powerbi_reader CONNECTION LIMIT 10;`",
        },
      ],
    },
    {
      kind: "encadre",
      ton: "attention",
      texte: "**⚠️ Enregistrer ≠ Fermer et appliquer.** **Fermer et appliquer** applique tes " +
        "transformations au modèle *en mémoire* — ça n'écrit rien sur le disque. Le seul geste " +
        "qui rend ton travail permanent, c'est **Ctrl+S** (ou Fichier > Enregistrer) sur le " +
        "fichier `.pbix`. Un redémarrage forcé (mise à jour Windows, coupure) entre les deux " +
        "efface tout le travail non enregistré, même si tu avais déjà cliqué sur \"Fermer et " +
        "appliquer\".",
    },
    {
      kind: "notion",
      titre: "Notion — Rendre son travail permanent et le reprendre sans tout refaire",
      etiquette: "Bonnes pratiques",
      contenu: [
        {
          kind: "paragraphe",
          texte: "**Le réflexe à prendre** — `Ctrl+S` après chaque étape importante de " +
            "transformation (pas seulement en fin de sprint). Un projet Power BI long comme " +
            "celui-ci mérite d'être sauvegardé aussi souvent qu'un document Word.",
        },
        {
          kind: "paragraphe",
          texte: "**La récupération automatique existe, mais n'y compte pas** — Power BI " +
            "Desktop propose un filet de sécurité (`Fichier > Options et paramètres > Options " +
            "> Global > Récupération automatique`), avec un intervalle réglable. Utile après " +
            "un simple plantage logiciel, mais pas garanti après un arrêt brutal du système " +
            "(redémarrage forcé, coupure électrique) — ce n'est pas un substitut à " +
            "l'enregistrement manuel.",
        },
        {
          kind: "paragraphe",
          texte: "**Garder des copies versionnées** — à chaque jalon important (fin de sprint, " +
            "avant une transformation risquée), enregistrer une copie datée du fichier (ex. " +
            "`chantier-brvm_sprint2_v1.pbix`). Si un fichier se corrompt ou qu'une " +
            "transformation casse tout, tu reviens à la dernière version saine au lieu de tout " +
            "recommencer.",
        },
        {
          kind: "paragraphe",
          texte: "**Éviter les redémarrages forcés pendant une session de travail** — " +
            "configurer les **Heures d'activité** de Windows (`Paramètres > Windows Update > " +
            "Heures d'activité`) pour couvrir tes plages de travail habituelles. Windows évite " +
            "alors de redémarrer automatiquement pendant ces heures-là.",
        },
      ],
    },
    {
      kind: "titre",
      texte: "Repérer l'éditeur Power Query",
      numero: "1.7",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Shape the initial data",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/2-shape-data",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Voici ce que tu dois voir à l'écran une fois dans l'éditeur — utile pour t'y " +
        "retrouver au sprint 2 :",
    },
    {
      kind: "maquette-power-query",
      onglets: [
        "Accueil",
        "Transformer",
        "Ajouter une colonne",
        "Afficher",
        "Outils",
      ],
      formule: "fx = Table.NavigateToNavigationTable(...) — la barre de formule, où chaque " +
        "étape s'écrit en langage M",
      requetes: {
        noms: [
          "v_quotes_history",
          "v_stocks",
          "v_fundamentals",
          "v_user_profiles",
          "v_analyses_quota_daily",
          "v_abonnements",
          "v_dim_date",
        ],
        selection: "v_quotes_history",
      },
      apercu: {
        titre: "Aperçu — v_quotes_history",
        colonnes: ["ticker", "close", "session_date"],
        types: ["ABC123", "ABC123", "ABC123"],
        lignes: [
          ["SNTS", "18500", "2026-09-10"],
          ["SGBC", "7200", "2026-09-10"],
          ["ORAC", "9950", "2026-09-10"],
        ],
        note: "La ligne \"ABC123\" sous les en-têtes = le type de données de chaque colonne. " +
          "On la corrigera au sprint 2.",
      },
      etapes: {
        titre: "Étapes appliquées",
        noms: ["Source", "Navigation"],
        note: "Chaque action que tu feras au sprint 2 (renommer, filtrer, changer un type…) " +
          "s'ajoute ici comme une étape — modifiable, supprimable, dans l'ordre.",
      },
    },
    {
      kind: "titre",
      texte: "À faire avant le sprint 2",
      numero: "1.8",
      etiquette: "repere",
    },
    {
      kind: "checklist",
      items: [
        {
          id: "c1-1",
          texte: "Les 7 vues sont visibles dans le volet Requêtes de Power Query",
        },
        {
          id: "c1-2",
          texte: "Le mode `Import` a bien été choisi (pas DirectQuery)",
        },
        {
          id: "c1-3",
          texte: "Tu retrouves les 3 zones de l'éditeur : Requêtes, Aperçu, Étapes appliquées",
        },
        {
          id: "c1-4",
          texte: "Tu n'as encore cliqué sur aucun bouton de transformation — on garde les " +
            "données brutes pour le sprint 2",
        },
      ],
    },
  ],
};
