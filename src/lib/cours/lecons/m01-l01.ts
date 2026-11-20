/**
 * =============================================================
 *  Fichier    : m01-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 1, leçon 1 — « Qu'est-ce qu'une stratégie ? Choisir, c'est
 *               renoncer ». Leçon pilote du Sprint 1. Sources : livre, module 1 (§ 1.1,
 *               encadré NPSP-CI, défis d'Infosystem) ; Porter, « What Is Strategy? »,
 *               Harvard Business Review, 1996. Texte et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import {
  appliquez,
  definition,
  exercice,
  fiche,
  liste,
  notion,
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

export const M01_L01: ContenuLecon = [
  p(
    "Une PME peut tourner des années sans plan écrit. Les clients appellent, l'équipe " +
      "répond, les factures partent. Puis un gros client s'en va, deux techniciens " +
      "démissionnent le même mois, un concurrent casse les prix, et l'on décide dans " +
      "l'urgence avec ce qu'on a sous la main. **La stratégie sert à sortir de ce mode " +
      "réactif.**",
  ),

  titre("Une définition qui tient en une ligne"),
  definition(
    "Stratégie",
    "L'ensemble cohérent des **choix** qui fixent où l'entreprise se bat, comment elle " +
      "compte y gagner, et ce qu'elle **refuse de faire** pour y parvenir.",
  ),
  p(
    "Trois mots portent la définition. *Choix* : une stratégie tranche entre des options " +
      "réelles. *Cohérent* : les décisions se renforcent au lieu de se contredire. " +
      "*Refuse* : ce qu'on écarte compte autant que ce qu'on retient.",
  ),

  titre("Choisir, c'est renoncer"),
  p(
    "Dans un article devenu classique, « What Is Strategy? » (*Harvard Business Review*, " +
      "1996), Michael Porter distingue deux choses qu'on confond souvent. " +
      "**L'efficacité opérationnelle** consiste à faire mieux que les autres les mêmes " +
      "activités : moins de pertes, plus de rapidité. Elle est nécessaire, mais elle " +
      "s'imite vite. **Le positionnement stratégique** consiste à faire des activités " +
      "*différentes*, ou les mêmes autrement, et il impose des arbitrages : on ne peut pas " +
      "être à la fois le moins cher et le plus attentionné, partout et pour tous.",
  ),
  schema(
    "choisir-renoncer",
    "Les options possibles passent par un filtre de choix : quelques-unes sont retenues " +
      "et se renforcent, les autres sont écartées volontairement.",
  ),
  retenir("Une stratégie se reconnaît à ce qu'elle exclut.", [
    "Si rien n'est exclu, ce n'est pas une stratégie, c'est une liste de souhaits.",
    "Un renoncement assumé libère des moyens pour ce qui compte.",
    "L'efficacité améliore la course ; la stratégie choisit la course.",
  ]),

  titre("Un exemple près de chez vous"),
  p(
    "Prenons une compagnie de transport interurbain fictive, basée à Bouaké. Elle peut " +
      "tout desservir, à tous les prix, avec des cars de tous âges. Ou bien elle choisit : " +
      "trois lignes seulement (Abidjan, Yamoussoukro, Korhogo), des départs à heure fixe, " +
      "des cars récents et un billet un peu plus cher. Elle **renonce** aux petites lignes " +
      "et aux clients qui cherchent le prix le plus bas.",
  ),
  tableau(
    ["Décision", "Ce qui est retenu", "Ce qui est écarté"],
    [
      ["Où se battre", "Trois grands axes", "Les petites lignes rurales"],
      [
        "Pour qui",
        "Voyageurs pressés et fidèles",
        "Clients qui veulent le moins cher",
      ],
      ["Comment gagner", "Ponctualité, confort", "Guerre des prix"],
      [
        "Avec quoi",
        "Flotte récente, entretien maison",
        "Cars d'occasion bon marché",
      ],
    ],
    "Chaque ligne renforce les autres : c'est la cohérence qui rend la stratégie " +
      "difficile à copier.",
  ),
  piege(
    "Confondre stratégie et objectif. « Devenir le leader du transport en Côte d'Ivoire » " +
      "est une ambition. La stratégie dit **comment** y arriver, et à quoi l'on renonce " +
      "en chemin.",
  ),

  titre("Comprendre le système avant de choisir"),
  terrain(
    "Comprendre le système avant de corriger",
    "À la NPSP-CI, à Abidjan, les créances clients étaient notre principal souci. Plutôt " +
      "que de traiter les retards un par un, nous avons cartographié le processus " +
      "commande-paiement de bout en bout. Trois causes sont apparues : des blocages " +
      "**internes** (services éloignés, chacun dans sa partie de l'ERP), des contraintes " +
      "**externes** (clients ruraux sans banque ni réseau) et des retards liés à **notre " +
      "mission** (on ne coupe pas l'approvisionnement d'un hôpital). Chacune appelait une " +
      "réponse différente : travail sur les flux, choix de banques au réseau étendu, " +
      "matrice de solvabilité à trois niveaux avec alertes. Avant de choisir une solution, " +
      "comprenez le système qui produit le problème.",
  ),
  notion(
    "Pour aller plus loin : Infosystem, notre fil rouge",
    p(
      "Tout au long du cours, nous suivons Infosystem, une PME québécoise de services " +
        "informatiques de treize personnes, dirigée par son fondateur, Justin. Quatre défis " +
        "s'y entremêlent :",
    ),
    liste(
      "**La relève** : Justin et Marthe veulent passer la main à quelqu'un de fiable.",
      "**La croissance** : les demandes affluent, mais pas au prix de la qualité.",
      "**La rétention** : les jeunes techniciens partent vers de grandes entreprises.",
      "**La capacité** : faute de bras et d'outils, on refuse déjà des mandats.",
    ),
    p(
      "Ces défis s'alimentent : le roulement réduit la capacité, qui freine la croissance, " +
        "et une entreprise qui repose sur trois personnes se transmet mal. Traiter un " +
        "symptôme isolé ne réglerait rien.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "qcm",
    id: "e1",
    question:
      "Laquelle de ces phrases décrit une **stratégie**, au sens de Porter ?",
    choix: [
      {
        texte: "Réduire de 10 % le temps de traitement des commandes.",
        explication:
          "C'est de l'efficacité opérationnelle : utile, mais un concurrent peut l'imiter.",
      },
      {
        texte: "Devenir l'entreprise préférée des clients.",
        explication:
          "C'est une ambition. Elle ne dit ni comment, ni à quoi l'on renonce.",
      },
      {
        texte:
          "Ne servir que les cliniques privées d'Abidjan, avec un technicien attitré, " +
          "et refuser les petits dépannages ponctuels.",
        explication:
          "Oui : un terrain choisi, une manière de gagner, et un renoncement explicite.",
      },
      {
        texte: "Adopter un nouvel ERP l'an prochain.",
        explication:
          "C'est un projet, qui peut servir une stratégie mais n'en est pas une.",
      },
    ],
    bonne: 2,
  }),
  exercice({
    type: "vrai-faux",
    id: "e2",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte:
          "Une bonne stratégie permet de satisfaire tous les clients à la fois.",
        vrai: false,
        explication:
          "Servir tout le monde empêche de choisir ; la stratégie impose des arbitrages.",
      },
      {
        texte:
          "Être plus efficace que ses concurrents suffit à garantir un avantage durable.",
        vrai: false,
        explication:
          "L'efficacité s'imite vite ; c'est la cohérence des choix qui protège.",
      },
      {
        texte:
          "Ce qu'une entreprise décide de ne pas faire fait partie de sa stratégie.",
        vrai: true,
        explication: "C'est le cœur de l'idée : choisir, c'est renoncer.",
      },
      {
        texte:
          "Une PME n'a pas besoin de stratégie tant que les affaires tournent.",
        vrai: false,
        explication:
          "C'est justement quand tout va bien qu'on a le temps d'analyser avant de subir.",
      },
    ],
  }),
  exercice({
    type: "classement",
    id: "e3",
    consigne:
      "À la NPSP-CI, chaque cause de retard de paiement relève d'un type différent. " +
      "Classez-les.",
    categories: ["Interne", "Externe", "Liée à la mission"],
    elements: [
      {
        texte:
          "Les services travaillent dans des bureaux éloignés, sans vue d'ensemble.",
        categorie: 0,
        explication: "L'organisation peut le corriger elle-même.",
      },
      {
        texte:
          "Des clients ruraux n'ont ni banque à proximité ni couverture réseau.",
        categorie: 1,
        explication:
          "On ne le corrige pas, on le contourne (banques au réseau étendu).",
      },
      {
        texte:
          "Les hôpitaux paient en retard, mais on ne peut pas cesser de les servir.",
        categorie: 2,
        explication:
          "La santé publique passe avant le recouvrement : on gère le risque.",
      },
      {
        texte: "Chaque service n'utilise que ses propres fonctions de l'ERP.",
        categorie: 0,
        explication: "Un travail sur les flux et les vues partagées y répond.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Justin veut à la fois faire croître Infosystem et préparer sa retraite. Ces deux " +
      "objectifs sont-ils compatibles ? À quoi devrait-il renoncer ?",
    corrige: [
      "Compatibles à condition de croître **sans dépendre davantage de Justin** : la " +
        "croissance doit renforcer l'équipe, pas le fondateur.",
      "Renoncer à certains mandats qui exigent son intervention personnelle, ou aux " +
        "contrats ponctuels peu rentables qui saturent l'équipe.",
      "Prioriser la rétention et la formation d'un successeur : sans elles, croître " +
        "rendrait l'entreprise plus difficile à transmettre.",
    ],
  }),

  appliquez(
    null,
    "Ouvrez une étude dans Kalami Stratégie et notez, pour votre organisation, une chose " +
      "qu'elle fait aujourd'hui et à laquelle elle gagnerait à renoncer.",
  ),
  fiche(
    "La stratégie est un ensemble cohérent de choix : où se battre, comment gagner, " +
      "à quoi renoncer.",
    "Efficacité opérationnelle ≠ stratégie : la première s'imite, la seconde se construit.",
    "Une stratégie qui n'exclut rien n'en est pas une.",
    "Avant de choisir, comprendre le système qui produit le problème.",
  ),
];
