/**
 * =============================================================
 *  Fichier    : m09-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 9, leçon 2 — « Diversification liée et non liée » : définitions,
 *               synergies et économies d'envergure, raisons et risques de se diversifier,
 *               les trois tests d'une diversification (attrait, coût d'entrée, mieux
 *               ensemble), l'exemple du projet de gamme d'Ajinomoto en Afrique de l'Ouest et
 *               l'offre de conformité d'Infosystem. Sources : livre, modules 8 et 11 ;
 *               Porter, 1987. Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import {
  appliquez,
  definition,
  etapes,
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

export const M09_L02: ContenuLecon = [
  p(
    "La diversification est la case la plus risquée de la matrice d'Ansoff. Elle n'est " +
      "pourtant pas toujours un saut dans le vide. Tout dépend de ce que la nouvelle " +
      "activité partage avec l'ancienne. Entre la boulangerie qui ouvre une pâtisserie et " +
      "celle qui achète un garage, il y a toute la différence entre deux familles.",
  ),

  titre("Deux familles"),
  definition(
    "Diversification liée",
    "L'entrée dans une activité nouvelle qui partage avec les activités existantes des " +
      "compétences, des ressources, des canaux ou des clients.",
  ),
  definition(
    "Diversification non liée (conglomérale)",
    "L'entrée dans une activité sans lien avec les activités existantes, sinon le " +
      "financement et la direction générale.",
  ),
  tableau(
    ["", "Liée", "Non liée"],
    [
      ["Ce qui est partagé", "Savoir-faire, réseau, marque, usines", "L'argent et la direction"],
      ["Source de valeur", "Les synergies", "La répartition des risques"],
      ["Risque principal", "Surestimer les synergies", "Ne rien apporter aux activités"],
      [
        "Exemple",
        "Un éditeur scolaire qui lance des cours en ligne",
        "Une brasserie qui achète un hôtel",
      ],
    ],
  ),

  titre("D'où vient la valeur : les synergies"),
  p(
    "Une diversification liée crée de la valeur quand deux activités font mieux ensemble " +
      "que séparées. On parle de **synergie**. Elle naît d'un réseau de distribution " +
      "partagé, d'une marque qui rassure dans un nouveau rayon, d'un savoir-faire " +
      "technique réutilisé, ou d'achats regroupés qui coûtent moins cher. Les économistes " +
      "parlent d'**économies d'envergure** : produire plusieurs choses ensemble coûte moins " +
      "que les produire chacune de son côté.",
  ),
  p(
    "En Afrique de l'Ouest, le groupe Ajinomoto prévoyait d'élargir sa gamme aux " +
      "assaisonnements aromatisés et aux aliments transformés. Les premiers, vendus aux " +
      "mêmes clients, relevaient du développement de produit. Les seconds touchaient " +
      "d'autres rayons et d'autres concurrents : c'était une diversification, mais liée, " +
      "puisqu'elle pouvait s'appuyer sur le même savoir-faire alimentaire et les mêmes " +
      "grossistes.",
  ),
  piege(
    "Compter des synergies qui n'existent que dans le tableur. Partager un réseau de " +
      "distribution ne sert à rien si les acheteurs ne sont pas les mêmes, et une marque ne " +
      "voyage pas si elle traîne une mauvaise réputation. Chaque synergie annoncée doit " +
      "nommer qui fera quoi, et ce que cela économisera.",
  ),

  titre("Pourquoi se diversifier, et pourquoi pas"),
  liste(
    "**Bonnes raisons** : un marché d'origine qui sature, des compétences sous-employées, " +
      "des synergies réelles, une dépendance dangereuse à un seul client ou à un seul produit.",
    "**Mauvaises raisons** : l'ennui du dirigeant, l'argent qui dort, l'envie de grossir, " +
      "l'imitation d'un concurrent.",
  ),
  p(
    "Les actionnaires peuvent répartir leurs risques eux-mêmes, en achetant des actions de " +
      "plusieurs sociétés. Une entreprise qui se diversifie sans synergie leur rend donc " +
      "un service qu'ils pouvaient se rendre seuls, et souvent à plus grand coût. C'est " +
      "pourquoi la diversification non liée doit apporter autre chose : une gestion " +
      "meilleure, un accès au financement, une connaissance du pays.",
  ),

  titre("Trois tests avant de se lancer"),
  p(
    "Michael Porter a proposé en 1987 trois tests qu'une diversification doit passer " +
      "ensemble.",
  ),
  etapes(
    "**L'attrait** : l'activité visée est-elle rentable en elle-même ? Les cinq forces " +
      "(module 3) répondent.",
    "**Le coût d'entrée** : le prix à payer pour y entrer ne mange-t-il pas tout le profit " +
      "futur ?",
    "**Le mieux ensemble** : l'activité nouvelle ou l'ancienne y gagne-t-elle quelque chose " +
      "de concret ?",
  ),
  retenir(
    "Une diversification réussie passe les trois tests : le terrain est attrayant, " +
      "l'entrée ne coûte pas tout, et les deux activités font mieux ensemble.",
  ),

  titre("Et Infosystem ?"),
  p(
    "La diversification n'est pas une priorité pour Infosystem. Mais une piste mérite " +
      "d'être nommée : une offre de conformité vendue directement aux directions " +
      "juridiques, en concurrence avec des cabinets d'avocats. Ce serait une " +
      "diversification liée : nouveaux clients, nouvel usage, mais un savoir-faire " +
      "partagé. Elle échoue pour l'instant au troisième test : elle détournerait les " +
      "techniciens dont l'activité principale a besoin.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Ces projets sont-ils des diversifications liées ou non liées ?",
    categories: ["Liée", "Non liée"],
    elements: [
      {
        texte: "Une compagnie de cars qui lance un service de livraison de colis entre villes.",
        categorie: 0,
        explication: "Mêmes trajets, mêmes gares, mêmes véhicules.",
      },
      {
        texte: "Un fabricant de peinture qui achète une chaîne de pharmacies.",
        categorie: 1,
        explication: "Aucun savoir-faire, client ou canal en commun.",
      },
      {
        texte: "Une école de langues qui ouvre un centre d'examens de langue reconnus.",
        categorie: 0,
        explication: "Mêmes apprenants, mêmes formateurs, réputation partagée.",
      },
      {
        texte: "Un exportateur de cajou qui investit dans une salle de cinéma.",
        categorie: 1,
        explication: "Seul l'argent est partagé.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Une entreprise rachète, très cher, une activité sans lien avec la sienne mais très " +
      "rentable. Quel test de Porter risque-t-elle d'échouer ?",
    choix: [
      {
        texte: "L'attrait.",
        explication: "L'activité est rentable : ce test est passé.",
      },
      {
        texte: "Le coût d'entrée, et sans doute le mieux ensemble.",
        explication:
          "Oui : le prix payé peut effacer le profit, et sans lien, rien n'est meilleur " +
          "ensemble.",
      },
      {
        texte: "Aucun : une activité rentable est toujours un bon achat.",
        explication: "Une activité rentable achetée trop cher ne rapporte rien à l'acheteur.",
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
        texte: "Une synergie doit pouvoir dire qui fera quoi et ce que cela économisera.",
        vrai: true,
        explication: "Sinon, elle n'existe que dans le tableur.",
      },
      {
        texte: "Répartir les risques suffit à justifier une diversification non liée.",
        vrai: false,
        explication: "Les actionnaires peuvent le faire eux-mêmes, et à moindre coût.",
      },
      {
        texte: "Partager un réseau de distribution est une source possible de synergie.",
        vrai: true,
        explication: "À condition que les acheteurs soient les mêmes.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Imaginez une diversification pour votre organisation. Est-elle liée ou non ? " +
      "Passez-la aux trois tests de Porter et concluez.",
    corrige: [
      "Une activité nouvelle précise, avec ses clients et ses concurrents.",
      "La nature du lien : compétences, clients, canaux ou marque partagés.",
      "Les trois tests appliqués, avec des arguments, pas des espoirs.",
      "Une conclusion nette : y aller, attendre, ou renoncer.",
    ],
  }),

  appliquez(
    7,
    "Si vous envisagez une diversification, inscrivez-la dans la case « Diversification » " +
      "de l'étape 7 et notez dans le commentaire le résultat des trois tests.",
  ),
  fiche(
    "Liée : des compétences, clients ou canaux partagés. Non liée : seulement l'argent.",
    "La valeur d'une diversification liée vient des synergies.",
    "Une synergie se chiffre : qui fera quoi, pour quelle économie.",
    "Trois tests : attrait, coût d'entrée, mieux ensemble.",
    "Infosystem : une piste liée, écartée pour l'instant faute de techniciens.",
  ),
];
