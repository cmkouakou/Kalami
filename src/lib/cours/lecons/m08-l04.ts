/**
 * =============================================================
 *  Fichier    : m08-l04.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 8, leçon 4 — « L'horloge stratégique » : prix et valeur perçue
 *               autour d'une offre de référence, les positions (prix, épuration, hybride,
 *               différenciation, sophistication), la zone non viable et la dérive vers
 *               elle, Infosystem sur l'horloge. Sources : programme du cours HEC (notions),
 *               Bowman et Faulkner, 1997. Texte, exemples et exercices originaux.
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

export const M08_L04: ContenuLecon = [
  p(
    "La grille de Porter oblige à choisir, mais elle reste vue d'en haut. L'horloge " +
      "stratégique, proposée par Cliff Bowman et David Faulkner, se place du côté du " +
      "client qui compare deux offres sur un étal. Elle ne pose que deux questions : " +
      "combien ça coûte, et combien ça vaut à mes yeux ?",
  ),

  titre("Deux axes et un point de repère"),
  definition(
    "Offre de référence",
    "L'offre moyenne d'un marché : un prix moyen pour une valeur perçue moyenne. Toutes " +
      "les autres offres se lisent par rapport à elle : plus ou moins chères, plus ou " +
      "moins appréciées.",
  ),
  schema(
    "horloge-strategique",
    "L'horloge stratégique : le prix en abscisse, la valeur perçue en ordonnée, l'offre de " +
      "référence au centre. Autour d'elle, l'épuration, le prix, l'hybride, la " +
      "différenciation et la sophistication. En bas à droite, la zone non viable : moins de " +
      "valeur pour plus cher.",
  ),
  tableau(
    ["Position", "Prix", "Valeur perçue", "Qui la choisit"],
    [
      ["Épuration", "Très bas", "Réduite à l'essentiel", "Le client qui veut le minimum"],
      ["Prix", "Plus bas", "Égale", "Le client qui compare les prix"],
      ["Hybride", "Moyen ou bas", "Plus élevée", "Le client qui veut une bonne affaire"],
      ["Différenciation", "Égal ou plus élevé", "Plus élevée", "Le client qui veut mieux"],
      ["Sophistication", "Élevé", "Très élevée", "Le client qui veut le meilleur"],
    ],
  ),
  p(
    "On retrouve les logiques de Porter : l'épuration et le prix reposent sur les coûts, " +
      "la différenciation et la sophistication sur la valeur. L'horloge ajoute la position " +
      "hybride, qui offre plus pour moins cher. Elle est tenable seulement si l'entreprise " +
      "a des coûts nettement plus bas, sinon elle détruit sa propre marge.",
  ),

  titre("La zone non viable, et comment on y tombe"),
  p(
    "Personne ne choisit de vendre moins bien plus cher. Pourtant, des entreprises s'y " +
      "retrouvent. La position sur l'horloge est **relative** : elle dépend des offres des " +
      "concurrents. Si les rivaux améliorent leur offre pendant que l'entreprise reste " +
      "immobile, sa valeur perçue baisse sans qu'elle ait rien changé.",
  ),
  p(
    "Imaginez une marque de téléphones haut de gamme admirée pour une fonction unique. " +
      "Ses concurrents l'intègrent à leur tour, à un prix plus bas, et ajoutent des " +
      "fonctions qu'elle n'a pas. Elle garde ses prix par habitude. En trois ans, elle " +
      "glisse de la sophistication vers la zone non viable, sans avoir pris une seule " +
      "mauvaise décision visible.",
  ),
  retenir(
    "L'horloge se relit chaque année : la position d'une offre bouge quand les rivaux " +
      "bougent, même si l'entreprise ne fait rien.",
  ),
  piege(
    "Mesurer la valeur perçue avec ses propres yeux. C'est le client qui place l'offre " +
      "sur l'axe vertical, en la comparant à celles qu'il connaît, pas l'équipe qui l'a " +
      "conçue.",
  ),

  titre("Infosystem sur l'horloge"),
  p(
    "L'offre de référence, sur le marché d'Infosystem, est celle d'une firme régionale de " +
      "taille moyenne : un forfait mensuel de soutien, au prix du marché. Infosystem vise " +
      "la **différenciation** : un prix égal ou un peu plus élevé, pour une valeur perçue " +
      "plus forte grâce à la proximité et à l'expertise en sécurité.",
  ),
  p(
    "La menace est celle de la dérive. L'IA va faire baisser le prix et améliorer la " +
      "qualité du soutien de base offert par les grandes firmes. Si Infosystem ne " +
      "construit pas son expertise, son offre glissera vers la zone non viable : aussi " +
      "chère qu'aujourd'hui, mais moins valorisée qu'une offre automatisée moins coûteuse.",
  ),
  notion(
    "Pour aller plus loin : les positions vouées à l'échec",
    p(
      "Dans la version complète de l'horloge, trois positions sont réputées vouées à " +
        "l'échec : augmenter le prix sans ajouter de valeur, baisser la valeur sans baisser " +
        "le prix, et faire les deux à la fois. Elles ne tiennent que sur un marché sans " +
        "concurrence réelle, par exemple en situation de monopole.",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une ville compte plusieurs restaurants. L'offre de référence est un maquis au prix " +
      "et au service moyens. Placez chaque restaurant sur l'horloge.",
    categories: ["Épuration", "Prix", "Hybride", "Sophistication"],
    elements: [
      {
        texte: "Un comptoir de rue : un seul plat, sans chaises, très bon marché.",
        categorie: 0,
        explication: "L'essentiel seulement, au prix le plus bas.",
      },
      {
        texte: "Un maquis semblable aux autres, mais 15 % moins cher.",
        categorie: 1,
        explication: "Même valeur, prix plus bas.",
      },
      {
        texte: "Un restaurant aux plats plus soignés que la moyenne, au prix d'un maquis.",
        categorie: 2,
        explication: "Plus de valeur pour un prix moyen : tenable seulement avec des coûts bas.",
      },
      {
        texte: "Une table gastronomique avec un chef réputé, prix trois fois plus élevés.",
        categorie: 3,
        explication: "Valeur et prix très élevés.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Une entreprise n'a rien changé à son offre depuis quatre ans, mais ses ventes " +
      "chutent. Que suggère l'horloge stratégique ?",
    choix: [
      {
        texte: "Que ses clients sont devenus moins exigeants.",
        explication: "Au contraire : ils comparent avec des offres qui se sont améliorées.",
      },
      {
        texte: "Que les rivaux ont bougé et que sa valeur perçue relative a baissé.",
        explication: "Oui : la position est relative, elle dérive quand les autres avancent.",
      },
      {
        texte: "Qu'elle doit simplement baisser ses prix de moitié.",
        explication: "Peut-être une option, mais il faut d'abord comprendre le déplacement.",
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
        texte: "La position hybride est tenable sans avoir des coûts plus bas.",
        vrai: false,
        explication: "Offrir plus pour moins cher sans coûts plus bas détruit la marge.",
      },
      {
        texte: "C'est le client qui place une offre sur l'axe de la valeur perçue.",
        vrai: true,
        explication: "La valeur est perçue, donc jugée par le client.",
      },
      {
        texte: "Une entreprise ne tombe dans la zone non viable que par une mauvaise décision.",
        vrai: false,
        explication: "Elle peut y glisser par simple immobilité face à des rivaux qui progressent.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Décrivez l'offre de référence de votre marché. Placez votre offre sur l'horloge, " +
      "puis dites ce qui pourrait la faire dériver dans les trois prochaines années.",
    corrige: [
      "Une offre de référence concrète : un concurrent ou un type d'offre identifiable.",
      "Une position justifiée par le prix et par la valeur perçue par les clients.",
      "Une source de dérive plausible : technologie, nouvel entrant, rival qui progresse.",
      "Une parade : où investir pour garder sa valeur perçue.",
    ],
  }),

  appliquez(
    7,
    "Dans la justification de votre stratégie générique, ajoutez une phrase sur votre " +
      "position par rapport à l'offre de référence, et sur le risque de dérive.",
  ),
  fiche(
    "Deux axes : le prix et la valeur perçue par le client.",
    "Tout se lit par rapport à l'offre de référence du marché.",
    "Hybride : plus de valeur pour moins cher, seulement avec des coûts plus bas.",
    "La position est relative : elle dérive quand les rivaux avancent.",
    "Infosystem vise la différenciation et doit éviter la dérive due à l'IA.",
  ),
];
