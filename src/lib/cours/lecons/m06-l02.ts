/**
 * =============================================================
 *  Fichier    : m06-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 6, leçon 2 — « Une stratégie d'engagement pour chaque groupe » : de
 *               la matrice aux actions, le plan d'engagement d'Infosystem, les dirigeants
 *               comme partie prenante, les alliés discrets, une carte qui bouge. Sources :
 *               livre, module 6 (§ 6.4, tableau 6.1, « Ce que l'outil ne vous dira pas »).
 *               Texte, exemples et exercices originaux.
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
  liste,
  notion,
  p,
  piege,
  retenir,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M06_L02: ContenuLecon = [
  p(
    "Une matrice pouvoir-intérêt bien remplie ne sert à rien si elle reste dans un " +
      "dossier. Chaque quadrant appelle des gestes concrets : qui consulter, qui " +
      "informer, quand, et par quel moyen. C'est la **stratégie d'engagement**.",
  ),

  titre("Le plan d'engagement d'Infosystem"),
  tableau(
    ["Partie prenante", "Approche", "Actions proposées"],
    [
      [
        "Techniciens seniors",
        "Gérer de près",
        "Les associer à la stratégie ; leur confier le mentorat des jeunes ; envisager " +
          "une participation au capital",
      ],
      [
        "Jeunes techniciens",
        "Gérer de près",
        "Parcours de formation en sécurité et en nuage ; mentorat ; perspectives claires",
      ],
      [
        "Grands clients",
        "Gérer de près",
        "Bilans annuels ; engagements de service écrits ; offre de sécurité et de conformité",
      ],
      ["Grands éditeurs", "Garder satisfaits", "Licences respectées ; certifications à jour"],
      ["Gouvernement", "Garder satisfaits", "Conformité à la Loi 25 ; veille sur les aides"],
      [
        "Banques",
        "Garder satisfaits",
        "États financiers soignés ; relation entretenue en vue de la relève",
      ],
      ["Petits clients", "Tenir informés", "Infolettre, conseils de sécurité, nouveaux services"],
      ["Cégeps et écoles", "Tenir informés", "Accueil de stagiaires ; journées carrières"],
      ["Filles de Justin", "Surveiller", "Les tenir au courant des grandes étapes de la relève"],
    ],
    "D'après le livre, tableau 6.1.",
  ),
  piege(
    "Confondre « tenir informé » et « envoyer un courriel de temps en temps ». Informer, " +
      "c'est choisir ce qui intéresse vraiment l'acteur, au moment où il en a besoin. Une " +
      "infolettre que personne ne lit n'informe personne.",
  ),

  titre("Les dirigeants sont aussi une partie prenante"),
  p(
    "Justin et Marthe décident, mais ce sont aussi eux dont la situation change le plus. " +
      "Le calendrier de leur retraite, le rôle qu'ils veulent garder et la valeur qu'ils " +
      "espèrent tirer de l'entreprise pèseront sur chaque choix. Mieux vaut **rendre ces " +
      "attentes explicites** dès maintenant, plutôt que de les découvrir au moment de " +
      "trancher.",
  ),

  titre("Les alliés discrets"),
  p(
    "Un acteur peu puissant dans la matrice peut aider à régler un enjeu majeur. Les " +
      "cégeps et les écoles n'ont aucun pouvoir sur Infosystem ; pourtant, les stagiaires " +
      "d'aujourd'hui sont les techniciens de demain. Une entreprise qui les accueille bien " +
      "a une longueur d'avance pour recruter, et touche directement à son enjeu de " +
      "**capacité**.",
  ),
  retenir(
    "La matrice dit combien d'attention accorder. Les enjeux disent **pourquoi** un acteur " +
      "compte. Relisez toujours votre plan d'engagement à la lumière de vos enjeux.",
  ),

  titre("Une carte qui bouge"),
  p(
    "La matrice est une photographie, alors que les positions changent. Quelques " +
      "mouvements à surveiller :",
  ),
  liste(
    "**Une décision change la carte.** Si Justin offrait aux seniors une part du capital, " +
      "ils deviendraient copropriétaires, plus puissants, et repreneurs naturels.",
    "**Un acteur grossit.** Un petit client peut devenir un grand compte.",
    "**Des acteurs s'allient.** Des clients mécontents peuvent rejoindre une association " +
      "de consommateurs ou alerter les médias.",
  ),
  notion(
    "Pour aller plus loin : quatre façons de s'engager",
    tableau(
      ["Niveau", "Ce que l'on fait", "Exemple"],
      [
        ["Informer", "Communiquer une décision", "Annoncer un nouveau service par infolettre"],
        ["Consulter", "Demander un avis avant de décider", "Sonder les grands clients"],
        ["Associer", "Décider avec eux", "Construire le plan de formation avec les seniors"],
        ["Déléguer", "Leur confier une part de la décision", "Laisser un senior piloter la relève"],
      ],
    ),
    p(
      "Plus on monte dans l'échelle, plus l'engagement coûte du temps, et plus il crée " +
        "d'adhésion. On réserve les niveaux élevés aux acteurs à gérer de près.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une école privée de Lomé prépare l'ouverture d'un cycle secondaire. Associez chaque " +
      "action au quadrant qu'elle sert.",
    categories: ["Gérer de près", "Garder satisfaits", "Tenir informés", "Surveiller"],
    grille: {
      axeVertical: ["Pouvoir", "faible", "fort"],
      axeHorizontal: ["Intérêt", "faible", "fort"],
      cases: [1, 0, 3, 2],
    },
    elements: [
      {
        texte: "Réunir les enseignants pour construire le programme avec eux.",
        categorie: 0,
        explication: "Puissants et très concernés : on les associe.",
      },
      {
        texte: "Déposer un dossier complet et à jour au ministère de l'Éducation.",
        categorie: 1,
        explication: "Puissant, peu intéressé par une école parmi d'autres : le satisfaire.",
      },
      {
        texte: "Envoyer aux parents un bulletin sur l'avancement du projet.",
        categorie: 2,
        explication: "Très intéressés, peu de pouvoir direct : les informer.",
      },
      {
        texte: "Garder un œil sur les projets des écoles voisines.",
        categorie: 3,
        explication: "Peu de pouvoir sur la décision, intérêt modéré : surveiller.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Les cégeps sont peu puissants dans la matrice d'Infosystem. Pourquoi méritent-ils " +
      "quand même des actions ?",
    choix: [
      {
        texte: "Parce qu'ils peuvent bloquer la stratégie.",
        explication: "Ils n'en ont pas le pouvoir.",
      },
      {
        texte: "Parce qu'ils aident à régler l'enjeu de capacité, par les stagiaires.",
        explication: "Oui : les stagiaires d'aujourd'hui sont les techniciens de demain.",
      },
      {
        texte: "Parce que la loi oblige à accueillir des stagiaires.",
        explication: "Ce n'est pas une obligation : c'est un choix stratégique.",
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
        texte: "Les dirigeants n'ont pas à figurer dans l'analyse des parties prenantes.",
        vrai: false,
        explication:
          "Leurs attentes personnelles (retraite, rôle, valeur) pèsent sur chaque choix.",
      },
      {
        texte: "Une décision stratégique peut déplacer une partie prenante dans la matrice.",
        vrai: true,
        explication: "Une part du capital ferait des seniors des copropriétaires.",
      },
      {
        texte: "Associer un acteur aux décisions est toujours la meilleure approche.",
        vrai: false,
        explication: "C'est coûteux : on le réserve aux acteurs à gérer de près.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Pour les trois parties prenantes les plus importantes de votre organisation, " +
      "proposez une action d'engagement précise, avec son moment et son moyen.",
    corrige: [
      "Des actions adaptées au quadrant : associer, satisfaire, informer ou surveiller.",
      "Pour chacune : quoi, quand, par quel canal, et qui s'en charge.",
      "Un lien explicite avec un enjeu du module 5.",
      "Un acteur discret repéré comme allié possible.",
    ],
  }),

  appliquez(
    4,
    "Complétez l'étape 4 en notant, pour chaque partie prenante importante, l'approche " +
      "retenue et une ou deux actions concrètes.",
  ),
  fiche(
    "La matrice débouche sur un plan d'engagement : qui, quoi, quand, comment.",
    "Les dirigeants sont aussi une partie prenante : rendre leurs attentes explicites.",
    "Un acteur peu puissant peut aider à régler un enjeu majeur.",
    "Informer, consulter, associer, déléguer : du moins au plus engageant.",
    "La carte bouge : la revoir à chaque grande décision.",
  ),
];
