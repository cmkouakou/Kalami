/**
 * =============================================================
 *  Fichier    : m09-l05.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 9, leçon 5 — « Croître à l'international » : pourquoi franchir une
 *               frontière, les deux pressions (intégration mondiale, adaptation locale),
 *               les quatre stratégies internationales, les modes d'entrée, l'intérêt des
 *               espaces régionaux (UEMOA, CEDEAO). Encadré : la logique régionale
 *               d'Ajinomoto en Afrique de l'Ouest. Sources : livre, modules 8 et 13 ;
 *               Bartlett et Ghoshal, 1989. Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import {
  appliquez,
  exercice,
  fiche,
  liste,
  p,
  piege,
  retenir,
  schema,
  tableau,
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M09_L05: ContenuLecon = [
  p(
    "Le développement de marché de la matrice d'Ansoff prend parfois la forme d'une " +
      "frontière à franchir. Vendre au pays voisin semble n'être qu'une affaire de " +
      "camions. En réalité, la question devient : que garder identique partout, et que " +
      "changer pour chaque pays ?",
  ),

  titre("Pourquoi franchir une frontière"),
  liste(
    "**Trouver des clients** quand le marché national sature ou reste trop petit.",
    "**Gagner du volume** pour baisser les coûts unitaires.",
    "**Suivre ses clients** qui s'installent ailleurs.",
    "**Accéder à des ressources** : matières, main-d'œuvre, savoir-faire.",
    "**Répartir les risques** entre plusieurs économies.",
  ),

  titre("Deux pressions contraires"),
  p(
    "Christopher Bartlett et Sumantra Ghoshal ont décrit en 1989 deux forces qui tirent " +
      "l'entreprise en sens opposés. La **pression d'intégration mondiale** pousse à " +
      "standardiser pour réduire les coûts. La **pression d'adaptation locale** pousse à " +
      "ajuster le produit aux goûts, aux lois, aux revenus et aux canaux de chaque pays.",
  ),
  schema(
    "global-local",
    "Les quatre stratégies internationales selon les deux pressions : intégration " +
      "mondiale en ordonnée, adaptation locale en abscisse. Faibles toutes deux : " +
      "exportation. Forte adaptation seulement : multidomestique. Forte intégration " +
      "seulement : globale. Fortes toutes deux : transnationale.",
  ),
  tableau(
    ["Stratégie", "Principe", "Exemple type"],
    [
      ["Exportation", "Le même produit, vendu depuis le pays d'origine", "Un artisan du cuir"],
      ["Multidomestique", "Chaque filiale s'adapte à son pays", "Une chaîne de restaurants"],
      ["Globale", "Un produit unique, fabriqué à grande échelle", "Un fabricant de puces"],
      ["Transnationale", "Une base commune, des adaptations locales", "Un groupe alimentaire"],
    ],
  ),
  retenir(
    "Il n'y a pas de bonne stratégie internationale en soi : il y a celle qui répond aux " +
      "deux pressions telles qu'elles s'exercent dans le secteur.",
  ),

  titre("Les modes d'entrée"),
  tableau(
    ["Mode", "Engagement", "Contrôle", "Risque"],
    [
      ["Exportation directe ou par agent", "Faible", "Faible", "Faible"],
      ["Licence ou franchise", "Faible", "Moyen", "Faible à moyen"],
      ["Coentreprise avec un partenaire local", "Moyen", "Partagé", "Moyen"],
      ["Filiale en propre", "Élevé", "Élevé", "Élevé"],
    ],
  ),
  p(
    "On commence souvent léger, puis on s'engage à mesure qu'on apprend le marché. La " +
      "coentreprise apporte ce qui manque le plus à l'arrivant : la connaissance des " +
      "réseaux, des clients et de l'administration du pays.",
  ),

  titre("Penser en espaces régionaux"),
  p(
    "En Afrique de l'Ouest, un marché national peut être petit, mais les espaces " +
      "régionaux sont grands. L'UEMOA partage une monnaie, le franc CFA, et un tarif " +
      "extérieur commun ; la CEDEAO ouvre un ensemble plus vaste encore. Pour une " +
      "entreprise, la bonne unité d'analyse est parfois la région plutôt que le pays.",
  ),
  terrain(
    "Une région plutôt qu'un pays",
    "Quand Ajinomoto a créé sa filiale d'Afrique de l'Ouest à Abidjan, en 2012, le groupe " +
      "ne visait pas la seule Côte d'Ivoire. Il raisonnait sur onze pays et environ 113 " +
      "millions d'habitants, qui partageaient souvent la langue, le franc CFA et des " +
      "habitudes de cuisine proches. Le produit restait le même partout ; ce qui " +
      "changeait, c'étaient les formats, conditionnés sur place pour les budgets des " +
      "ménages. Depuis Abidjan, nous exportions ensuite vers les pays voisins. C'était, à " +
      "petite échelle, une logique transnationale : une base commune, une adaptation " +
      "locale là où le client la voyait.",
  ),
  piege(
    "Croire qu'une monnaie commune efface les différences. Les goûts, les circuits de " +
      "distribution et les règles douanières réelles varient d'un pays à l'autre, même " +
      "dans l'UEMOA.",
  ),

  titre("Et Infosystem ?"),
  p(
    "L'international n'est pas à l'ordre du jour pour Infosystem. Ses services exigent " +
      "souvent une présence sur place, ses clients sont des PME régionales, et son " +
      "problème central reste le manque de techniciens. La leçon sert ici à reconnaître " +
      "une option pour l'écarter en connaissance de cause.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Placez chaque entreprise dans la stratégie internationale qui la décrit.",
    categories: ["Exportation", "Multidomestique", "Globale", "Transnationale"],
    grille: {
      axeVertical: ["Intégration mondiale", "faible", "forte"],
      axeHorizontal: ["Adaptation locale", "faible", "forte"],
      cases: [2, 3, 0, 1],
    },
    elements: [
      {
        texte: "Un tisserand de pagnes qui expédie ses pièces à des clients d'Europe.",
        categorie: 0,
        explication: "Même produit, fabriqué et vendu depuis le pays d'origine.",
      },
      {
        texte: "Un groupe de médias dont chaque filiale produit ses propres émissions locales.",
        categorie: 1,
        explication: "Chaque pays a son offre : l'adaptation domine.",
      },
      {
        texte: "Un fabricant de composants électroniques identiques dans le monde entier.",
        categorie: 2,
        explication: "Standardisation et volume : l'intégration domine.",
      },
      {
        texte: "Une marque de boissons à recette commune, avec des formats et parfums locaux.",
        categorie: 3,
        explication: "Une base commune et des adaptations visibles : les deux pressions.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Une PME sénégalaise veut tester le marché malien sans grand risque, mais en " +
      "profitant du réseau d'un acteur local. Quel mode d'entrée lui convient le mieux ?",
    choix: [
      {
        texte: "Une filiale en propre à Bamako.",
        explication: "C'est le mode le plus engageant et le plus risqué.",
      },
      {
        texte: "Une coentreprise ou un accord avec un distributeur malien.",
        explication: "Oui : risque partagé et accès au réseau local.",
      },
      {
        texte: "Aucun : le franc CFA rend toute adaptation inutile.",
        explication: "La monnaie commune n'efface pas les différences de marché.",
      },
    ],
    bonne: 1,
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "La stratégie globale répond surtout à la pression d'adaptation locale.",
        vrai: false,
        explication:
          "Elle répond à la pression d'intégration : " +
          "standardiser pour baisser les coûts.",
      },
      {
        texte: "Une filiale en propre donne plus de contrôle qu'une licence.",
        vrai: true,
        explication: "En échange d'un engagement et d'un risque plus élevés.",
      },
      {
        texte: "Pour une entreprise ouest-africaine, la région peut être une meilleure unité " +
          "d'analyse que le pays.",
        vrai: true,
        explication: "Les espaces UEMOA et CEDEAO élargissent le marché accessible.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Choisissez un pays ou une région où votre organisation pourrait s'étendre. " +
      "Évaluez les deux pressions, choisissez une stratégie et un mode d'entrée, et " +
      "dites ce que vous adapteriez.",
    corrige: [
      "Une raison claire de franchir la frontière.",
      "Les deux pressions évaluées avec des exemples concrets du secteur.",
      "Une stratégie et un mode d'entrée cohérents avec ces pressions et avec vos moyens.",
      "Une liste précise de ce qui reste identique et de ce qui change.",
    ],
  }),

  appliquez(
    7,
    "Si l'international fait partie de vos options, placez-le dans la case « Développement " +
      "de marché » de l'étape 7 et précisez le mode d'entrée envisagé.",
  ),
  fiche(
    "Deux pressions : intégration mondiale et adaptation locale.",
    "Quatre stratégies : exportation, multidomestique, globale, transnationale.",
    "Modes d'entrée : de l'exportation à la filiale, l'engagement monte avec le contrôle.",
    "En Afrique de l'Ouest, penser en espaces régionaux : UEMOA, CEDEAO.",
    "Infosystem : option reconnue, puis écartée.",
  ),
];
