/**
 * =============================================================
 *  Fichier    : enonce.ts
 *  Projet     : Kalami Stratégie
 *  Description: Énoncé du cas Ajinomoto Afrique de l'Ouest (module 11 du livre) : consignes,
 *               récit, chronologie, annexes 1 à 5, questions reliées aux étapes, pistes de
 *               réflexion et sources. Texte de l'auteur, adapté à l'assistant (la mission
 *               est datée du début de 2016, comme le corrigé). Contenu payant : serveur seul.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: server-only, cases/types.ts
 * =============================================================
 */

import "server-only";

import type { CaseBlock, CaseQuestion, CaseStatement } from "../types";

// ==================== CONSIGNES ====================

const INTRO: CaseBlock[] = [
  {
    kind: "paragraph",
    text:
      "Ce cas complet est construit sur le modèle des études de cas utilisées dans les " +
      "écoles de gestion. Vous y trouverez un récit, des annexes chiffrées et une série de " +
      "questions qui suivent la démarche. À vous de mener l'analyse, étape après étape, puis " +
      "de répondre à la question centrale : si vous aviez été chargé de la stratégie " +
      "d'Ajinomoto Afrique de l'Ouest, qu'auriez-vous fait pour éviter cet échec ?",
  },
  {
    kind: "paragraph",
    text:
      "Le cas repose sur deux types de sources : des informations publiques (communiqués " +
      "du groupe, presse économique, annonces légales), citées en fin d'énoncé, et le " +
      "témoignage de l'auteur, qui a travaillé dans l'entreprise à partir de son ouverture. " +
      "Les chiffres globaux de la filiale (chiffre d'affaires total, marges) n'ont jamais " +
      "été publiés. L'auteur, alors administrateur des ventes, a toutefois conservé le " +
      "bilan du canal de vente directe pour l'exercice 2015-2016 ; ses principaux chiffres " +
      "figurent en annexe. Comme souvent dans la réalité, vous devrez raisonner avec une " +
      "information incomplète.",
  },
  {
    kind: "paragraph",
    text:
      "Lisez le cas jusqu'aux questions, puis arrêtez-vous. L'épilogue, qui raconte la " +
      "suite, s'ouvre avec le plan stratégique, une fois votre analyse terminée.",
  },
];

// ==================== RÉCIT ====================

