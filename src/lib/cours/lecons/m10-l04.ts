/**
 * =============================================================
 *  Fichier    : m10-l04.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 10, leçon 4 — « Le dilemme de l'innovateur et les ruptures » :
 *               innovation de continuité et de rupture, le mécanisme décrit par
 *               Christensen, pourquoi les leaders ne réagissent pas, les réponses
 *               possibles, la menace et la réponse d'Infosystem. Sources : livre, module 8
 *               (§ 8.6) ; Christensen, 1997. Texte, exemples et exercices originaux.
 *               v1.1 : exemples réels au Québec et en Côte d'Ivoire, sources citées
 *               (permis de taxi et projet de loi 17, taxis compteurs d'Abidjan).
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

  titre("Des exemples au Québec et en Côte d'Ivoire"),
  p(
    "Le taxi est un cas d'école : un métier installé, des permis qui valaient cher, " +
      "et des applications de réservation qui changent les règles. Voici la même " +
      "rupture vue à Montréal et à Abidjan. La source est indiquée sous chaque " +
      "exemple.",
  ),
  notion(
    "Québec : le permis de taxi perd sa valeur",
    p(
      "Selon une note de l'IRIS, l'ensemble des permis de taxi du Québec valait entre " +
        "1,3 et 1,5 milliard de dollars en 2014, l'année où Uber est arrivé. Les " +
        "titulaires avaient investi dans un actif protégé par la rareté ; l'application " +
        "a contourné cette rareté. En octobre 2019, l'Assemblée nationale a adopté le " +
        "projet de loi 17, qui a mis fin au régime des permis. Le gouvernement a " +
        "annoncé une aide totale de 814 millions de dollars aux propriétaires et à " +
        "l'industrie, une somme que bien des chauffeurs ont jugée insuffisante. Sources " +
        ": [Gouvernement du Québec, adoption du projet de loi 17]" +
        "(https://www.quebec.ca/nouvelles/actualites/details/modernisation-de-" +
        "lindustrie-du-taxi-le-ministre-francois-bonnardel-souligne-ladoption-du-" +
        "projet-de-loi-no-17) ; [IRIS, la réforme du taxi]" +
        "(https://iris-recherche.qc.ca/wp-content/uploads/2021/03/FicheCAQ-6-" +
        "taxis_web.pdf).",
    ),
  ),
  notion(
    "Côte d'Ivoire : les taxis compteurs face à Yango et Uber",
    p(
      "À Abidjan, les taxis compteurs ont fait grève début novembre 2021 contre ce " +
        "qu'ils appelaient la concurrence déloyale de Yango et d'Uber : les chauffeurs " +
        "de VTC ne payaient pas les mêmes taxes qu'eux. Pendant les deux jours d'arrêt, " +
        "selon la presse, les applications ont été les grandes gagnantes et ont même " +
        "augmenté leurs tarifs. Les VTC invoquaient un vide juridique, et le ministère " +
        "des Transports a annoncé un examen des taxes et charges des taxis. La rupture " +
        "a forcé le leader, et l'État, à revoir les règles du jeu. Sources : [Koaci, " +
        "Yango, Uber et la SOTRA grands gagnants de la grève]" +
        "(https://www.koaci.com/article/2021/11/04/cote-divoire/societe/cote-divoire-" +
        "greve-des-taxis-compteurs-reprise-progressive-yango-uber-et-sotra-grands-" +
        "gagnants_155156.html) ; [Koaci, les VTC se défendent]" +
        "(https://www.koaci.com/article/2021/11/10/cote-divoire/societe/cote-divoire-" +
        "indexees-par-les-taxis-compteurs-les-vtc-se-defendent-en-brandissant-le-vide-" +
        "juridique-ce-qui-est-prevu-par-le-ministere-des-transports_155320.html).",
    ),
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
