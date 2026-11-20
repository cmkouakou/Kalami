/**
 * =============================================================
 *  Fichier    : examen.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Examen final du cours : un cas court (entreprise fictive, Bara Jus) et
 *               20 questions qui couvrent les modules 1 à 12. Texte, entreprise et chiffres
 *               sont originaux et inventés pour le cours. Corrigé côté serveur : seules la
 *               note et la liste des questions manquées sont montrées à l'apprenant.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== LE CAS ====================

/** Cas de l'examen : à lire avant de répondre. */
export const CAS_EXAMEN = {
  titre: "Bara Jus, Bouaké",
  paragraphes: [
    "Bara Jus fabrique depuis 2016, à Bouaké, des jus de mangue, de bissap et de " +
      "gingembre vendus en bouteilles de verre consignées. L'entreprise compte 38 " +
      "employés. Ses jus sont sans sucre ajouté, une recette que sa fondatrice, Awa Koné, " +
      "a mise au point avec une nutritionniste. Ils sont vendus dans les maquis, les " +
      "hôtels et deux chaînes de supermarchés de Bouaké et de Yamoussoukro.",
    "Le chiffre d'affaires atteint 410 millions de FCFA et progresse d'environ 12 % par " +
      "an. Bara Jus achète ses fruits à 120 productrices regroupées en six coopératives, " +
      "qu'elle forme et paie dans les sept jours ; d'autres transformateurs ont tenté de " +
      "les attirer, sans succès. La mangue ne se récolte que quatre mois par an, et près " +
      "d'un fruit sur cinq est perdu faute de chambre froide.",
    "L'an dernier, un industriel d'Abidjan a lancé un jus sucré en bouteille plastique, " +
      "vendu deux fois moins cher. Le gouvernement annonce une taxe sur les boissons " +
      "sucrées et un programme d'appui à la transformation locale des fruits. Le prix du " +
      "sucre importé varie fortement d'une année à l'autre.",
    "Au bilan, les actifs courants s'élèvent à 90 millions de FCFA et les dettes à court " +
      "terme à 120 millions. Awa Koné décide encore presque tout elle-même. Trois pistes " +
      "sont sur la table : un distributeur d'Accra propose de vendre les jus au Ghana ; " +
      "l'équipe veut lancer des « shots » de gingembre pour les salles de sport " +
      "d'Abidjan ; la banque offre un prêt pour une chambre froide.",
  ],
} as const;

// ==================== QUESTIONS ====================