const STORY: CaseBlock[] = [
  { kind: "heading", text: "Abidjan, octobre 2021" },
  {
    kind: "paragraph",
    text:
      "Le 1er octobre 2021, réunis en assemblée générale extraordinaire, les actionnaires " +
      "d'Ajinomoto Afrique de l'Ouest (AAO) prennent une décision lourde : la société sera " +
      "dissoute par anticipation et mise en liquidation amiable. Quelques semaines plus " +
      "tard, un avis publié dans la presse ivoirienne officialise la fin d'une aventure " +
      "commencée moins de dix ans plus tôt, dans l'enthousiasme d'une inauguration présidée " +
      "par le Premier ministre. Comment une filiale d'un groupe centenaire, leader mondial " +
      "de son métier, a-t-elle pu ne jamais prendre racine sur un marché qu'elle jugeait " +
      "prometteur ?",
  },
  { kind: "heading", text: "Le groupe Ajinomoto" },
  {
    kind: "paragraph",
    text:
      "Ajinomoto est né au Japon en 1909 avec le lancement du premier assaisonnement umami " +
      "au monde, AJI-NO-MOTO®, du glutamate monosodique (MSG). L'umami, que l'on présente " +
      "souvent comme le cinquième goût, est la saveur que l'on retrouve dans les bouillons, " +
      "les viandes et les aliments fermentés. Le glutamate monosodique est obtenu par " +
      "fermentation de matières premières agricoles, comme la canne à sucre.",
  },
  {
    kind: "paragraph",
    text:
      "Au fil du siècle, le groupe s'est diversifié dans les aliments transformés, les " +
      "boissons, les acides aminés, les produits pharmaceutiques et la chimie de " +
      "spécialité. En 2011, il était présent dans 26 pays et réalisait des ventes nettes " +
      "d'environ 1 200 milliards de yens. Son plan à moyen terme 2011-2013 faisait du " +
      "développement des produits alimentaires grand public à l'étranger l'une de ses " +
      "priorités, avec l'ambition de devenir un groupe véritablement mondial.",
  },
  {
    kind: "paragraph",
    text:
      "Le groupe s'appuie sur un savoir-faire particulier, développé en Asie du Sud-Est : " +
      "la vente directe au comptant. Des équipes de vendeurs parcourent les marchés et les " +
      "petits commerces, vendent de petits formats et encaissent immédiatement. C'est ce " +
      "modèle qui a fait le succès d'AJI-NO-MOTO® dans plusieurs pays d'Asie.",
  },
  { kind: "heading", text: "L'Afrique de l'Ouest, une conquête par étapes" },
  {
    kind: "paragraph",
    text:
      "La présence du groupe en Afrique de l'Ouest remonte à 1991, avec la création au " +
      "Nigeria de la West African Seasoning Company (WASCO). Pendant vingt ans, " +
      "AJI-NO-MOTO® y est vendu principalement par l'intermédiaire de distributeurs " +
      "locaux. Le groupe renforce ses capacités nigérianes au début des années 2010 : " +
      "agrandissement de l'usine d'emballage et construction d'un entrepôt dans le nord " +
      "du pays.",
  },
  {
    kind: "paragraph",
    text:
      "En octobre 2011, le groupe annonce la création d'une filiale commerciale en Côte " +
      "d'Ivoire. La justification est claire. Onze pays d'Afrique de l'Ouest, peuplés " +
      "d'environ 113 millions d'habitants en 2009, partagent des langues (le français et " +
      "l'anglais), pour beaucoup une monnaie (le franc CFA) et des habitudes alimentaires " +
      "proches de celles du Nigeria : des féculents accompagnés de sauces et de soupes, " +
      "auxquelles le MSG se marie bien. Le marché des assaisonnements y existe déjà et " +
      "devrait croître.",
  },
  {
    kind: "paragraph",
    text:
      "Ajinomoto Afrique de l'Ouest est créée en janvier 2012, avec un président japonais. " +
      "Elle commence par importer et vendre le produit fini fabriqué par WASCO. En avril " +
      "2013, son usine de reconditionnement de la zone industrielle de Yopougon, à Abidjan, " +
      "entre en service : le MSG arrive désormais en vrac du Brésil, d'une autre filiale du " +
      "groupe, et il est conditionné sur place dans des formats adaptés aux consommateurs " +
      "locaux. Le groupe vise un chiffre d'affaires d'environ 2,5 milliards de yens en " +
      "2016, et prévoit d'élargir la gamme aux assaisonnements aromatisés et aux aliments " +
      "transformés.",
  },
  {
    kind: "paragraph",
    text:
      "L'inauguration officielle a lieu le 13 mai 2013. Pour la Côte d'Ivoire, qui sort de " +
      "la crise postélectorale de 2010-2011, c'est un symbole : le premier investissement " +
      "industriel japonais depuis la crise. La presse évoque un investissement de " +
      "1,9 milliard de francs CFA, une capacité de 300 tonnes d'assaisonnement et, à " +
      "terme, 250 emplois. Au démarrage, la filiale compte une soixantaine de salariés.",
  },
  { kind: "heading", text: "Chronologie d'Ajinomoto en Afrique de l'Ouest" },
  {
    kind: "list",
    items: [
      "1909 : lancement d'AJI-NO-MOTO® au Japon",
      "1991 : création de WASCO au Nigeria",
      "Octobre 2011 : annonce d'une filiale commerciale en Côte d'Ivoire",
      "Janvier 2012 : création d'Ajinomoto Afrique de l'Ouest",
      "Avril 2013 : mise en service de l'usine de Yopougon",
      "13 mai 2013 : inauguration officielle",
      "Avril 2015 à mars 2016 : exercice du bilan de la vente directe (annexe 5)",
      "1er octobre 2021 : décision de dissolution anticipée",
    ],
  },
  { kind: "heading", text: "Le marché ivoirien de l'assaisonnement" },
  {
    kind: "paragraph",
    text:
      "Le marché qu'aborde AAO est déjà occupé. Le produit de référence des cuisines " +
      "ouest-africaines est le bouillon cube, introduit au siècle dernier. Selon une étude " +
      "de Sagaci Research citée par la presse vers 2015, il se vend en Côte d'Ivoire " +
      "environ 30 000 tonnes de bouillons par an, soit quelque 90 milliards de francs CFA. " +
      "Nestlé, avec sa marque Maggi, en détient environ les trois quarts. Suivent Jumbo (du " +
      "groupe espagnol GB Foods), Doli (du sénégalais Patisen) et Maxi Goût, ainsi qu'une " +
      "multitude de marques régionales. Le bouillon cube contient lui-même du sel, des " +
      "arômes et, souvent, des exhausteurs de goût.",
  },
  {
    kind: "paragraph",
    text:
      "Le glutamate pur occupe une place à part. Les ménages l'achètent peu. En revanche, " +
      "les restaurants, les rôtisseurs et tous ceux qui cuisinent en grande quantité " +
      "l'apprécient : il leur permet d'obtenir facilement le goût recherché, à moindre coût " +
      "que les cubes. Mais beaucoup l'utilisent en cachette, de peur d'inquiéter leurs " +
      "clients.",
  },
  {
    kind: "paragraph",
    text:
      "C'est que le produit traîne une réputation tenace. En Côte d'Ivoire, on le surnomme " +
      "le « cube Maggi blanc », et une rumeur prétend qu'il s'agit d'un produit chimique si " +
      "nocif qu'il blanchirait une marmite noircie par le feu de bois. Des contrefaçons " +
      "grossières, vendues en gros cristaux irréguliers, bien loin de la fine poudre " +
      "blanche du produit authentique, entretiennent le doute.",
  },
  {
    kind: "paragraph",
    text:
      "La distribution repose sur un réseau de grossistes, de demi-grossistes et de " +
      "détaillantes sur les marchés, souvent organisées en coopératives de femmes. Les " +
      "grossistes, qui achètent en volume, ont un poids considérable dans les négociations.",
  },
  { kind: "heading", text: "L'organisation de la filiale" },
  {
    kind: "paragraph",
    text:
      "AAO est dirigée par une équipe japonaise, qui s'appuie sur des cadres ivoiriens. Le " +
      "groupe a délégué un consultant pour former le personnel à ses standards en matière " +
      "de maintenance, de qualité et de respect des normes. Dans les premiers mois, " +
      "l'effort porte surtout sur la production, le stockage et la qualité, au point que la " +
      "maintenance est d'abord négligée.",
  },
  {
    kind: "paragraph",
    text:
      "La direction de l'usine reprend la situation en main. Une démarche TPM est déployée, " +
      "avec un suivi quotidien de l'efficacité des équipements. Les résultats sont " +
      "spectaculaires : les pertes diminuent de 40 %, et l'usine d'Abidjan se classe parmi " +
      "les dix meilleures des quelque cent vingt usines du groupe.",
  },
  { kind: "heading", text: "Le problème change de nature" },
  {
    kind: "paragraph",
    text:
      "Ce succès industriel révèle un autre problème : les ventes ne suivent pas. Bientôt, " +
      "les magasins de l'usine débordent. Le défi n'est plus de produire, mais de vendre. " +
      "Le directeur de l'usine est nommé directeur commercial, et des réformes " +
      "s'engagent : refonte des itinéraires de vente, réorganisation des agences " +
      "décentralisées, gestion de la flotte de véhicules et de la force de vente, " +
      "formation du personnel commercial.",
  },
  {
    kind: "paragraph",
    text:
      "Face à la rumeur, l'entreprise contre-attaque. Elle lance une campagne publicitaire " +
      "avec une actrice ivoirienne populaire, Delta, distribue des dépliants expliquant la " +
      "fabrication du produit, de la canne à sucre au glutamate, et envoie des équipes sur " +
      "les marchés pour répondre aux questions. Elle développe aussi un nouveau produit, " +
      "AjiGoût : du glutamate coupé de sel et d'épices locales comme le poivre et le " +
      "soumara, moins cher et plus abordable que le produit pur.",
  },
  {
    kind: "paragraph",
    text:
      "Le département commercial est organisé autour de plusieurs canaux. Sous la " +
      "direction des ventes, un responsable s'occupe de l'export vers les pays voisins, un " +
      "autre de l'administration des ventes et du marketing. La vente directe s'appuie sur " +
      "trois implantations : une agence à Abidjan, qui compte cinq équipes, une agence à " +
      "Bouaké, qui en compte deux, et un dépôt à Daloa. Deux « développeurs » prospectent " +
      "de nouveaux clients. Un canal distinct sert les distributeurs, les grossistes et les " +
      "restaurants. S'y ajoutent un service de contrôle, un service de transit et de " +
      "logistique, et le marketing (annexe 4).",
  },
  {
    kind: "paragraph",
    text:
      "Le bilan de la vente directe pour l'exercice d'avril 2015 à mars 2016 est riche " +
      "d'enseignements (annexe 5). Sur les dix premiers mois, les équipes émettent plus de " +
      "55 000 factures, pour environ 111 tonnes et 163 millions de francs CFA hors taxes. " +
      "La facture moyenne dépasse à peine 2 900 francs CFA, soit environ deux kilogrammes, " +
      "et ne comporte presque toujours qu'un seul article. Les ventes mensuelles restent " +
      "stables d'un bout à l'autre de la période, sans tendance à la hausse.",
  },
  {
    kind: "paragraph",
    text:
      "Malgré ces efforts, les grossistes continuent de faire valoir combien il est " +
      "difficile de vendre un produit à la mauvaise réputation, et en tirent de meilleures " +
      "conditions. Le groupe, de son côté, a fixé un objectif de ventes ambitieux pour 2016.",
  },
  { kind: "heading", text: "Votre mission" },
  {
    kind: "paragraph",
    text:
      "Nous sommes au début de l'année 2016. La direction régionale du groupe vous confie " +
      "une mission : réaliser le diagnostic stratégique d'Ajinomoto Afrique de l'Ouest et " +
      "proposer une stratégie pour les trois prochaines années. Vous devez dire si la " +
      "filiale peut atteindre ses objectifs, et à quelles conditions. Vous pouvez tout " +
      "remettre en question : le produit, le marché visé, le modèle de distribution, " +
      "l'organisation, et même la pertinence d'une filiale autonome.",
  },
];

