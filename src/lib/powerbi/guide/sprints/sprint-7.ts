/**
 * =============================================================
 *  Fichier    : sprint-7.ts
 *  Projet     : Kalami Données
 *  Description: Chantier BRVM Power BI — sprint 7 : Finalisation.
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

export const sprint7: Sprint = {
  numero: 7,
  slug: "sprint-7",
  titre: "Finalisation",
  lede: "Dernier sprint : un thème visuel cohérent, des visuels qui interagissent " +
    "intelligemment, des infobulles utiles, une vérification de performance, puis la " +
    "publication. Après ça, ton dashboard d'entraînement est terminé.",
  contenu: [
    {
      kind: "titre",
      texte: "Un thème visuel, pas des couleurs par défaut",
      numero: "7.1",
      etiquette: "pratique",
    },
    {
      kind: "liste",
      items: [
        "**Affichage → Thèmes → Personnaliser le thème actuel**",
        "Onglet **Couleurs** : choisis une couleur d'accent (les 12 couleurs de la palette " +
          "découlent d'elle) — par exemple un bleu sobre pour la page Marché, cohérent avec " +
          "l'univers financier plutôt qu'une palette arc-en-ciel par défaut",
        "Onglet **Texte** : une seule police pour tout le rapport (celle de Power BI par " +
          "défaut, Segoe UI, est un choix parfaitement raisonnable — l'important est qu'elle " +
          "soit unique)",
      ],
      ordonnee: true,
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Pourquoi ça compte plus qu'il n'y paraît :** un thème appliqué une fois se " +
        "répercute sur les 3 pages automatiquement. C'est l'inverse d'un travail visuel fait " +
        "visuel par visuel, qui devient impossible à maintenir cohérent dès qu'on ajoute une " +
        "page.",
    },
    {
      kind: "titre",
      texte: "Mise en forme conditionnelle sur les tableaux",
      numero: "7.2",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Sur la table de la page Marché (sprint 6), la colonne de variation % gagne à " +
        "être lue d'un coup d'œil plutôt que chiffre par chiffre :",
    },
    {
      kind: "liste",
      items: [
        "Sélectionne le visuel Table → colonne `change_pct`",
        "**Mise en forme conditionnelle → Barres de données** (ou **Échelle de couleurs**)",
        "Couleur négative / positive cohérente avec l'intuition : rouge pour une baisse, vert " +
          "pour une hausse — l'inverse dérouterait n'importe quel lecteur habitué aux marchés " +
          "financiers",
      ],
      ordonnee: true,
    },
    {
      kind: "titre",
      texte: "Interactions entre visuels",
      numero: "7.3",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Par défaut, cliquer sur une colonne d'un graphique filtre tous les autres " +
        "visuels de la page. Ce n'est pas toujours souhaitable :",
    },
    {
      kind: "liste",
      items: [
        "Sélectionne un visuel (ex. la courbe des cours) → onglet **Format → Modifier les " +
          "interactions**",
        "Pour chaque autre visuel de la page, choisis : **Filtrer** (comportement par défaut), " +
          "**Surligner** (garde tout visible mais met en évidence la sélection — souvent " +
          "préférable sur un graphique de comparaison), ou **Aucune** (le visuel ignore la " +
          "sélection — pour une carte KPI qui doit rester une vue d'ensemble)",
      ],
      ordonnee: true,
    },
    {
      kind: "encadre",
      ton: "attention",
      texte: "**Cas concret :** les cartes KPI en haut de chaque page (sprint 6) devraient " +
        "presque toujours être en **Aucune** — elles perdent leur utilité de \"vue " +
        "d'ensemble\" si elles se recalculent au moindre clic sur un visuel voisin.",
    },
    {
      kind: "titre",
      texte: "Infobulles personnalisées",
      numero: "7.4",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Une infobulle par défaut ne montre que le champ survolé. Pour afficher 2-3 " +
        "mesures de contexte au survol d'un point de la courbe des cours :",
    },
    {
      kind: "liste",
      items: [
        "Nouvelle page → **Format de la page → Type de page → Info-bulle** (redimensionne-la " +
          "en petit format, ex. 320×240)",
        "Dépose-y une carte ou deux (ex. Volume total, Évolution vs N-1) filtrées par le " +
          "contexte survolé",
        "Retourne sur le visuel principal → **Format → Info-bulles → Type : Page de rapport** " +
          "→ sélectionne cette page",
      ],
      ordonnee: true,
    },
    {
      kind: "titre",
      texte: "Vérifier la performance avant de livrer",
      numero: "7.5",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Fix performance issues",
          url: "https://learn.microsoft.com/fr-ca/training/modules/get-data/8-performance-issues",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "**Affichage → Analyseur de performances → Actualiser les visuels** : chaque " +
        "visuel affiche son temps de calcul DAX et de rendu. Un visuel qui dépasse largement " +
        "les autres (souvent une table avec trop de lignes, ou une mesure avec `DISTINCTCOUNT` " +
        "sur une grande table) mérite d'être simplifié — soit en réduisant les lignes " +
        "affichées, soit en déplaçant le calcul lourd dans une mesure dédiée plus simple.",
    },
    {
      kind: "paragraphe",
      texte: "L'Analyseur de performances mesure le **rapport**. Si c'est l'**actualisation** " +
        "qui traîne, le problème est en amont et l'outil est ailleurs : dans l'éditeur Power " +
        "Query, onglet **Outils** → **Démarrer les diagnostics**, tu rejoues tes " +
        "transformations, puis **Arrêter les diagnostics**. **Diagnostiquer l'étape** donne la " +
        "durée de chaque étape prise isolément — l'étape nettement plus lente que les autres " +
        "est ton point de départ.",
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Les deux outils répondent à deux questions différentes.** Le query folding " +
        "(2.8) te dit *si* le travail est délégué à Supabase. Les diagnostics te disent *où " +
        "part le temps*. Vérifie le folding en premier : une étape lente qui ne folde pas est " +
        "souvent une étape mal placée, pas une étape intrinsèquement coûteuse.",
    },
    {
      kind: "titre",
      texte: "Alléger le modèle avant de livrer",
      numero: "7.6",
      etiquette: "repere",
    },
    {
      kind: "paragraphe",
      texte: "Microsoft publie huit techniques de réduction des données pour les modèles " +
        "d'importation. Le tableau ci-dessous les reprend toutes, avec ce que tu en as déjà " +
        "fait : cinq sont cochées sans que tu aies eu à les apprendre, parce que le travail " +
        "en amont dans les vues `reporting.*` les a appliquées naturellement.",
    },
    {
      kind: "tableau",
      entetes: ["Technique", "Chez toi", "Où"],
      lignes: [
        ["Supprimer les colonnes inutiles", "Fait", "Vues `reporting.*`, sprint 1"],
        ["Supprimer les lignes inutiles", "Fait", "Filtres dans les vues, sprint 1"],
        ["Élever le grain des tables de faits", "Inutile", "17 779 lignes : le détail reste exploitable"],
        ["Optimiser les types, préférer le numérique", "À vérifier", "Sprint 2, sur `v_quotes_history`"],
        ["Colonnes Power Query plutôt que calculées", "Fait", "Sprint 3"],
        ["Désactiver le chargement des requêtes", "Fait", "Requêtes bac à sable, sprint 3"],
        ["Désactiver la date/heure automatique", "Fait", "Sprint 4, en marquant `v_dim_date`"],
        ["Stockage DirectQuery pour certaines tables", "Hors sujet", "Volume trop faible pour en tirer un gain"],
      ],
      colonnesMono: [],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Ce que ce tableau dit vraiment.** Les cinq « fait » ne viennent pas de " +
        "Power BI : ils viennent du travail SQL en amont. C'est la règle d'or du module " +
        "précédent — traiter le maximum dans la source native — et elle a pour effet " +
        "secondaire de cocher la moitié d'une liste d'optimisation officielle.",
    },
    {
      kind: "notion",
      titre: "L'actualisation incrémentielle, pour plus tard",
      etiquette: "architecture",
      contenu: [
        {
          kind: "paragraphe",
          texte: "Par défaut, actualiser une table **supprime toutes ses données et les " +
            "recharge**. Sur une grande table de faits, c'est une charge lourde pour la source " +
            "comme pour Power BI.",
        },
        {
          kind: "paragraphe",
          texte: "L'**actualisation incrémentielle** découpe la table en partitions par " +
            "période et ne recharge que celles qui ont changé. Les actualisations deviennent " +
            "plus rapides, plus fiables, et moins coûteuses des deux côtés.",
        },
        {
          kind: "paragraphe",
          texte: "À ton volume, ça n'apporte rien aujourd'hui : quelques dizaines de milliers " +
            "de lignes se rechargent en quelques secondes. Ça deviendra pertinent si " +
            "`v_quotes_history` atteint les centaines de milliers de lignes — autrement dit " +
            "après quelques années de cotations. À garder en tête comme culture " +
            "d'architecture, pas comme action.",
        },
      ],
    },
    { kind: "titre", texte: "Publier", numero: "7.7", etiquette: "pratique" },
    {
      kind: "liste",
      items: [
        "**Accueil → Publier**",
        "Connecte-toi avec ton compte (une licence gratuite suffit pour publier dans **Mon " +
          "espace de travail** à usage personnel — pas besoin de Power BI Pro pour ce chantier " +
          "d'entraînement)",
        "Choisis **Mon espace de travail** comme destination",
      ],
      ordonnee: true,
    },
    {
      kind: "paragraphe",
      texte: "Le rapport devient consultable depuis app.powerbi.com, avec les mêmes pages, " +
        "segments et interactions que dans Power BI Desktop.",
    },
    {
      kind: "encadre",
      ton: "attention",
      texte: "**Ce que la licence gratuite plafonne.** Mon espace de travail tourne sur une " +
        "**capacité partagée**, qui impose deux limites : **1 Go par dataset** et **8 " +
        "actualisations planifiées par jour**. Aucune ne te gêne ici — ton modèle compressé " +
        "pèse quelques mégaoctets, et les cotations BRVM tombent une fois par séance. Mais le " +
        "savoir avant de publier évite de chercher longtemps le jour où une actualisation " +
        "échoue sans explication.",
      points: [
        "Le 1 Go porte sur la **taille compressée du modèle**, pas sur le volume lu dans Supabase",
        "Au-delà de la limite, l'actualisation **échoue** — elle ne se dégrade pas, elle s'arrête",
        "Une capacité dédiée (Premium) monte à 10 Go et 48 actualisations par jour",
      ],
    },
    {
      kind: "titre",
      texte: "Checklist finale — les 7 sprints",
      numero: "7.8",
      etiquette: "repere",
    },
    {
      kind: "checklist",
      items: [
        {
          id: "c7-1",
          texte: "Un thème visuel unique est appliqué aux 3 pages",
        },
        {
          id: "c7-2",
          texte: "La mise en forme conditionnelle est posée sur au moins un tableau",
        },
        {
          id: "c7-3",
          texte: "Les interactions des cartes KPI sont passées en \"Aucune\"",
        },
        {
          id: "c7-4",
          texte: "Au moins une infobulle personnalisée est configurée",
        },
        {
          id: "c7-5",
          texte: "L'Analyseur de performances a été exécuté, aucun visuel anormalement lent",
        },
        {
          id: "c7-6",
          texte: "Le rapport est publié dans Mon espace de travail",
        },
      ],
    },
    {
      kind: "titre",
      texte: "Pour aller plus loin",
      numero: "7.9",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "Ce chantier a volontairement limité le modèle à 7 des 13 vues disponibles dans " +
        "le schéma `reporting` (sprint 1). La méthode reste identique pour ajouter les 6 " +
        "restantes (`v_analyst_forecasts`, `v_evenements_titres`, `v_analytics_events`, " +
        "`v_blog_page_views`, `v_academie_acces`, `v_portfolio_transactions`) : Power Query → " +
        "nettoyer → transformer → relier → mesurer → présenter. Deux pistes naturelles pour " +
        "une prochaine itération, non couvertes ici : la **sécurité au niveau des lignes** " +
        "(RLS, utile si ce rapport devait un jour être partagé avec plusieurs personnes voyant " +
        "chacune des données différentes) et les **signets** (bookmarks, pour construire une " +
        "navigation entre plusieurs vues d'une même page). Le tien est fini — la prochaine " +
        "étape, comme tu le disais au départ, est de construire le vrai à partir de cette " +
        "méthode.",
    },
  ],
};