export const QUESTIONS_EXAMEN: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "x1",
    question:
      "Awa Koné a refusé de lancer des sodas pour rester sur des jus sans sucre ajouté. " +
      "Qu'illustre ce choix ?",
    choix: [
      {
        texte: "Une décision opérationnelle de production.",
        explication: "Elle engage l'offre et la cible pour des années : c'est stratégique.",
      },
      {
        texte: "Une stratégie : choisir, c'est aussi renoncer à certains clients.",
        explication: "Oui : le renoncement rend le positionnement clair.",
      },
      {
        texte: "Une erreur, puisqu'elle se prive de ventes.",
        explication: "Renoncer à des ventes est le prix de tout choix cohérent.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "x2",
    question:
      "La décision d'aller ou non au Ghana se prend à quel niveau de stratégie, pour une " +
      "entreprise qui n'a qu'un seul métier ?",
    choix: [
      {
        texte: "Au niveau d'affaires : comment gagner sur ses marchés.",
        explication:
          "Oui : choisir ses marchés pour son métier unique relève du niveau d'affaires.",
      },
      {
        texte: "Au niveau fonctionnel : c'est l'affaire du service commercial.",
        explication: "Le service commercial met en œuvre ; il ne choisit pas le pays.",
      },
      {
        texte: "Au niveau opérationnel : il s'agit de livraisons.",
        explication: "Le choix d'un pays engage l'entreprise bien au-delà de la logistique.",
      },
    ],
    bonne: 0,
  },
  {
    type: "classement",
    id: "x3",
    consigne: "Classez chaque fait du cas dans le PESTEL.",
    categories: ["Politique", "Économique", "Socioculturel", "Technologique", "Légal"],
    elements: [
      { texte: "Le programme public d'appui à la transformation locale.", categorie: 0 },
      { texte: "Le prix du sucre importé varie fortement.", categorie: 1 },
      { texte: "Les citadins surveillent davantage le sucre qu'ils consomment.", categorie: 2 },
      { texte: "La taxe annoncée sur les boissons sucrées, une fois votée.", categorie: 4 },
      {
        texte: "Des chambres froides solaires deviennent abordables pour les PME.",
        categorie: 3,
      },
    ],
  },
  {
    type: "qcm",
    id: "x4",
    question:
      "Bara Jus ne sait pas si la taxe sera votée, et son effet sur les ventes serait " +
      "fort. Comment traiter ce facteur ?",
    choix: [
      {
        texte: "L'ignorer tant qu'elle n'est pas votée.",
        explication: "Un facteur incertain et décisif est justement celui à anticiper.",
      },
      {
        texte: "En faire une variable pivot et bâtir des scénarios autour.",
        explication: "Oui : fort impact et forte incertitude, c'est la définition.",
      },
      {
        texte: "La classer comme une menace certaine dans la SWOT.",
        explication: "Elle n'est pas certaine ; et pour Bara Jus, elle serait plutôt favorable.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "x5",
    question:
      "L'eau en sachet et le bissap préparé à la maison répondent au même besoin que les " +
      "jus de Bara Jus. Dans les cinq forces, ce sont :",
    choix: [
      {
        texte: "Des concurrents directs.",
        explication: "Un concurrent direct vend le même type de produit.",
      },
      {
        texte: "Des substituts.",
        explication: "Oui : un autre produit qui satisfait le même besoin.",
      },
      {
        texte: "De nouveaux entrants.",
        explication: "Ils ne viennent pas de s'installer dans l'industrie du jus.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "x6",
    question:
      "Pourquoi l'arrivée de l'industriel d'Abidjan ne condamne-t-elle pas Bara Jus ?",
    choix: [
      {
        texte: "Parce qu'un prix deux fois plus bas n'attire aucun client.",
        explication: "Il en attire beaucoup : mais pas forcément ceux de Bara Jus.",
      },
      {
        texte: "Parce que Bara Jus ne vise pas le même client que lui.",
        explication: "Oui : sans sucre, en verre, pour une clientèle qui paie la qualité.",
      },
      {
        texte: "Parce que les supermarchés refuseront le plastique.",
        explication: "Rien dans le cas ne l'indique.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "x7",
    question:
      "Le lien avec les 120 productrices est utile, rare et difficile à copier. Que faut-il " +
      "encore vérifier, selon le VRIO, pour parler d'avantage durable ?",
    choix: [
      {
        texte: "Que l'entreprise est organisée pour l'exploiter.",
        explication: "Oui : le O du VRIO. Ici, tout repose sur la fondatrice : à surveiller.",
      },
      {
        texte: "Qu'il figure dans les états financiers.",
        explication: "Une ressource stratégique est souvent absente du bilan.",
      },
      {
        texte: "Qu'aucun concurrent n'achète de mangues.",
        explication: "Ce n'est pas un critère du VRIO.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "x8",
    question:
      "Actifs courants : 90 millions ; dettes à court terme : 120 millions. Que dit le " +
      "ratio de liquidité générale ?",
    choix: [
      {
        texte: "1,33 : la situation est confortable.",
        explication: "C'est l'inverse du bon calcul (120 ÷ 90).",
      },
      {
        texte: "0,75 : l'entreprise peut avoir du mal à payer ses dettes à court terme.",
        explication: "Oui : 90 ÷ 120 = 0,75, sous le seuil de 1.",
      },
      {
        texte: "On ne peut rien conclure sans le chiffre d'affaires.",
        explication: "Ce ratio ne compare que l'actif et le passif à court terme.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "x9",
    question:
      "Où se perd surtout de la valeur dans la chaîne de valeur de Bara Jus, d'après le cas ?",
    choix: [
      {
        texte: "Dans la logistique d'approvisionnement : un fruit sur cinq est perdu.",
        explication: "Oui : sans froid, la matière première se gâte avant d'être pressée.",
      },
      {
        texte: "Dans le service après-vente.",
        explication: "Le cas n'en dit rien ; la perte de fruits est chiffrée.",
      },
      {
        texte: "Dans le marketing, faute de publicité.",
        explication: "Les ventes progressent de 12 % par an : ce n'est pas le maillon faible.",
      },
    ],
    bonne: 0,
  },
  {
    type: "classement",
    id: "x10",
    consigne: "Classez chaque élément du cas dans la SWOT de Bara Jus.",
    categories: ["Force", "Faiblesse", "Opportunité", "Menace"],
    elements: [
      {
        texte: "Une recette sans sucre ajouté, mise au point avec une nutritionniste.",
        categorie: 0,
      },
      { texte: "Près d'un fruit sur cinq perdu faute de froid.", categorie: 1 },
      { texte: "Un programme public d'appui à la transformation locale.", categorie: 2 },
      { texte: "Un jus industriel vendu deux fois moins cher.", categorie: 3 },
      { texte: "Toutes les décisions passent par la fondatrice.", categorie: 1 },
    ],
  },
  {
    type: "qcm",
    id: "x11",
    question:
      "« Mettre en avant le sans-sucre ajouté pour profiter de la taxe sur les boissons " +
      "sucrées. » Dans la matrice TOWS, c'est une option :",
    choix: [
      {
        texte: "FO : une force pour saisir une opportunité.",
        explication: "Oui : la recette (force) rencontre un changement favorable.",
      },
      {
        texte: "FM : une force contre une menace.",
        explication: "Pour Bara Jus, la taxe joue en sa faveur : c'est une opportunité.",
      },
      {
        texte: "fM : réduire une faiblesse face à une menace.",
        explication: "Aucune faiblesse n'est en jeu dans cette option.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "x12",
    question:
      "Le ministère a beaucoup de pouvoir sur Bara Jus mais s'intéresse peu à elle. Selon " +
      "la matrice pouvoir-intérêt, il faut :",
    choix: [
      {
        texte: "Le tenir informé de tout, chaque semaine.",
        explication: "C'est trop pour un acteur peu intéressé : on l'épuiserait.",
      },
      {
        texte: "Le garder satisfait, sans le solliciter à l'excès.",
        explication: "Oui : pouvoir fort, intérêt faible.",
      },
      {
        texte: "Le surveiller de loin, sans effort particulier.",
        explication: "C'est pour les acteurs à faible pouvoir ; celui-ci peut tout changer.",
      },
    ],
    bonne: 1,
  },
  {
    type: "vrai-faux",
    id: "x13",
    consigne: "Vrai ou faux, à propos des parties prenantes et de la culture de Bara Jus ?",
    affirmations: [
      {
        texte: "Les coopératives de productrices ont un intérêt élevé pour les choix de Bara Jus.",
        vrai: true,
        explication: "Leur revenu en dépend directement.",
      },
      {
        texte: "Une entreprise où tout passe par la fondatrice ne court aucun risque de dérive.",
        vrai: false,
        explication:
          "Au contraire : les habitudes d'une seule personne peuvent figer la stratégie.",
      },
      {
        texte: "Payer les productrices en sept jours relève aussi de la responsabilité sociale.",
        vrai: true,
        explication: "C'est un engagement envers une partie prenante, au-delà du profit immédiat.",
      },
    ],
  },
  {
    type: "qcm",
    id: "x14",
    question: "Lequel de ces objectifs est SMART ?",
    choix: [
      {
        texte: "Devenir la marque de jus préférée des Ivoiriens.",
        explication: "C'est une ambition, pas un objectif mesurable et daté.",
      },
      {
        texte: "Réduire beaucoup les pertes de fruits.",
        explication: "Ni chiffré ni daté.",
      },
      {
        texte: "Ramener les pertes de mangues de 20 % à 8 % avant la récolte de 2028.",
        explication: "Oui : précis, mesurable, réaliste avec une chambre froide, et daté.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "x15",
    question:
      "« Faire du fruit ivoirien une boisson saine, au juste prix pour celles qui le " +
      "cultivent. » Cette phrase est plutôt :",
    choix: [
      {
        texte: "Une vision : un futur désiré qui donne une direction.",
        explication: "Oui : elle dit où l'on veut aller, pas ce que l'on fait chaque jour.",
      },
      {
        texte: "Une mission : l'activité et les clients d'aujourd'hui.",
        explication: "La mission décrirait ce que fait Bara Jus, pour qui, aujourd'hui.",
      },
      {
        texte: "Un objectif SMART.",
        explication: "Rien n'y est chiffré ni daté.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "x16",
    question:
      "Des jus haut de gamme, sans sucre ajouté, pour une clientèle attentive à sa santé " +
      "dans deux villes. Quelle stratégie générique de Porter ?",
    choix: [
      {
        texte: "La domination par les coûts.",
        explication: "Bara Jus vend plus cher que l'industriel : ce n'est pas son jeu.",
      },
      {
        texte: "La différenciation sur tout le marché.",
        explication: "Elle ne vise pas tout le marché, mais un segment.",
      },
      {
        texte: "La concentration fondée sur la différenciation.",
        explication: "Oui : un segment étroit, servi par une offre distinctive.",
      },
    ],
    bonne: 2,
  },
  {
    type: "classement",
    id: "x17",
    consigne: "Placez chaque piste dans la matrice d'Ansoff.",
    categories: [
      "Pénétration du marché",
      "Développement de marché",
      "Développement de produit",
      "Diversification",
    ],
    elements: [
      { texte: "Vendre les jus actuels au Ghana avec le distributeur d'Accra.", categorie: 1 },
      { texte: "Entrer dans de nouveaux maquis de Bouaké avec les jus actuels.", categorie: 0 },
      { texte: "Proposer un jus de corossol aux clients actuels.", categorie: 2 },
      { texte: "Lancer des shots de gingembre pour les salles de sport d'Abidjan.", categorie: 3 },
    ],
  },
  {
    type: "qcm",
    id: "x18",
    question:
      "Pour le Ghana, pourquoi un accord avec le distributeur d'Accra plutôt qu'une filiale ?",
    choix: [
      {
        texte: "Parce qu'une alliance est toujours plus rentable qu'une filiale.",
        explication: "Ce n'est pas toujours vrai : on partage aussi la marge et le contrôle.",
      },
      {
        texte: "Pour profiter de son réseau en engageant peu de capitaux, vu la trésorerie.",
        explication: "Oui : avec une liquidité de 0,75, une filiale serait très risquée.",
      },
      {
        texte: "Parce que la loi ghanéenne interdit les filiales étrangères.",
        explication: "Rien dans le cas ne l'indique.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "x19",
    question:
      "Avant de lancer les shots, l'équipe se demande si la banque prêtera en même temps " +
      "pour la chambre froide. Quel critère d'évaluation examine-t-elle ?",
    choix: [
      {
        texte: "La pertinence.",
        explication: "La pertinence demande si l'option répond aux enjeux.",
      },
      {
        texte: "L'acceptabilité.",
        explication: "L'acceptabilité porte sur le risque, le rendement et les parties prenantes.",
      },
      {
        texte: "La faisabilité.",
        explication: "Oui : a-t-on l'argent, les gens et le temps de le faire ?",
      },
    ],
    bonne: 2,
  },
  {
    type: "vrai-faux",
    id: "x20",
    consigne: "Vrai ou faux, à propos de la mise en œuvre et du suivi chez Bara Jus ?",
    affirmations: [
      {
        texte:
          "Le taux de fruits perdus est un indicateur de la perspective « processus " +
          "internes » du tableau de bord équilibré.",
        vrai: true,
        explication: "Il mesure l'efficacité de la transformation, un processus interne.",
      },
      {
        texte: "Une fois le plan adopté, le suivi peut attendre la fin de l'année.",
        vrai: false,
        explication: "Le suivi est un rendez-vous régulier : on corrige en chemin.",
      },
      {
        texte: "Chaque action de la feuille de route doit avoir un responsable et une échéance.",
        vrai: true,
        explication: "Sans porteur ni date, une action reste une intention.",
      },
    ],
  },
];
