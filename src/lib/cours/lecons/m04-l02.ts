/**
 * =============================================================
 *  Fichier    : m04-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 4, leçon 2 — « La chaîne de valeur » : activités principales et de
 *               soutien, la marge, adapter la chaîne à une entreprise de services, lire
 *               points forts et points à renforcer. Sources : livre, module 4 (§ 4.2,
 *               chaîne de valeur d'Infosystem) ; Porter, « Competitive Advantage », 1985 ;
 *               Stabell et Fjeldstad, 1998. Texte, exemples et exercices originaux.
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
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M04_L02: ContenuLecon = [
  p(
    "Dire qu'une entreprise « fonctionne bien » ne dit rien. Fonctionne bien où ? Pour " +
      "trouver ce qui crée de la valeur et ce qui en détruit, il faut la décomposer en " +
      "activités. C'est l'idée de la chaîne de valeur, proposée par Michael Porter en 1985.",
  ),

  titre("Les activités et la marge"),
  schema(
    "chaine-valeur",
    "La chaîne de valeur de Porter. En bas, cinq activités principales de gauche à " +
      "droite : logistique interne, production, logistique externe, marketing et ventes, " +
      "services. Au-dessus, quatre activités de soutien qui traversent toute l'entreprise : " +
      "infrastructure, ressources humaines, développement technologique, approvisionnement. " +
      "À droite, la marge.",
  ),
  definition(
    "Activités principales",
    "Celles qui contribuent directement à l'offre : recevoir les intrants, les " +
      "transformer, livrer, vendre et accompagner le client après la vente.",
  ),
  definition(
    "Activités de soutien",
    "Celles qui traversent toute l'entreprise et rendent les premières possibles : " +
      "l'infrastructure (direction, finances, administration), la gestion des ressources " +
      "humaines, le développement technologique et l'approvisionnement.",
  ),
  definition(
    "Marge",
    "La différence entre ce que les clients sont prêts à payer et ce que coûtent toutes " +
      "les activités. Chaque activité peut l'augmenter (en ajoutant de la valeur perçue) " +
      "ou la réduire (en coûtant plus qu'elle ne rapporte).",
  ),
  piege(
    "Placer l'approvisionnement parmi les activités principales. Chez Porter, acheter est " +
      "une activité de **soutien** : elle sert toutes les autres, de la production aux " +
      "ventes.",
  ),

  titre("Pour chaque activité, deux questions"),
  liste(
    "**Crée-t-elle de la valeur aux yeux du client ?** Le client la remarque-t-il, " +
      "paierait-il pour elle ?",
    "**Coûte-t-elle plus ou moins que chez les concurrents ?** Une activité banale mais " +
      "très efficace peut aussi être une source d'avantage.",
  ),
  terrain(
    "Une activité principale qu'on rend excellente",
    "Chez Ajinomoto Afrique de l'Ouest, à la demande du directeur technique, j'ai mené " +
      "l'implantation d'une démarche TPM et mis en place l'OEE, dont les ratios, réunis " +
      "dans un tableau de bord, permettaient de piloter la production. Les pertes de " +
      "production ont baissé de 40 %. Mais une chaîne de valeur se lit en entier : nous " +
      "produisions bien et beaucoup, et les ventes n'ont pas suivi. L'activité suivante, " +
      "marketing et ventes, est devenue le maillon à renforcer.",
  ),

  titre("Adapter la chaîne à une entreprise de services"),
  p(
    "Le modèle de Porter a été pensé pour des entreprises qui fabriquent et livrent des " +
      "produits. Appliqué tel quel à Infosystem, il donne un résultat déroutant : pas de " +
      "stock, rien à fabriquer, rien de physique à livrer. Trois activités principales " +
      "sur cinq sont vides.",
  ),
  p(
    "Une chaîne à moitié vide ne montre pas qu'Infosystem crée peu de valeur : elle montre " +
      "que le modèle ne correspond pas à son métier. Pour les entreprises qui vivent de la " +
      "résolution de problèmes (conseil, santé, services informatiques), les chercheurs " +
      "Stabell et Fjeldstad proposent en 1998 de suivre plutôt **le parcours d'un " +
      "problème**, depuis le moment où le client le confie jusqu'à sa résolution.",
  ),
  schema(
    "chaine-services",
    "La chaîne de valeur d'Infosystem, adaptée à une entreprise de services. Cinq " +
      "activités principales : attirer les clients (à renforcer), établir le diagnostic " +
      "(point fort), mettre en place les solutions (point fort), assurer le soutien au " +
      "quotidien (à renforcer), intervenir en urgence (point fort). En soutien, la gestion " +
      "des ressources humaines est le point faible.",
  ),
  tableau(
    ["Activité", "Constat", "Lecture"],
    [
      [
        "Attirer les clients",
        "Bouche-à-oreille et réseau de Justin",
        "À renforcer : partira avec lui",
      ],
      ["Diagnostic", "Expertise des deux seniors", "Point fort"],
      ["Mise en place", "Expertise des deux seniors", "Point fort"],
      [
        "Soutien au quotidien",
        "Bien fait, limité par l'équipe",
        "À renforcer : chaque départ se sent",
      ],
      ["Urgence", "Chaque technicien part avec sa voiture", "Point fort : la grande fierté"],
      [
        "Ressources humaines (soutien)",
        "Assurées par Marthe, avec la comptabilité",
        "Point faible critique",
      ],
    ],
  ),
  retenir(
    "La chaîne de valeur d'Infosystem révèle que ses difficultés ne viennent pas de son " +
      "métier, qu'elle fait bien, mais de ce qui permet de l'exercer à plus grande échelle.",
  ),
  notion(
    "Pour aller plus loin : trois configurations de la valeur",
    p(
      "Stabell et Fjeldstad distinguent trois logiques. La **chaîne** transforme des " +
        "intrants en produits (une usine, une boulangerie). L'**atelier** résout le " +
        "problème d'un client (un cabinet comptable, un hôpital, Infosystem). Le " +
        "**réseau** met des clients en relation entre eux (une banque, un opérateur " +
        "télécom, une plateforme de Mobile Money).",
    ),
    p(
      "Choisir la bonne logique évite de forcer une entreprise dans un moule qui n'est " +
        "pas le sien. Dans Kalami Stratégie, l'étape 3 propose les deux modèles : Porter " +
        "ou services.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Pour une usine de jus de fruits à Bouaké, rangez chaque tâche dans l'activité de " +
      "Porter qui lui correspond.",
    categories: [
      "Logistique interne",
      "Production",
      "Logistique externe",
      "Marketing et ventes",
      "Approvisionnement (soutien)",
    ],
    elements: [
      {
        texte: "Réceptionner et stocker les mangues livrées par les coopératives.",
        categorie: 0,
        explication: "Recevoir et stocker les intrants.",
      },
      {
        texte: "Presser, pasteuriser et mettre en bouteille.",
        categorie: 1,
        explication: "Transformer les intrants en produit.",
      },
      {
        texte: "Livrer les supermarchés d'Abidjan en camion frigorifique.",
        categorie: 2,
        explication: "Acheminer le produit vers les clients.",
      },
      {
        texte: "Organiser des dégustations dans les supermarchés.",
        categorie: 3,
        explication: "Faire connaître et vendre le produit.",
      },
      {
        texte: "Négocier le contrat annuel avec les coopératives de mangues.",
        categorie: 4,
        explication: "Acheter est une activité de soutien chez Porter.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "La chaîne de Porter d'Infosystem a trois activités principales vides. Qu'en conclure ?",
    choix: [
      {
        texte: "Qu'Infosystem crée peu de valeur.",
        explication: "C'est la conclusion trompeuse que le livre corrige.",
      },
      {
        texte: "Que le modèle ne correspond pas à son métier et qu'il faut l'adapter.",
        explication:
          "Oui : on suit le parcours du problème du client plutôt que celui d'un produit.",
      },
      {
        texte: "Qu'Infosystem devrait fabriquer ses propres produits.",
        explication: "Rien ne justifie de changer de métier pour remplir un schéma.",
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
        texte: "La gestion des ressources humaines est une activité de soutien.",
        vrai: true,
        explication: "Elle traverse toute l'entreprise et rend les autres activités possibles.",
      },
      {
        texte: "Une activité de soutien ne peut pas être une source d'avantage concurrentiel.",
        vrai: false,
        explication:
          "Chez Infosystem, c'est même une activité de soutien qui bloque la croissance.",
      },
      {
        texte: "Exceller dans une activité suffit si les activités suivantes ne suivent pas.",
        vrai: false,
        explication: "La valeur se crée sur toute la chaîne : un maillon faible limite les autres.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Dressez la chaîne de valeur de votre organisation. Le modèle de Porter convient-il " +
      "à son métier, ou faut-il l'adapter ? Signalez deux points forts et un point à " +
      "renforcer, avec leur justification.",
    corrige: [
      "Un choix de modèle justifié : chaîne (produit), atelier (problème) ou réseau " +
        "(mise en relation).",
      "Cinq ou six activités principales nommées dans le vocabulaire du métier, et les " +
        "activités de soutien.",
      "Pour chaque point fort ou faible, un constat observable, pas une impression.",
      "Une lecture d'ensemble : où se crée la valeur, et quel maillon limite le reste ?",
    ],
  }),

  appliquez(
    3,
    "Dans l'étape 3, choisissez le modèle Porter ou services, puis qualifiez chaque " +
      "activité : point fort ou point à renforcer.",
  ),
  fiche(
    "Activités principales : contribuent directement à l'offre.",
    "Activités de soutien : infrastructure, RH, technologie, approvisionnement.",
    "La marge : ce que le client paie moins ce que coûtent les activités.",
    "Une entreprise de services suit le parcours du problème, pas celui du produit.",
    "Un maillon faible limite toute la chaîne.",
  ),
];
