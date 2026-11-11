/**
 * =============================================================
 *  Fichier    : sprint-4.ts
 *  Projet     : Kalami Données
 *  Description: Chantier BRVM Power BI — sprint 4 : Modélisation.
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

export const sprint4: Sprint = {
  numero: 4,
  slug: "sprint-4",
  titre: "Modélisation",
  lede: "Objectif : relier correctement les 7 tables entre elles, comprendre les deux ou trois " +
    "pièges classiques de cardinalité, marquer la table de dates, et écrire tes trois " +
    "premières mesures DAX. C'est le sprint le plus dense — prends ton temps.",
  contenu: [
    {
      kind: "titre",
      texte: "Passer de Power Query au modèle",
      numero: "4.1",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "**Accueil → Fermer et appliquer.** Les 7 requêtes se chargent réellement dans le " +
        "modèle pour la première fois (jusqu'ici tu ne travaillais que sur un aperçu). Ça peut " +
        "prendre quelques dizaines de secondes — `v_dim_date` à elle seule contient plus de 8 " +
        "000 lignes (2010-2031).",
    },
    {
      kind: "paragraphe",
      texte: "Une fois chargé, passe dans la **vue Modèle** (icône en forme de schéma de " +
        "tables, dans le rail vertical à gauche de l'écran — sous les icônes Rapport et " +
        "Données).",
    },
    {
      kind: "titre",
      texte: "Vérifier les relations déjà auto-détectées",
      numero: "4.2",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Power BI tente de deviner des relations à partir de colonnes de même nom. Il a " +
        "probablement déjà créé, sans que tu n'aies rien fait :",
    },
    {
      kind: "liste",
      items: [
        "`v_stocks[ticker]` ↔ `v_quotes_history[ticker]`",
        "`v_stocks[ticker]` ↔ `v_fundamentals[ticker]`",
        "`v_user_profiles[pseudo_user_key]` ↔ `v_analyses_quota_daily[pseudo_user_key]`",
        "`v_user_profiles[pseudo_user_key]` ↔ `v_abonnements[pseudo_user_key]`",
      ],
    },
    {
      kind: "paragraphe",
      texte: "Vérifie chacune en double-cliquant sur la ligne de relation dans la vue Modèle : " +
        "le sens doit aller de la dimension (`v_stocks`, `v_user_profiles`) vers la table de " +
        "faits, en cardinalité **Un vers plusieurs (1:*)**.",
    },
    {
      kind: "titre",
      texte: "Créer les relations manquantes — les dates",
      numero: "4.3",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Les colonnes de dates n'ont pas le même nom d'une table à l'autre, donc " +
        "l'auto-détection les ignore. Fais-les à la main : clique sur `date_jour` dans " +
        "`v_dim_date`, glisse-dépose vers la colonne correspondante de chaque table de faits " +
        "datée au jour :",
    },
    {
      kind: "tableau",
      colonnesMono: [0, 1],
      entetes: [
        "Depuis",
        "Vers",
        "Cardinalité",
        "Sens du filtre",
      ],
      lignes: [
        [
          "v_dim_date[date_jour]",
          "v_quotes_history[session_date]",
          "1 : *",
          "Unique →",
        ],
        [
          "v_dim_date[date_jour]",
          "v_analyses_quota_daily[jour]",
          "1 : *",
          "Unique →",
        ],
        [
          "v_dim_date[date_jour]",
          "v_abonnements[date_debut]",
          "1 : *",
          "Unique → (active)",
        ],
        [
          "v_dim_date[date_jour]",
          "v_abonnements[date_fin]",
          "1 : *",
          "Unique → (inactive, voir 4.6)",
        ],
      ],
    },
    {
      kind: "titre",
      texte: "Cardinalité et sens de filtrage : pourquoi \"Unique\"",
      numero: "4.4",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "Pour chaque relation, laisse le **sens de filtrage croisé** sur **Unique** (la " +
        "dimension filtre la table de faits) plutôt que **Les deux** (bidirectionnel). Ici, " +
        "deux dimensions (`v_user_profiles`, `v_dim_date`) touchent plusieurs tables de faits " +
        "à la fois : en bidirectionnel, un filtre posé sur une page \"Revenus\" pourrait se " +
        "propager en silence jusqu'à des visuels de la page \"Utilisateurs\", et inversement — " +
        "des chiffres qui bougent sans qu'on comprenne pourquoi. En sens unique, chaque filtre " +
        "reste prévisible.",
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Règle simple pour débuter :** Unique par défaut, toujours. Tu passeras en " +
        "bidirectionnel plus tard, ponctuellement, seulement si un besoin précis l'exige et " +
        "que tu comprends pourquoi.",
    },
    {
      kind: "titre",
      texte: "Cas particulier : deux relations vers la même dimension",
      numero: "4.5",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "`v_abonnements` a deux colonnes de date (`date_debut`, `date_fin`) qui " +
        "pourraient toutes les deux se relier à `v_dim_date`. Power BI n'autorise qu'une seule " +
        "relation **active** à la fois entre deux tables — la seconde se crée automatiquement " +
        "en pointillé, **inactive** :",
    },
    {
      kind: "schema",
      gauche: ["v_dim_date"],
      droite: ["v_abonnements"],
      liens: [
        {
          de: 0,
          vers: 0,
          libelle: "date_debut · active",
        },
        {
          de: 0,
          vers: 0,
          libelle: "date_fin · inactive",
          inactif: true,
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Laisse `date_debut` active (elle répond à \"combien de nouveaux abonnements par " +
        "jour\"). La relation inactive sur `date_fin` reste disponible pour plus tard : on " +
        "l'activera ponctuellement dans une mesure avec `USERELATIONSHIP()` le jour où tu " +
        "voudras analyser les résiliations par date de fin (hors périmètre de ce chantier, " +
        "mais bon à savoir que c'est possible sans dupliquer la table).",
    },
    {
      kind: "titre",
      texte: "Pourquoi v_fundamentals ne se relie pas à v_dim_date",
      numero: "4.6",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "`v_fundamentals` est annuelle (`fiscal_year` est un entier comme `2025`, pas une " +
        "date calendaire précise). La relier à un calendrier journalier n'aurait pas de sens — " +
        "`fiscal_year` reste un simple champ de filtre/segment autonome dans les visuels de la " +
        "page Marché, sans relation dédiée.",
    },
    {
      kind: "titre",
      texte: "Une précision de vocabulaire : étoile ou galaxie ?",
      numero: "4.7",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "Au sprint 1, on a appelé ce montage \"schéma en étoile\" pour simplifier. " +
        "Maintenant que le modèle est sous tes yeux : un schéma en étoile *au sens strict* n'a " +
        "qu'**une seule** table de faits entourée de ses dimensions. Ici, on a **quatre** " +
        "tables de faits (`v_quotes_history`, `v_fundamentals`, `v_analyses_quota_daily`, " +
        "`v_abonnements`) qui partagent des dimensions communes (`v_dim_date`, `v_stocks`, " +
        "`v_user_profiles`) sans jamais se relier entre elles directement. Le terme exact est " +
        "**schéma en galaxie** (ou \"constellation de faits\") — le principe de fond " +
        "(dimensions séparées des faits) reste identique, seul le nom change selon le nombre " +
        "de tables de faits.",
    },
    {
      kind: "etoile",
      centre: { nom: "v_quotes_history", note: "17 779 lignes" },
      branches: [
        { nom: "v_dim_date", cle: "session_date" },
        { nom: "v_stocks", cle: "ticker" },
      ],
      legende:
        "Première étoile — axe marché. Deux dimensions suffisent : une étoile se juge à sa " +
        "forme, pas au nombre de ses branches.",
    },
    {
      kind: "etoile",
      centre: { nom: "v_abonnements", note: "revenus" },
      branches: [
        { nom: "v_dim_date", cle: "date_debut" },
        { nom: "v_user_profiles", cle: "pseudo_user_key" },
      ],
      legende:
        "Deuxième étoile — axe revenus. `v_dim_date` apparaît dans les deux : c'est cette " +
        "dimension partagée qui fait la galaxie.",
    },
    {
      kind: "encadre",
      ton: "info",
      texte: "Ce que ces deux schémas montrent, et que la vue Modèle masque : chaque table de " +
        "faits a **sa propre étoile**, et les dimensions communes sont le point de contact " +
        "entre elles. `v_dim_date` touche les quatre tables de faits, `v_stocks` en touche " +
        "deux, `v_user_profiles` deux. Aucune table de faits n'est reliée à une autre — c'est " +
        "la règle, et c'est elle qui garantit que les filtres se propagent proprement.",
    },
    {
      kind: "titre",
      texte: "Marquer v_dim_date comme table de dates",
      numero: "4.8",
      etiquette: "pratique",
    },
    {
      kind: "liste",
      items: [
        "Clique sur la table `v_dim_date` dans la vue Modèle (ou Données)",
        "Onglet contextuel **Outils de table** → **Marquer comme table de dates**",
        "Colonne de date : `date_jour` → Valider",
      ],
      ordonnee: true,
    },
    {
      kind: "encadre",
      ton: "attention",
      texte: "**Pourquoi c'est obligatoire :** les fonctions de time intelligence DAX du " +
        "sprint 5 (`SAMEPERIODLASTYEAR`, `DATESYTD`…) exigent une table marquée comme table de " +
        "dates, avec une colonne couvrant des dates uniques et continues — ce que `v_dim_date` " +
        "garantit par construction (2010-01-01 à 2031-12-31, un jour par ligne, sans trou).",
    },
    {
      kind: "titre",
      texte: "Organiser le modèle : une table dédiée aux mesures",
      numero: "4.9",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Avant d'écrire des mesures DAX, crée un endroit propre pour les ranger plutôt " +
        "que de les éparpiller sur les 7 tables de données :",
    },
    {
      kind: "liste",
      items: [
        "**Accueil → Entrer des données**",
        "Laisse le tableau vide, nomme-le `_Mesures` (le tiret bas la fait remonter en haut de " +
          "la liste des tables) → **Charger**",
      ],
      ordonnee: true,
    },
    {
      kind: "paragraphe",
      texte: "C'est dans cette table que vivront toutes tes mesures — jamais de colonne de " +
        "données dedans, uniquement des mesures.",
    },
    {
      kind: "titre",
      texte: "Tes trois premières mesures",
      numero: "4.10",
      etiquette: "pratique",
    },
    {
      kind: "notion",
      titre: "Notion — DAX, c'est quoi au juste ?",
      etiquette: "DAX",
      contenu: [
        {
          kind: "paragraphe",
          texte: "**DAX** (`Data Analysis eXpressions`) est le langage de formules de Power BI " +
            "— le même esprit qu'une formule Excel, mais conçu pour raisonner sur des tables " +
            "entières plutôt que sur des cellules isolées.",
        },
        {
          kind: "paragraphe",
          texte: "**Utilité.** DAX sert à créer deux choses : des **colonnes calculées** (vues " +
            "au sprint 3 — une valeur ajoutée à chaque ligne d'une table, figée au chargement) " +
            "et des **mesures** (ci-dessous — un calcul qui se refait à la volée selon ce que " +
            "l'utilisateur regarde). La quasi totalité du travail DAX porte sur les mesures, " +
            "car ce sont elles qui rendent un dashboard interactif.",
        },
        {
          kind: "paragraphe",
          texte: "**Contexte.** Le mot-clé le plus important de DAX est `CALCULATE` : il " +
            "permet de changer le contexte de filtre d'un calcul (par exemple, comparer le " +
            "volume du titre sélectionné contre celui de *tout* le marché, dans la même " +
            "visualisation). Le sprint 5 lui est entièrement consacré.",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Clic droit sur `_Mesures` → **Nouvelle mesure** :",
    },
    {
      kind: "code",
      accents: ["CALCULATE", "DISTINCTCOUNT", "TRUE", "SUM"],
      texte: "Nombre de titres actifs = CALCULATE(\n    DISTINCTCOUNT(v_stocks[ticker]),\n    " +
        "v_stocks[is_active] = TRUE()\n)\n\nVolume total = " +
        "SUM(v_quotes_history[volume])\n\nTotal abonnements (FCFA) = " +
        "SUM(v_abonnements[montant])",
    },
    {
      kind: "paragraphe",
      texte: "Différence à retenir avec une colonne calculée (sprint 3) : une **mesure** ne se " +
        "calcule pas ligne par ligne au chargement, elle se recalcule à la volée selon le " +
        "*contexte de filtre* du visuel qui l'affiche (le titre sélectionné, la période du " +
        "segment…). C'est ce qui la rend réutilisable partout dans le dashboard sans jamais " +
        "dupliquer de donnée.",
    },
    {
      kind: "titre",
      texte: "À faire avant le sprint 5",
      numero: "4.11",
      etiquette: "repere",
    },
    {
      kind: "checklist",
      items: [
        {
          id: "c4-1",
          texte: "Les 4 relations auto-détectées (4.2) sont vérifiées en 1:*, sens Unique",
        },
        {
          id: "c4-2",
          texte: "Les 4 relations de dates (4.3) sont créées manuellement",
        },
        {
          id: "c4-3",
          texte: "date_debut est active, date_fin est inactive sur v_abonnements",
        },
        {
          id: "c4-4",
          texte: "v_dim_date est marquée comme table de dates",
        },
        {
          id: "c4-5",
          texte: "La table _Mesures existe avec les 3 premières mesures",
        },
      ],
    },
  ],
};