// ==================== ANNEXES ====================

const ANNEXES: CaseBlock[] = [
  {
    kind: "table",
    table: {
      caption: "Annexe 1 – Fiche d'identité d'Ajinomoto Afrique de l'Ouest",
      headers: ["Élément", "Information"],
      rows: [
        ["Forme juridique", "Société anonyme avec conseil d'administration"],
        ["Création", "Janvier 2012 (annonce en octobre 2011)"],
        ["Siège et usine", "Zone industrielle de Yopougon, Abidjan"],
        ["Activité", "Importation, reconditionnement et vente d'AJI-NO-MOTO®"],
        ["Approvisionnement", "MSG en vrac importé de la filiale brésilienne du groupe"],
        ["Usine", "En service en avril 2013 ; terrain d'environ 2 765 m²"],
        ["Investissement annoncé", "1,9 milliard de FCFA ; capacité de 300 tonnes"],
        ["Effectif", "Environ 60 salariés en 2013 ; 250 emplois annoncés à terme"],
        ["Capital social (2021)", "6,15 milliards de FCFA"],
        ["Objectif de ventes", "Environ 2,5 milliards de yens en 2016"],
      ],
    },
  },
  {
    kind: "table",
    table: {
      caption: "Annexe 2 – Zone de vente visée (onze pays)",
      headers: ["Zone", "Pays"],
      rows: [
        [
          "Zone franc CFA (UEMOA)",
          "Côte d'Ivoire, Mali, Burkina Faso, Togo, Sénégal, Guinée-Bissau",
        ],
        ["Autres monnaies", "Ghana, Guinée, Liberia, Sierra Leone, Gambie"],
        ["Hors zone (couvert par WASCO)", "Nigeria"],
      ],
    },
  },
  {
    kind: "table",
    table: {
      caption: "Annexe 3 – Le marché ivoirien des bouillons, vers 2015",
      headers: ["Indicateur", "Donnée"],
      rows: [
        ["Volume annuel", "Environ 30 000 tonnes"],
        ["Valeur annuelle", "Environ 90 milliards de FCFA"],
        ["Leader", "Maggi (Nestlé), environ 75 % du marché"],
        [
          "Principaux challengers",
          "Jumbo (GB Foods), Doli (Patisen), Maxi Goût, nombreuses marques régionales",
        ],
        ["Canaux", "Grossistes, demi-grossistes, détaillantes des marchés, boutiques de quartier"],
      ],
      source:
        "Étude Sagaci Research citée par Jeune Afrique. Les données portent sur les " +
        "bouillons ; il n'existe pas de statistiques publiques sur le marché du glutamate pur.",
    },
  },
  {
    kind: "table",
    table: {
      caption: "Annexe 4 – Organisation du département commercial (2015-2016)",
      headers: ["Fonction", "Rôle"],
      rows: [
        ["Direction des ventes", "Pilote l'ensemble des canaux"],
        ["Export", "Ventes vers les pays voisins de la zone visée"],
        ["Administration des ventes et marketing", "Suivi des résultats, contrôle, marketing"],
        [
          "Vente directe",
          "Agence d'Abidjan (5 équipes), agence de Bouaké (2 équipes), dépôt de Daloa, " +
            "2 développeurs",
        ],
        [
          "Distributeurs, grossistes et restaurants",
          "Équipes dédiées aux clients en volume, à Abidjan et dans les régions",
        ],
        ["Soutien", "Contrôle (back-office), transit et logistique"],
      ],
    },
  },
  {
    kind: "table",
    table: {
      caption: "Annexe 5 – Bilan de la vente directe, avril 2015 à janvier 2016 (10 mois)",
      headers: ["Implantation", "Factures", "Volume (kg)", "Montant (FCFA HT)", "Part du montant"],
      rows: [
        ["Agence d'Abidjan", "40 890", "70 033", "102 992 026", "63 %"],
        ["Agence de Bouaké", "8 971", "21 682", "30 526 634", "19 %"],
        ["Dépôt de Daloa", "4 987", "11 196", "17 177 006", "11 %"],
        ["Développeurs", "872", "8 415", "12 762 294", "8 %"],
        ["Total", "55 720", "111 325", "163 457 961", "100 %"],
      ],
      totalRow: 4,
    },
  },
  {
    kind: "table",
    table: {
      caption: "Annexe 5 (suite) – Indicateurs moyens de la vente directe",
      headers: ["Indicateur moyen", "Valeur"],
      rows: [
        ["Montant mensuel", "Entre 14,6 et 18,8 millions de FCFA, sans tendance nette"],
        ["Facture moyenne", "Environ 2 900 FCFA, soit environ 2 kg"],
        ["Articles par facture", "1,10"],
        ["Prix moyen", "Environ 1 470 FCFA le kilogramme"],
        ["Facture moyenne des développeurs", "Environ 14 600 FCFA, soit près de 10 kg"],
      ],
      source:
        "Annexes 4 et 5 : document interne du département commercial d'AAO, « Résultat " +
        "d'activité commerciale – vente directe, exercice avril 2015 – mars 2016 », archives " +
        "de l'auteur. Les chiffres de février et mars 2016 n'y figuraient pas encore. Les " +
        "autres canaux (distributeurs, grossistes, restaurants, export) ne sont pas inclus.",
    },
  },
];

