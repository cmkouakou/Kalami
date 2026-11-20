/**
 * =============================================================
 *  Fichier    : m10.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 10 — Innovation : terrains d'innovation, diffusion
 *               et fossé, pionnier ou suiveur, continuité ou rupture. Questions
 *               originales.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M10: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question: "Qu'est-ce qu'une innovation, au sens stratégique ?",
    choix: [
      {
        texte: "Une invention brevetée.",
        explication: "Une invention qui ne trouve pas preneur n'est pas une innovation.",
      },
      {
        texte: "Toute nouvelle technologie numérique.",
        explication: "L'innovation peut porter sur un procédé, une offre, un modèle.",
      },
      {
        texte: "Une nouveauté adoptée par des clients ou par l'organisation.",
        explication: "Oui : c'est l'adoption qui fait l'innovation.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q2",
    question: "Qu'appelle-t-on le « fossé » dans la diffusion d'une innovation ?",
    choix: [
      {
        texte: "Le passage difficile des premiers adeptes à la majorité.",
        explication: "Oui : la majorité veut des preuves, pas de la nouveauté.",
      },
      {
        texte: "L'écart de prix entre l'innovation et l'ancien produit.",
        explication: "Le prix peut jouer, mais ce n'est pas la définition.",
      },
      {
        texte: "Le moment où les retardataires adoptent enfin le produit.",
        explication: "C'est la toute fin de la courbe, pas le fossé.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q3",
    question: "Que signifie l'idée d'être « le premier à réussir » plutôt que le premier ?",
    choix: [
      {
        texte: "Il faut toujours attendre que d'autres se lancent.",
        explication: "Attendre n'est pas toujours gagnant non plus.",
      },
      {
        texte: "Arriver en premier ne garantit rien ; compte celui qui gagne le marché.",
        explication: "Oui : un suiveur peut apprendre des erreurs du pionnier.",
      },
      {
        texte: "Il faut breveter avant de lancer.",
        explication: "Le brevet protège, mais ne fait pas réussir.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q4",
    question: "Lequel de ces leviers accélère l'adoption d'une innovation ?",
    choix: [
      {
        texte: "La rendre plus compliquée, pour paraître plus avancée.",
        explication: "La complexité freine l'adoption.",
      },
      {
        texte: "Empêcher les clients de l'essayer avant l'achat.",
        explication: "L'essai rassure et accélère.",
      },
      {
        texte: "Cacher ses résultats aux autres clients.",
        explication: "Des résultats visibles convainquent les suivants.",
      },
      {
        texte: "Montrer un avantage clair par rapport à ce qu'on utilise déjà.",
        explication: "Oui : c'est le premier des accélérateurs.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question: "Qu'est-ce qui caractérise une innovation de rupture ?",
    choix: [
      {
        texte: "Elle améliore un produit pour les meilleurs clients actuels.",
        explication: "C'est une innovation de continuité.",
      },
      {
        texte: "Elle commence souvent par une offre plus simple, pour des clients négligés.",
        explication: "Oui : les leaders la sous-estiment, puis elle monte en gamme.",
      },
      {
        texte: "Elle coûte toujours plus cher que l'existant.",
        explication: "C'est souvent l'inverse au départ.",
      },
    ],
    bonne: 1,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Innover dans l'organisation : vrai ou faux ?",
    affirmations: [
      {
        texte: "Un intrapreneur porte un projet nouveau à l'intérieur d'une entreprise.",
        vrai: true,
        explication: "Il agit comme un entrepreneur, avec les moyens de l'organisation.",
      },
      {
        texte: "Seule l'innovation de produit compte vraiment.",
        vrai: false,
        explication: "Procédés, modèles d'affaires et organisation sont aussi des terrains.",
      },
      {
        texte: "La peur de l'échec peut freiner l'innovation dans une entreprise.",
        vrai: true,
        explication: "C'est l'un des obstacles à lever.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Diffusion : vrai ou faux ?",
    affirmations: [
      {
        texte: "L'adoption cumulée d'une innovation suit souvent une courbe en S.",
        vrai: true,
        explication: "Lente au début, rapide au milieu, lente à la fin.",
      },
      {
        texte: "Les innovateurs et les premiers adeptes forment la majorité du marché.",
        vrai: false,
        explication: "Ils sont peu nombreux ; la majorité vient après.",
      },
      {
        texte: "Ce qui convainc les premiers adeptes convainc aussi la majorité.",
        vrai: false,
        explication: "La majorité veut des références, du service, peu de risque.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne:
      "Une banque lance le paiement par téléphone : à quel groupe chaque client " +
      "appartient-il ?",
    categories: [
      "Innovateurs",
      "Premiers adeptes",
      "Majorité précoce",
      "Majorité tardive",
      "Retardataires",
    ],
    elements: [
      {
        texte: "Teste le service le jour du lancement, par simple curiosité.",
        categorie: 0,
      },
      {
        texte: "Un commerçant influent l'adopte tôt et en parle à ses fournisseurs.",
        categorie: 1,
      },
      {
        texte: "Attend que ses collègues l'utilisent sans souci depuis des mois.",
        categorie: 2,
      },
      {
        texte: "Ne s'y met que lorsque son employeur paie les salaires ainsi.",
        categorie: 3,
      },
      {
        texte: "Refuse tout paiement qui ne passe pas par l'argent liquide.",
        categorie: 4,
      },
    ],
  },
];
