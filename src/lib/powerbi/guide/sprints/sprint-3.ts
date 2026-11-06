/**
 * =============================================================
 *  Fichier    : sprint-3.ts
 *  Projet     : Kalami Données
 *  Description: Chantier BRVM Power BI — sprint 3 : Transformation.
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

export const sprint3: Sprint = {
  numero: 3,
  slug: "sprint-3",
  titre: "Transformation",
  lede: "Objectif : ajouter les colonnes qui manquent (calculées, conditionnelles), savoir " +
    "quand aller chercher une information dans une autre table par fusion — et surtout, savoir " +
    "quand **ne pas** le faire, parce qu'une relation (sprint 4) fera mieux le travail.",
  contenu: [
    {
      kind: "titre",
      texte: "Trois façons d'ajouter une colonne",
      numero: "3.1",
      etiquette: "info",
    },
    {
      kind: "tableau",
      entetes: ["Type", "Où", "Pour"],
      lignes: [
        [
          "Colonne personnalisée",
          "Ajouter une colonne → Colonne personnalisée",
          "un calcul sur les colonnes déjà présentes dans la table (formule M libre)",
        ],
        [
          "Colonne conditionnelle",
          "Ajouter une colonne → Colonne conditionnelle",
          "un si/alors/sinon guidé par une interface, sans écrire de M",
        ],
        [
          "Colonne fusionnée",
          "Accueil → Fusionner les requêtes",
          "une information qui vit dans une *autre* table",
        ],
      ],
    },
    {
      kind: "titre",
      texte: "Colonne personnalisée — rendre un montant lisible",
      numero: "3.2",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Sur `v_quotes_history`, les valeurs transigées sont en FCFA bruts (parfois " +
        "plusieurs centaines de millions) — illisibles sur l'axe d'un graphique. On ajoute une " +
        "colonne en millions :",
    },
    {
      kind: "liste",
      items: [
        "**Ajouter une colonne** → **Colonne personnalisée**",
        "Nom : `Valeur transigée (M FCFA)`",
        "Formule : `[Valeur transigée (FCFA)] / 1000000`",
      ],
      ordonnee: true,
    },
    {
      kind: "code",
      texte: "= Table.AddColumn(#\"Colonnes renommées\", \"Valeur transigée (M FCFA)\",\n    " +
        "each [Valeur transigée (FCFA)] / 1000000, type number)",
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Réflexe à prendre :** une colonne personnalisée sort presque toujours en type " +
        "`Quelconque` même si le résultat est numérique — vérifie et corrige son type juste " +
        "après création (clic sur l'icône de type dans l'en-tête), sinon elle ne s'agrège pas " +
        "correctement dans le modèle.",
    },
    {
      kind: "titre",
      texte: "Colonne conditionnelle — réutiliser ce qu'on a compris des nulls",
      numero: "3.3",
      etiquette: "pratique",
    },
    {
      kind: "paragraphe",
      texte: "Au sprint 2 (2.3), on a vu qu'un `pnb_xof` nul dans `v_fundamentals` signifie " +
        "\"ce n'est pas une banque\". On transforme cette observation en colonne exploitable " +
        "pour filtrer/comparer plus tard :",
    },
    {
      kind: "liste",
      items: [
        "**Ajouter une colonne** → **Colonne conditionnelle**",
        "Nom de sortie : `Type de société`",
        "Clause : Si `pnb_xof` est `null` Alors `\"Non-bancaire\"` Sinon `\"Banque\"`",
      ],
      ordonnee: true,
    },
    {
      kind: "paragraphe",
      texte: "Même logique pour segmenter les volumes de `v_quotes_history` — une colonne " +
        "conditionnelle à seuils, utile pour un futur visuel :",
    },
    {
      kind: "liste",
      items: [
        "Nom de sortie : `Segment de volume`",
        "Si `volume` < 1 000 Alors `\"Faible\"`",
        "Sinon si `volume` < 10 000 Alors `\"Moyen\"`",
        "Sinon `\"Élevé\"`",
      ],
      ordonnee: true,
    },
    {
      kind: "paragraphe",
      texte: "L'interface \"Colonne conditionnelle\" gère elle-même l'ordre des clauses (elle " +
        "génère un `if … then … else if …` en M) — pas besoin d'écrire la formule à la main " +
        "pour celle-ci.",
      discret: true,
    },
    {
      kind: "titre",
      texte: "Fusion de requêtes — aller chercher une info ailleurs",
      numero: "3.4",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Combine multiple tables into a single table",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/5-combine-tables",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Avant de fusionner quoi que ce soit, **duplique la requête** que tu veux tester " +
        ": clic droit sur `v_quotes_history` dans le volet Requêtes → **Dupliquer**. Renomme " +
        "la copie `Sandbox fusion`. Tu expérimentes dessus, jamais sur la vraie table — si le " +
        "résultat ne te convient pas, tu supprimes juste la copie.",
    },
    {
      kind: "paragraphe",
      texte: "Sur cette copie, **Accueil → Fusionner les requêtes** avec `v_stocks`, en " +
        "faisant correspondre `ticker` des deux côtés :",
    },
    {
      kind: "maquette-fusion",
      tables: [
        {
          titre: "Sandbox fusion",
          colonnes: [
            "Cours de clôture",
            "ticker",
            "session_date",
          ],
          cle: "ticker",
        },
        {
          titre: "v_stocks",
          colonnes: ["ticker", "sector", "shares_outstanding"],
          cle: "ticker",
        },
      ],
      jointures: [
        "Externe droite",
        "Externe gauche",
        "Interne",
        "Anti gauche",
      ],
      choisie: "Externe gauche",
    },
    {
      kind: "paragraphe",
      texte: "Choisis **Externe gauche** (garde toutes les lignes de cours, même si un ticker " +
        "n'a exceptionnellement pas de fiche dans v_stocks). Valide, puis clique sur la petite " +
        "icône ⤢ dans la nouvelle colonne pour **développer** les champs voulus " +
        "(`shares_outstanding`). Ajoute enfin une colonne personnalisée `Capitalisation " +
        "boursière (FCFA)` = `[Cours de clôture] * [shares_outstanding]`.",
    },
    {
      kind: "titre",
      texte: "Fusion ou relation ? La question à se poser à chaque fois",
      numero: "3.5",
      etiquette: "info",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Combine multiple tables into a single table",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/5-combine-tables",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Tu viens de fusionner deux tables pour obtenir une capitalisation boursière. Au " +
        "sprint 4, tu vas créer une **relation** entre les mêmes deux tables. Les deux se " +
        "ressemblent — elles ne servent pas au même besoin :",
    },
    {
      kind: "cartes",
      cartes: [
        {
          titre: "Relation (sprint 4)",
          points: [
            "Aucune donnée dupliquée",
            "Un seul modèle, propre et léger",
            "C'est le cas de 95% des besoins de ce dashboard",
          ],
          texte: "Tu veux filtrer/trancher une table de faits par un attribut d'une dimension " +
            "(secteur, pays, profil de risque…) dans tes visuels.",
        },
        {
          titre: "Fusion (Power Query)",
          points: [
            "Duplique les données dans la table de résultat",
            "À réserver aux cas où une relation ne suffit pas",
          ],
          texte: "Tu veux un *calcul* qui combine des colonnes de deux tables en une seule " +
            "valeur, ligne par ligne (comme la capitalisation ci-dessus).",
        },
      ],
    },
    {
      kind: "encadre",
      ton: "attention",
      texte: "**Verdict pour la capitalisation boursière :** une fois la relation v_stocks → " +
        "v_quotes_history posée (sprint 4), la même valeur s'obtient en DAX avec " +
        "`RELATED('v_stocks'[shares_outstanding])` sans dupliquer aucune donnée (sprint 5). La " +
        "fusion de 3.4 t'a servi à *comprendre* le mécanisme — mais pour ce chantier, laisse " +
        "le chargement de `Sandbox fusion` désactivé (clic droit sur la requête → décoche " +
        "**Activer le chargement**) : elle reste dans ton fichier pour référence, sans polluer " +
        "le modèle final.",
    },
    {
      kind: "titre",
      texte: "v_dim_date : rien à transformer, et c'est voulu",
      numero: "3.6",
      etiquette: "info",
    },
    {
      kind: "paragraphe",
      texte: "Résiste à la tentation d'ajouter une colonne \"Année\" séparée sur chaque table " +
        "de faits en la recalculant depuis `session_date` ou `jour` — c'est exactement le " +
        "doublon que `v_dim_date` existe pour éviter. Vérifie juste que le type de `date_jour` " +
        "est bien `Date` (fait au sprint 2) : la table est prête à être reliée telle quelle au " +
        "sprint 4.",
    },
    {
      kind: "titre",
      texte: "Ajouter des requêtes : l'autre façon de combiner",
      numero: "3.7",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Combine multiple tables into a single table",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/5-combine-tables",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "La fusion (3.4) ajoute des **colonnes**. L'**ajout** (*append*) fait l'inverse : " +
        "il ajoute des **lignes**. Deux tables de 300 et 100 lignes donnent une table de 400.",
    },
    {
      kind: "tableau",
      entetes: [
        "",
        "Fusionner (merge)",
        "Ajouter (append)",
      ],
      lignes: [
        [
          "Ajoute",
          "Des colonnes",
          "Des lignes",
        ],
        [
          "Forme",
          "Plus large",
          "Plus haute",
        ],
        [
          "Prérequis",
          "Une colonne clé commune",
          "Des noms de colonnes identiques",
        ],
        [
          "Équivalent SQL",
          "`JOIN`",
          "`UNION ALL`",
        ],
      ],
    },
    {
      kind: "paragraphe",
      texte: "La règle d'or : les colonnes que tu veux voir fusionner doivent **porter " +
        "exactement le même nom** dans chaque table. Sinon Power Query crée des colonnes " +
        "séparées remplies de nulls.",
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Pourquoi tes 7 vues n'en ont pas besoin.** Une base relationnelle bien conçue " +
        "range déjà les données d'un même type dans une seule table — c'est le travail qu'on a " +
        "fait côté SQL. L'ajout sert surtout quand les données arrivent découpées : un fichier " +
        "Excel par mois, un export par filiale, une table d'archive séparée de la table " +
        "courante. Le PL-300 le teste quand même, et tu en auras besoin en entreprise. D'où " +
        "l'exercice ci-dessous.",
    },
    {
      kind: "paragraphe",
      texte: "**Exercice en bac à sable** — il se vérifie tout seul :",
    },
    {
      kind: "liste",
      items: [
        "Duplique `v_quotes_history` deux fois (clic droit → **Dupliquer**)",
        "Sur la première copie, filtre les dates sur 2025 ; sur la seconde, sur 2026",
        "**Accueil → Ajouter des requêtes → Ajouter des requêtes comme nouvelles**",
        "Ajoute les deux copies, OK",
        "Compare le nombre de lignes obtenu avec le total 2025 + 2026 de la table d'origine : " +
          "ça doit tomber juste",
        "Désactive le chargement des trois requêtes de l'exercice",
      ],
      ordonnee: true,
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**« Comme nouvelles » ou pas ?** **Ajouter des requêtes comme nouvelles** crée " +
        "une table supplémentaire et laisse les originales intactes. **Ajouter des requêtes** " +
        "tout court verse les lignes *dans* une table existante et la modifie. Pour un " +
        "chantier comme celui-ci, prends toujours « comme nouvelles » : tu gardes la " +
        "possibilité de revenir en arrière.",
    },
    {
      kind: "titre",
      texte: "Dépivoter et pivoter : changer la forme d'une table",
      numero: "3.8",
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
      texte: "Deux transformations symétriques, et une notion que le PL-300 teste " +
        "systématiquement :",
    },
    {
      kind: "liste",
      items: [
        "**Dépivoter** (*unpivot*) : colonnes → lignes. Transforme une table **large** en " +
          "table **haute**. Produit toujours deux colonnes nommées `Attribut` (les anciens " +
          "en-têtes) et `Valeur` (le contenu des cellules).",
        "**Pivoter** : lignes → colonnes, avec une fonction d'agrégation (Somme, Moyenne, " +
          "Compte, Min, Max, Médiane).",
      ],
    },
    {
      kind: "paragraphe",
      texte: "Le cas classique : un fichier Excel avec une colonne « 2024 », une colonne « " +
        "2025 », une colonne « 2026 ». Lisible pour un humain, inexploitable en DAX — " +
        "impossible de totaliser les trois années sans écrire une formule par colonne. " +
        "Dépivoter donne une colonne `Année` et une colonne `Montant`, et tout redevient " +
        "simple.",
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Ce que ça t'apprend sur ton propre travail.** Aucune de tes 7 vues n'a besoin " +
        "d'être dépivotée — elles sortent déjà en format haut et étroit. Ce n'est pas un " +
        "hasard : **une base relationnelle produit nativement la forme que DAX attend**. Le " +
        "problème du dépivotage est un problème d'Excel, où les humains étalent les données " +
        "pour les lire. Retenir ça, c'est comprendre pourquoi le travail fait côté SQL t'a " +
        "épargné une étape entière.",
    },
    {
      kind: "paragraphe",
      texte: "**Exercice en bac à sable** — aller-retour, pour voir les deux sens :",
    },
    {
      kind: "liste",
      items: [
        "Duplique `v_quotes_history`, garde seulement `date`, `ticker`, `close`",
        "Filtre sur 3 ou 4 tickers pour garder l'aperçu lisible",
        "Sélectionne `ticker` → onglet **Transformer** → **Colonne dynamique** → colonne de " +
          "valeurs = `close`, fonction d'agrégation = **Moyenne**",
        "Tu obtiens une colonne par ticker : c'est la forme « Excel ». Regarde à quel point " +
          "elle est agréable à lire et pénible à exploiter",
        "Sélectionne ces colonnes de tickers → **Transformer → Dépivoter les colonnes** — tu " +
          "retrouves la forme d'origine, avec `Attribut` et `Valeur` à renommer",
        "Désactive le chargement de la requête",
      ],
      ordonnee: true,
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Note performance.** Ces deux transformations cassent souvent le query folding " +
        "(2.8) : le SQL n'a pas d'équivalent direct du pivot dynamique. Une raison de plus de " +
        "les placer en fin de séquence, après les filtres.",
    },
    {
      kind: "paragraphe",
      texte: "**La variante qui sauve du temps : Dépivoter les autres colonnes.** Le menu " +
        "offre trois options, et le choix entre elles change la robustesse de ta requête :",
    },
    {
      kind: "tableau",
      entetes: [
        "Option",
        "Ce qu'elle dépivote",
        "Quand la choisir",
      ],
      lignes: [
        [
          "**Dépivoter les colonnes**",
          "Celles que tu as sélectionnées",
          "Peu de colonnes à dépivoter",
        ],
        [
          "**Dépivoter les autres colonnes** ⭐",
          "Tout *sauf* ce que tu as sélectionné",
          "Beaucoup de colonnes à dépivoter, peu à garder",
        ],
        [
          "**Dépivoter uniquement les colonnes sélectionnées**",
          "Strictement celles-là, figées",
          "Quand la liste ne doit jamais varier",
        ],
      ],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Pourquoi « les autres » est souvent le bon choix.** Dans le lab officiel, une " +
        "table a 12 colonnes de mois (M01 à M12) et deux colonnes à conserver. Sélectionner " +
        "les deux à garder et dépivoter le reste est plus rapide — mais surtout plus solide : " +
        "si la source gagne un M13 le mois prochain, la requête l'absorbe toute seule. L'autre " +
        "option aurait ignoré la nouvelle colonne en silence.",
    },
    {
      kind: "titre",
      texte: "L'Éditeur avancé : lire le code M de tes requêtes",
      numero: "3.9",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Use Advanced Editor to modify M code",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/7-advanced-editor",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Depuis le sprint 2, chacun de tes clics écrit du code — le **langage M** — que " +
        "Power Query exécute ensuite. L'**Éditeur avancé** te montre ce code. Tu n'as pas " +
        "besoin de l'écrire pour travailler, mais savoir le lire change trois choses concrètes " +
        "dans ce chantier.",
    },
    {
      kind: "paragraphe",
      texte: "**Ruban Affichage → Éditeur avancé** — le même ruban que les outils de profilage " +
        "de 2.7.",
    },
    {
      kind: "paragraphe",
      texte: "Toute requête a la même forme :",
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "`let` `Source = PostgreSQL.Database(...),` `reporting_v_quotes_history = " +
        "Source{[Schema=\"reporting\",Item=\"v_quotes_history\"]}[Data],` `#\"Lignes " +
        "filtrées\" = Table.SelectRows(reporting_v_quotes_history, each ...),` `#\"Type " +
        "modifié\" = Table.TransformColumnTypes(#\"Lignes filtrées\", {...})` `in` `#\"Type " +
        "modifié\"`",
    },
    {
      kind: "liste",
      items: [
        "`let` ouvre la liste des étapes — une ou deux lignes par étape appliquée",
        "Chaque étape **reprend le nom de la précédente**, celui à gauche du signe `=`",
        "`in` désigne l'étape à renvoyer — presque toujours la dernière",
      ],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Pourquoi réordonner casse tout.** C'est une course de relais : chaque ligne " +
        "prend le témoin de celle qu'elle nomme. Interverti deux étapes et le témoin part vers " +
        "un coureur qui n'a pas encore couru. Si tu déplaces une étape par glisser-déposer " +
        "(comme en 2.8), Power Query réécrit les références pour toi — mais dans l'Éditeur " +
        "avancé, tu es seul responsable.",
    },
    {
      kind: "paragraphe",
      texte: "**Trois usages concrets pour ce chantier :**",
    },
    {
      kind: "tableau",
      entetes: [
        "Situation",
        "Ce que l'Éditeur avancé t'apporte",
      ],
      lignes: [
        [
          "Comparer deux versions d'un fichier .pbix",
          "Tu lis la recette complète d'une requête d'un coup d'œil, au lieu de cliquer sur " +
            "chaque étape une par une",
        ],
        [
          "Le pooler Supabase change d'adresse",
          "Tu corriges le nom du serveur directement dans le code, puis **Terminé**",
        ],
        [
          "Reproduire une transformation sur une autre vue",
          "Tu copies la ligne M et adaptes le nom de la table, plutôt que de refaire tous les " +
            "clics",
        ],
      ],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**M et DAX ne sont pas la même chose** — et l'examen y revient sans cesse. Le " +
        "**M** vit dans Power Query et transforme les données *avant* le chargement (sprints 2 " +
        "et 3). Le **DAX** vit dans le modèle et calcule *après* le chargement (sprints 4 et " +
        "5). Deux langages, deux moments, deux fenêtres.",
    },
    {
      kind: "paragraphe",
      texte: "**Exercice.** Ouvre l'Éditeur avancé sur `v_quotes_history` et retrouve, ligne " +
        "par ligne, chacune des étapes que tu as créées aux sprints 2 et 3. Repère le nom qui " +
        "suit le `in`. Ne modifie rien cette fois — l'objectif est de lire.",
    },
    {
      kind: "titre",
      texte: "Deux autres façons de dériver une colonne",
      numero: "3.10",
      etiquette: "pratique",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Exercise - Load data in Power BI Desktop",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/8-lab",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Les sections 3.1 à 3.3 couvraient la colonne personnalisée et la colonne " +
        "conditionnelle. Le lab officiel en ajoute deux autres, qui évitent d'écrire la " +
        "moindre formule.",
    },
    {
      kind: "paragraphe",
      texte: "**Fusionner des colonnes** — assembler plusieurs colonnes en une seule, avec un " +
        "séparateur.",
    },
    {
      kind: "liste",
      items: [
        "Sélectionne la première colonne, puis **Ctrl+clic** sur la seconde — l'ordre de " +
          "sélection détermine l'ordre dans le résultat",
        "Clic droit sur l'un des en-têtes → **Fusionner les colonnes**",
        "Choisis le séparateur (Espace, Virgule, Personnalisé…) et le nom de la nouvelle colonne",
      ],
      ordonnee: true,
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Attention — les colonnes d'origine disparaissent.** Fusionner les consomme. Si " +
        "tu as encore besoin du prénom et du nom séparément, passe par **Ajouter une colonne → " +
        "Fusionner les colonnes** plutôt que par l'onglet Transformer : la version de l'onglet " +
        "« Ajouter une colonne » conserve les originales.",
    },
    {
      kind: "paragraphe",
      texte: "**Colonne d'après les exemples** — tu montres le résultat voulu, Power Query " +
        "devine la formule.",
    },
    {
      kind: "liste",
      items: [
        "**Ajouter une colonne → Colonne d'après les exemples**",
        "Dans la première cellule, tape le résultat attendu pour cette ligne, puis **Entrée**",
        "Power Query remplit les autres lignes avec sa prédiction et affiche la formule M " +
          "au-dessus de la grille",
        "Corrige une cellule si la prédiction se trompe — elle s'ajuste",
        "Renomme la colonne et valide",
      ],
      ordonnee: true,
    },
    {
      kind: "paragraphe",
      texte: "Dans le lab, c'est ainsi qu'on fabrique une date à partir d'une colonne Année et " +
        "d'une colonne Numéro de mois : on tape `7/1/2017` sur la première ligne, et la " +
        "combinaison des deux colonnes est déduite.",
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Lis toujours la formule générée.** C'est la grande valeur de cette " +
        "fonctionnalité : elle t'enseigne le M (3.9) en partant d'un exemple concret. Et c'est " +
        "aussi la précaution à prendre — la prédiction est une devinette, pas une règle. " +
        "Vérifie-la sur quelques lignes avant de continuer, surtout quand des formats de date " +
        "sont en jeu.",
    },
    {
      kind: "titre",
      texte: "Niveaux de confidentialité : quand Power BI refuse de croiser deux sources",
      numero: "3.11",
      etiquette: "info",
    },
    {
      kind: "references",
      liens: [
        {
          texte: "Exercise - Load data in Power BI Desktop",
          url: "https://learn.microsoft.com/fr-ca/training/modules/clean-data-power-bi/8-lab",
        },
      ],
    },
    {
      kind: "paragraphe",
      texte: "Au moment de fusionner deux requêtes issues de **sources différentes**, une " +
        "fenêtre **Niveaux de confidentialité** peut s'ouvrir et demander de classer chaque " +
        "source.",
    },
    {
      kind: "tableau",
      entetes: [
        "Niveau",
        "Ce qu'il autorise",
      ],
      lignes: [
        [
          "**Public**",
          "Données librement partageables avec les autres sources",
        ],
        [
          "**Organizational**",
          "Partage autorisé avec les autres sources de l'organisation",
        ],
        [
          "**Private**",
          "Jamais partagé avec aucune autre source",
        ],
      ],
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Ce que le réglage signifie vraiment.** Il ne dit pas qui a le droit de voir " +
        "les données — il dit si le **moteur Power Query** peut faire transiter les valeurs " +
        "d'une source vers une autre pendant l'exécution. Marquer une source **Private** ne " +
        "protège pas les données d'un lecteur du rapport; ça empêche simplement Power Query de " +
        "les envoyer à l'autre système pour effectuer la jointure.",
    },
    {
      kind: "paragraphe",
      texte: "**Pourquoi ça te concerne directement.** Tant que tes requêtes viennent toutes " +
        "de Supabase, la question ne se pose pas. Mais dès que tu fusionnes une vue " +
        "`reporting.*` avec un fichier Excel ou une autre base, la fenêtre apparaîtra. Et " +
        "c'est là qu'il faut réfléchir : tes vues contiennent des données de production. Les " +
        "marquer **Organizational** plutôt que **Public** est le réglage prudent.",
    },
    {
      kind: "encadre",
      ton: "precision",
      texte: "**Le piège de performance.** Quand deux sources ont des niveaux incompatibles, " +
        "Power Query refuse de déléguer la jointure et rapatrie tout localement — le query " +
        "folding (2.8) tombe. Si une fusion entre sources devient subitement très lente, les " +
        "niveaux de confidentialité sont le premier endroit à regarder.",
    },
    {
      kind: "titre",
      texte: "À faire avant le sprint 4",
      numero: "3.12",
      etiquette: "repere",
    },
    {
      kind: "checklist",
      items: [
        {
          id: "c3-1",
          texte: "`Valeur transigée (M FCFA)` existe sur v_quotes_history, en type Nombre",
        },
        {
          id: "c3-2",
          texte: "`Type de société` (Banque/Non-bancaire) existe sur v_fundamentals",
        },
        {
          id: "c3-3",
          texte: "Tu as fait l'exercice de fusion sur une requête dupliquée, jamais sur les 7 " +
            "tables originales",
        },
        {
          id: "c3-4",
          texte: "Tu sais expliquer, dans tes mots, la différence entre fusionner et relier",
        },
        {
          id: "c3-5",
          texte: "Le chargement de la requête sandbox est désactivé",
        },
        {
          id: "c3-6",
          texte: "L'exercice d'ajout (3.7) est fait et le compte de lignes tombe juste",
        },
        {
          id: "c3-7",
          texte: "Tu sais dire en une phrase ce que fait **ajouter** par rapport à " +
            "**fusionner**, et lequel correspond à `UNION ALL`",
        },
        {
          id: "c3-8",
          texte: "L'aller-retour pivoter / dépivoter (3.8) est fait, et tu as vu apparaître " +
            "les colonnes `Attribut` et `Valeur`",
        },
        {
          id: "c3-9",
          texte: "Tu as ouvert l'Éditeur avancé sur au moins une requête et retrouvé tes " +
            "étapes dans le code M",
        },
        {
          id: "c3-10",
          texte: "Tu sais dire en une phrase ce qui distingue le **M** du **DAX**",
        },
        {
          id: "c3-11",
          texte: "Tu as essayé **Colonne d'après les exemples** au moins une fois et lu la " +
            "formule M générée",
        },
        {
          id: "c3-12",
          texte: "Tu sais ce que font les trois niveaux de confidentialité, et lequel convient " +
            "à tes vues `reporting.*`",
        },
      ],
    },
  ],
};
