/**
 * =============================================================
 *  Fichier    : m03-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 3, leçon 3 — « Concurrent ou substitut : qui sont vos rivaux ? » :
 *               même besoin, même manière ou autre manière ; pourquoi les armes ne sont
 *               pas les mêmes ; les cercles de la concurrence. Sources : livre, module 3
 *               (§ 3.4, concurrents et substituts d'Infosystem, glutamate et cube de
 *               bouillon) ; Porter, 1980 ; Whittington et coll., « Stratégique », 2023.
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

export const M03_L03: ContenuLecon = [
  p(
    "Un gérant de maquis baisse ses prix parce que le maquis d'en face a baissé les " +
      "siens. Mais ses clients du midi ne partent pas chez le voisin : ils commandent " +
      "désormais leur repas par une application de livraison. Il s'est battu contre le " +
      "mauvais adversaire. Cette leçon apprend à reconnaître ses vrais rivaux.",
  ),

  titre("Même besoin, même manière ou non"),
  definition(
    "Concurrent",
    "Une entreprise qui répond au **même besoin de la même manière** que vous. Elle vise " +
      "les mêmes clients, utilise les mêmes ressources et subit les mêmes contraintes de " +
      "coûts.",
  ),
  definition(
    "Substitut",
    "Une offre qui répond au **même besoin d'une autre manière**, avec d'autres " +
      "ressources et un autre modèle d'affaires. La visioconférence est un substitut au " +
      "voyage d'affaires, pas un concurrent des compagnies aériennes.",
  ),
  schema(
    "concurrent-substitut",
    "Au centre, le besoin du client. D'un côté, l'entreprise et ses concurrents, qui y " +
      "répondent de la même manière. De l'autre, les substituts, qui y répondent " +
      "autrement. Les deux groupes captent les mêmes clients, mais ne jouent pas au même jeu.",
  ),

  titre("Pourquoi la distinction est vitale"),
  p(
    "Parce que **les armes ne sont pas les mêmes**. Face à un concurrent, on peut faire " +
      "mieux sur le même terrain : réduire ses coûts, négocier avec les fournisseurs " +
      "communs, recruter plus vite. Face à un substitut, ces efforts sont souvent gaspillés, " +
      "car il n'est pas soumis aux mêmes contraintes. Une entreprise qui baisse ses prix " +
      "pour lutter contre l'IA en libre-service se bat contre un adversaire qui ne joue pas " +
      "au même jeu.",
  ),
  tableau(
    ["", "Face à un concurrent", "Face à un substitut"],
    [
      [
        "Question à se poser",
        "Comment faire mieux que lui ?",
        "Pourquoi le client nous choisirait-il ?",
      ],
      ["Leviers", "Coûts, qualité, rapidité, prix", "Valeur propre, expérience, combinaison"],
      ["Risque", "Perdre des parts de marché", "Voir le marché entier se réduire"],
      [
        "Signal d'alerte",
        "Un concurrent gagne nos clients",
        "Tous les acteurs perdent en même temps",
      ],
    ],
  ),
  piege(
    "Ne surveiller que les entreprises qui vous ressemblent. Le substitut vient souvent " +
      "d'une autre industrie, avec d'autres codes : on ne le voit pas arriver, parce qu'on " +
      "ne le cherche pas au bon endroit.",
  ),

  titre("Appliqué à Infosystem"),
  tableau(
    ["Concurrents", "Substituts"],
    [
      ["Autres PME de services gérés de la région", "L'équipe informatique interne du client"],
      [
        "Grandes firmes offrant des services comparables",
        "Le soutien inclus par les éditeurs infonuagiques",
      ],
      ["", "Les outils d'IA qui aident l'utilisateur à se dépanner seul"],
    ],
  ),
  p(
    "Contre ses concurrents, Infosystem doit **se distinguer**. Contre les substituts, elle " +
      "doit **convaincre** que son modèle apporte ce que l'alternative n'apporte pas : la " +
      "proximité, la connaissance du client, la responsabilité d'un interlocuteur humain.",
  ),

  titre("La frontière se joue dans la tête du client"),
  p(
    "Qui est concurrent et qui est substitut dépend de la façon dont le client définit son " +
      "besoin. Pour la ménagère ivoirienne dont parle le livre, le glutamate d'Ajinomoto et " +
      "le cube de bouillon servaient le même besoin : donner du goût au plat. Le " +
      "fabricant, lui, pouvait se croire seul dans sa catégorie.",
  ),
  retenir("Partez du besoin, pas du produit.", [
    "Formulez le besoin du client en une phrase, sans nommer votre produit.",
    "Listez tout ce qui y répond : votre industrie, puis les autres.",
    "Les premiers sont vos concurrents ; les seconds, vos substituts.",
  ]),
  notion(
    "Pour aller plus loin : les cercles de la concurrence",
    p(
      "On peut représenter ses rivaux en cercles concentriques. Au centre, les " +
        "concurrents directs : même offre, mêmes clients. Puis les concurrents indirects : " +
        "offre voisine, en partie les mêmes clients. Puis les substituts : autre manière de " +
        "satisfaire le besoin. Enfin, au dernier cercle, tout ce qui se dispute le même " +
        "budget du client.",
    ),
    p(
      "Pour un cinéma d'Abidjan, le dernier cercle comprend le maquis, la sortie à la " +
        "plage et l'abonnement de vidéo à la demande : tous se disputent la même soirée et " +
        "le même argent.",
    ),
  ),
  liste(
    "Un concurrent vous prend des clients ; un substitut peut vous prendre le marché.",
    "Un substitut devient dangereux quand son rapport qualité-prix s'améliore plus vite " +
      "que le vôtre.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Pour Infosystem, chaque acteur est-il un concurrent ou un substitut ?",
    categories: ["Concurrent", "Substitut"],
    elements: [
      {
        texte: "Une autre PME de soutien informatique de Laval.",
        categorie: 0,
        explication: "Même besoin, même manière : un concurrent direct.",
      },
      {
        texte: "Un client qui embauche un technicien à temps plein.",
        categorie: 1,
        explication: "Le besoin est couvert autrement, à l'interne.",
      },
      {
        texte: "Le service de soutien inclus dans un abonnement infonuagique.",
        categorie: 1,
        explication: "Un autre modèle d'affaires répond au même besoin.",
      },
      {
        texte: "Une grande firme qui lance une offre pour les PME.",
        categorie: 0,
        explication: "Elle répond au même besoin de la même manière, à plus grande échelle.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Une compagnie de cars voit ses ventes baisser sur la ligne Abidjan–Yamoussoukro. " +
      "Toutes les compagnies de la ligne perdent des voyageurs en même temps. Quelle " +
      "hypothèse examiner d'abord ?",
    choix: [
      {
        texte: "Un concurrent a baissé ses prix.",
        explication:
          "Dans ce cas, ses concurrents perdraient des clients mais lui en gagnerait : " +
          "tout le monde ne baisserait pas en même temps.",
      },
      {
        texte: "Un substitut (covoiturage, train, vols intérieurs) attire les voyageurs.",
        explication:
          "Oui : quand toute l'industrie perd en même temps, le marché se réduit, signe " +
          "d'un substitut.",
      },
      {
        texte: "La qualité des cars de la compagnie s'est dégradée.",
        explication: "Cela n'expliquerait pas que les autres compagnies perdent aussi.",
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
        texte: "Baisser ses prix est une bonne riposte à un substitut.",
        vrai: false,
        explication:
          "Le substitut n'a pas les mêmes coûts : la baisse use l'entreprise sans l'arrêter.",
      },
      {
        texte: "Un même acteur peut être concurrent pour un client et substitut pour un autre.",
        vrai: true,
        explication: "Tout dépend de la façon dont chaque client définit son besoin.",
      },
      {
        texte: "Les substituts viennent toujours de la même industrie que l'entreprise.",
        vrai: false,
        explication:
          "Ils viennent le plus souvent d'ailleurs, ce qui les rend difficiles à repérer.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Formulez en une phrase le besoin auquel répond votre organisation, sans nommer votre " +
      "produit. Listez ensuite trois concurrents et deux substituts, et dites quelle arme " +
      "vous opposeriez à chacun des deux groupes.",
    corrige: [
      "Un besoin formulé du point de vue du client (« se rendre à Bouaké en sécurité », " +
        "pas « vendre des billets de car »).",
      "Des concurrents qui répondent de la même manière ; des substituts qui répondent " +
        "autrement, souvent venus d'une autre industrie.",
      "Contre les concurrents : se distinguer sur le même terrain. Contre les substituts : " +
        "montrer la valeur propre du modèle, et non baisser les prix.",
    ],
  }),

  appliquez(
    2,
    "Dans l'étape 2, distinguez clairement vos concurrents de vos substituts avant " +
      "d'évaluer la menace des substituts.",
  ),
  fiche(
    "Concurrent : même besoin, même manière. Substitut : même besoin, autre manière.",
    "Les armes diffèrent : faire mieux face au concurrent, convaincre face au substitut.",
    "Quand toute l'industrie recule en même temps, cherchez le substitut.",
    "Partez du besoin du client, pas de votre produit.",
  ),
];
