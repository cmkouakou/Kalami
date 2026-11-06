/**
 * =============================================================
 *  Fichier    : sprint-6.ts
 *  Projet     : Kalami Données
 *  Description: Chantier BRVM Power BI — sprint 6 : Présentation.
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

export const sprint6: Sprint = {
  numero: 6,
  slug: "sprint-6",
  titre: "Présentation",
  lede: "Objectif : transformer les mesures des sprints 4-5 en un dashboard qu'on peut " +
    "réellement lire — 3 pages organisées par axe, les bons visuels pour les bonnes questions, " +
    "et des segments qui filtrent proprement. Le thème visuel et les finitions viennent au " +
    "sprint 7.",
  contenu: [
    {
      kind: "titre",
      texte: "Une page par axe, pas un fourre-tout",
      numero: "6.1",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Avec 4 tables de faits et 3 dimensions, tout mettre sur une seule page " +
        "produirait un mur de visuels sans hiérarchie de lecture. Crée 3 pages (clic droit sur " +
        "l'onglet de page en bas → Renommer) :",
    },
    {
      kind: "tableau",
      colonnesMono: [0],
      entetes: [
        "Page",
        "Question à laquelle elle répond",
        "Tables mobilisées",
      ],
      lignes: [
        [
          "Marché",
          "Comment se comportent les titres cotés ?",
          "v_stocks, v_quotes_history, v_fundamentals",
        ],
        [
          "Usage",
          "Comment la plateforme est-elle utilisée ?",
          "v_user_profiles, v_analyses_quota_daily",
        ],
        [
          "Revenus",
          "Combien rapportent les abonnements, et comment ça évolue ?",
          "v_abonnements",
        ],
      ],
    },
    {
      kind: "paragraphe",
      texte: "`v_dim_date` n'a pas sa propre page : elle alimente les segments de date " +
        "présents sur les trois.",
    },
    {
      kind: "titre",
      texte: "Choisir le visuel selon la question, pas selon le goût",
      numero: "6.2",
      etiquette: "info",
    },
    {
      kind: "tableau",
      colonnesMono: [1],
      entetes: [
        "Question posée",
        "Visuel Power BI",
        "Exemple avec nos mesures",
      ],
      lignes: [
        [
          "Un seul chiffre clé, tout de suite",
          "Carte",
          "Nombre de titres actifs",
        ],
        [
          "Un chiffre qui évolue dans le temps",
          "Courbe",
          "Volume total par jour",
        ],
        [
          "Comparer des catégories entre elles",
          "Graphique à colonnes groupées",
          "Volume par ticker",
        ],
        [
          "Une part d'un tout, peu de catégories",
          "Anneau",
          "Répartition des abonnements par plan",
        ],
        [
          "Le détail ligne par ligne, pour vérifier",
          "Table / Matrice",
          "Historique des cours d'un titre",
        ],
      ],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Piège fréquent chez les débutants :** la jauge et le graphique en secteurs " +
        "(camembert) sont visuellement flatteurs mais rarement les bons choix — la jauge n'a " +
        "de sens qu'avec un objectif explicite (ex. un quota), et le camembert devient " +
        "illisible au-delà de 4-5 parts. Préfère la carte pour un chiffre seul, l'anneau ou la " +
        "colonne pour une répartition.",
    },
    {
      kind: "titre",
      texte: "Page Marché — construction",
      numero: "6.3",
      etiquette: "pratique",
    },
    {
      kind: "liste",
      items: [
        "Rangée de **cartes** en haut : Nombre de titres actifs, Volume total, Volume YTD",
        "**Courbe** : axe X = `v_dim_date[date_jour]`, valeur = `v_quotes_history[close]`, " +
          "légende = `v_stocks[ticker]`",
        "**Table** : ticker, secteur, dernier cours, variation % — triée par variation " +
          "décroissante",
      ],
      ordonnee: true,
    },
    {
      kind: "titre",
      texte: "Page Usage — construction",
      numero: "6.4",
      etiquette: "pratique",
    },
    {
      kind: "liste",
      items: [
        "**Carte** : nombre d'analyses du jour (`SUM(v_analyses_quota_daily[nb_analyses])` — " +
          "adapte au nom réel de la colonne de comptage dans ta requête)",
        "**Courbe** : analyses par jour sur `v_dim_date[date_jour]`",
        "**Colonnes groupées** : répartition des profils par " +
          "`v_user_profiles[type_investisseur]` si la colonne est incluse dans ta vue",
      ],
      ordonnee: true,
    },
    {
      kind: "titre",
      texte: "Page Revenus — construction",
      numero: "6.5",
      etiquette: "pratique",
    },
    {
      kind: "liste",
      items: [
        "**Cartes** : Total abonnements (FCFA), Évolution volume vs N-1 (%) adaptée en " +
          "\"Évolution abonnements\"",
        "**Courbe** : Cumul abonnements (FCFA) — la courbe ne doit jamais redescendre (sprint 5)",
        "**Anneau** : répartition par plan si `v_abonnements` expose une colonne de plan",
      ],
      ordonnee: true,
    },
    {
      kind: "titre",
      texte: "Segments : filtrer sans dupliquer les pages",
      numero: "6.6",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Ajoute un **segment** (visuel \"Segment\") sur `v_dim_date[annee]` ou une plage " +
        "de dates, posé une fois sur chaque page. Pour qu'un choix de période reste cohérent " +
        "en changeant de page :",
    },
    {
      kind: "liste",
      items: [
        "**Affichage → Synchroniser les segments**",
        "Sélectionne le segment de date → coche les 3 pages dans l'onglet Synchroniser",
      ],
      ordonnee: true,
    },
    {
      kind: "paragraphe",
      texte: "Ajoute un second segment sur `v_stocks[ticker]`, celui-là uniquement sur la page " +
        "Marché (pas de sens ailleurs) — pas besoin de synchronisation.",
    },
    {
      kind: "titre",
      texte: "Filtres de page vs filtres de visuel",
      numero: "6.7",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "Le volet **Filtres** à droite propose 3 niveaux : sur ce visuel, sur cette page, " +
        "sur toutes les pages. Réserve **Filtres sur cette page** à une exclusion durable (ex. " +
        "retirer un ticker radié de la cote sur la page Marché) — un filtre que l'utilisateur " +
        "du dashboard n'a pas besoin de changer. Pour tout ce qui doit rester manipulable à " +
        "l'usage, un **segment** visible vaut mieux qu'un filtre caché dans le volet : " +
        "personne ne pense à ouvrir ce volet pour comprendre pourquoi un chiffre semble " +
        "incomplet.",
    },
    {
      kind: "titre",
      texte: "Alignement et grille",
      numero: "6.8",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "**Affichage → Aligner sur la grille** (et **Ancrer aux éléments**) avant de " +
        "positionner le moindre visuel — un dashboard où les cartes du haut ne sont pas " +
        "alignées sur les bords des graphiques du dessous se remarque instantanément, même par " +
        "quelqu'un qui ne saurait pas dire pourquoi. Garde une marge extérieure identique sur " +
        "les 3 pages et un espacement constant entre visuels.",
    },
    {
      kind: "titre",
      texte: "À faire avant le sprint 7",
      numero: "6.9",
      etiquette: "repere",
    },
    {
      kind: "checklist",
      items: [
        {
          id: "c6-1",
          texte: "Les 3 pages (Marché, Usage, Revenus) existent et sont renommées",
        },
        {
          id: "c6-2",
          texte: "Chaque page a ses cartes KPI + au moins un visuel temporel + un visuel de détail",
        },
        {
          id: "c6-3",
          texte: "Le segment de date est synchronisé sur les 3 pages",
        },
        {
          id: "c6-4",
          texte: "Le segment de ticker n'existe que sur la page Marché",
        },
        {
          id: "c6-5",
          texte: "Les visuels sont alignés sur une grille cohérente d'une page à l'autre",
        },
      ],
    },
  ],
};