// ==================== QUESTIONS ====================

const QUESTIONS: CaseQuestion[] = [
  {
    id: "q1-externe",
    title: "Environnement externe",
    module: 2,
    step: 1,
    text:
      "Dressez le PESTEL d'AAO en 2016. Quelles sont les deux variables pivots de son " +
      "avenir ? Construisez les quatre scénarios correspondants.",
  },
  {
    id: "q2-concurrence",
    title: "Environnement concurrentiel",
    module: 3,
    step: 2,
    text:
      "Évaluez les cinq forces. Le bouillon cube est-il un concurrent ou un substitut du " +
      "glutamate pur ? Quelles conséquences en tirez-vous pour la stratégie ?",
  },
  {
    id: "q3-interne",
    title: "Environnement interne",
    module: 4,
    step: 3,
    text:
      "Dressez la chaîne de valeur d'AAO. Où se crée la valeur, et où se perd-elle ? " +
      "Soumettez au VRIO les ressources de la filiale, en distinguant celles qui viennent " +
      "du groupe et celles qui sont propres à AAO.",
  },
  {
    id: "q4-chiffres",
    title: "Les chiffres (annexes 1 et 5)",
    module: null,
    step: 3,
    text:
      "Annualisez les résultats de la vente directe et comparez-les à l'objectif de " +
      "2,5 milliards de yens fixé pour 2016, en retenant un taux d'environ 4,9 FCFA pour un " +
      "yen. Quelle part de l'objectif ce canal représente-t-il ? Que vous disent la taille " +
      "de la facture moyenne, le nombre d'articles par facture et la stabilité des ventes " +
      "mensuelles ? Que révèle la facture moyenne des développeurs ? (À intégrer à " +
      "l'environnement interne.)",
  },
  {
    id: "q5-synthese",
    title: "Synthèse",
    module: 5,
    step: 5,
    text:
      "Établissez la SWOT et la matrice TOWS. Quels sont les trois enjeux stratégiques " +
      "d'AAO ?",
  },
  {
    id: "q6-parties-prenantes",
    title: "Parties prenantes",
    module: 6,
    step: 4,
    text:
      "Placez dans la matrice pouvoir-intérêt le siège à Tokyo, la direction régionale, " +
      "les grossistes, les détaillantes, les restaurateurs, les consommatrices, le " +
      "gouvernement ivoirien et les concurrents. Lequel de ces acteurs a été le plus " +
      "négligé ?",
  },
  {
    id: "q7-cap",
    title: "Cap",
    module: 7,
    step: 6,
    text:
      "Proposez une vision et une mission pour AAO. À qui la filiale devait-elle " +
      "s'adresser en priorité ?",
  },
  {
    id: "q8-choix",
    title: "Choix",
    module: 8,
    step: 7,
    text:
      "Évaluez au moins quatre options avec les critères de pertinence, d'acceptabilité et " +
      "de faisabilité. Pensez notamment à : concentrer l'effort sur les restaurateurs ; " +
      "s'attaquer en priorité à la réputation du produit ; lancer des produits mélangés " +
      "comme AjiGoût ; passer par un distributeur régional plutôt que par une force de " +
      "vente propre ; réduire l'ambition géographique à quelques pays.",
  },
  {
    id: "q9-action",
    title: "Action",
    module: 9,
    step: 8,
    text:
      "Bâtissez une feuille de route sur trois ans et un tableau de bord équilibré pour la " +
      "stratégie retenue.",
  },
  {
    id: "q10-centrale",
    title: "Question centrale",
    module: 10,
    step: 9,
    text:
      "Si vous aviez été chargé de la stratégie d'AAO, qu'auriez-vous fait pour éviter " +
      "l'échec ? Votre réponse prend la forme du plan stratégique, assemblé à partir de " +
      "vos étapes 5 à 8.",
  },
];

