/**
 * =============================================================
 *  Fichier    : m10-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 10, leçon 3 — « Pionnier ou suiveur ? » : les avantages du premier
 *               entrant, ses risques, les avantages du suiveur, le suiveur rapide, les
 *               conditions qui favorisent l'un ou l'autre, la position d'Infosystem
 *               (suiveur technologique, pionnier local). Sources : livre, module 8
 *               (§ 8.6) ; Lieberman et Montgomery, 1988 ; Markides et Geroski, 2005.
 *               Texte, exemples et exercices originaux.
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
  p,
  piege,
  retenir,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M10_L03: ContenuLecon = [
  p(
    "Arriver le premier semble toujours préférable. Pourtant, l'histoire des affaires est " +
      "pleine de pionniers oubliés et de suiveurs devenus leaders. Le premier réseau " +
      "social, le premier lecteur de musique numérique ou le premier moteur de recherche " +
      "ne sont pas ceux dont tout le monde se souvient.",
  ),

  titre("Les avantages du premier entrant"),
  p(
    "En 1988, Marvin Lieberman et David Montgomery ont recensé ce que gagne l'entreprise " +
      "qui ouvre un marché.",
  ),
  liste(
    "**L'expérience** : elle apprend avant les autres, et ses coûts baissent plus tôt.",
    "**Les ressources rares** : elle s'empare des meilleurs emplacements, fournisseurs, " +
      "employés ou licences.",
    "**La réputation** : son nom s'associe à la nouveauté, au point de parfois la " +
      "désigner.",
    "**Les clients captifs** : si changer de fournisseur coûte cher, ceux qu'elle a " +
      "gagnés restent.",
    "**Le standard** : quand elle impose sa norme, les suivants doivent s'y conformer.",
  ),

  titre("Les risques du pionnier"),
  liste(
    "**Éduquer le marché coûte cher** : il faut expliquer la nouveauté, et ce travail " +
      "profite aussi aux concurrents.",
    "**La demande est incertaine** : le pionnier parie sur un besoin qui n'existe peut-" +
      "être pas encore.",
    "**La technologie évolue** : le premier produit, conçu tôt, est vite dépassé.",
    "**L'imitation est moins chère** que l'invention : le suiveur profite gratuitement " +
      "des essais du pionnier.",
  ),

  titre("Les avantages du suiveur"),
  p(
    "Le suiveur dépense moins, puisqu'il imite au lieu d'inventer. Surtout, il apprend : " +
      "il voit ce qui a plu, ce qui a échoué, ce que les clients réclament. Il peut " +
      "arriver avec une offre corrigée, au moment où le marché commence vraiment à " +
      "croître.",
  ),
  definition(
    "Suiveur rapide",
    "L'entreprise qui laisse d'autres ouvrir un marché, puis entre dès que la demande se " +
      "confirme, avec une offre plus aboutie et les moyens de croître vite. Constantinos " +
      "Markides et Paul Geroski en ont fait une stratégie à part entière en 2005.",
  ),
  retenir(
    "Ce qui compte n'est pas d'être le premier, mais d'être le premier à réussir. Un " +
      "suiveur rapide entre quand le marché bascule, pas quand il naît.",
  ),

  titre("Quand choisir l'un ou l'autre"),
  tableau(
    ["Être pionnier a du sens si…", "Être suiveur a du sens si…"],
    [
      [
        "l'avance se protège : brevet, contrat, ressource rare",
        "l'imitation est facile et peu coûteuse",
      ],
      [
        "l'effet de réseau récompense le premier grand",
        "la technologie change encore très vite",
      ],
      [
        "changer de fournisseur coûte cher au client",
        "la demande reste incertaine",
      ],
      [
        "l'entreprise a les moyens d'éduquer le marché",
        "l'entreprise sait produire et vendre mieux que les autres",
      ],
    ],
  ),
  piege(
    "Croire qu'il faut choisir une fois pour toutes. Une entreprise peut être pionnière " +
      "sur un marché local et suiveuse sur la technologie, ou pionnière sur un service et " +
      "suiveuse sur un autre.",
  ),

  titre("La position d'Infosystem"),
  p(
    "Infosystem n'inventera pas l'intelligence artificielle, ni les outils de " +
      "cybersécurité. Sur la technologie, elle est **suiveuse**, et c'est raisonnable : " +
      "les grands éditeurs dépensent pour elle, et la technologie change chaque mois. " +
      "Mais sur son marché, celui des PME de sa région, elle peut être **pionnière** : la " +
      "première firme locale à proposer une offre de conformité claire, un forfait par " +
      "poste et un premier niveau de soutien assisté par l'IA.",
  ),
  p(
    "Cet avantage local se protège de deux façons : la confiance des clients, qui rend " +
      "le changement de fournisseur coûteux, et l'expérience accumulée par les " +
      "techniciens, qui ne s'imite pas en quelques mois.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Chaque situation favorise-t-elle plutôt le pionnier ou le suiveur ?",
    categories: ["Pionnier", "Suiveur"],
    elements: [
      {
        texte: "Une plateforme de covoiturage qui devient plus utile à chaque inscrit.",
        categorie: 0,
        explication: "L'effet de réseau récompense le premier à grossir.",
      },
      {
        texte: "Un produit que n'importe quel atelier peut copier en quelques semaines.",
        categorie: 1,
        explication: "L'imitation est facile : le pionnier paie pour les autres.",
      },
      {
        texte: "Une licence d'exploitation unique attribuée par l'État au premier demandeur.",
        categorie: 0,
        explication: "Une ressource rare protège l'avance.",
      },
      {
        texte: "Une technologie dont les standards changent encore chaque année.",
        categorie: 1,
        explication: "Le premier produit risque d'être vite dépassé.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question: "Qu'est-ce qui définit le mieux un suiveur rapide ?",
    choix: [
      {
        texte: "Une entreprise qui copie tout ce que font ses concurrents, dès le premier jour.",
        explication: "Il ne copie pas tout : il attend que la demande se confirme.",
      },
      {
        texte: "Une entreprise qui entre quand le marché bascule, avec une offre plus aboutie.",
        explication: "Oui : il profite de ce que le pionnier a appris.",
      },
      {
        texte: "Une entreprise qui attend que le marché arrive à maturité.",
        explication: "Ce serait trop tard : les places sont prises.",
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
        texte: "Le premier entrant finit toujours par dominer son marché.",
        vrai: false,
        explication: "Beaucoup de pionniers ont été dépassés par des suiveurs.",
      },
      {
        texte: "Le travail d'éducation du marché profite aussi aux concurrents.",
        vrai: true,
        explication: "Les clients convaincus par le pionnier peuvent acheter au suiveur.",
      },
      {
        texte: "Infosystem peut être suiveuse sur la technologie et pionnière sur son marché.",
        vrai: true,
        explication: "Les deux positions se combinent selon le terrain.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Pour une innovation de votre plan, faut-il être pionnier ou suiveur ? Appuyez-vous " +
      "sur les conditions du tableau et dites comment vous protégerez votre position.",
    corrige: [
      "Une position choisie, pionnier ou suiveur, sur un terrain précis.",
      "Au moins deux conditions du tableau appliquées au cas.",
      "Les risques de la position reconnus, avec une réponse.",
      "Une façon concrète de protéger l'avance ou de rattraper le pionnier.",
    ],
  }),

  appliquez(
    7,
    "Pour chaque innovation retenue à l'étape 7, précisez dans le commentaire si vous " +
      "visez d'être pionnier ou suiveur, et sur quel terrain.",
  ),
  fiche(
    "Le pionnier gagne expérience, ressources rares, réputation et clients captifs.",
    "Il paie l'éducation du marché et parie sur une demande incertaine.",
    "Le suiveur dépense moins et apprend des erreurs du pionnier.",
    "Ce qui compte : être le premier à réussir.",
    "Infosystem : suiveuse sur la technologie, pionnière sur son marché local.",
  ),
];
