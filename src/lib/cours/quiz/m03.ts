/**
 * =============================================================
 *  Fichier    : m03.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 3 — L'industrie et la concurrence : cinq forces,
 *               barrières à l'entrée et à la sortie, cycle de vie, concurrents et
 *               substituts, facteurs clés de succès. Questions originales.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M03: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question: "Que nous apprennent les cinq forces d'une industrie ?",
    choix: [
      {
        texte: "Qui capte la valeur créée : plus elles sont fortes, moins il reste de marge.",
        explication: "Oui : c'est la question centrale de l'analyse.",
      },
      {
        texte: "Quelle entreprise est la mieux gérée de l'industrie.",
        explication: "Les forces décrivent l'industrie, pas la qualité d'une entreprise.",
      },
      {
        texte: "Quelles tendances du PESTEL vont se réaliser.",
        explication: "Le PESTEL est une autre strate de l'analyse.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q2",
    question:
      "Les techniciens qualifiés sont rares et changent facilement d'employeur. Pour une " +
      "firme de services informatiques, quelle force cela renforce-t-il ?",
    choix: [
      {
        texte: "La menace des substituts.",
        explication: "Les techniciens ne remplacent pas le service : ils le produisent.",
      },
      {
        texte: "Le pouvoir des clients.",
        explication: "Les clients ne sont pas concernés ici.",
      },
      {
        texte: "Le pouvoir des fournisseurs.",
        explication: "Oui : une main-d'œuvre rare est un fournisseur puissant.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q3",
    question:
      "Les ventes de toutes les imprimeries d'une ville baissent la même année. Quelle " +
      "piste explorer en premier ?",
    choix: [
      {
        texte: "Un concurrent qui a baissé ses prix.",
        explication: "Un concurrent prend des parts aux autres ; ici, tout le monde recule.",
      },
      {
        texte: "Un substitut : le besoin est satisfait autrement.",
        explication: "Oui : quand toute l'industrie recule, cherchez le substitut.",
      },
      {
        texte: "Une erreur de gestion commune.",
        explication: "Peu probable chez toutes les imprimeries à la fois.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q4",
    question: "Lequel de ces éléments n'est pas une barrière à l'entrée ?",
    choix: [
      {
        texte: "Les effets de réseau.",
        explication: "C'en est une : chaque utilisateur rend l'offre plus attirante.",
      },
      {
        texte: "La réglementation.",
        explication: "C'en est une : licences et agréments freinent les entrants.",
      },
      {
        texte: "Les coûts de changement des clients.",
        explication: "C'en est une : quitter le fournisseur actuel coûte au client.",
      },
      {
        texte: "Des équipements très spécialisés, impossibles à revendre.",
        explication: "Oui : c'est une barrière à la sortie ; elle entretient la rivalité.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question: "À quoi reconnaît-on un facteur clé de succès ?",
    choix: [
      {
        texte: "C'est le point fort principal de notre entreprise.",
        explication: "Un FCS appartient à l'industrie, pas à une entreprise.",
      },
      {
        texte: "Il appartient à l'industrie et part des attentes des clients.",
        explication: "Oui : c'est ce qu'il faut maîtriser pour réussir dans ce marché.",
      },
      {
        texte: "C'est l'objectif le plus ambitieux du plan.",
        explication: "Un objectif est un choix ; le FCS est une exigence du marché.",
      },
    ],
    bonne: 1,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Barrières et cycle de vie : vrai ou faux ?",
    affirmations: [
      {
        texte: "Une barrière à l'entrée, une fois en place, protège pour toujours.",
        vrai: false,
        explication: "La technologie, les lois et les stratégies la déplacent.",
      },
      {
        texte: "Les cinq forces changent selon la phase du cycle de vie.",
        vrai: true,
        explication: "La rivalité, par exemple, monte souvent en maturité.",
      },
      {
        texte: "Les compléments n'ont aucun effet sur la valeur d'un produit.",
        vrai: false,
        explication: "Ils en ajoutent ; qui les contrôle peut capter une part de la valeur.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Se comparer : vrai ou faux ?",
    affirmations: [
      {
        texte: "Un point fort que tous les concurrents partagent n'est pas un avantage.",
        vrai: true,
        explication: "Il est nécessaire, mais il ne distingue pas.",
      },
      {
        texte: "Dans un marché fragmenté, on peut se comparer à des types de concurrents.",
        vrai: true,
        explication: "Comparer à chacun serait impossible et peu utile.",
      },
      {
        texte: "Il vaut mieux partir de son produit que du besoin du client.",
        vrai: false,
        explication: "Partir du besoin révèle les substituts qu'on ne voit pas sinon.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne:
      "Une compagnie d'autocars entre Abidjan et Yamoussoukro : quelle force chaque fait " +
      "illustre-t-il ?",
    categories: [
      "Rivalité",
      "Pouvoir des clients",
      "Pouvoir des fournisseurs",
      "Nouveaux entrants",
      "Substituts",
    ],
    elements: [
      {
        texte: "Les voyageurs comparent les prix de six compagnies sur la même ligne.",
        categorie: 0,
      },
      {
        texte: "Un seul importateur vend les pièces détachées des cars de la flotte.",
        categorie: 2,
      },
      {
        texte: "Le covoiturage organisé par messagerie se développe sur le trajet.",
        categorie: 4,
      },
      {
        texte: "Une compagnie étrangère obtient sa licence pour exploiter la ligne.",
        categorie: 3,
      },
      {
        texte: "Les entreprises qui louent des cars pour leur personnel négocient fort.",
        categorie: 1,
      },
    ],
  },
];