// ==================== ÉNONCÉ ====================

export const CASE_STATEMENT: CaseStatement = {
  title: "Étude de cas : Ajinomoto Afrique de l'Ouest",
  lead:
    "Un géant mondial de l'assaisonnement s'installe à Abidjan en 2013 avec l'ambition de " +
    "conquérir onze pays. Huit ans plus tard, ses actionnaires décident de dissoudre la " +
    "filiale. À vous de mener l'analyse et de dire ce qui aurait pu être fait autrement.",
  intro: INTRO,
  story: STORY,
  annexes: ANNEXES,
  questions: QUESTIONS,
  hints: [
    "Le problème principal d'AAO était-il un problème de prix, de produit, de " +
      "distribution ou de confiance ?",
    "L'objectif de ventes fixé par le siège était-il cohérent avec la taille réelle du " +
      "marché du glutamate pur, que personne n'avait mesurée ?",
    "Le modèle de vente directe au comptant, qui avait fait ses preuves en Asie, " +
      "était-il adapté à un marché dominé par des grossistes puissants ?",
    "Le succès de l'usine a-t-il pu masquer, pendant un temps, le fait que la filiale " +
      "n'avait pas trouvé son marché ?",
  ],
  sources: [
    "Ajinomoto Co. (21 octobre 2011). « Ajinomoto to Establish Sales Company in Côte " +
      "d'Ivoire to Accelerate Market Development in West Africa ». Communiqué de presse.",
    "Ajinomoto Co. (15 mai 2013). Communiqué annonçant la mise en service de l'usine de " +
      "reconditionnement de Yopougon. Repris par Food Ingredients First, 16 mai 2013.",
    "Agence Ecofin (14 mai 2013). « Ajinomoto, leader mondial de la production d'acides " +
      "aminés, investit en Côte d'Ivoire ».",
    "Jeune Afrique (vers 2015). « En Côte d'Ivoire, Ali Hojeij bouscule Unilever et " +
      "Nestlé ». Données de Sagaci Research sur le marché des bouillons.",
    "Avis de dissolution et de liquidation d'Ajinomoto Afrique de l'Ouest, Fraternité " +
      "Matin, 11 novembre 2021 (reproduit sur business.abidjan.net).",
    "Ajinomoto Europe et Afrique. « L'histoire d'Ajinomoto Europe & Afrique », page " +
      "historique du site institutionnel.",
    "Ajinomoto Afrique de l'Ouest, département commercial (2016). « Résultat d'activité " +
      "commerciale – vente directe, exercice avril 2015 – mars 2016 ». Document interne, " +
      "archives de l'auteur.",
  ],
};
