/**
 * =============================================================
 *  Fichier    : m11-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 11, leçon 3 — « Alliances, partenariats et coentreprises » : les
 *               formes de collaboration (accord, alliance, coentreprise, consortium,
 *               licence, franchise, impartition), pourquoi s'allier, les risques, les
 *               clés d'une alliance qui dure, les deux alliances d'Infosystem. Sources :
 *               livre, module 8 (§ 8.4). Texte, exemples et exercices originaux.
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
