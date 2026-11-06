/**
 * =============================================================
 *  Fichier    : sprint-5.ts
 *  Projet     : Kalami Données
 *  Description: Chantier BRVM Power BI — sprint 5 : DAX avancé.
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

export const sprint5: Sprint = {
  numero: 5,
  slug: "sprint-5",
  titre: "DAX avancé",
  lede: "Objectif : écrire des mesures qui comparent des périodes entre elles (année sur " +
    "année, cumul depuis le début de l'année), et des ratios sûrs qui ne cassent jamais sur " +
    "une division par zéro. C'est le sprint où DAX cesse d'être décoratif et devient " +
    "réellement utile.",
  contenu: [
    {
      kind: "titre",
      texte: "Ce que change CALCULATE",
      numero: "5.1",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "Toutes les mesures du sprint 4 (`Volume total`, `Nombre de titres actifs`…) " +
        "héritent silencieusement du **contexte de filtre** posé par le visuel qui les affiche " +
        ": un tableau par titre les recalcule ticker par ticker, un segment de date les " +
        "recalcule période par période. `CALCULATE` est la seule fonction DAX qui peut " +
        "**modifier** ce contexte plutôt que le subir — c'est elle qui rend possible tout ce " +
        "qui suit : comparer une période à une autre exige de désobéir, dans un coin de la " +
        "formule, au filtre que le visuel a posé.",
    },
    {
      kind: "titre",
      texte: "Time intelligence : cumul depuis le début de l'année",
      numero: "5.2",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Ces fonctions exigent que `v_dim_date` soit marquée comme table de dates (fait " +
        "au sprint 4) — sans ça, elles renvoient une erreur ou un résultat silencieusement " +
        "faux.",
    },
    {
      kind: "code",
      texte: "Volume YTD =\nCALCULATE(\n    [Volume total],\n    " +
        "DATESYTD(v_dim_date[date_jour])\n)",
    },
    {
      kind: "paragraphe",
      texte: "Posée dans un visuel par mois, cette mesure ne montre pas le volume du mois " +
        "seul, mais le cumul depuis le 1er janvier jusqu'à ce mois — `DATESYTD` remplace le " +
        "filtre de date du visuel par la plage \"du 1er janvier de l'année en cours jusqu'à la " +
        "date affichée\".",
    },
    {
      kind: "titre",
      texte: "Comparer une année à l'autre",
      numero: "5.3",
      etiquette: "pratique",
    },
    {
      kind: "code",
      texte: "Volume N-1 (même période) =\nCALCULATE(\n    [Volume total],\n    " +
        "SAMEPERIODLASTYEAR(v_dim_date[date_jour])\n)\n\nÉvolution volume vs N-1 (%) " +
        "=\nDIVIDE(\n    [Volume total] - [Volume N-1 (même période)],\n    [Volume N-1 (même " +
        "période)]\n)",
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Pourquoi DIVIDE et pas l'opérateur /** — si le titre n'avait aucune " +
        "transaction l'année précédente, `[Volume N-1]` vaut 0 ou vide, et `/` renverrait une " +
        "erreur qui casserait tout le visuel. `DIVIDE(numérateur, dénominateur)` renvoie un " +
        "blanc proprement dans ce cas — troisième argument optionnel pour une valeur de repli " +
        "si tu en veux une précise (ex. 0).",
    },
    {
      kind: "titre",
      texte: "Cumul glissant (running total)",
      numero: "5.4",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Même principe que le YTD, mais sans repartir de zéro chaque 1er janvier — utile " +
        "pour `v_abonnements` où on veut voir le total encaissé progresser sans jamais " +
        "redescendre :",
    },
    {
      kind: "code",
      texte: "Cumul abonnements (FCFA) =\nCALCULATE(\n    [Total abonnements (FCFA)],\n    " +
        "FILTER(\n        ALLSELECTED(v_dim_date),\n        v_dim_date[date_jour] <= " +
        "MAX(v_dim_date[date_jour])\n    )\n)",
    },
    {
      kind: "paragraphe",
      texte: "`ALLSELECTED(v_dim_date)` retire temporairement le filtre de date posé par le " +
        "visuel (sans toucher aux autres filtres, par ex. un segment sur le plan tarifaire), " +
        "puis `FILTER` ne garde que les dates antérieures ou égales à la date de la ligne " +
        "courante — chaque ligne du visuel additionne donc tout ce qui la précède.",
    },
    {
      kind: "titre",
      texte: "Un ratio bancaire, proprement",
      numero: "5.5",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "`v_fundamentals` contient `credit_xof` et `depot_xof`, nuls pour les sociétés " +
        "non bancaires (sprint 2). Une mesure de ratio doit rester silencieuse sur ces lignes " +
        "plutôt que d'afficher une erreur :",
    },
    {
      kind: "code",
      texte: "Ratio Crédits/Dépôts =\nDIVIDE(\n    SUM(v_fundamentals[credit_xof]),\n    " +
        "SUM(v_fundamentals[depot_xof])\n)",
    },
    {
      kind: "paragraphe",
      texte: "Posée dans un tableau mêlant banques et non-banques, cette mesure affiche un " +
        "ratio pour les premières et une cellule vide pour les secondes — exactement le " +
        "comportement voulu, sans `IF` ni test de nullité écrit à la main.",
    },
    {
      kind: "titre",
      texte: "Mettre le pourcentage en forme correctement",
      numero: "5.6",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "DAX ne fait pas la distinction entre \"0,145\" et \"14,5 %\" — c'est un nombre " +
        "décimal, point. Une fois la mesure `Évolution volume vs N-1 (%)` créée :",
    },
    {
      kind: "liste",
      items: [
        "Sélectionne la mesure dans le volet Données",
        "Onglet contextuel **Outils de mesure** → format **%**, 1 décimale",
      ],
      ordonnee: true,
    },
    {
      kind: "encadre",
      ton: "attention",
      texte: "**Piège à éviter :** ne jamais multiplier la formule par 100 pour \"faire " +
        "apparaître\" le pourcentage — la valeur stockée doit rester le ratio brut (0,145), " +
        "seule sa *mise en forme d'affichage* change. Multiplier par 100 fausserait tout " +
        "calcul ultérieur qui réutilise cette mesure (moyenne, écart, tri).",
    },
    {
      kind: "titre",
      texte: "À faire avant le sprint 6",
      numero: "5.7",
      etiquette: "repere",
    },
    {
      kind: "checklist",
      items: [
        {
          id: "c5-1",
          texte: "Volume YTD créée et testée sur un visuel par mois",
        },
        {
          id: "c5-2",
          texte: "Volume N-1 (même période) et Évolution vs N-1 (%) créées",
        },
        {
          id: "c5-3",
          texte: "La mesure d'évolution est formatée en % (pas de ×100 dans la formule)",
        },
        {
          id: "c5-4",
          texte: "Cumul abonnements créé et vérifié (courbe qui ne redescend jamais)",
        },
        {
          id: "c5-5",
          texte: "Ratio Crédits/Dépôts créé avec DIVIDE, vide sur les non-banques",
        },
      ],
    },
  ],
};
