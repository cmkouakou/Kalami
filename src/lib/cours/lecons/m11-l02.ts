/**
 * =============================================================
 *  Fichier    : m11-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 11, leçon 2 — « Fusions et acquisitions : promesses et pièges » :
 *               définitions, raisons d'acheter, pourquoi tant d'opérations déçoivent, les
 *               trois temps d'une acquisition (avant, signature, intégration), le rachat
 *               d'une petite firme et la vente d'Infosystem comme issue de relève.
 *               Sources : livre, module 8 (§ 8.4). Texte, exemples et exercices
 *               originaux.
 *               v1.1 (v0.39.2) : encadré « Sur le terrain » sur le rachat de Nexio par
 *               Cofomo (annoncé le 21 septembre 2021), vécu par l'auteur.
 *               v1.2 : exemples réels au Québec et en Côte d'Ivoire, sources citées
 *               (Couche-Tard, RONA, Orange et CI-Telecom, Attijariwafa et SIB).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
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

export const M11_L02: ContenuLecon = [
  p(
    "Acheter une entreprise, c'est obtenir en quelques mois ce qui prendrait des années " +
      "à construire : des clients, des employés formés, une marque, un savoir-faire. C'est " +
      "le mode de croissance le plus rapide. C'est aussi le plus risqué, parce qu'on " +
      "achète des personnes, et que les personnes peuvent partir.",
  ),

  titre("Quelques définitions"),
  definition(
    "Acquisition",
    "L'achat de tout ou partie d'une entreprise, qui passe sous le contrôle de " +
      "l'acheteur.",
  ),
  definition(
    "Fusion",
    "La réunion de deux entreprises en une seule, souvent de taille comparable, dont les " +
      "propriétaires partagent désormais le contrôle.",
  ),
  p(
    "Une acquisition est **amicale** quand les dirigeants de la cible l'acceptent, " +
      "**hostile** quand l'acheteur s'adresse directement aux actionnaires contre l'avis " +
      "de ces dirigeants. Les opérations hostiles concernent surtout les grandes sociétés " +
      "cotées ; pour une PME, l'achat se négocie de gré à gré.",
  ),

  titre("Pourquoi acheter"),
  liste(
    "**Gagner du temps** : entrer sur un marché ou dans un métier sans tout construire.",
    "**Obtenir des compétences** rares, difficiles à recruter une par une.",
    "**Gagner des clients** et une part de marché d'un coup.",
    "**Réaliser des synergies** : partager des coûts, croiser des ventes.",
    "**Réduire la concurrence** en absorbant un rival.",
  ),

  titre("Pourquoi tant d'opérations déçoivent"),
  p(
    "Les études sur les acquisitions concluent régulièrement qu'une part importante " +
      "d'entre elles ne crée pas la valeur promise. Les causes reviennent toujours.",
  ),
  tableau(
    ["Cause", "Ce qui se passe"],
    [
      ["Le prix trop élevé", "L'acheteur, pressé de gagner, paie plus que la valeur réelle"],
      ["Les synergies surestimées", "Les économies prévues n'arrivent pas, ou tard"],
      ["Le choc des cultures", "Deux façons de travailler se heurtent au quotidien"],
      ["Le départ des personnes clés", "Ceux qui faisaient la valeur s'en vont"],
      ["L'intégration négligée", "On fête la signature, puis on oublie de réunir les équipes"],
    ],
  ),
  retenir(
    "Une acquisition ne se joue pas à la signature, mais dans les mois qui suivent. Ce " +
      "qu'on achète vraiment, ce sont des personnes et des relations : il faut les garder.",
  ),

  titre("Des exemples au Québec et en Côte d'Ivoire"),
  p(
    "Une même opération peut réussir ou décevoir. Voici deux cas par territoire : une " +
      "acquisition et une fusion qui ont tenu leurs promesses, puis une acquisition qui " +
      "a coûté cher. La source est indiquée sous chaque exemple.",
  ),
  notion(
    "Acquisitions : Couche-Tard achète Circle K ; Lowe's achète RONA",
    p(
      "**Québec, une réussite.** En décembre 2003, Alimentation Couche-Tard, née à " +
        "Laval, a conclu l'achat de Circle K auprès de ConocoPhillips : environ 1 663 " +
        "magasins dans 16 États américains, pour un prix annoncé de 830 millions de " +
        "dollars américains. Couche-Tard a appris à intégrer ses achats, et Circle K " +
        "est devenue plus tard sa marque mondiale. Sources : [Lexpert]" +
        "(https://www.lexpert.ca/big-deals/alimentation-couche-tard-acquires-circle-k/" +
        "344422) ; [CSP Daily News](https://www.cspdailynews.com/biggest-c-store-deals-" +
        "so-far-century-2020/no-3-couche-tard-acquires-circle-k).",
    ),
    p(
      "**Québec, une déception.** En 2016, l'américain Lowe's a acheté RONA, de " +
        "Boucherville, pour environ 3,2 milliards de dollars canadiens. Six ans plus " +
        "tard, il a vendu toutes ses activités canadiennes au fonds Sycamore Partners " +
        "pour 400 millions de dollars américains comptant, plus un paiement différé lié " +
        "aux résultats, et inscrit une dépréciation d'environ 2 milliards de dollars " +
        "américains. Payer cher ne garantit pas la valeur : il faut ensuite savoir " +
        "intégrer. Sources : [CTV News Montréal]" +
        "(https://montreal.ctvnews.ca/lowe-s-to-sell-its-canadian-operations-including-" +
        "rona-and-reno-depot-1.6138066) ; [MDM, vente conclue]" +
        "(https://www.mdm.com/news/mergers-acquisitions/lowes-completes-400m-sale-of-" +
        "canada-retail-unit-to-sycamore/).",
    ),
  ),
  notion(
    "Fusion et acquisition en Côte d'Ivoire : Orange et CI-Telecom ; Attijariwafa et la SIB",
    p(
      "**Une fusion.** En 2016, Orange Côte d'Ivoire (le mobile) et Côte d'Ivoire " +
        "Telecom (l'opérateur historique du fixe) ont fusionné. L'absorption a été " +
        "finalisée fin décembre 2016 : une seule société, Orange Côte d'Ivoire, offre " +
        "désormais le fixe, le mobile, l'Internet et Orange Money sous une seule marque. " +
        "En 2014, les deux sociétés réalisaient 370 et 175 milliards de F CFA de chiffre " +
        "d'affaires. Sources : [Financial Afrik, 30 décembre 2016]" +
        "(https://www.financialafrik.com/2016/12/30/orange-finalise-labsorption-de-" +
        "loperateur-historique-cote-divoire-telecom/) ; [Financial Afrik, 3 mai 2016]" +
        "(https://www.financialafrik.com/2016/05/03/cote-divoire-telecom-et-le-groupe-" +
        "orange-finalisent-leur-fusion-pour-donner-naissance-a-un-geant-des-telecoms).",
    ),
    p(
      "**Une acquisition.** Fin 2009, le marocain Attijariwafa bank a acheté au Crédit " +
        "Agricole 51 % de la Société Ivoirienne de Banque (SIB), dans un ensemble de " +
        "cinq banques africaines payé environ 250 millions d'euros. Plutôt que d'ouvrir " +
        "une banque à partir de rien, il a acheté un réseau, des clients et des équipes " +
        "déjà en place. En 2015, il a racheté une part de l'État. Sources : " +
        "[Crédit Agricole, communiqué]" +
        "(https://www.credit-agricole.com/en/press-releases/credit-agricole-s.a.-and-" +
        "attijariwafa-bank-announce-agreement-concerning-changes-to-their-respective-" +
        "investments-in-morocco-and-africa) ; [Financial Afrik, 9 septembre 2015]" +
        "(https://www.financialafrik.com/2015/09/09/cote-divoire-attijariwafa-bank-" +
        "prend-officiellement-39-de-la-sib/).",
    ),
  ),

  titre("Trois temps"),
  liste(
    "**Avant** : vérifier ce que l'on achète. Les comptes, bien sûr, mais aussi les " +
      "contrats, la fidélité des clients et l'intention des employés clés de rester.",
    "**La signature** : fixer un prix que l'opération peut rembourser, même si les " +
      "synergies tardent. Prévoir l'accompagnement du vendeur pendant la transition.",
    "**L'intégration** : rencontrer chaque employé, dire tôt ce qui change et ce qui ne " +
      "change pas, et garder les personnes clés par des engagements concrets.",
  ),
  piege(
    "Acheter une liste de clients en croyant acheter une entreprise. Dans une firme de " +
      "services, si les techniciens partent après la vente, les clients suivent souvent, " +
      "et l'acheteur a payé pour presque rien.",
  ),
  terrain(
    "Anecdote de l'auteur : racheté par l'employeur que je venais de quitter",
    "En 2021, j'étais consultant à la STM pour Cofomo, une firme québécoise de conseil " +
      "et de placement en TI. J'ai quitté Cofomo pour Nexio, une firme concurrente, qui " +
      "m'a placé chez Hydro-Québec. Le 21 septembre 2021, Cofomo annonçait l'arrivée de " +
      "Nexio dans son groupe. Le communiqué parlait de **partenariat** ; il s'agissait " +
      "bien d'une **acquisition**. Sans changer de bureau, je me retrouvais chez " +
      "l'employeur que je venais de quitter. Dans une firme de placement, ce qu'on " +
      "achète, ce sont les consultants et leurs mandats chez les clients. Pour l'acheteur, " +
      "la vraie question commence après la signature : ces consultants, dont certains " +
      "étaient partis de chez lui, vont-ils rester ?",
  ),

  titre("Infosystem : acheter, ou être achetée"),
  p(
    "La première édition du livre évoquait des offres publiques d'achat et des " +
      "désinvestissements. Ces outils de grandes sociétés ne conviennent pas à une PME de " +
      "treize personnes. Deux pistes restent réalistes.",
  ),
  liste(
    "**Racheter une petite firme locale** dont le propriétaire part à la retraite. " +
      "Infosystem y gagnerait des clients et, surtout, des techniciens formés, ce qui " +
      "répond directement à son enjeu central. La condition : que ces techniciens " +
      "veuillent rester.",
    "**Être rachetée** par une firme plus grande. C'est l'une des issues possibles de la " +
      "relève de Justin. Elle lui assurerait une sortie, mais pourrait effacer la " +
      "proximité qui fait la valeur d'Infosystem pour ses clients.",
  ),
  p(
    "Dans les deux cas, la question n'est pas d'abord financière. Elle porte sur les " +
      "personnes : qui reste, sous quelle culture, et pour servir quels clients.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une chaîne de pharmacies a racheté un concurrent l'an dernier, et l'opération " +
      "déçoit. Quelle cause chaque symptôme révèle-t-il ?",
    categories: [
      "Prix trop élevé",
      "Synergies surestimées",
      "Choc des cultures",
      "Départ des personnes clés",
    ],
    elements: [
      {
        texte: "Les remboursements de la dette dépassent les profits de la pharmacie achetée.",
        categorie: 0,
        explication: "Le prix payé ne peut pas être remboursé par l'activité.",
      },
      {
        texte: "Les achats groupés promis n'ont pas fait baisser les prix des fournisseurs.",
        categorie: 1,
        explication: "L'économie prévue n'est pas venue.",
      },
      {
        texte: "Les équipes refusent les nouvelles procédures et parlent de « l'autre maison ».",
        categorie: 2,
        explication: "Deux façons de travailler se heurtent.",
      },
      {
        texte: "Les deux pharmaciens les plus appréciés ont ouvert leur propre officine.",
        categorie: 3,
        explication: "Ceux qui portaient la clientèle sont partis.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Infosystem envisage de racheter une petite firme dont le propriétaire part à la " +
      "retraite. Quelle vérification compte le plus avant de signer ?",
    choix: [
      {
        texte: "Le nombre de postes informatiques dans les locaux de la firme.",
        explication: "Utile, mais secondaire.",
      },
      {
        texte: "L'intention des techniciens de rester après la vente.",
        explication: "Oui : ce sont eux qui font la valeur, et qui retiennent les clients.",
      },
      {
        texte: "La possibilité de lancer une offre publique d'achat.",
        explication: "C'est un outil de grande société cotée, sans rapport ici.",
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
        texte: "L'acquisition est le mode de croissance le plus rapide.",
        vrai: true,
        explication: "Elle apporte d'un coup ce qui prendrait des années à construire.",
      },
      {
        texte: "Une acquisition est réussie dès que le contrat est signé.",
        vrai: false,
        explication: "Elle se joue dans l'intégration qui suit.",
      },
      {
        texte: "Une acquisition hostile se fait contre l'avis des dirigeants de la cible.",
        vrai: true,
        explication: "L'acheteur s'adresse alors directement aux actionnaires.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Votre organisation pourrait-elle croître par acquisition ? Décrivez une cible " +
      "possible, ce que vous achèteriez vraiment, et les trois risques que vous " +
      "surveilleriez en premier.",
    corrige: [
      "Une cible réaliste, à la mesure des moyens de l'organisation.",
      "Ce qui fait vraiment sa valeur : clients, personnes, savoir-faire, marque.",
      "Trois risques tirés des causes d'échec, appliqués au cas.",
      "Une mesure concrète pour garder les personnes clés.",
    ],
  }),

  appliquez(
    7,
    "Si une acquisition figure parmi vos options de l'étape 7, évaluez sa faisabilité " +
      "avec prudence : prix, financement et rétention des personnes clés.",
  ),
  fiche(
    "L'acquisition est rapide, mais c'est le mode le plus risqué.",
    "Causes d'échec : prix, synergies, cultures, départs, intégration négligée.",
    "On achète des personnes et des relations : il faut les garder.",
    "Trois temps : vérifier, signer à un prix remboursable, intégrer.",
    "Infosystem : racheter une petite firme, ou être rachetée comme issue de relève.",
  ),
];
