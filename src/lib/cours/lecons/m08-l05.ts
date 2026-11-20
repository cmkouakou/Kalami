/**
 * =============================================================
 *  Fichier    : m08-l05.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 8, leçon 5 — « Le modèle d'affaires » : créer, livrer et capter la
 *               valeur, le canevas en neuf blocs, le modèle d'Infosystem avant et après le
 *               forfait mensuel par poste, la cohérence entre stratégie et modèle.
 *               Sources : livre, modules 3, 8 et 10 (§ 8.6, forfait par poste) ; Osterwalder
 *               et Pigneur, 2010. Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
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
  schema,
  tableau,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M08_L05: ContenuLecon = [
  p(
    "Deux entreprises peuvent viser la même position sur la grille de Porter et gagner leur " +
      "argent de façon très différente. L'une vend à l'unité, l'autre par abonnement ; " +
      "l'une possède ses camions, l'autre les loue. Ces choix forment le modèle " +
      "d'affaires : la mécanique qui transforme une stratégie en revenus.",
  ),

  titre("Créer, livrer, capter"),
  definition(
    "Modèle d'affaires",
    "La manière dont une organisation **crée** de la valeur pour ses clients, la leur " +
      "**livre**, et en **capte** une partie sous forme de revenus supérieurs à ses coûts.",
  ),
  liste(
    "**Créer** : quel problème résout-on, pour qui ?",
    "**Livrer** : par quels canaux, avec quelle relation, grâce à quelles activités et " +
      "ressources ?",
    "**Capter** : qui paie, combien, quand, et pour quels coûts ?",
  ),
  p(
    "La stratégie concurrentielle dit **où** l'entreprise se place. Le modèle d'affaires " +
      "dit **comment** elle en vit. Une bonne position avec un mauvais modèle s'épuise : " +
      "les clients sont satisfaits, mais l'argent ne rentre pas au bon rythme.",
  ),

  titre("Le canevas en neuf blocs"),
  p(
    "Alexander Osterwalder et Yves Pigneur ont proposé en 2010 un canevas qui tient sur " +
      "une page. Au centre, la proposition de valeur. À droite, tout ce qui touche le " +
      "client. À gauche, tout ce qu'il faut pour produire. En bas, l'argent.",
  ),
  schema(
    "canevas-modele",
    "Le canevas du modèle d'affaires : partenaires, activités et ressources clés à gauche ; " +
      "la proposition de valeur au centre ; relation client, canaux et segments à droite ; " +
      "structure de coûts et sources de revenus en bas.",
  ),
  retenir(
    "Un canevas se lit en lignes, pas en cases isolées : chaque bloc doit servir la " +
      "proposition de valeur, et le bas du canevas doit montrer que l'ensemble rapporte " +
      "plus qu'il ne coûte.",
  ),

  titre("Le modèle d'Infosystem, avant et après"),
  p(
    "Infosystem vend aujourd'hui une partie de ses services par contrats à prix fixe, " +
      "dont les marges se compriment avec la hausse du coût du matériel et des licences. " +
      "Pour le soutien courant, le livre propose de passer à un **forfait mensuel par poste " +
      "de travail**.",
  ),
  tableau(
    ["Bloc", "Aujourd'hui", "Avec le forfait par poste"],
    [
      ["Proposition de valeur", "Dépanner vite", "L'esprit tranquille, sans surprise de prix"],
      ["Relation client", "Appel quand ça casse", "Suivi régulier, bilans de sécurité"],
      ["Revenus", "Mandats et contrats à prix fixe", "Revenus récurrents, prévisibles"],
      ["Activités clés", "Intervention", "Prévention, documentation, intervention"],
      ["Ressources clés", "Savoirs dans la tête des seniors", "Base de connaissances commune"],
    ],
  ),
  p(
    "Le changement profite à trois parties. Les clients savent ce qu'ils paient et " +
      "comparent facilement. Infosystem lisse ses revenus et peut planifier ses " +
      "embauches. Un éventuel repreneur, enfin, valorise mieux des revenus récurrents que " +
      "des mandats ponctuels : le modèle d'affaires sert aussi la question de la relève.",
  ),
  piege(
    "Changer de modèle de revenus sans changer le reste. Un forfait par poste incite " +
      "Infosystem à prévenir les pannes plutôt qu'à les réparer : si les activités et la " +
      "relation client ne suivent pas, le forfait devient une perte sur les clients les " +
      "plus difficiles.",
  ),

  notion(
    "Pour aller plus loin : quelques modèles de revenus",
    tableau(
      ["Modèle", "Principe", "Exemple"],
      [
        ["Vente à l'unité", "Le client paie chaque achat", "Une boutique de pièces auto"],
        ["Abonnement", "Un montant fixe par période", "Un forfait de téléphonie"],
        ["Paiement à l'usage", "Le client paie ce qu'il consomme", "Le crédit de communication"],
        ["Commission", "Un pourcentage sur chaque transaction", "Un service de Mobile Money"],
        ["Gratuit et payant", "Une base gratuite, des options payantes", "Une application"],
      ],
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une coopérative de transformation de manioc à Daloa décrit son modèle. Rangez " +
      "chaque élément dans la partie du modèle qu'il décrit.",
    categories: ["Créer la valeur", "Livrer la valeur", "Capter la valeur"],
    elements: [
      {
        texte: "Un attiéké frais, sans sable, qui se conserve trois jours.",
        categorie: 0,
        explication: "La proposition de valeur : ce que le client y gagne.",
      },
      {
        texte: "Des livraisons quotidiennes aux restaurants par tricycle.",
        categorie: 1,
        explication: "Un canal et une activité qui portent la valeur jusqu'au client.",
      },
      {
        texte: "Un paiement à la semaine par Mobile Money.",
        categorie: 2,
        explication: "Une source de revenus et son rythme.",
      },
      {
        texte: "Le coût du manioc acheté aux planteurs voisins.",
        categorie: 2,
        explication: "La structure de coûts fait partie de la captation de valeur.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Pourquoi un repreneur paierait-il plus cher une Infosystem payée au forfait mensuel " +
      "qu'une Infosystem payée au mandat ?",
    choix: [
      {
        texte: "Parce que les forfaits sont toujours plus rentables que les mandats.",
        explication: "Pas forcément : un forfait mal calculé peut perdre de l'argent.",
      },
      {
        texte: "Parce que des revenus récurrents sont plus prévisibles, donc moins risqués.",
        explication: "Oui : l'acheteur paie pour des revenus futurs qu'il peut anticiper.",
      },
      {
        texte: "Parce que le forfait réduit le nombre de clients à servir.",
        explication: "Le nombre de clients ne change pas avec le mode de facturation.",
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
        texte: "Deux concurrents qui visent la même stratégie générique ont forcément le " +
          "même modèle d'affaires.",
        vrai: false,
        explication: "Ils peuvent gagner leur argent de façons très différentes.",
      },
      {
        texte: "Un modèle d'affaires doit montrer que les revenus dépassent les coûts.",
        vrai: true,
        explication: "C'est le rôle du bas du canevas : capter la valeur créée.",
      },
      {
        texte: "Changer de modèle de revenus n'oblige à rien changer d'autre.",
        vrai: false,
        explication: "Le forfait d'Infosystem exige plus de prévention et de documentation.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Remplissez les neuf blocs du canevas pour votre organisation. Puis nommez un " +
      "changement de modèle qui renforcerait votre stratégie générique.",
    corrige: [
      "Neuf blocs remplis avec des éléments concrets, pas des généralités.",
      "Une proposition de valeur qui reprend la différence de la leçon 8.3.",
      "Une ligne de revenus et une ligne de coûts réalistes, même approximatives.",
      "Un changement de modèle relié à la position visée, avec ses effets sur les autres blocs.",
    ],
  }),

  appliquez(
    7,
    "Si votre modèle d'affaires doit changer, inscrivez ce changement comme une option " +
      "à évaluer dans l'étape 7.",
  ),
  fiche(
    "Le modèle d'affaires : créer, livrer et capter la valeur.",
    "Le canevas tient sur une page : neuf blocs autour de la proposition de valeur.",
    "Stratégie : où se placer. Modèle d'affaires : comment en vivre.",
    "Infosystem : passer au forfait mensuel par poste pour le soutien courant.",
    "Changer de revenus oblige à changer les activités et la relation client.",
  ),
];
