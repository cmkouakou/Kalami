/**
 * =============================================================
 *  Fichier    : m11-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 11, leçon 3 — « Alliances, partenariats et coentreprises » : les
 *               formes de collaboration (accord, alliance, coentreprise, consortium,
 *               licence, franchise, impartition), pourquoi s'allier, les risques, les
 *               clés d'une alliance qui dure, les deux alliances d'Infosystem. Sources :
 *               livre, module 8 (§ 8.4). Texte, exemples et exercices originaux.
 *               v1.1 : exemples réels au Québec et en Côte d'Ivoire, sources citées
 *               (pont Samuel-De Champlain, pont Henri-Konan-Bédié, deux par forme).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
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
  notion,
  p,
  piege,
  retenir,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M11_L03: ContenuLecon = [
  p(
    "Entre construire seul et acheter, il existe une voie intermédiaire : s'associer. " +
      "Deux entreprises mettent en commun une partie de leurs ressources pour atteindre " +
      "un but qu'aucune n'atteindrait aussi bien seule, tout en restant indépendantes.",
  ),

  titre("Les formes de collaboration"),
  tableau(
    ["Forme", "Ce qui est partagé", "Exemple"],
    [
      [
        "Accord de partenariat",
        "Une activité précise, par contrat",
        "Deux transporteurs qui se passent du fret",
      ],
      [
        "Alliance stratégique",
        "Des ressources clés, sur la durée",
        "Une banque et un opérateur qui lancent un compte mobile",
      ],
      [
        "Coentreprise",
        "Une société nouvelle, détenue en commun",
        "Un groupe étranger et un partenaire local qui créent une usine",
      ],
      [
        "Consortium",
        "Un grand projet, à plusieurs",
        "Des firmes de génie qui construisent un pont",
      ],
      [
        "Licence et franchise",
        "Une marque, un procédé, contre redevance",
        "Une chaîne de restauration qui franchise ses points de vente",
      ],
      [
        "Impartition",
        "Une activité confiée à un spécialiste",
        "Une PME qui confie sa paie à un cabinet",
      ],
    ],
  ),
  definition(
    "Coentreprise",
    "Une entreprise nouvelle créée et détenue par deux sociétés ou plus, qui y apportent " +
      "chacune des ressources et en partagent les résultats et le contrôle.",
  ),

  titre("Des exemples au Québec et en Côte d'Ivoire"),
  p(
    "Chaque forme se retrouve autour de nous. Commençons par un ouvrage que tout " +
      "Montréalais connaît, puis voyons deux exemples par forme : l'un au Québec, " +
      "l'autre en Côte d'Ivoire. La source est indiquée sous chaque exemple.",
  ),
  p(
    "**Le pont Samuel-De Champlain, à Montréal.** Pour remplacer l'ancien pont " +
      "Champlain, le gouvernement du Canada n'a pas tout fait seul : il a choisi un " +
      "**partenariat public-privé**. Le 19 juin 2015, il a signé l'entente de projet " +
      "avec **Signature sur le Saint-Laurent**, un consortium de firmes dont ACS " +
      "Infrastructure Canada, Dragados Canada, Flatiron et SNC-Lavalin (aujourd'hui " +
      "AtkinsRéalis). Le consortium a conçu, construit et financé le corridor, puis il " +
      "l'exploite et l'entretient pendant 30 ans. L'État fixe les exigences et paie ; " +
      "les firmes apportent leur génie, leurs équipes et leur financement. Le pont a " +
      "ouvert le 24 juin 2019 vers Montréal, puis le 1er juillet vers Brossard. " +
      "Sources : [Infrastructure Canada, foire aux questions]" +
      "(https://logement-infrastructure.canada.ca/nbsl-npsl/faq-fra.html) ; " +
      "[Infrastructure Canada, ouverture du pont, juin 2019]" +
      "(https://www.canada.ca/fr/bureau-infrastructure/nouvelles/2019/06/" +
      "le-pont-samuel-de-champlain-ouvrira-a-la-circulation-le-24-juin.html).",
  ),
  notion(
    "Consortium et PPP en Côte d'Ivoire : le pont Henri-Konan-Bédié",
    p(
      "À Abidjan, le pont Henri-Konan-Bédié (environ 1,5 km sur la lagune Ébrié, entre " +
        "Riviera et Marcory) est lui aussi un partenariat public-privé. L'État a accordé " +
        "une concession de 30 ans à la **SOCOPRIM**, société dont Bouygues est " +
        "l'actionnaire principal : elle a conçu, financé et construit l'ouvrage, et elle " +
        "l'exploite. Réunir le financement a pris des années ; le pont a été inauguré " +
        "le 16 décembre 2014. Différence avec Champlain : à Abidjan, l'usager paie un " +
        "**péage**, qui rembourse le concessionnaire ; à Montréal, le pont est sans " +
        "péage et c'est l'État qui paie le consortium.",
    ),
    p(
      "Sources : [Banque mondiale, fiche PPP du pont à péage]" +
        "(https://ppp.worldbank.org/public-private-partnership/sites/default/files/" +
        "2022-03/P3Briefs_CotedIvoireTollBridge.pdf) ; [Bouygues Construction]" +
        "(https://www.bouygues-construction.com/en/achievements/henri-konan-bedie-bridge).",
    ),
  ),
  notion(
    "Accord de partenariat : STM et BIXI ; CIE, SODECI et Orange",
    p(
      "**Québec.** En 2015, la STM, BIXI Montréal et Communauto ont conclu une " +
        "entente : les abonnés annuels OPUS obtenaient un rabais sur leur abonnement " +
        "BIXI. En 2017, la carte OPUS est devenue utilisable dans les 540 stations BIXI. " +
        "Chacun reste indépendant ; ils partagent une clientèle et un support de " +
        "paiement, rien de plus. Sources : [STM, conseil d'administration, 2015]" +
        "(https://www.stm.info/sites/default/files/pdf/fr/CA/150401/art._12.5.pdf) ; " +
        "[communiqué BIXI–STM, 2017](https://www.newswire.ca/news-releases/" +
        "les-540-stations-intelligentes-bixi-opus-en-service-des-aujourdhui-" +
        "632892393.html).",
    ),
    p(
      "**Côte d'Ivoire.** La CIE et la SODECI ont signé un protocole d'accord avec " +
        "Orange Côte d'Ivoire et la BIAO-CI pour que leurs clients règlent les factures " +
        "d'eau et d'électricité par paiement électronique. Les distributeurs encaissent " +
        "plus vite ; l'opérateur et la banque gagnent des transactions. D'autres accords " +
        "ont suivi, par exemple avec Wave en 2023. Sources : [Abidjan.net]" +
        "(https://news.abidjan.net/articles/417037/reglement-des-factures-deau-et-" +
        "delectricite-desormais-possible-par-paiement-electronique) ; [Digital Mag]" +
        "(https://digitalmag.ci/wave-cote-divoire-integre-la-possibilite-de-payer-" +
        "vos-factures-cie-et-sodeci/).",
    ),
  ),
  notion(
    "Alliance stratégique : Air Canada et Star Alliance ; Air France et Air Côte d'Ivoire",
    p(
      "**Québec.** Air Canada, dont le siège est à Montréal, est l'une des cinq " +
        "compagnies fondatrices de **Star Alliance**, créée le 14 mai 1997 avec " +
        "Lufthansa, SAS, Thai Airways et United. Les membres vendent les vols des " +
        "autres et relient leurs réseaux, sans fusionner. Source : [Air Canada, " +
        "transporteurs partenaires et Star Alliance]" +
        "(https://www.aircanada.com/fr/travelinfo/airport/codeshare.html).",
    ),
    p(
      "**Côte d'Ivoire.** Air France est actionnaire et partenaire stratégique d'Air " +
        "Côte d'Ivoire depuis la création de la compagnie, en 2012. En octobre 2026, " +
        "les deux compagnies ont signé un accord de partage de codes sur Paris–Abidjan, " +
        "en vigueur le 25 octobre, et annoncé le rapprochement de leurs programmes de " +
        "fidélité. Une alliance peut donc aller jusqu'à une part du capital. Source : " +
        "[Air France, communiqué du 16 octobre 2026]" +
        "(https://corporate.airfrance.com/fr/communiques-presse/air-france-et-air-" +
        "cote-divoire-renforcent-leur-partenariat-strategique-avec-un).",
    ),
  ),
  notion(
    "Coentreprise : l'Aluminerie de Bécancour ; Orange Bank Africa",
    p(
      "**Québec.** L'Aluminerie de Bécancour (ABI) est une société détenue par Alcoa " +
        "(74,95 %) et Rio Tinto (25,05 %). Deux concurrents partagent une usine, ses " +
        "coûts et sa production, chacun selon sa part. Source : [Alcoa, fiche de " +
        "l'Aluminerie de Bécancour](https://www.alcoa.com/canada/fr/pdf/Becancour.pdf).",
    ),
    p(
      "**Côte d'Ivoire.** Le 23 juillet 2020, Orange et le groupe NSIA ont lancé à " +
        "Abidjan **Orange Bank Africa**, une banque créée en commun : Orange apporte ses " +
        "abonnés et Orange Money, NSIA son métier de banque et d'assurance. Premier " +
        "produit : un microcrédit dès 5 000 F CFA, demandé depuis le téléphone. C'est " +
        "l'exemple « une banque et un opérateur » du tableau, poussé jusqu'à la " +
        "coentreprise. Sources : [Orange, communiqué du 23 juillet 2020]" +
        "(https://newsroom.orange.com/orange-and-nsia-launch-orange-bank-africa-to-" +
        "provide-greater-access-to-financial-services-and-improve-the-financial-" +
        "inclusion-of-people-living-in-west-africa?lang=eng) ; [Koaci]" +
        "(https://www.koaci.com/article/2020/07/23/cote-divoire/economie/cote-divoire-" +
        "orange-et-nsia-lancent-orange-bank-africa_143434.html).",
    ),
  ),
  notion(
    "Licence et franchise : Jean Coutu ; Carrefour et CFAO",
    p(
      "**Québec.** Le Groupe Jean Coutu, né en 1969 dans l'est de Montréal, a grandi " +
        "par un réseau de pharmacies affiliées. Au Québec, seul un pharmacien peut " +
        "posséder une pharmacie : chaque succursale appartient donc à un pharmacien " +
        "propriétaire, qui utilise l'enseigne, la publicité et l'approvisionnement du " +
        "groupe contre rémunération. Metro a acquis le groupe en 2018. Sources : " +
        "[Jean Coutu, historique](https://jeancoutu.com/en/corpo/about/history) ; " +
        "[L'Express Franchise](https://lexpress-franchise.com/fr-ca/franchise/jean-coutu/).",
    ),
    p(
      "**Côte d'Ivoire.** En mai 2013, Carrefour et CFAO ont créé une société commune " +
        "(CFAO 55 %, Carrefour 45 %) qui détient le droit exclusif d'exploiter " +
        "l'enseigne Carrefour dans huit pays d'Afrique de l'Ouest et centrale, dont la " +
        "Côte d'Ivoire. CFAO construit les centres commerciaux et exploite les magasins ; " +
        "Carrefour apporte sa marque et son savoir-faire. Le premier hypermarché a ouvert " +
        "à PlaYce Marcory, à Abidjan, en décembre 2015. Le montage est mixte : une " +
        "coentreprise créée pour exploiter une enseigne. Sources : [communiqué " +
        "Carrefour–CFAO, 29 mai 2013]" +
        "(https://echanges.dila.gouv.fr/OPENDATA/AMF/BWR/2013/05/" +
        "FCBWR071254_20130529.pdf) ; [Financial Afrik, 18 décembre 2015]" +
        "(https://www.financialafrik.com/2015/12/18/cote-divoire-playce-centre-" +
        "commercial-de-nouvelle-generation-est-inaugure-ce-jour-a-abidjan/).",
    ),
  ),
  notion(
    "Impartition : Desjardins, IBM et CGI ; l'État ivoirien et la CIE",
    p(
      "**Québec.** En 2010, après un appel d'offres, Desjardins a confié à IBM Canada " +
        "l'exploitation de son infrastructure informatique centralisée et " +
        "l'hébergement de ses systèmes, pour cinq ans. Sa paie est confiée à CGI ; " +
        "l'entente a été prolongée en 2021 pour dix ans. Desjardins garde la stratégie " +
        "et ses clients ; les spécialistes font tourner la machine. Sources : " +
        "[Insurance Canada, 5 mai 2010](https://insurance-canada.ca/2010/05/05/" +
        "desjardins-selects-ibm-canada-for-its-centralized-it-infrastructure-" +
        "operations-and-hosting/) ; [CGI, 28 juillet 2021](https://www.cgi.com/fr/" +
        "2021-07-28-CGI-et-Desjardins-prolongent-leur-partenariat-pour-la-gestion-" +
        "des-services-de-paie).",
    ),
    p(
      "**Côte d'Ivoire.** En octobre 1990, l'État a confié à la Compagnie ivoirienne " +
        "d'électricité (CIE), une société privée, l'exploitation du service public de " +
        "l'électricité : production, transport, distribution et vente. L'État garde " +
        "les ouvrages ; la CIE les exploite. Les juristes parlent d'**affermage** plutôt " +
        "que de concession. La convention a été reconduite en 2005, puis renégociée " +
        "pour 2021. Sources : [IFDD, Francophonie]" +
        "(https://www.ifdd.francophonie.org/media/docs/publications/" +
        "276_Fi_pol-mai-energ_ppp2_no11_jan2008.pdf) ; [Koaci, 30 septembre 2020]" +
        "(https://www.koaci.com/index.php/article/2020/09/30/cote-divoire/economie/" +
        "cote-divoire-electricite-letat-revoit-a-la-baisse-la-convention-de-" +
        "concession-du-service-public-national-de-production-de-distribution-" +
        "dexportation_145463.html).",
    ),
  ),
  p(
    "Remarquez que les frontières bougent : Air France est à la fois partenaire et " +
      "actionnaire ; Carrefour et CFAO ont créé une coentreprise pour exploiter une " +
      "enseigne. Ce qui compte n'est pas l'étiquette, mais ce qui est partagé : un " +
      "contrat, des ressources, une société ou un grand projet.",
  ),

  titre("Pourquoi s'allier"),
  liste(
    "**Accéder à une compétence** que l'on n'a pas, sans la construire ni l'acheter.",
    "**Partager les coûts et les risques** d'un projet trop lourd pour un seul.",
    "**Aller vite**, presque autant qu'une acquisition, pour bien moins cher.",
    "**Rester réversible** : une alliance se défait plus facilement qu'une fusion.",
    "**Entrer sur un marché** avec un partenaire qui en connaît les règles.",
  ),
  retenir(
    "L'alliance donne l'accès sans la propriété. Elle convient quand on a besoin d'une " +
      "compétence sans avoir besoin de la posséder.",
  ),

  titre("Les risques"),
  liste(
    "**L'opportunisme** : un partenaire qui prend plus qu'il ne donne.",
    "**L'apprentissage inégal** : l'un apprend le métier de l'autre, puis devient son " +
      "concurrent.",
    "**La dépendance** : une activité clé qui ne tient qu'à la bonne volonté d'un autre.",
    "**Les buts qui divergent** : ce qui convenait aux deux au départ ne convient plus " +
      "qu'à un seul.",
  ),
  piege(
    "Laisser flou qui possède la relation client. Dans une alliance de services, celui " +
      "qui parle au client finit souvent par le garder. Il faut décider dès le départ qui " +
      "vend, qui facture, et qui reste l'interlocuteur.",
  ),

  titre("Les clés d'une alliance qui dure"),
  etapes(
    "**Un but commun, écrit** : ce que chacun veut obtenir, et en combien de temps.",
    "**Des apports clairs** : qui apporte quoi, et qui garde quoi.",
    "**Une gouvernance simple** : qui décide, à quel rythme on se rencontre, comment on " +
      "règle un désaccord.",
    "**Une porte de sortie** : comment on se sépare, et ce que devient chacun des clients.",
  ),

  titre("Les deux alliances d'Infosystem"),
  p(
    "Le plan d'Infosystem prévoit deux alliances, et chacune répond à un manque précis.",
  ),
  liste(
    "**Une firme spécialisée en cybersécurité**, pour les tests d'intrusion et les " +
      "audits avancés. Infosystem n'a pas cette compétence, et elle coûterait trop cher à " +
      "construire. L'accord doit préciser qu'Infosystem garde la relation avec ses " +
      "clients, et que son partenaire n'y vend pas ses propres services gérés.",
    "**Des liens avec des cégeps et des centres de formation professionnelle**, pour " +
      "accueillir des stagiaires. Infosystem y gagne un vivier de futurs techniciens ; " +
      "les écoles, des milieux de stage réels. C'est une réponse directe au manque de " +
      "main-d'œuvre.",
  ),
  p(
    "Les deux alliances renforcent la croissance interne au lieu de la remplacer : la " +
      "première complète l'offre, la seconde alimente l'équipe.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Quelle forme de collaboration chaque situation décrit-elle ?",
    categories: ["Coentreprise", "Franchise", "Impartition", "Consortium"],
    elements: [
      {
        texte: "Deux sociétés créent ensemble une raffinerie qu'elles détiennent à parts égales.",
        categorie: 0,
        explication: "Une société nouvelle, détenue en commun.",
      },
      {
        texte: "Un commerçant ouvre un salon sous la marque d'une chaîne, contre redevance.",
        categorie: 1,
        explication: "Il exploite la marque et le savoir-faire d'un autre.",
      },
      {
        texte: "Un hôtel confie le nettoyage de son linge à une blanchisserie industrielle.",
        categorie: 2,
        explication: "Une activité confiée à un spécialiste.",
      },
      {
        texte: "Quatre entreprises s'associent pour construire un port, puis se séparent.",
        categorie: 3,
        explication: "Un grand projet mené à plusieurs.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Dans l'alliance avec la firme de cybersécurité, quel point Infosystem doit-elle " +
      "régler en premier ?",
    choix: [
      {
        texte: "Le logo qui apparaîtra sur les rapports d'audit.",
        explication: "Utile, mais secondaire.",
      },
      {
        texte: "Qui garde la relation avec le client, et ce que le partenaire peut lui vendre.",
        explication: "Oui : sinon le partenaire peut finir par prendre le client.",
      },
      {
        texte: "La fusion des deux entreprises à terme.",
        explication: "L'alliance sert justement à éviter de fusionner.",
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
        texte: "Une alliance est plus facile à défaire qu'une fusion.",
        vrai: true,
        explication: "Chacun reste indépendant : c'est sa réversibilité.",
      },
      {
        texte: "Dans une alliance, les deux partenaires apprennent toujours autant l'un que " +
          "l'autre.",
        vrai: false,
        explication: "L'apprentissage inégal est l'un des risques majeurs.",
      },
      {
        texte: "Prévoir comment se séparer fait partie d'une bonne alliance.",
        vrai: true,
        explication: "La porte de sortie évite les ruptures coûteuses.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Proposez une alliance pour votre organisation. Nommez le partenaire visé, ce que " +
      "chacun apporte, le risque principal et la règle qui le limitera.",
    corrige: [
      "Un partenaire précis et la forme de collaboration choisie.",
      "Les apports de chacun et ce que chacun garde.",
      "Le risque principal parmi opportunisme, apprentissage inégal, dépendance, buts.",
      "Une règle concrète : relation client, gouvernance ou porte de sortie.",
    ],
  }),

  appliquez(
    7,
    "Si une alliance figure parmi vos options de l'étape 7, notez dans le commentaire le " +
      "partenaire visé et ce que chacun apporte.",
  ),
  fiche(
    "Partenariat, alliance, coentreprise, consortium, licence, franchise, impartition.",
    "L'alliance donne l'accès sans la propriété, et reste réversible.",
    "Risques : opportunisme, apprentissage inégal, dépendance, buts divergents.",
    "Clés : but écrit, apports clairs, gouvernance simple, porte de sortie.",
    "Infosystem : une firme de cybersécurité, des cégeps et centres de formation.",
  ),
];
