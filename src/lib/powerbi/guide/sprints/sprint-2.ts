/**
 * =============================================================
 *  Fichier    : sprint-2.ts
 *  Projet     : Kalami Données
 *  Description: Chantier BRVM Power BI — sprint 2 : Nettoyage des données.
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

export const sprint2: Sprint = {
  numero: 2,
  slug: "sprint-2",
  titre: "Nettoyage des données",
  lede: "Objectif : que les 7 tables aient des types corrects, des valeurs nulles gérées en " +
    "connaissance de cause, aucun doublon, et des noms de colonnes lisibles — avant de passer " +
    "à la transformation (sprint 3) et au modèle (sprint 4).",
  contenu: [
    {
      kind: "titre",
      texte: "Le principe : une recette, pas un bricolage",
      numero: "2.1",
      etiquette: "info",
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
      texte: "Chaque action que tu fais dans l'éditeur Power Query — changer un type, renommer " +
        "une colonne, filtrer une ligne — s'ajoute comme une **étape** dans le volet `Étapes " +
        "appliquées` (repéré au sprint 1). Deux conséquences importantes :",
    },
    {
      kind: "liste",
      items: [
        "Rien n'est destructif : tu peux revenir sur une étape, la modifier ou la supprimer " +
          "sans tout recommencer.",
        "L'ordre compte : chaque étape s'appuie sur le résultat de la précédente. On nettoie " +
          "donc dans un ordre précis (2.6), pas au hasard.",
      ],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Repère utile :** à tout moment, clique sur une étape passée dans la liste pour " +
        "voir l'état des données à ce stade précis — pratique pour comprendre ce qu'une étape " +
        "a changé.",
    },
    {
      kind: "titre",
      texte: "Corriger les types de données",
      numero: "2.2",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Evaluate and change column data types",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/4-column-data-types",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Power Query devine les types automatiquement à l'import, mais il se trompe " +
        "souvent sur les dates et sur les montants. Sélectionne la colonne → onglet " +
        "**Accueil** → **Type de données** (ou clique sur l'icône de type dans l'en-tête de " +
        "colonne).",
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Règle de lecture des 7 tableaux ci-dessous :** chaque vue est listée avec " +
        "*l'intégralité* de ses colonnes — aucune n'est passée sous silence. Une colonne " +
        "marquée `Texte — déjà correct` n'a besoin d'aucune action : Power Query la détecte " +
        "bien telle quelle, on la laisse. Seules les colonnes marquées avec un type numérique, " +
        "date ou logique doivent être corrigées manuellement, comme expliqué plus haut.",
    },
    {
      kind: "paragraphe",
      texte: "**v_quotes_history** — 8 colonnes",
    },
    {
      kind: "tableau",
      colonnesMono: [0],
      entetes: [
        "Colonne",
        "Type Power Query correct",
      ],
      lignes: [
        [
          "ticker",
          "Texte — déjà correct",
        ],
        [
          "close",
          "Nombre décimal fixe",
        ],
        [
          "change_pct",
          "Nombre décimal fixe",
        ],
        [
          "direction",
          "Texte — déjà correct `(up / down / unchanged)`",
        ],
        ["session_date", "Date"],
        [
          "volume",
          "Nombre entier",
        ],
        [
          "valeur_transigee",
          "Nombre décimal fixe",
        ],
        [
          "per_officiel",
          "Nombre décimal fixe",
        ],
      ],
    },
    {
      kind: "paragraphe",
      texte: "**v_stocks** — 8 colonnes",
    },
    {
      kind: "tableau",
      colonnesMono: [0],
      entetes: [
        "Colonne",
        "Type Power Query correct",
      ],
      lignes: [
        [
          "ticker",
          "Texte — déjà correct",
        ],
        [
          "name",
          "Texte — déjà correct",
        ],
        [
          "country",
          "Texte — déjà correct `(CI, SN, BF…)`",
        ],
        [
          "sector",
          "Texte — déjà correct",
        ],
        [
          "currency",
          "Texte — déjà correct `(XOF)`",
        ],
        [
          "shares_outstanding",
          "Nombre entier",
        ],
        ["is_active", "Vrai/Faux"],
        [
          "indices",
          "Texte — déjà correct `(ex. BRVM30, BRVM-C)`",
        ],
      ],
    },
    {
      kind: "paragraphe",
      texte: "**v_fundamentals** — 21 colonnes",
    },
    {
      kind: "tableau",
      colonnesMono: [0],
      entetes: [
        "Colonne",
        "Type Power Query correct",
      ],
      lignes: [
        [
          "ticker",
          "Texte — déjà correct",
        ],
        [
          "fiscal_year",
          "Nombre entier",
        ],
        [
          "bna",
          "Nombre décimal fixe",
        ],
        [
          "dpa",
          "Nombre décimal fixe",
        ],
        [
          "vca",
          "Nombre décimal fixe",
        ],
        [
          "bna_growth_1y",
          "Nombre décimal `(croissance %, pas de l'argent)`",
        ],
        [
          "bna_growth_3y",
          "Nombre décimal",
        ],
        [
          "source",
          "Texte — déjà correct",
        ],
        [
          "ca_xof",
          "Nombre décimal fixe",
        ],
        [
          "resultat_net_xof",
          "Nombre décimal fixe",
        ],
        [
          "dividendes_xof",
          "Nombre décimal fixe",
        ],
        [
          "pnb_xof",
          "Nombre décimal fixe `(banques seulement)`",
        ],
        [
          "rbe_xof",
          "Nombre décimal fixe `(banques seulement)`",
        ],
        [
          "credit_xof",
          "Nombre décimal fixe `(banques seulement)`",
        ],
        [
          "depot_xof",
          "Nombre décimal fixe `(banques seulement)`",
        ],
        [
          "provisions_xof",
          "Nombre décimal fixe `(banques seulement)`",
        ],
        [
          "creances_douteuses_xof",
          "Nombre décimal fixe `(banques seulement)`",
        ],
        [
          "resultat_hao_xof",
          "Nombre décimal fixe",
        ],
        [
          "marge_interets_xof",
          "Nombre décimal fixe `(banques seulement)`",
        ],
        [
          "commissions_nettes_xof",
          "Nombre décimal fixe `(banques seulement)`",
        ],
        [
          "resultat_marche_xof",
          "Nombre décimal fixe `(banques seulement)`",
        ],
        ["updated_at", "Date/Heure"],
      ],
    },
    {
      kind: "paragraphe",
      texte: "Les colonnes marquées \"banques seulement\" sont `null` pour une société " +
        "non-bancaire — c'est normal, pas une donnée manquante (détaillé en 2.3).",
      discret: true,
    },
    {
      kind: "paragraphe",
      texte: "**v_user_profiles** — 11 colonnes",
    },
    {
      kind: "tableau",
      colonnesMono: [0],
      entetes: [
        "Colonne",
        "Type Power Query correct",
      ],
      lignes: [
        [
          "pseudo_user_key",
          "Texte — déjà correct `(hash, pas un identifiant réel)`",
        ],
        [
          "type_investisseur",
          "Texte — déjà correct",
        ],
        [
          "horizon_valeur",
          "Nombre entier",
        ],
        [
          "horizon_unite",
          "Texte — déjà correct `(ans / semaines)`",
        ],
        [
          "budget_xof",
          "Nombre décimal fixe",
        ],
        [
          "profil_risque",
          "Texte — déjà correct",
        ],
        [
          "objectif_rendement_pct",
          "Nombre décimal",
        ],
        ["is_active", "Vrai/Faux"],
        [
          "rendement_min_pct",
          "Nombre décimal",
        ],
        ["created_at", "Date/Heure"],
        ["updated_at", "Date/Heure"],
      ],
    },
    {
      kind: "paragraphe",
      texte: "**v_analyses_quota_daily** — 4 colonnes",
    },
    {
      kind: "tableau",
      colonnesMono: [0],
      entetes: [
        "Colonne",
        "Type Power Query correct",
      ],
      lignes: [
        [
          "pseudo_user_key",
          "Texte — déjà correct",
        ],
        ["jour", "Date"],
        [
          "ticker",
          "Texte — déjà correct",
        ],
        ["created_at", "Date/Heure"],
      ],
    },
    {
      kind: "paragraphe",
      texte: "**v_abonnements** — 13 colonnes",
    },
    {
      kind: "tableau",
      colonnesMono: [0],
      entetes: [
        "Colonne",
        "Type Power Query correct",
      ],
      lignes: [
        [
          "pseudo_user_key",
          "Texte — déjà correct",
        ],
        [
          "plan",
          "Texte — déjà correct",
        ],
        [
          "montant",
          "Nombre décimal fixe",
        ],
        [
          "devise",
          "Texte — déjà correct",
        ],
        [
          "statut",
          "Texte — déjà correct",
        ],
        [
          "periode",
          "Texte — déjà correct",
        ],
        [
          "operateur",
          "Texte — déjà correct",
        ],
        ["date_debut", "Date"],
        ["date_fin", "Date"],
        ["relance_j5_envoyee", "Vrai/Faux"],
        ["relance_j2_envoyee", "Vrai/Faux"],
        ["created_at", "Date/Heure"],
        ["updated_at", "Date/Heure"],
      ],
    },
    {
      kind: "paragraphe",
      texte: "**v_dim_date** — 9 colonnes",
    },
    {
      kind: "tableau",
      colonnesMono: [0],
      entetes: [
        "Colonne",
        "Type Power Query correct",
      ],
      lignes: [
        [
          "date_jour",
          "Date `(+ marquer \"table de dates\" en 4.x)`",
        ],
        [
          "annee",
          "Nombre entier",
        ],
        [
          "trimestre",
          "Nombre entier",
        ],
        [
          "mois",
          "Nombre entier",
        ],
        [
          "nom_mois",
          "Texte — déjà correct",
        ],
        [
          "semaine",
          "Nombre entier",
        ],
        [
          "jour_mois",
          "Nombre entier",
        ],
        [
          "jour_semaine",
          "Nombre entier",
        ],
        [
          "nom_jour_semaine",
          "Texte — déjà correct",
        ],
      ],
    },
    {
      kind: "encadre",
      ton: "attention",
      texte: "**Pourquoi \"Nombre décimal fixe\" et pas \"Nombre décimal\" pour les montants " +
        "FCFA ?** Le type `Nombre décimal` est un flottant binaire — il peut introduire de " +
        "minuscules erreurs d'arrondi invisibles à l'écran mais qui s'accumulent dans un " +
        "total. `Nombre décimal fixe` (precision fixe, 4 décimales) est exact — c'est le bon " +
        "choix pour tout ce qui représente de l'argent (cours, montants, dividendes, budgets). " +
        "Les pourcentages et taux de croissance (`change_pct, objectif_rendement_pct, " +
        "bna_growth_1y`…) restent en \"Nombre décimal\" simple — ce ne sont pas des montants.",
    },
    {
      kind: "code",
      accents: ["type date", "type number", "Int64.Type"],
      texte: "= Table.TransformColumnTypes(#\"Navigation\",{\n    {\"session_date\", type " +
        "date},\n    {\"close\", type number},\n    {\"volume\", Int64.Type}\n})",
    },
    {
      kind: "paragraphe",
      texte: "Ce que Power Query écrit tout seul en langage M quand tu changes des types " +
        "depuis le ruban — visible dans la barre de formule (fx).",
      discret: true,
    },
    {
      kind: "titre",
      texte: "Valeurs nulles : ne pas nettoyer à l'aveugle",
      numero: "2.3",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Simplify the data structure",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/3-data-structure",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Sur ce jeu de données, un `null` n'est pas toujours une erreur — c'est parfois " +
        "l'information elle-même. Deux cas très différents à traiter différemment :",
    },
    {
      kind: "liste",
      items: [
        "**pseudo_user_key nul** (dans v_user_profiles, v_abonnements, v_analyses_quota_daily) " +
          ": l'événement n'est rattaché à aucun utilisateur identifié (action système, session " +
          "anonyme). Selon ce que la page doit montrer, tu *filtres* ces lignes ou tu les " +
          "gardes sous un segment \"Non attribué\" — mais tu ne les supprimes jamais sans le " +
          "décider explicitement.",
        "**Colonnes bancaires nulles dans v_fundamentals** (pnb_xof, rbe_xof, credit_xof, " +
          "depot_xof, marge_interets_xof…) : ces ratios n'existent que pour les banques. Un " +
          "null ici sur une société commerciale (ex. Sonatel, Orange CI) n'est **pas une " +
          "donnée manquante** — c'est normal, la colonne ne s'applique pas.",
      ],
    },
    {
      kind: "encadre",
      ton: "attention",
      texte: "**Piège à éviter :** remplacer ces nulls bancaires par `0` \"pour que ça " +
        "calcule\" fausserait toute moyenne ou tout total sur ces colonnes (une société " +
        "non-bancaire apparaîtrait avec un PNB de 0 FCFA au lieu de \"non applicable\"). " +
        "Laisse le null tel quel — DAX l'ignore correctement dans `AVERAGE`/`SUM` ; c'est " +
        "seulement dans les visuels qu'on choisira d'exclure les non-banques (sprint 6).",
    },
    {
      kind: "paragraphe",
      texte: "Un vrai nettoyage de nulls reste utile dans un cas : une ligne *entièrement* " +
        "vide ou une clé de jointure absente (ex. `ticker` nul dans v_quotes_history, qui " +
        "rendrait la ligne inutilisable). Là, **Accueil → Réduire les lignes → Supprimer les " +
        "lignes → Supprimer les lignes vides**, ou un clic droit sur l'en-tête de colonne → " +
        "**Supprimer les lignes vides** ciblé sur la colonne clé.",
    },
    {
      kind: "titre",
      texte: "Éliminer les doublons — sur la bonne clé",
      numero: "2.4",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Simplify the data structure",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/3-data-structure",
        },
      ],
    },
    {
      kind: "encadre",
      ton: "attention",
      texte: "**À exécuter, pas juste à lire :** applique **Supprimer les doublons** sur " +
        "chacune des 4 vues ci-dessous, dans ta requête réelle — ce n'est pas une simple " +
        "information de référence. La checklist de fin de sprint (2.7) part du principe que " +
        "cette étape a été faite.",
    },
    {
      kind: "paragraphe",
      texte: "Clic droit sur l'en-tête de colonne → **Supprimer les doublons**, ou sélectionne " +
        "plusieurs colonnes avant de faire l'opération. Le piège : Power Query déduplique sur " +
        "*les colonnes que tu as sélectionnées*, pas sur la ligne entière si tu n'en " +
        "sélectionnes qu'une ou deux.",
    },
    {
      kind: "tableau",
      colonnesMono: [0],
      entetes: [
        "Vue",
        "Clé d'unicité à sélectionner",
      ],
      lignes: [
        [
          "v_quotes_history",
          "ticker + session_date",
        ],
        [
          "v_fundamentals",
          "ticker + fiscal_year",
        ],
        ["v_stocks", "ticker"],
        [
          "v_analyses_quota_daily",
          "pseudo_user_key + jour + ticker",
        ],
      ],
    },
    {
      kind: "paragraphe",
      texte: "v_abonnements, v_user_profiles et v_dim_date sont déjà à une ligne par clé " +
        "naturelle dans leur définition — pour celles-là, un contrôle rapide (tri + inspection " +
        "visuelle) suffit, purement informatif : pas besoin d'exécuter de suppression dessus.",
      discret: true,
    },
    {
      kind: "titre",
      texte: "Renommer pour la lisibilité — en dernier",
      numero: "2.5",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Simplify the data structure",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/3-data-structure",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Double-clic sur l'en-tête de colonne (ou clic droit → **Renommer**) pour donner " +
        "des noms clairs, qui apparaîtront tels quels dans les visuels du dashboard. Quelques " +
        "renommages utiles pour la suite :",
    },
    {
      kind: "tableau",
      colonnesMono: [0],
      entetes: [
        "Nom technique",
        "Nom d'affichage",
        "Vue",
      ],
      lignes: [
        [
          "close",
          "Cours de clôture",
          "v_quotes_history",
        ],
        [
          "change_pct",
          "Variation (%)",
          "v_quotes_history",
        ],
        [
          "valeur_transigee",
          "Valeur transigée (FCFA)",
          "v_quotes_history",
        ],
        [
          "bna",
          "BNA (FCFA)",
          "v_fundamentals",
        ],
        [
          "dpa",
          "DPA (FCFA)",
          "v_fundamentals",
        ],
        [
          "montant",
          "Montant abonnement (FCFA)",
          "v_abonnements",
        ],
        [
          "jour",
          "Date analyse",
          "v_analyses_quota_daily",
        ],
      ],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Pourquoi en dernier ?** Tant que tu corriges des types ou filtres des lignes, " +
        "tu veux pouvoir relire tes étapes avec les noms d'origine (ceux de la migration SQL), " +
        "qui sont sans ambiguïté. Renommer en dernier évite aussi de devoir mettre à jour des " +
        "étapes précédentes qui référencent encore l'ancien nom.",
    },
    {
      kind: "titre",
      texte: "L'ordre conseillé, de bout en bout",
      numero: "2.6",
      etiquette: "info",
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
      texte: "Ce n'est pas un nouvel ordre : c'est exactement celui que tu viens de suivre " +
        "section par section (2.2 → 2.3 → 2.4 → 2.5) — ce récapitulatif sert juste à le voir " +
        "d'un seul coup d'œil, comme il apparaîtra dans le volet Étapes appliquées.",
      discret: true,
    },
    {
      kind: "liste",
      items: [
        "Types de données corrigés (2.2)",
        "Lignes vraiment inutilisables supprimées — clé de jointure nulle (2.3)",
        "Doublons supprimés sur la bonne clé (2.4)",
        "Colonnes renommées (2.5)",
      ],
      ordonnee: true,
    },
    {
      kind: "paragraphe",
      texte: "Sur `v_quotes_history`, ça donne cette recette dans le volet Étapes appliquées :",
    },
    {
      kind: "maquette-power-query",
      etapes: {
        titre: "Étapes appliquées — v_quotes_history",
        noms: [
          "Source",
          "Navigation",
          "Type modifié",
          "Lignes filtrées (ticker non vide)",
          "Doublons supprimés",
          "Colonnes renommées",
        ],
      },
    },
    {
      kind: "titre",
      texte: "Profiler avant de nettoyer",
      numero: "2.7",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Profile data in Power BI",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/6-profile-data",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Tout ce qui précède suppose que tu sais déjà ce qui cloche. Le **profilage** est " +
        "l'outil qui te le dit. À faire idéalement *avant* 2.2, mais il n'est jamais trop tard " +
        ": c'est une lecture, il ne modifie rien.",
    },
    {
      kind: "paragraphe",
      texte: "Dans l'éditeur Power Query : onglet **Affichage** → section **Aperçu des " +
        "données** → coche les trois options.",
    },
    {
      kind: "tableau",
      entetes: [
        "Option",
        "Ce qu'elle affiche",
        "Ce que tu y cherches",
      ],
      lignes: [
        [
          "**Qualité de la colonne**",
          "% valides / en erreur / vides",
          "Toute colonne qui n'est pas à 100 % valide",
        ],
        [
          "**Distribution de la colonne**",
          "Compte des valeurs **distinctes** et **uniques**",
          "Cardinalité réelle, doublons cachés",
        ],
        [
          "**Profil de colonne**",
          "Min, max, moyenne, écart-type, zéros, nulls, nb de lignes",
          "Valeurs aberrantes, import incomplet",
        ],
      ],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Le piège des 1 000 lignes.** Par défaut Power Query ne profile que les **1 000 " +
        "premières lignes**. Sur `v_quotes_history` (~17 800 lignes) et " +
        "`v_analyses_quota_daily`, ça ne veut rien dire. Clique sur l'indicateur de profilage " +
        "dans la **barre d'état** en bas → **Profilage de colonne basé sur l'ensemble du jeu " +
        "de données**. Le calcul devient plus lent : c'est exactement pour ça que la valeur " +
        "par défaut existe.",
    },
    {
      kind: "paragraphe",
      texte: "**Distinctes ≠ uniques** — la confusion la plus fréquente, et une question " +
        "classique du PL-300 :",
    },
    {
      kind: "liste",
      items: [
        "**Distinctes** = toutes les valeurs différentes, *doublons et nulls compris*",
        "**Uniques** = les valeurs qui n'apparaissent *qu'une seule fois*, nulls exclus",
      ],
    },
    {
      kind: "paragraphe",
      texte: "Sur la colonne `A, A, B, C, null` : 4 distinctes, 2 uniques. Distinctes est donc " +
        "toujours ≥ uniques.",
    },
    {
      kind: "paragraphe",
      texte: "**Trois contrôles à faire sur tes données** — ce ne sont pas des exercices " +
        "théoriques, ils peuvent révéler de vrais problèmes dans ta base de production :",
    },
    {
      kind: "tableau",
      entetes: [
        "Colonne",
        "Ce que tu regardes",
        "Signal d'alarme",
      ],
      lignes: [
        [
          "`v_quotes_history[ticker]`",
          "Valeurs distinctes",
          "Un écart avec les lignes de `v_stocks` = tickers orphelins ou mal saisis",
        ],
        [
          "`v_quotes_history[close]`",
          "Min et max",
          "Un min à 0 ou un max absurde = données de collecte corrompues",
        ],
        [
          "`v_analyses_quota_daily`",
          "Distribution des valeurs",
          "Une régularité trop parfaite = données de test restées en production",
        ],
      ],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Pourquoi le dernier point compte.** Les vraies données sont irrégulières. " +
        "Quand une distribution est trop propre, quelque chose d'artificiel s'est produit — un " +
        "jeu de test, un bogue de collecte, un import dupliqué. C'est souvent le seul moment " +
        "où on le détecte.",
    },
    {
      kind: "paragraphe",
      texte: "**Deux réflexes tirés du lab officiel**, qui ne coûtent rien et évitent des " +
        "heures de débogage :",
    },
    {
      kind: "tableau",
      entetes: ["Réflexe", "Comment", "Pourquoi"],
      lignes: [
        [
          "**Lire la barre d'état après chaque étape**",
          "En bas à gauche : nombre de colonnes et de lignes",
          "Le lab fait vérifier le compte après *chaque* requête configurée. Un filtre qui " +
            "retire 15 000 lignes au lieu de 15 se voit immédiatement",
        ],
        [
          "**Atteindre la colonne**",
          "Accueil → **Choisir les colonnes ▾** → Atteindre la colonne, puis trier par nom " +
            "(bouton AZ)",
          "Bien plus rapide que de faire défiler horizontalement une table large",
        ],
      ],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Le compte de lignes est ton test unitaire.** Tu n'as pas de tests automatisés " +
        "sur une requête Power Query. La barre d'état est ce qui s'en rapproche le plus : note " +
        "le compte attendu avant une transformation, vérifie-le après. C'est la seule façon " +
        "d'attraper une jointure qui duplique des lignes ou un filtre trop large — deux " +
        "erreurs qui ne déclenchent aucun message.",
    },
    {
      kind: "titre",
      texte: "Vérifier que le query folding tient",
      numero: "2.8",
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
      texte: "Le **query folding** est le mécanisme par lequel Power Query traduit tes étapes " +
        "en SQL et les fait exécuter par **Supabase** plutôt que par Power BI. Tu ne l'actives " +
        "pas — il est automatique — mais tes choix déterminent jusqu'où il se propage.",
    },
    {
      kind: "paragraphe",
      texte: "**Comment vérifier :** volet `Étapes appliquées` → clic droit sur une étape → " +
        "cherche **Afficher la requête native**.",
    },
    {
      kind: "liste",
      items: [
        "**En gras** → le folding fonctionne, clique pour voir le SQL envoyé à Supabase",
        "**Grisé** → le folding est cassé à cette étape ; remonte les étapes une à une jusqu'à " +
          "en trouver une où l'option redevient active, c'est là que ça a lâché",
      ],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Les trois briseurs — moyen mnémotechnique « I-F-T » :** colonne d'**I**ndex, " +
        "**F**usion entre deux sources différentes, changement de **T**ype de données. Si le " +
        "SQL ne sait pas l'exprimer, le folding s'arrête — et **il ne reprend jamais** : " +
        "toutes les étapes suivantes se feront localement, même celles qui auraient pu être " +
        "traduites.",
    },
    {
      kind: "paragraphe",
      texte: "**La conséquence directe pour ce chantier :** la section 2.2 te fait changer des " +
        "types de données. C'est le briseur n° 3. Deux façons d'en limiter l'impact :",
    },
    {
      kind: "liste",
      items: [
        "**Corriger à la source quand c'est possible.** Un montant stocké en texte se règle " +
          "mieux dans la vue SQL (`cast(colonne as numeric)`) que dans Power Query — le " +
          "folding reste intact et Power BI reçoit le bon type d'emblée.",
        "**Ordonner les étapes.** Filtres et suppressions de colonnes **d'abord** (elles " +
          "foldent et réduisent le volume transféré), changements de type et colonnes d'index " +
          "**en dernier**. C'est déjà la logique de 2.6 — voici maintenant la raison technique " +
          "derrière.",
      ],
      ordonnee: true,
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Exercice de démonstration.** Sur une requête dupliquée : ajoute un filtre de " +
        "date, vérifie que la requête native s'affiche et contient bien ton `WHERE`. Ajoute " +
        "ensuite une colonne d'index, puis reclique droit : l'option est grisée. Déplace " +
        "l'étape d'index avant le filtre par glisser-déposer et observe que le folding ne " +
        "survit plus du tout. Même résultat à l'écran, performance très différente.",
    },
    {
      kind: "titre",
      texte: "À faire avant le sprint 3",
      numero: "2.9",
      etiquette: "repere",
    },
    {
      kind: "checklist",
      items: [
        {
          id: "c2-1",
          texte: "Les types de données des 7 tables correspondent aux tableaux de 2.2, colonne " +
            "par colonne (vérifie l'icône de type dans chaque en-tête)",
        },
        {
          id: "c2-2",
          texte: "Tu sais dire, pour chaque table, quels nulls sont légitimes et lesquels ne " +
            "le sont pas",
        },
        {
          id: "c2-3",
          texte: "Les doublons ont été supprimés sur la clé d'unicité de chaque table (2.4), " +
            "pas sur une colonne au hasard",
        },
        {
          id: "c2-4",
          texte: "Les colonnes principales ont des noms d'affichage clairs",
        },
        {
          id: "c2-5",
          texte: "Le profilage est passé sur **l'ensemble du jeu de données**, pas sur les 1 " +
            "000 premières lignes",
        },
        {
          id: "c2-6",
          texte: "Les trois contrôles de 2.7 ont été faits, et tu sais expliquer l'écart entre " +
            "valeurs distinctes et uniques",
        },
        {
          id: "c2-7",
          texte: "Tu as vu au moins une fois la requête native s'afficher, et au moins une " +
            "fois le folding se casser",
        },
        {
          id: "c2-8",
          texte: "Tu notes le compte de lignes de la barre d'état avant et après chaque " +
            "transformation importante",
        },
      ],
    },
  ],
};
