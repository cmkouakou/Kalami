/**
 * =============================================================
 *  Fichier    : m11-l01.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 11, leçon 1 — « Croître seul : la croissance interne » : les trois
 *               modes de croissance, la croissance interne, ses atouts et ses limites,
 *               quand la préférer, le goulot humain, le chemin d'Infosystem (former,
 *               structurer, documenter). Sources : livre, module 8 (§ 8.4). Texte,
 *               exemples et exercices originaux.
 *               v1.1 : exemples réels au Québec et en Côte d'Ivoire, sources citées
 *               (Simons, Orange Money, Ubisoft Montréal, CME de la CIE).
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
  schema,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M11_L01: ContenuLecon = [
  p(
    "La matrice d'Ansoff dit **où** croître. Reste à savoir **comment** y aller. Une " +
      "entreprise peut construire elle-même ce dont elle a besoin, s'associer à d'autres, " +
      "ou acheter une entreprise qui l'a déjà. Ce sont les trois modes de croissance, et " +
      "le module 11 les examine l'un après l'autre.",
  ),
  schema(
    "modes-croissance",
    "Trois modes de croissance : la croissance interne, lente mais avec un contrôle total ; " +
      "l'alliance, qui partage sans fusionner ; la fusion ou acquisition, rapide et " +
      "risquée. De gauche à droite, la vitesse et le risque d'intégration augmentent ; de " +
      "droite à gauche, le contrôle et la préservation de la culture augmentent.",
  ),

  titre("La croissance interne"),
  definition(
    "Croissance interne (organique)",
    "La croissance par les moyens propres de l'entreprise : embaucher, former, investir, " +
      "développer de nouveaux services ou ouvrir de nouveaux sites, sans racheter ni " +
      "s'associer.",
  ),
  tableau(
    ["Atouts", "Limites"],
    [
      ["Le contrôle reste entier", "C'est lent : tout se construit pas à pas"],
      ["La culture se transmet aux nouveaux", "La croissance dépend des ressources propres"],
      ["On apprend en faisant, et on garde ce savoir", "On peut rater le moment du marché"],
      ["L'investissement se fait par étapes", "Il faut tout apprendre soi-même"],
    ],
  ),
  retenir(
    "La croissance interne échange de la vitesse contre de la maîtrise. Elle convient " +
      "quand le temps n'est pas l'ennemi et quand ce qu'il faut construire se construit " +
      "mieux de l'intérieur.",
  ),

  titre("Quand la préférer"),
  liste(
    "**Le savoir-faire se transmet mal** : il vit dans les gestes et les relations, et " +
      "aucun rachat ne l'apporte tout fait.",
    "**La culture est un atout** : ce qui distingue l'entreprise risquerait de se diluer " +
      "dans un rapprochement.",
    "**Le marché laisse du temps** : aucun concurrent ne va prendre la place en quelques " +
      "mois.",
    "**Les moyens sont limités** : investir par petites étapes évite de tout engager " +
      "d'un coup.",
  ),

  titre("Le goulot humain"),
  p(
    "Dans une entreprise de services, la croissance interne bute sur un goulot simple : " +
      "les personnes. On ne vend pas plus d'heures que l'équipe n'en a. Embaucher prend " +
      "du temps, former en prend davantage, et un technicien qui part emporte avec lui " +
      "des mois d'apprentissage. La vitesse de croissance est celle à laquelle " +
      "l'entreprise sait accueillir, former et garder.",
  ),
  piege(
    "Planifier la croissance sur les ventes plutôt que sur l'équipe. Gagner des clients " +
      "que l'on ne peut pas servir dégrade le service, épuise les plus anciens et " +
      "provoque les départs qui freineront la suite.",
  ),

  titre("Des exemples au Québec et en Côte d'Ivoire"),
  p(
    "La croissance interne n'est pas réservée aux petites entreprises. Voici deux " +
      "situations, chacune illustrée au Québec et en Côte d'Ivoire : ouvrir de " +
      "nouveaux marchés par ses propres moyens, puis lever le goulot humain en formant " +
      "soi-même ses gens. La source est indiquée sous chaque exemple.",
  ),
  notion(
    "Grandir par ses propres magasins et ses propres services : Simons ; Orange Money",
    p(
      "**Québec.** La Maison Simons, entreprise familiale de la ville de Québec, a " +
        "longtemps vendu seulement au Québec. Pour s'étendre au reste du Canada, elle " +
        "n'a racheté aucun détaillant : elle a ouvert son propre magasin au West " +
        "Edmonton Mall, le 31 octobre 2012, son premier hors du Québec. Les nouveaux " +
        "magasins ont suivi un à un. C'est lent et coûteux, mais l'enseigne, le " +
        "style et la culture de la maison restent intacts. Sources : [communiqué de " +
        "Simons, octobre 2012](https://newswire.ca/news-releases/simons-to-open-at-" +
        "west-edmonton-mall-on-october-31-2012-511057331.html) ; [L'Encyclopédie " +
        "canadienne](https://thecanadianencyclopedia.ca/en/article/la-maison-simons).",
    ),
    p(
      "**Côte d'Ivoire.** Le 6 décembre 2008, Orange Côte d'Ivoire a lancé **Orange " +
        "Money**, le paiement et le transfert d'argent par téléphone. La Côte d'Ivoire " +
        "était le premier pays du groupe Orange à recevoir ce service. L'opérateur n'a " +
        "pas acheté de société de paiement : il a développé un nouveau service pour ses " +
        "propres abonnés. Une nuance utile : la loi exige une banque pour émettre la " +
        "monnaie électronique, et c'est la BICICI (groupe BNP Paribas) qui a tenu ce " +
        "rôle. Une croissance interne peut s'appuyer sur un partenaire là où la règle " +
        "l'impose. Sources : [communiqué de BNP Paribas]" +
        "(https://group.bnpparibas/communique-de-presse/orange-lance-partenariat-bnp-" +
        "paribas-orange-money-cote-ivoire-premier-service-paiement-transfert-argent-" +
        "telephone-mobile-afrique-ouest) ; [Abidjan.net, 2009]" +
        "(https://news.abidjan.net/articles/336319/orange-money-transactions-et-" +
        "operations-courantes-de-type-bancaire).",
    ),
  ),
  notion(
    "Former ses gens soi-même : Ubisoft Montréal ; le Centre des métiers de l'électricité",
    p(
      "**Québec.** Ubisoft n'a pas acheté de studio pour s'installer à Montréal : il " +
        "en a créé un, en 1997, avec une cinquantaine de personnes, dont la moitié " +
        "venait du siège en France pour transmettre le métier. Le studio comptait " +
        "environ 1 600 employés en 2007, plus de 3 000 en 2013 et plus de 4 000 en " +
        "2023. Pour grandir aussi vite sans perdre la qualité, il a dû recruter et " +
        "former sans arrêt : le goulot était humain, pas financier. Sources : " +
        "[Wikipédia, Ubisoft Montréal](https://en.wikipedia.org/wiki/Ubisoft_Montreal) ; " +
        "[MobileSyrup, 2023](https://mobilesyrup.com/2023/10/17/ubisoft-vice-president-" +
        "interview-25-years-in-canada/).",
    ),
    p(
      "**Côte d'Ivoire.** Des électriciens qualifiés ne s'achètent pas sur le marché. " +
        "La CIE a donc son propre établissement de formation, le **Centre des métiers " +
        "de l'électricité** (CME) de Bingerville, créé en 1970. Il prépare des BTS " +
        "(électrotechnique, maintenance industrielle) et forme aussi les agents en " +
        "poste, ainsi que ceux d'autres compagnies de la sous-région. Le savoir-faire " +
        "se construit de l'intérieur et reste dans la maison. Sources : [Financial " +
        "Afrik, 3 décembre 2018](https://financialafrik.com/2018/12/03/cote-divoire-" +
        "le-centre-des-metiers-de-lelectricite-cme-obtient-98-de-reussite-au-bts-" +
        "electrotechnique-2018) ; [Abidjan.net, formation de 120 agents]" +
        "(https://news.abidjan.net/articles/683194/electricite-renforcement-des-" +
        "capacites-a-abidjan-de-120-personnes-dont-14-guineens).",
    ),
  ),

  titre("Le chemin d'Infosystem"),
  p(
    "La croissance interne est la voie principale d'Infosystem. Elle répond à son enjeu " +
      "central, le manque de techniciens, et protège ce qui la distingue : la proximité " +
      "et la confiance des clients. Trois chantiers la portent.",
  ),
  etapes(
    "**Former les jeunes techniciens** à la sécurité et à l'infonuagique, pour qu'ils " +
      "prennent une part du travail des seniors.",
    "**Structurer une offre de conformité**, vendue d'abord aux clients actuels.",
    "**Documenter le savoir** dans une base de connaissances, pour que l'entreprise " +
      "dépende moins de quelques personnes.",
  ),
  p(
    "L'ordre compte. Former et documenter libèrent du temps ; ce temps permet de vendre " +
      "la nouvelle offre ; et c'est seulement ensuite que l'entreprise pourra accueillir " +
      "de nouveaux clients.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Ces projets relèvent-ils de la croissance interne ou d'un autre mode ?",
    categories: ["Croissance interne", "Autre mode"],
    elements: [
      {
        texte: "Une boulangerie qui forme deux apprentis et ouvre un second comptoir.",
        categorie: 0,
        explication: "Elle grandit par ses propres moyens.",
      },
      {
        texte: "Une agence de voyages qui rachète une agence concurrente.",
        categorie: 1,
        explication: "C'est une acquisition.",
      },
      {
        texte: "Un cabinet comptable qui crée un service de paie avec ses propres employés.",
        categorie: 0,
        explication: "Nouveau service, construit de l'intérieur.",
      },
      {
        texte: "Une transporteuse qui signe un accord de partage de camions avec une autre.",
        categorie: 1,
        explication: "C'est une alliance.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Une firme de services gagne trois gros contrats d'un coup, sans avoir embauché. " +
      "Quel risque guette sa croissance interne ?",
    choix: [
      {
        texte: "Aucun : plus de contrats, c'est plus de croissance.",
        explication: "Encore faut-il pouvoir servir ces clients.",
      },
      {
        texte: "Un service dégradé et l'épuisement de l'équipe, qui provoque des départs.",
        explication: "Oui : le goulot est humain, et il se resserre.",
      },
      {
        texte: "Une perte de contrôle sur sa culture.",
        explication: "C'est plutôt le risque d'une acquisition.",
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
        texte: "La croissance interne est le mode le plus rapide.",
        vrai: false,
        explication: "C'est le plus lent : tout se construit pas à pas.",
      },
      {
        texte: "Elle protège mieux la culture que les autres modes.",
        vrai: true,
        explication: "Les nouveaux entrent dans une culture existante, sans la diluer.",
      },
      {
        texte: "Dans les services, la vitesse de croissance dépend surtout de l'équipe.",
        vrai: true,
        explication: "On ne vend pas plus d'heures que l'équipe n'en a.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Quelles options de votre plan peuvent se réaliser par croissance interne ? Pour " +
      "chacune, nommez la ressource qui limitera la vitesse et comment vous la " +
      "développerez.",
    corrige: [
      "Des options précises, reliées aux directions choisies au module 9.",
      "La ressource limitante nommée : personnes, argent, savoir-faire, temps.",
      "Un moyen concret de la développer, avec un ordre réaliste.",
      "Une raison de préférer la croissance interne aux deux autres modes.",
    ],
  }),

  appliquez(
    7,
    "Pour chaque option de l'étape 7, notez dans le commentaire le mode de croissance " +
      "envisagé : interne, alliance ou acquisition.",
  ),
  fiche(
    "Trois modes : croissance interne, alliance, fusion ou acquisition.",
    "La croissance interne échange de la vitesse contre de la maîtrise.",
    "Elle convient quand le savoir-faire se transmet mal et que le marché laisse du temps.",
    "Dans les services, le goulot est humain.",
    "Infosystem : former, structurer l'offre de conformité, documenter.",
  ),
];
