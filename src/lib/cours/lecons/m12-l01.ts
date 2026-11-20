/**
 * =============================================================
 *  Fichier    : m12-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 12, leçon 1 — « Évaluer les options : pertinence, acceptabilité,
 *               faisabilité » : les trois critères, l'évaluation des options d'Infosystem,
 *               l'énoncé de stratégie et ce qu'il écarte, le cas AjiGoût sur la
 *               pertinence. Sources : livre, modules 8 (§ 8.5) et 13 ; Whittington et
 *               al., Stratégique, 2023. Texte, exemples et exercices originaux.
 *               v1.1 : exemples réels au Québec et en Côte d'Ivoire, sources citées
 *               (GNL Québec, Northvolt Six, ligne 1 du métro d'Abidjan).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
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
  tableau,
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M12_L01: ContenuLecon = [
  p(
    "Les modules précédents ont ouvert beaucoup de portes : des directions de croissance, " +
      "des innovations, des modes pour y aller. Aucune entreprise ne peut tout faire. Il " +
      "faut maintenant choisir, et choisir avec méthode. Trois questions suffisent à " +
      "trier la plupart des options.",
  ),

  titre("Trois critères"),
  definition(
    "Pertinence",
    "L'option répond-elle au diagnostic ? Elle doit s'attaquer aux enjeux relevés, " +
      "exploiter les forces et tenir compte des menaces.",
  ),
  definition(
    "Acceptabilité",
    "L'option convient-elle à ceux qui décident et à ceux qu'elle touche ? On examine " +
      "son rendement attendu, son niveau de risque et la réaction des parties prenantes.",
  ),
  definition(
    "Faisabilité",
    "L'organisation peut-elle la réaliser ? On vérifie l'argent, les personnes, les " +
      "compétences et le temps disponibles.",
  ),
  p(
    "Richard Whittington et ses coauteurs présentent ces trois critères dans " +
      "*Stratégique* (2023). Ils se posent dans cet ordre : une option non pertinente ne " +
      "mérite pas qu'on examine sa faisabilité.",
  ),
  retenir(
    "Une bonne option est à la fois pertinente, acceptable et faisable. Une option forte " +
      "sur deux critères et nulle sur le troisième est une option à transformer ou à " +
      "reporter, pas à retenir.",
  ),

  titre("Des exemples au Québec et en Côte d'Ivoire"),
  p(
    "Les grands projets publics et industriels montrent bien les trois critères, parce " +
      "que leurs décisions sont publiques et documentées. La source est indiquée sous " +
      "chaque exemple.",
  ),
  notion(
    "Acceptabilité : le projet Énergie Saguenay de GNL Québec",
    p(
      "GNL Québec voulait construire à Saguenay une usine de liquéfaction de gaz " +
        "naturel destiné à l'exportation. Après une audience du BAPE (septembre 2020 à " +
        "mars 2021), la consultation des communautés innues et l'analyse du ministère " +
        "de l'Environnement, le gouvernement du Québec a refusé le projet le 21 juillet " +
        "2021 : le promoteur ne pouvait pas démontrer une baisse nette des gaz à effet " +
        "de serre, et « les risques du projet dépassent ses avantages ». Ottawa l'a " +
        "refusé à son tour en février 2022. Le projet pouvait être rentable ; il n'était " +
        "pas acceptable pour ceux qui décidaient. Sources : [gouvernement du Québec, " +
        "21 juillet 2021](https://www.quebec.ca/nouvelles/actualites/details/le-" +
        "gouvernement-du-quebec-nautorise-pas-le-projet-de-liquefaction-de-gaz-" +
        "naturel-energie-saguenay-33572) ; [gouvernement du Canada, février 2022]" +
        "(https://www.canada.ca/en/impact-assessment-agency/news/2022/02/government-" +
        "of-canada-releases-the-final-decision-on-the-energie-saguenay-project.html).",
    ),
  ),
  notion(
    "Faisabilité : l'usine Northvolt Six, en Montérégie",
    p(
      "Le projet d'usine de batteries de Northvolt à McMasterville et Saint-Basile-le-" +
        "Grand répondait à une stratégie de filière (pertinent) et avait l'appui de " +
        "l'État (acceptable). Mais la société mère suédoise a manqué d'argent et déposé " +
        "son bilan en Suède en mars 2025. Le 2 septembre 2025, Québec a mis fin à tout " +
        "financement et passé en perte 270 millions de dollars investis dans la société " +
        "mère. La faisabilité ne se juge pas seulement chez soi : elle dépend aussi de la " +
        "solidité du partenaire. Sources : [gouvernement du Québec, 2 septembre 2025]" +
        "(https://www.quebec.ca/nouvelles/actualites/details/quebec-met-fin-au-projet-" +
        "avec-northvolt-64856) ; [Electric Autonomy, 4 septembre 2025]" +
        "(https://electricautonomy.ca/ev-supply-chain/batteries/2025-09-04/quebec-" +
        "northvolt-factory-pulls-funding/).",
    ),
  ),
  notion(
    "Faisabilité et acceptabilité : la ligne 1 du métro d'Abidjan",
    p(
      "Personne ne doute de la pertinence d'un métro dans une ville engorgée : 37,4 km, " +
        "18 stations, environ 540 000 voyageurs par jour attendus. La difficulté est la " +
        "faisabilité. Porté depuis 2014, le projet a vu son financement bouclé seulement " +
        "en décembre 2022, son coût revu à la hausse, et sa mise en service repoussée " +
        "plusieurs fois : prévue d'abord en 2024, elle est annoncée pour janvier 2029, " +
        "avec 66 % de l'infrastructure réalisée en novembre 2026. L'acceptabilité compte " +
        "aussi : les habitants déplacés pour le chantier, les « déguerpis », " +
        "s'impatientent. Sources : [Koaci, 11 novembre 2026]" +
        "(https://www.koaci.com/article/2026/11/11/cote-divoire/societe/cote-divoire-" +
        "ligne-1-du-metro-dabidjan-mise-en-service-prevue-en-janvier-2029_202516.html) ; " +
        "[Le360 Afrique, financement bouclé](https://afrique.le360.ma/economie/cote-" +
        "divoire-le-cout-du-metro-dabidjan-fortement-revu-a-la-hausse-et-le-financement-" +
        "boucle_7Z2C74T2HFHLZGSVPRIBNYVWW4/) ; [Le360 Afrique, les déguerpis]" +
        "(https://afrique.le360.ma/afrique-de-louest/metro-dabidjan-la-mise-sur-rails-" +
        "tarde-limpatience-des-deguerpis-saccelere_5SAIEUQPPRFMTA2L7TWQB5QCYU/).",
    ),
  ),

  titre("Les options d'Infosystem"),
  tableau(
    ["Option", "Pertinence", "Acceptabilité", "Faisabilité", "Décision"],
    [
      ["Baisser les prix", "Faible", "Faible", "Faible", "Rejetée"],
      ["Spécialisation sécurité et conformité", "Forte", "Forte", "Moyenne", "Retenue"],
      ["Partenariat en cybersécurité", "Forte", "Forte", "Forte", "Retenue"],
      ["Racheter une petite firme locale", "Moyenne", "Moyenne", "Faible", "Plus tard"],
      ["Revendre du matériel", "Faible", "Moyenne", "Moyenne", "Rejetée"],
      ["Relève avec les seniors", "Forte", "À vérifier", "Moyenne", "Retenue"],
    ],
  ),
  liste(
    "**Baisser les prix** ne répond pas au vrai problème, le manque de techniciens, et " +
      "réduirait les moyens de les garder.",
    "**La spécialisation** répond au diagnostic, mais sa faisabilité dépend de la " +
      "formation des jeunes : d'où la note moyenne.",
    "**Le rachat** apporterait des techniciens, mais Infosystem n'a aujourd'hui ni les " +
      "moyens ni le temps de l'intégrer. Il revient dans trois ans.",
    "**La relève** est « à vérifier » : personne ne sait encore si les seniors veulent " +
      "devenir propriétaires. La première conversation de Justin sera avec eux.",
  ),

  titre("L'énoncé de stratégie"),
  p(
    "Les options retenues se résument en une phrase, qui servira de boussole :",
  ),
  p(
    "« Infosystem se concentre sur les PME de sa région et s'y distingue par la " +
      "proximité et par une expertise reconnue en sécurité et en conformité. Elle croît " +
      "d'abord de l'intérieur, s'allie à un spécialiste et prépare une relève qui associe " +
      "ses techniciens seniors. »",
  ),
  p(
    "Un énoncé vaut aussi par ce qu'il écarte. Infosystem ne cassera pas ses prix, ne " +
      "revendra pas de matériel, ne développera pas de logiciel et n'ira pas dans " +
      "d'autres régions. Quand une occasion se présentera, l'énoncé dira vite si elle " +
      "entre dans le plan.",
  ),
  piege(
    "Retenir toutes les options « parce qu'elles sont bonnes ». Une stratégie qui ne " +
      "renonce à rien disperse les moyens, et aucune option n'est menée jusqu'au bout.",
  ),

  terrain(
    "Une réponse pertinente à quel problème ?",
    "Chez Ajinomoto, en Côte d'Ivoire, le glutamate AjiGoût faisait face à une rumeur " +
      "tenace et à des contrefaçons, tandis que des restaurateurs et des rôtisseurs " +
      "l'utilisaient en cachette. Une des réponses envisagées fut un produit coupé avec " +
      "du sel, du poivre et du soumara, moins cher à fabriquer. Il réglait une question " +
      "de coût, alors que le vrai problème était la réputation et la confiance. Les " +
      "actions qui visaient la rumeur elle-même, la campagne Delta, les dépliants et la " +
      "présence dans les marchés, étaient plus pertinentes.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une école privée de Lomé évalue ses options. Quel critère chaque remarque " +
      "examine-t-elle ?",
    categories: ["Pertinence", "Acceptabilité", "Faisabilité"],
    elements: [
      {
        texte: "« Ouvrir une classe du soir répond-il à la baisse des inscriptions ? »",
        categorie: 0,
        explication: "On vérifie le lien avec le diagnostic.",
      },
      {
        texte: "« Les parents accepteront-ils une hausse des frais de 15 % ? »",
        categorie: 1,
        explication: "La réaction d'une partie prenante.",
      },
      {
        texte: "« Avons-nous assez d'enseignants pour une classe de plus ? »",
        categorie: 2,
        explication: "Les ressources humaines disponibles.",
      },
      {
        texte: "« Le conseil d'administration jugera-t-il le risque raisonnable ? »",
        categorie: 1,
        explication: "Le risque, vu par ceux qui décident.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Justin reçoit une offre d'achat d'un grand concurrent. L'offre est généreuse, mais " +
      "l'acheteur prévoit de fermer le bureau local et de servir les clients à distance. " +
      "Quel critère pose le plus problème ?",
    choix: [
      {
        texte: "La faisabilité : la vente serait trop compliquée.",
        explication: "Une vente est simple à réaliser ; ce n'est pas l'obstacle.",
      },
      {
        texte: "L'acceptabilité : employés et clients perdraient ce qu'ils valorisent.",
        explication: "Oui : le prix convient à Justin, pas aux autres parties prenantes.",
      },
      {
        texte: "Aucun : une offre généreuse est toujours acceptable.",
        explication: "Le rendement n'est qu'une partie de l'acceptabilité.",
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
        texte: "Une option faisable et acceptable est forcément une bonne option.",
        vrai: false,
        explication: "Elle doit aussi être pertinente, c'est-à-dire répondre au diagnostic.",
      },
      {
        texte: "L'acceptabilité tient compte du risque, pas seulement du rendement.",
        vrai: true,
        explication: "Rendement, risque et parties prenantes forment l'acceptabilité.",
      },
      {
        texte: "Un énoncé de stratégie doit aussi dire ce que l'entreprise ne fera pas.",
        vrai: true,
        explication: "Ce qu'il écarte permet de trier les occasions.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Évaluez trois options de votre plan sur les trois critères. Lesquelles retenez-vous, " +
      "et rédigez l'énoncé de stratégie qui en découle, avec ce qu'il écarte.",
    corrige: [
      "Trois options notées sur la pertinence, l'acceptabilité et la faisabilité.",
      "Une justification courte pour chaque note faible.",
      "Une décision claire : retenue, rejetée ou reportée.",
      "Un énoncé d'une ou deux phrases et au moins deux renoncements explicites.",
    ],
  }),

  appliquez(
    7,
    "À l'étape 7, évaluez chaque option sur la pertinence, l'acceptabilité et la " +
      "faisabilité (oui, partiel ou non), puis rédigez votre énoncé de stratégie.",
  ),
  fiche(
    "Pertinence : répond-elle au diagnostic ?",
    "Acceptabilité : rendement, risque, parties prenantes.",
    "Faisabilité : argent, personnes, compétences, temps.",
    "Une option nulle sur un critère est à transformer ou à reporter.",
    "L'énoncé de stratégie dit aussi ce que l'entreprise ne fera pas.",
  ),
];
