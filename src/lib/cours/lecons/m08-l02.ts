/**
 * =============================================================
 *  Fichier    : m08-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 8, leçon 2 — « Les stratégies génériques de Porter » : les deux
 *               questions (avantage, cible), les quatre positions, la voie médiane, le
 *               choix d'Infosystem (focalisation par la différenciation). Sources : livre,
 *               module 8 (§ 8.2) ; Porter, Competitive Strategy, 1980. Texte, exemples et
 *               exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
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
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M08_L02: ContenuLecon = [
  p(
    "Dans un DAS, on peut gagner de plusieurs façons, mais pas de toutes à la fois. " +
      "Michael Porter l'a résumé en 1980, dans *Competitive Strategy*, avec deux questions " +
      "simples. Leurs réponses donnent quatre positions, et un avertissement.",
  ),

  titre("Deux questions"),
  liste(
    "**Sur quoi repose l'avantage ?** Sur des coûts plus bas que ceux des concurrents, ou " +
      "sur une valeur perçue unique, pour laquelle les clients acceptent de payer plus.",
    "**Quelle est la cible ?** L'ensemble du marché, ou un segment précis que l'on sert " +
      "mieux que les généralistes.",
  ),
  schema(
    "strategies-generiques",
    "Les stratégies génériques de Porter : l'avantage (coûts plus bas ou valeur unique) en " +
      "colonnes, la cible (large ou étroite) en lignes. Infosystem vise la focalisation par " +
      "la différenciation.",
  ),

  titre("Quatre positions"),
  tableau(
    ["Position", "Logique", "Ce qu'il faut maîtriser"],
    [
      [
        "Domination par les coûts",
        "Être le moins cher du marché, et rester rentable",
        "Volume, standardisation, achats, chasse au gaspillage",
      ],
      [
        "Différenciation",
        "Offrir ce que les autres n'offrent pas, à tout le marché",
        "Marque, qualité, innovation, service",
      ],
      [
        "Focalisation par les coûts",
        "Le moins cher pour un segment précis",
        "Une offre dépouillée, taillée pour ce segment",
      ],
      [
        "Focalisation par la différenciation",
        "Le meilleur pour un segment précis",
        "Connaître ce segment mieux que quiconque",
      ],
    ],
  ),
  p(
    "Domination par les coûts ne veut pas dire prix bas : cela veut dire **coûts** bas. " +
      "L'entreprise peut vendre au prix du marché et empocher une marge plus forte, ou " +
      "baisser ses prix pour gagner du volume. Le prix est une tactique ; le coût est " +
      "l'avantage.",
  ),

  titre("Le piège de la voie médiane"),
  definition(
    "Voie médiane (stuck in the middle)",
    "La situation de l'entreprise qui ne choisit pas : un peu moins chère et un peu " +
      "meilleure pour tout le monde. Elle n'a ni les coûts du leader des prix ni l'attrait " +
      "du spécialiste.",
  ),
  p(
    "Le risque est concret. Les clients sensibles au prix iront chez le moins cher, ceux " +
      "qui cherchent la qualité iront chez le spécialiste. Il reste à l'entreprise du " +
      "milieu les clients que personne d'autre ne sert, souvent les moins rentables.",
  ),
  piege(
    "Croire que « qualité et bas prix » est une stratégie. C'est une promesse que toutes " +
      "les entreprises font. La stratégie commence quand on dit sur lequel des deux on " +
      "accepte d'être battu.",
  ),

  titre("Le choix d'Infosystem"),
  p(
    "Pour Infosystem, le raisonnement se fait par élimination. La domination par les " +
      "coûts est hors de portée : une PME de treize personnes n'aura jamais les économies " +
      "d'échelle de CGI, et l'IA va faire baisser le prix du soutien de base pour tout le " +
      "monde. La différenciation sur tout le marché l'est aussi, faute de moyens.",
  ),
  p(
    "Reste la **focalisation par la différenciation** : servir les PME de sa région mieux " +
      "que quiconque, en combinant la proximité, qu'elle maîtrise déjà, et une expertise " +
      "reconnue en sécurité et en conformité, qu'elle doit développer.",
  ),
  retenir(
    "Le choix d'Infosystem n'est pas une surprise : il prolonge le diagnostic.",
    [
      "La rivalité forte invite à ne pas se battre sur les prix (module 3).",
      "Ses atouts tiennent tous à la relation avec le client (module 4).",
      "Son marché se déplace vers l'expertise (module 5).",
    ],
  ),
  notion(
    "Pour aller plus loin : les stratégies hybrides",
    p(
      "Porter jugeait incompatibles le coût bas et la différenciation. L'expérience a " +
        "nuancé ce point : certaines entreprises, comme les constructeurs automobiles " +
        "japonais des années 1980, ont offert plus de qualité à un coût plus bas grâce à " +
        "des méthodes de production nouvelles. L'horloge stratégique (leçon 8.4) donne une " +
        "place à ces positions hybrides.",
    ),
    p(
      "La leçon reste valable pour une PME : réussir les deux à la fois suppose une " +
        "innovation de fond, pas un simple effort de bonne volonté.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Placez chaque entreprise fictive dans sa stratégie générique.",
    categories: [
      "Domination par les coûts",
      "Différenciation",
      "Focalisation par les coûts",
      "Focalisation par la différenciation",
    ],
    elements: [
      {
        texte: "Une chaîne nationale de supermarchés aux marques de distributeur, la moins " +
          "chère du pays.",
        categorie: 0,
        explication: "Tout le marché, avantage par le volume et les achats.",
      },
      {
        texte: "Un constructeur de motos reconnu pour sa robustesse, vendu partout.",
        categorie: 1,
        explication: "Tout le marché, avantage par une valeur perçue.",
      },
      {
        texte: "Un transporteur qui ne fait que des trajets étudiants, sans bagages en soute.",
        categorie: 2,
        explication: "Un segment précis, une offre dépouillée pour rester la moins chère.",
      },
      {
        texte: "Un cabinet comptable spécialisé dans les coopératives agricoles.",
        categorie: 3,
        explication: "Un segment précis, servi avec une expertise que les généralistes n'ont pas.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Une imprimerie de Dakar se dit « moins chère que les grandes et plus soignée que les " +
      "petites ». Ses marges baissent. Quel diagnostic ?",
    choix: [
      {
        texte: "Elle doit baisser encore ses prix pour gagner du volume.",
        explication: "Sans coûts plus bas que les grandes, elle perdra cette course.",
      },
      {
        texte: "Elle est enlisée dans la voie médiane : elle doit choisir.",
        explication:
          "Oui : ni la moins chère, ni la plus soignée, " +
          "elle n'attire personne en propre.",
      },
      {
        texte: "Sa stratégie est hybride, donc la meilleure possible.",
        explication:
          "Une vraie stratégie hybride repose sur une innovation " +
          "de fond, pas un slogan.",
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
        texte: "Domination par les coûts veut dire vendre au plus bas prix du marché.",
        vrai: false,
        explication: "Elle veut dire avoir les coûts les plus bas ; le prix est un choix ensuite.",
      },
      {
        texte: "Une PME peut difficilement viser la domination par les coûts sur tout le marché.",
        vrai: true,
        explication: "Il lui manque le volume et les économies d'échelle.",
      },
      {
        texte: "La focalisation suppose de renoncer à certains clients.",
        vrai: true,
        explication: "C'est même sa condition : servir un segment mieux que les autres.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Quelle stratégie générique votre organisation suit-elle aujourd'hui, et laquelle " +
      "devrait-elle viser ? Justifiez avec deux éléments de votre diagnostic.",
    corrige: [
      "Une position actuelle honnête, y compris la voie médiane si c'est le cas.",
      "Une position visée, avec l'avantage (coût ou valeur) et la cible (large ou étroite).",
      "Deux appuis tirés du diagnostic : forces de l'industrie, ressources, enjeux.",
      "Ce à quoi l'organisation accepte de renoncer.",
    ],
  }),

  appliquez(
    7,
    "Dans la première partie de l'étape 7, choisissez votre position parmi les quatre et " +
      "justifiez-la à partir de votre diagnostic.",
  ),
  fiche(
    "Deux questions : avantage (coût ou valeur) et cible (large ou étroite).",
    "Quatre positions : coûts, différenciation, et leurs deux versions focalisées.",
    "Coûts bas ne veut pas dire prix bas.",
    "Ne pas choisir mène à la voie médiane.",
    "Infosystem vise la focalisation par la différenciation : les PME de sa région.",
  ),
];
