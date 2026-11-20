/**
 * =============================================================
 *  Fichier    : m10-l04.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 10, leçon 4 — « Le dilemme de l'innovateur et les ruptures » :
 *               innovation de continuité et de rupture, le mécanisme décrit par
 *               Christensen, pourquoi les leaders ne réagissent pas, les réponses
 *               possibles, la menace et la réponse d'Infosystem. Sources : livre, module 8
 *               (§ 8.6) ; Christensen, 1997. Texte, exemples et exercices originaux.
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
  schema,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M10_L04: ContenuLecon = [
  p(
    "Certaines entreprises disparaissent alors qu'elles étaient bien gérées. Elles " +
      "écoutaient leurs clients, investissaient dans leurs meilleurs produits, " +
      "surveillaient leurs concurrents. C'est justement ce qui les a perdues. En 1997, " +
      "Clayton Christensen a appelé ce paradoxe **le dilemme de l'innovateur**.",
  ),

  titre("Deux sortes d'innovation"),
  definition(
    "Innovation de continuité",
    "Une amélioration de l'offre existante, pour les clients existants, sur les critères " +
      "qu'ils valorisent déjà : plus rapide, plus puissant, plus complet.",
  ),
  definition(
    "Innovation de rupture",
    "Une offre d'abord moins performante sur ces critères, mais plus simple, moins chère " +
      "ou plus pratique, qui séduit des clients négligés ou des non-clients, puis " +
      "s'améliore jusqu'à suffire au plus grand nombre.",
  ),

  titre("Le mécanisme"),
  schema(
    "rupture",
    "L'innovation de rupture : la performance en ordonnée, le temps en abscisse. L'offre " +
      "des leaders progresse vite et dépasse ce que le client moyen utilise. L'offre de " +
      "rupture part de plus bas, simple et moins chère, puis progresse à son tour. Quand " +
      "elle devient assez bonne pour le client moyen, les clients basculent.",
  ),
  etapes(
    "Les leaders améliorent leur offre plus vite que les besoins de la plupart de leurs " +
      "clients : ceux-ci paient pour des fonctions qu'ils n'utilisent pas.",
    "Un nouvel entrant propose une offre plus modeste, mais simple et bon marché, à des " +
      "clients que les leaders jugent peu rentables.",
    "Les leaders le laissent faire : ce marché est petit et ses marges sont faibles.",
    "L'entrant progresse. Un jour, son offre devient assez bonne pour le client moyen, et " +
      "celui-ci bascule.",
  ),
  retenir(
    "La rupture ne vient pas d'une offre meilleure, mais d'une offre suffisante, plus " +
      "simple et moins chère, que les leaders avaient de bonnes raisons d'ignorer.",
  ),

  titre("Pourquoi les leaders ne réagissent pas"),
  liste(
    "**Leurs meilleurs clients ne la demandent pas** : ils veulent plus de performance, " +
      "pas moins.",
    "**Les marges sont faibles** : comparé à l'activité principale, le nouveau marché " +
      "semble ne pas valoir l'effort.",
    "**Ils craignent de se cannibaliser** : une offre moins chère pourrait détourner leurs " +
      "propres clients.",
    "**Leur organisation est faite pour l'existant** : coûts, processus et façon de " +
      "décider ne conviennent pas à une offre modeste.",
  ),

  titre("Les réponses possibles"),
  liste(
    "**Surveiller le bas du marché** et les non-clients, pas seulement les concurrents " +
      "connus.",
    "**Créer une équipe ou une unité à part**, avec ses propres coûts et ses propres " +
      "critères de succès.",
    "**Accepter de se cannibaliser** : mieux vaut perdre des ventes à soi-même qu'à un " +
      "concurrent.",
  ),
  piege(
    "Appeler « rupture » toute nouveauté. Une technologie spectaculaire qui améliore " +
      "l'offre des leaders pour leurs clients actuels est une innovation de continuité. " +
      "La rupture se reconnaît à son point de départ : moins bien, mais plus simple et " +
      "moins cher, pour des clients négligés.",
  ),

  titre("La menace qui guette Infosystem"),
  p(
    "Pour une firme de services gérés, la rupture pourrait venir de deux côtés. Des " +
      "outils en ligne, de plus en plus aidés par l'intelligence artificielle, permettent " +
      "à une petite PME de gérer elle-même ses postes et ses comptes. Des fournisseurs " +
      "entièrement à distance proposent un soutien de base, sans déplacement, à très bas " +
      "prix. Aujourd'hui, ces offres semblent trop limitées pour les clients " +
      "d'Infosystem. C'est exactement le début du mécanisme.",
  ),
  p(
    "La réponse du plan suit les leçons de Christensen. Infosystem utilise elle-même " +
      "l'IA pour le premier niveau de soutien, plutôt que de la subir : elle se " +
      "cannibalise avant qu'un autre ne le fasse. Et elle déplace sa valeur là où " +
      "l'outil à distance est faible : la proximité, la sécurité, la conformité et le " +
      "conseil.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Ces innovations relèvent-elles de la continuité ou de la rupture ?",
    categories: ["Continuité", "Rupture"],
    elements: [
      {
        texte: "Un fabricant de téléphones haut de gamme qui ajoute un quatrième objectif.",
        categorie: 0,
        explication: "Plus de performance pour les clients existants.",
      },
      {
        texte: "Une école en ligne à bas prix, d'abord moins reconnue que les universités.",
        categorie: 1,
        explication: "Moins bien au départ, plus simple et moins cher, pour des négligés.",
      },
      {
        texte: "Une banque qui modernise son application pour ses clients actuels.",
        categorie: 0,
        explication: "Elle améliore l'existant sur des critères déjà valorisés.",
      },
      {
        texte: "Un portefeuille sur téléphone pour ceux qui n'avaient pas de compte bancaire.",
        categorie: 1,
        explication: "Il sert d'abord des non-clients avec une offre plus modeste.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question: "Pourquoi un leader bien géré laisse-t-il souvent passer une rupture ?",
    choix: [
      {
        texte: "Parce que ses dirigeants manquent de compétences techniques.",
        explication: "Christensen montre des leaders compétents et bien gérés.",
      },
      {
        texte: "Parce que ses meilleurs clients et ses marges l'en détournent.",
        explication: "Oui : c'est en faisant ce qui semble rationnel qu'il passe à côté.",
      },
      {
        texte: "Parce que l'entrant offre dès le départ un produit meilleur.",
        explication: "Au départ, l'offre de rupture est moins performante.",
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
        texte: "Une offre de rupture est, au départ, moins performante que celle des leaders.",
        vrai: true,
        explication: "Elle gagne par la simplicité et le prix, pas par la performance.",
      },
      {
        texte: "Écouter ses meilleurs clients protège contre les ruptures.",
        vrai: false,
        explication: "Ils réclament plus de performance, ce qui détourne du bas du marché.",
      },
      {
        texte: "Se cannibaliser peut être une bonne réponse à une rupture.",
        vrai: true,
        explication: "Mieux vaut perdre des ventes à soi-même qu'à un concurrent.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Quelle offre plus simple et moins chère pourrait un jour remplacer celle de votre " +
      "organisation ? Décrivez son point de départ et la réponse que vous préparez.",
    corrige: [
      "Une offre précise, avec les clients négligés ou non-clients qu'elle sert d'abord.",
      "Le critère sur lequel elle est aujourd'hui « trop faible ».",
      "Le moment où elle deviendrait assez bonne pour vos clients.",
      "Une réponse concrète : surveiller, créer une équipe à part, ou se cannibaliser.",
    ],
  }),

  appliquez(
    7,
    "Ajoutez à vos options de l'étape 7 une réponse à la rupture la plus probable dans " +
      "votre secteur, même si elle semble encore lointaine.",
  ),
  fiche(
    "Continuité : mieux pour les clients actuels. Rupture : moins bien, plus simple, " +
      "moins cher.",
    "Les leaders dépassent les besoins ; l'entrant devient « assez bon ».",
    "Clients, marges et organisation détournent les leaders du bas du marché.",
    "Réponses : surveiller, équipe à part, accepter de se cannibaliser.",
    "Infosystem : utiliser l'IA elle-même et miser sur la proximité et la sécurité.",
  ),
];
