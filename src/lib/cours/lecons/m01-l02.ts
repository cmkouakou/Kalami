/**
 * =============================================================
 *  Fichier    : m01-l02.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 1, leçon 2 — « Est-ce une question de stratégie ? Stratégique,
 *               tactique, opérationnel ». Sources : livre, module 1 (Infosystem, ses
 *               quatre services et ses défis) ; expérience de l'auteur chez Ajinomoto
 *               (démarche TPM). Texte, exemples et exercices originaux.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
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
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M01_L02: ContenuLecon = [
  p(
    "Lundi matin, chez Infosystem, trois sujets attendent Justin : un technicien malade à " +
      "remplacer pour la journée, le calendrier des formations du trimestre, et la " +
      "proposition d'un associé de lancer une offre de cybersécurité. Les trois paraissent " +
      "urgents. **Un seul engage l'avenir de l'entreprise.** Savoir lequel, c'est la " +
      "première compétence du stratège.",
  ),

  titre("Trois familles de décisions"),
  definition(
    "Décision stratégique",
    "Une décision qui engage l'organisation **dans la durée**, mobilise des ressources " +
      "importantes, est **difficile à défaire** et change sa position face à son " +
      "environnement : ce qu'elle offre, à qui, ou avec quels moyens.",
  ),
  p(
    "Autour d'elle gravitent deux autres familles. La décision **tactique** traduit la " +
      "stratégie en programmes de quelques mois : budgets, recrutements, campagnes, " +
      "calendriers. La décision **opérationnelle** règle le quotidien : qui fait quoi " +
      "aujourd'hui, comment traiter ce client, quelle commande passer.",
  ),
  schema(
    "niveaux-decision",
    "Trois familles de décisions comparées selon l'horizon, la réversibilité et la personne " +
      "qui décide : stratégique (années, difficile à défaire, direction), tactique (mois, " +
      "ajustable, cadres), opérationnel (jours, facile à corriger, équipes).",
  ),

  titre("Quatre questions pour trancher"),
  p(
    "La frontière n'est pas toujours nette. Plutôt que d'apprendre une liste par cœur, " +
      "posez quatre questions à la décision qui vous occupe :",
  ),
  liste(
    "**Horizon** : ses effets dureront-ils quelques jours ou plusieurs années ?",
    "**Réversibilité** : si l'on se trompe, peut-on revenir en arrière à faible coût ?",
    "**Ampleur** : engage-t-elle une part importante de l'argent, du temps ou des talents ?",
    "**Position** : modifie-t-elle ce que l'on offre, à qui, ou face à quels concurrents ?",
  ),
  retenir(
    "Plus les réponses penchent vers « longtemps, difficile, beaucoup, oui », plus la " +
      "décision est stratégique.",
    [
      "Une décision stratégique mérite une analyse avant d'être prise.",
      "Une décision opérationnelle mérite une règle claire, pas un comité.",
      "L'urgence ne dit rien de l'importance : la panne du jour crie plus fort que " +
        "l'avenir.",
    ],
  ),

  titre("Appliqué à Infosystem"),
  tableau(
    ["Décision", "Famille", "Pourquoi"],
    [
      [
        "Lancer une offre de cybersécurité",
        "Stratégique",
        "Nouvelle offre, nouveaux clients, compétences à bâtir sur des années",
      ],
      [
        "Planifier les formations du trimestre",
        "Tactique",
        "Met en œuvre le choix de monter en compétence ; se révise chaque trimestre",
      ],
      [
        "Remplacer un technicien malade aujourd'hui",
        "Opérationnel",
        "Effet d'un jour, corrigé dès demain",
      ],
      [
        "Choisir un successeur à Justin",
        "Stratégique",
        "Engage la continuité de toute l'entreprise et se défait mal",
      ],
    ],
    "La même entreprise prend chaque semaine des décisions des trois familles.",
  ),

  titre("Un exemple près de chez vous"),
  p(
    "Une boulangerie de Cocody, à Abidjan, livre chaque matin une vingtaine de " +
      "supérettes. Décider du nombre de baguettes à cuire demain est opérationnel. Fixer " +
      "les tournées de livraison pour la saison des pluies est tactique. Ouvrir un " +
      "deuxième four à Yopougon, ou renoncer aux supérettes pour vendre en boutique, est " +
      "stratégique : l'investissement est lourd, l'emplacement ne se déplace pas, et la " +
      "clientèle visée change.",
  ),
  piege(
    "Croire qu'une décision est stratégique parce qu'elle est prise par la direction. Un " +
      "dirigeant de PME passe souvent l'essentiel de sa journée dans l'opérationnel. À " +
      "l'inverse, un choix fait sur le terrain (accepter tous les petits dépannages, par " +
      "exemple) peut, répété des centaines de fois, devenir une stratégie que personne n'a " +
      "décidée.",
  ),

  titre("Bien faire n'est pas bien choisir"),
  terrain(
    "Une usine parmi les meilleures du groupe",
    "À l'usine d'Ajinomoto à Abidjan, nous avons déployé une démarche d'amélioration " +
      "continue (TPM) suivie par des indicateurs de rendement des équipements. Les pertes " +
      "de production ont baissé de 40 %, et l'usine s'est classée parmi les dix meilleures " +
      "des quelque 120 usines du groupe dans le monde. C'était un vrai succès, mais un " +
      "succès **opérationnel**. Il rendait l'usine capable de servir la stratégie ; il ne " +
      "disait pas quels produits vendre, à quels clients ni à quel prix. Ces choix-là se " +
      "faisaient ailleurs, et ils comptaient tout autant.",
  ),
  notion(
    "Pour aller plus loin : quand l'opérationnel devient stratégique",
    p(
      "Une décision opérationnelle peut prendre une portée stratégique de deux façons. Par " +
        "**accumulation** : des milliers de petits choix finissent par dessiner une " +
        "position (la stratégie dite « émergente »). Par **exposition** : un incident " +
        "banal qui touche la réputation, la sécurité ou un client clé change soudain " +
        "d'échelle.",
    ),
    p(
      "D'où l'intérêt de relire de temps en temps ses décisions courantes en se demandant : " +
        "quelle stratégie suis-je en train de construire sans l'avoir choisie ?",
    ),
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne: "Classez ces décisions d'une coopérative de cacao de Soubré.",
    categories: ["Stratégique", "Tactique", "Opérationnel"],
    elements: [
      {
        texte: "Construire un centre de fermentation pour vendre un cacao de qualité supérieure.",
        categorie: 0,
        explication:
          "Investissement lourd, nouvelle clientèle exigeante, difficile à défaire.",
      },
      {
        texte: "Organiser la collecte de la campagne principale par zones et par semaines.",
        categorie: 1,
        explication: "Programme de quelques mois, révisé à chaque campagne.",
      },
      {
        texte: "Envoyer un camion de plus demain au village où la récolte déborde.",
        categorie: 2,
        explication: "Effet d'un jour, corrigé dès le lendemain.",
      },
      {
        texte: "Cesser de vendre aux intermédiaires et traiter directement avec un exportateur.",
        categorie: 0,
        explication: "Change à qui l'on vend et la position de la coopérative dans la filière.",
      },
      {
        texte: "Former les pesateurs au nouveau barème de qualité ce trimestre.",
        categorie: 1,
        explication: "Met en œuvre un choix déjà fait, sur un horizon court.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question:
      "Quel critère distingue le mieux une décision stratégique d'une décision tactique ?",
    choix: [
      {
        texte: "Elle est prise en réunion de direction.",
        explication:
          "Le lieu ou le rang du décideur ne suffit pas : la direction décide aussi du " +
          "quotidien.",
      },
      {
        texte: "Elle coûte plus d'un million de francs CFA.",
        explication:
          "Le montant compte, mais un seuil fixe ne dit rien de la durée ni de la position.",
      },
      {
        texte:
          "Elle est difficile à défaire et modifie la position de l'organisation pour " +
          "plusieurs années.",
        explication: "Oui : réversibilité et horizon sont les deux tests les plus sûrs.",
      },
      {
        texte: "Elle est urgente.",
        explication: "L'urgence est un mauvais indice : les vraies questions attendent souvent.",
      },
    ],
    bonne: 2,
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Réduire les pertes de production de 40 % est une décision stratégique.",
        vrai: false,
        explication:
          "C'est de l'excellence opérationnelle : précieuse, mais elle ne choisit ni les " +
          "marchés ni les clients.",
      },
      {
        texte:
          "Une suite de petites décisions opérationnelles peut finir par former une " +
          "stratégie.",
        vrai: true,
        explication: "C'est la stratégie émergente : personne ne l'a décidée, mais elle existe.",
      },
      {
        texte: "Une décision tactique doit rester cohérente avec la stratégie.",
        vrai: true,
        explication: "La tactique traduit la stratégie en programmes ; elle ne la remplace pas.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Infosystem accepte tous les petits dépannages qu'on lui demande, parce que « ça " +
      "rapporte toujours un peu ». Est-ce une décision opérationnelle ou stratégique ? " +
      "Justifiez.",
    corrige: [
      "Chaque dépannage, pris isolément, est une décision opérationnelle.",
      "Répétée, la règle devient stratégique : elle sature une équipe déjà trop petite et " +
        "empêche d'accepter les mandats plus rentables (le défi de la capacité).",
      "Elle mérite donc d'être tranchée consciemment par la direction, par exemple en " +
        "réservant les dépannages aux clients sous contrat.",
    ],
  }),

  appliquez(
    null,
    "Notez les trois décisions les plus importantes prises dans votre organisation ce " +
      "mois-ci et classez-les avec les quatre questions. Combien sont réellement " +
      "stratégiques ?",
  ),
  fiche(
    "Stratégique : longue durée, difficile à défaire, ressources importantes, position " +
      "modifiée.",
    "Tactique : programmes de quelques mois qui traduisent la stratégie.",
    "Opérationnel : le quotidien, à régler par des règles claires.",
    "L'urgence ne mesure pas l'importance ; de petits choix répétés peuvent devenir une " +
      "stratégie.",
  ),
];
