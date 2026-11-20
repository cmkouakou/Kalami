/**
 * =============================================================
 *  Fichier    : m13-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 13, leçon 2 — « Le cas Ajinomoto Afrique de l'Ouest » : le groupe
 *               et son projet ivoirien, le marché, l'usine et les ventes, les chiffres de
 *               la vente directe, la mission et les questions dans l'ordre de la démarche,
 *               puis l'épilogue (Promasidor en 2016, dissolution en 2021), à lire après
 *               l'analyse. Sources : livre, module 11 et ses annexes (communiqués du
 *               groupe, presse, document interne). Texte et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import {
  appliquez,
  etapes,
  exercice,
  fiche,
  liste,
  notion,
  p,
  piege,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M13_L02: ContenuLecon = [
  p(
    "Infosystem est un cas d'école, construit pour apprendre. Ajinomoto Afrique de l'Ouest " +
      "est un cas réel, que l'auteur de ce cours a connu de l'intérieur. Cette fois, " +
      "l'analyse vous revient : la leçon présente les faits, puis vous confie la mission.",
  ),
  p(
    "Le cas complet, avec ses annexes et un corrigé étape par étape, est aussi proposé " +
      "dans l'assistant : [le cas Ajinomoto](/strategie/cas/ajinomoto).",
  ),

  titre("Le groupe et son projet"),
  liste(
    "**Un groupe japonais centenaire.** Fondé en 1909 autour d'un assaisonnement, le " +
      "glutamate monosodique AJI-NO-MOTO, obtenu par fermentation de la canne à sucre, " +
      "il est présent en 2011 dans 26 pays.",
    "**Un savoir-faire de vente.** En Asie du Sud-Est, le groupe a appris à vendre au " +
      "comptant, directement aux commerçants, par ses propres équipes.",
    "**Une priorité.** Son plan 2011-2013 fait des produits de consommation à l'étranger " +
      "un axe de croissance.",
    "**Une tête de pont.** Au Nigeria, une filiale vend depuis 1991 par des distributeurs " +
      "locaux.",
  ),
  p(
    "En octobre 2011, le groupe annonce une filiale en Côte d'Ivoire. Ses arguments : " +
      "onze pays à couvrir, environ 113 millions d'habitants, des langues et une monnaie " +
      "en partage pour une partie de la zone, des habitudes culinaires proches. Ajinomoto " +
      "Afrique de l'Ouest (AAO) naît en janvier 2012 et importe d'abord le produit fini " +
      "du Nigeria.",
  ),
  tableau(
    ["Repère", "Donnée"],
    [
      ["Usine de reconditionnement", "Yopougon, en service en avril 2013"],
      ["Matière", "Glutamate en vrac importé du Brésil"],
      ["Investissement annoncé", "1,9 milliard de FCFA, 300 tonnes de capacité"],
      ["Effectif", "Environ 60 personnes en 2013, 250 emplois annoncés à terme"],
      ["Objectif de ventes", "Environ 2,5 milliards de yens en 2016"],
    ],
    "Sources : communiqués du groupe et presse économique, 2011 à 2013.",
  ),

  titre("Le marché"),
  p(
    "Les ménages ivoiriens assaisonnent surtout au bouillon cube : environ 30 000 tonnes " +
      "et 90 milliards de FCFA par an vers 2015. Maggi, de Nestlé, en détient près des " +
      "trois quarts, devant Jumbo, Doli, Maxi Goût et des marques régionales. Personne ne " +
      "mesure le marché du glutamate pur.",
  ),
  liste(
    "**Les ménages** en achètent peu. Une rumeur le surnomme le « cube Maggi blanc » et " +
      "prétend qu'il blanchit une marmite noircie.",
    "**Les gros cuisiniers**, restaurateurs et rôtisseurs, l'apprécient, mais l'utilisent " +
      "en cachette.",
    "**Des contrefaçons** circulent, en gros cristaux irréguliers.",
    "**La distribution** passe par des grossistes, des demi-grossistes et des " +
      "détaillantes des marchés. Les grossistes ont un fort pouvoir de négociation.",
  ),

  titre("L'usine réussit, les ventes ne suivent pas"),
  p(
    "La direction est japonaise, les cadres ivoiriens. L'entretien des machines, négligé " +
      "au départ, est repris en main : une démarche de maintenance productive totale " +
      "réduit les pertes de 40 % et place l'usine parmi les dix meilleures des quelque " +
      "120 usines du groupe.",
  ),
  p(
    "Mais les entrepôts se remplissent. Le directeur de l'usine devient directeur " +
      "commercial et réorganise tout : tournées, agences, véhicules, formation. AAO " +
      "contre-attaque la rumeur par une campagne publicitaire, des dépliants qui " +
      "expliquent la fabrication et des équipes sur les marchés. Elle lance AjiGoût, un " +
      "glutamate mélangé à du sel, du poivre et du soumara.",
  ),

  titre("Les chiffres de la vente directe"),
  tableau(
    ["Implantation", "Factures", "Volume (kg)", "Montant (FCFA HT)"],
    [
      ["Agence d'Abidjan", "40 890", "70 033", "102 992 026"],
      ["Agence de Bouaké", "8 971", "21 682", "30 526 634"],
      ["Dépôt de Daloa", "4 987", "11 196", "17 177 006"],
      ["Deux développeurs", "872", "8 415", "12 762 294"],
      ["Total", "55 720", "111 325", "163 457 961"],
    ],
    "Vente directe, avril 2015 à janvier 2016 (dix mois). Document interne d'AAO.",
  ),
  liste(
    "Les ventes mensuelles oscillent entre 14,6 et 18,8 millions de FCFA, sans tendance.",
    "La facture moyenne est d'environ 2 900 FCFA, soit 2 kg, avec 1,1 article.",
    "La facture moyenne des développeurs atteint environ 14 600 FCFA, soit près de 10 kg.",
  ),
  p(
    "Les autres canaux (distributeurs, grossistes, restaurants, export) ne figurent pas " +
      "dans ce tableau. Pendant ce temps, les grossistes invoquent la mauvaise réputation " +
      "du produit pour obtenir de meilleures conditions, et le siège fixe un objectif " +
      "ambitieux pour 2016.",
  ),

  titre("Votre mission"),
  p(
    "Début 2015, la direction régionale demande un diagnostic et une stratégie sur trois " +
      "ans. Tout peut être remis en question, y compris l'idée d'une filiale autonome. " +
      "Menez l'analyse dans l'ordre de la démarche.",
  ),
  etapes(
    "**Macroenvironnement** (module 2) : le PESTEL d'AAO en 2015, deux variables pivots, " +
      "quatre scénarios.",
    "**Concurrence** (module 3) : les cinq forces. Le bouillon cube est-il un concurrent " +
      "ou un substitut du glutamate pur ?",
    "**Interne** (module 4) : la chaîne de valeur, puis le VRIO, en séparant les " +
      "ressources du groupe de celles d'AAO.",
    "**Les chiffres** : annualisez la vente directe et comparez-la à l'objectif, à " +
      "environ 4,9 FCFA pour un yen. Que disent la facture moyenne et la stabilité des " +
      "ventes ?",
    "**Synthèse** (module 5) : la SWOT, la TOWS et trois enjeux.",
    "**Parties prenantes** (module 6) : le siège, la direction régionale, les grossistes, " +
      "les détaillantes, les restaurateurs, les consommatrices, l'État, les concurrents. " +
      "Qui a été le plus négligé ?",
    "**Cap** (module 7) : une vision et une mission. À qui s'adresser d'abord ?",
    "**Choix** (module 12) : au moins quatre options sur les trois critères, par exemple " +
      "viser les restaurateurs, traiter d'abord la réputation, multiplier les produits " +
      "mélangés, passer par un distributeur régional, réduire la zone visée.",
    "**Action** (module 12) : une feuille de route sur trois ans et un tableau de bord " +
      "équilibré.",
  ),
  p(
    "**La question centrale** : chargé de la stratégie d'AAO, qu'auriez-vous fait pour " +
      "éviter l'échec ? Répondez par un plan de cinq pages, selon le modèle de la leçon " +
      "précédente.",
  ),
  piege(
    "Commencer par les solutions. Le problème d'AAO tenait-il au prix, au produit, à la " +
      "distribution ou à la confiance ? Une action bien menée sur le mauvais problème " +
      "peut réussir et ne rien changer.",
  ),

  titre("Exercices"),
  exercice({
    type: "qcm",
    id: "e1",
    question:
      "Sur douze mois, la vente directe atteindrait environ 196 millions de FCFA. " +
      "L'objectif de 2016 vaut environ 12,25 milliards de FCFA. Quelle part en " +
      "représente-t-elle ?",
    choix: [
      {
        texte: "Environ 16 %.",
        explication: "Erreur d'un facteur dix : 0,196 ÷ 12,25 donne 0,016.",
      },
      {
        texte: "Environ 1,6 %.",
        explication: "Oui : ce canal, à ce rythme et sans croissance, en est très loin.",
      },
      {
        texte: "Environ 0,16 %.",
        explication: "Erreur d'un facteur dix dans l'autre sens.",
      },
    ],
    bonne: 1,
  }),
  exercice({
    type: "classement",
    id: "e2",
    consigne: "Dans la SWOT d'AAO, où ranger chacun de ces faits ?",
    categories: ["Force", "Faiblesse", "Opportunité", "Menace"],
    elements: [
      {
        texte: "Une usine parmi les dix plus performantes du groupe.",
        categorie: 0,
        explication: "Une capacité interne, démontrée.",
      },
      {
        texte: "Des ventes directes faites de petites factures, sans croissance.",
        categorie: 1,
        explication: "Un modèle de vente interne qui ne décolle pas.",
      },
      {
        texte: "Des restaurateurs qui apprécient le produit et l'utilisent déjà.",
        categorie: 2,
        explication: "Une demande réelle, dans l'environnement, encore cachée.",
      },
      {
        texte: "Une rumeur tenace et des contrefaçons sur les marchés.",
        categorie: 3,
        explication: "Des facteurs externes qui détruisent la confiance.",
      },
    ],
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "L'objectif de 2016 reposait sur une mesure du marché du glutamate pur.",
        vrai: false,
        explication: "Aucune statistique publique n'existait sur ce marché.",
      },
      {
        texte: "La réussite de l'usine prouvait que la filiale avait trouvé son marché.",
        vrai: false,
        explication: "Une production efficace peut masquer un produit qui ne se vend pas.",
      },
      {
        texte: "La facture des développeurs suggère que des acheteurs en volume existent.",
        vrai: true,
        explication: "Près de 10 kg par facture, cinq fois la moyenne.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Répondez à la question centrale en une page : le vrai problème d'AAO, la stratégie " +
      "que vous auriez retenue, ce à quoi vous auriez renoncé, et les trois premiers " +
      "chantiers.",
    corrige: [
      "Un problème principal nommé et justifié par les faits du cas.",
      "Une stratégie qui choisit un client prioritaire et un canal.",
      "Au moins un renoncement explicite, par exemple sur la zone ou sur les produits.",
      "Trois chantiers avec un responsable, une échéance et un indicateur.",
    ],
  }),

  notion(
    "Épilogue : à lire une fois votre analyse terminée",
    p(
      "En novembre 2016, Ajinomoto achète un tiers de Promasidor Holdings, un fabricant " +
        "d'aliments présent dans 36 pays africains, pour 532 millions de dollars. Le " +
        "groupe veut associer son savoir-faire de fabrication au réseau de distribution de " +
        "son partenaire, et étudie le rapprochement de ses activités nigérianes.",
    ),
    p(
      "Le 1er octobre 2021, les actionnaires d'AAO décident sa dissolution anticipée et sa " +
        "liquidation amiable. L'avis paraît le 11 novembre 2021. L'histoire officielle du " +
        "groupe en Europe et en Afrique mentionne désormais la filiale ivoirienne comme " +
        "fermée en 2021.",
    ),
    p(
      "Les causes exactes n'ont pas été rendues publiques, et elles sont sans doute " +
        "multiples. Deux questions demeurent. En 2016, le groupe a préféré entrer en " +
        "Afrique par un acteur déjà doté d'un réseau, plutôt que de bâtir le sien filiale " +
        "par filiale : ce choix est-il cohérent avec votre analyse ? Et que fallait-il " +
        "faire dès 2012 pour que la question ne se pose pas ?",
    ),
  ),

  appliquez(
    9,
    "Revenez ensuite à votre propre plan, à l'étape 9 : son problème principal est-il " +
      "nommé, et vos chantiers s'y attaquent-ils vraiment ?",
  ),
  fiche(
    "AAO : une usine performante, un produit qui ne se vendait pas.",
    "Le marché du glutamate pur n'avait jamais été mesuré.",
    "La rumeur et la contrefaçon touchaient d'abord la confiance.",
    "La vente directe valait environ 1,6 % de l'objectif du siège.",
    "Choisir le bon problème avant de choisir la solution.",
  ),
];
