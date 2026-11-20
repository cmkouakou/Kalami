/**
 * =============================================================
 *  Fichier    : m09-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 9, leçon 1 — « La matrice d'Ansoff : où croître ? » : les quatre
 *               directions et leur risque croissant, la correction de la première édition
 *               (développement de produit ou de marché n'est pas une diversification), les
 *               choix d'Infosystem. Sources : livre, module 8 (§ 8.3) ; Ansoff, Harvard
 *               Business Review, 1957. Texte, exemples et exercices originaux.
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
  notion,
  p,
  piege,
  retenir,
  schema,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M09_L01: ContenuLecon = [
  p(
    "Le module 8 a répondu à la question « comment gagner ? ». Le module 9 change " +
      "d'étage : il monte au niveau corporatif et demande « où croître ? ». La première " +
      "carte pour s'orienter date de 1957. Igor Ansoff l'a publiée dans la Harvard " +
      "Business Review, et elle reste la plus utilisée.",
  ),

  titre("Deux axes, quatre directions"),
  p(
    "La matrice croise les produits (actuels ou nouveaux) et les marchés (actuels ou " +
      "nouveaux). Chaque case est une direction de croissance. Plus on s'éloigne de la " +
      "case de départ, plus l'entreprise entre dans l'inconnu, et plus le risque monte.",
  ),
  schema(
    "ansoff",
    "La matrice d'Ansoff appliquée à Infosystem : les produits en abscisse, les marchés en " +
      "ordonnée. Développement de produit (sécurité, conformité, IA) en premier, " +
      "pénétration de marché ensuite, développement de marché plus tard, diversification " +
      "écartée.",
  ),
  tableau(
    ["Direction", "Ce qu'elle fait", "Ce que l'entreprise connaît déjà"],
    [
      ["Pénétration de marché", "Vendre plus des mêmes produits aux mêmes clients", "Tout"],
      ["Développement de produit", "De nouveaux produits pour les clients actuels", "Ses clients"],
      ["Développement de marché", "Les produits actuels vers de nouveaux clients", "Ses produits"],
      ["Diversification", "De nouveaux produits pour de nouveaux clients", "Presque rien"],
    ],
  ),
  retenir(
    "Le risque grandit avec ce qu'on ignore. La pénétration joue à domicile ; la " +
      "diversification joue sur un terrain inconnu, avec un produit inconnu.",
  ),

  titre("Une correction utile"),
  p(
    "La première édition du livre rangeait le développement de produit et le " +
      "développement de marché sous l'étiquette de « diversification liée ». C'est une " +
      "confusion fréquente. Dans la matrice d'Ansoff, ces deux cases ne sont pas des " +
      "diversifications : l'entreprise y reste sur un terrain qu'elle connaît à moitié, " +
      "par ses clients ou par ses produits.",
  ),
  piege(
    "Appeler « diversification » tout lancement de produit. Un fabricant de jus qui ajoute " +
      "un parfum à sa gamme fait du développement de produit. Il ne se diversifie que s'il " +
      "entre dans une activité nouvelle, pour des clients nouveaux.",
  ),

  titre("Les choix d'Infosystem"),
  tableau(
    ["Direction", "Option pour Infosystem", "Verdict"],
    [
      [
        "Développement de produit",
        "Cybersécurité, conformité à la Loi 25, conseil sur l'IA pour les clients actuels",
        "En premier : s'appuie sur la confiance acquise",
      ],
      [
        "Pénétration de marché",
        "Gagner d'autres PME de la région",
        "Ensuite, quand l'équipe pourra les accueillir",
      ],
      ["Développement de marché", "S'implanter dans d'autres régions", "Plus tard"],
      ["Diversification", "Une activité hors de l'informatique gérée", "Écartée"],
    ],
  ),
  p(
    "L'ordre compte autant que le choix. Chercher de nouveaux clients avant d'avoir " +
      "stabilisé l'équipe aggraverait le problème central d'Infosystem : le manque de " +
      "techniciens. Le développement de produit, lui, augmente la valeur de chaque client " +
      "sans multiplier les interventions.",
  ),
  notion(
    "Pour aller plus loin : la consolidation et le retrait",
    p(
      "Les éditions récentes des manuels ajoutent une case souvent oubliée : la " +
        "**consolidation**, voire le **retrait**. Rester sur le même marché en se " +
        "concentrant sur les clients les plus rentables, ou sortir d'un marché qui ne " +
        "rapporte plus, est aussi un choix de direction.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une entreprise ivoirienne produit des jus de fruits vendus dans les supermarchés " +
      "d'Abidjan. Placez chaque projet dans sa case d'Ansoff.",
    categories: [
      "Pénétration de marché",
      "Développement de produit",
      "Développement de marché",
      "Diversification",
    ],
    elements: [
      {
        texte: "Une promotion pour que les clients actuels achètent plus souvent.",
        categorie: 0,
        explication: "Même produit, mêmes clients.",
      },
      {
        texte: "Un jus de bissap sans sucre ajouté dans les mêmes supermarchés.",
        categorie: 1,
        explication: "Nouveau produit, mêmes clients.",
      },
      {
        texte: "Les mêmes jus vendus dans les stations-service de Yamoussoukro et Bouaké.",
        categorie: 2,
        explication: "Même produit, nouveaux clients et nouvelle zone.",
      },
      {
        texte: "Une entreprise de location de matériel agricole.",
        categorie: 3,
        explication: "Nouveau produit, nouveaux clients : terrain inconnu.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Pourquoi Infosystem place-t-elle le développement de produit avant la pénétration " +
      "de marché ?",
    choix: [
      {
        texte: "Parce que le développement de produit est toujours moins risqué.",
        explication: "Ce n'est pas une règle générale ; c'est vrai ici à cause de sa situation.",
      },
      {
        texte: "Parce qu'il valorise la confiance acquise sans aggraver le manque de techniciens.",
        explication: "Oui : plus de valeur par client, sans multiplier les clients à servir.",
      },
      {
        texte: "Parce que la région n'a plus de PME à conquérir.",
        explication: "Rien ne le dit ; la limite est la capacité de l'équipe.",
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
        texte: "Le développement de marché est une forme de diversification.",
        vrai: false,
        explication: "L'entreprise garde ses produits : ce n'est pas une diversification.",
      },
      {
        texte: "La diversification est la direction la plus risquée de la matrice.",
        vrai: true,
        explication: "Elle combine deux inconnues : le produit et le marché.",
      },
      {
        texte: "L'ordre des directions compte autant que leur choix.",
        vrai: true,
        explication: "Infosystem le montre : l'équipe d'abord, les nouveaux clients ensuite.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Proposez une option de croissance pour votre organisation dans chacune des quatre " +
      "cases. Classez-les dans l'ordre où vous les mèneriez, et justifiez cet ordre.",
    corrige: [
      "Quatre options concrètes, une par case, bien placées.",
      "Un ordre justifié par les enjeux et les ressources, pas seulement par l'envie.",
      "Au moins une option écartée ou reportée, avec sa raison.",
      "Le rappel du risque croissant d'une case à l'autre.",
    ],
  }),

  appliquez(
    7,
    "Dans la deuxième partie de l'étape 7, listez vos options et placez chacune dans une " +
      "case de la matrice d'Ansoff.",
  ),
  fiche(
    "Ansoff croise produits et marchés, actuels ou nouveaux.",
    "Quatre directions : pénétration, développement de produit, de marché, diversification.",
    "Le risque grandit avec ce que l'entreprise ignore.",
    "Développer un produit ou un marché n'est pas se diversifier.",
    "Infosystem : nouveaux services d'abord, nouveaux clients ensuite.",
  ),
];
