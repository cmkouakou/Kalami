/**
 * =============================================================
 *  Fichier    : m08-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 8, leçon 3 — « La différenciation qui tient » : les sources de
 *               différenciation (produit, service, marque, réseau), les quatre conditions
 *               d'une différence durable (valorisée, visible, rentable, difficile à
 *               copier), la différenciation d'Infosystem. Encadré : la poudre fine
 *               d'Ajinomoto face aux contrefaçons. Sources : livre, modules 4, 8 et 11.
 *               Texte, exemples et exercices originaux.
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
  p,
  piege,
  retenir,
  tableau,
  terrain,
  titre,
  type ContenuLecon,
} from "@/lib/cours/content";

// ==================== CONTENU ====================

export const M08_L03: ContenuLecon = [
  p(
    "Se différencier est facile à dire. Une nouvelle couleur, un slogan, une option de " +
      "plus : toute entreprise peut ajouter quelque chose. La vraie question est ailleurs. " +
      "La différence est-elle assez importante pour que le client paie plus, et assez " +
      "solide pour que le concurrent ne la copie pas le mois suivant ?",
  ),

  titre("Où trouver la différence"),
  tableau(
    ["Source", "Exemples", "Facilité à copier"],
    [
      ["Le produit", "Durabilité, goût, performance, design", "Souvent rapide"],
      ["Le service", "Délai, conseil, après-vente, garantie", "Moyenne"],
      ["La marque", "Réputation, confiance, image", "Lente : elle se gagne en années"],
      ["Le réseau", "Proximité, couverture, relations", "Lente : elle se construit"],
    ],
  ),
  p(
    "Les différences les plus durables sont rarement dans le produit lui-même. Elles " +
      "tiennent à ce qui s'accumule avec le temps : une réputation, un réseau de " +
      "relations, un savoir-faire maison. On retrouve la logique du VRIO (leçon 4.3) : ce " +
      "qui est rare et difficile à imiter protège mieux que ce qui est seulement utile.",
  ),

  titre("Quatre conditions"),
  etapes(
    "**Valorisée** : le client y attache de l'importance. Une différence qui ne compte " +
      "que pour l'ingénieur qui l'a conçue n'en est pas une.",
    "**Visible** : le client la perçoit avant d'acheter, ou peut la vérifier. Une qualité " +
      "invisible ne justifie aucun prix.",
    "**Rentable** : le supplément que le client accepte de payer dépasse ce que la " +
      "différence coûte à produire.",
    "**Difficile à copier** : elle repose sur des ressources ou des capacités que les " +
      "rivaux ne peuvent pas acheter du jour au lendemain.",
  ),
  retenir(
    "Une différenciation tient si elle est valorisée, visible, rentable et difficile à " +
      "copier. Il suffit qu'une condition manque pour que l'avantage s'évapore.",
  ),
  piege(
    "Confondre ce qu'on fait bien et ce que le client achète. Une entreprise peut être " +
      "fière de sa technique, alors que ses clients la choisissent pour sa ponctualité. " +
      "Demandez-leur, plutôt que de le supposer.",
  ),

  titre("La différenciation d'Infosystem"),
  p(
    "Infosystem combine deux sources. La **proximité**, d'abord : des techniciens qui " +
      "connaissent chaque client et interviennent vite. Elle est valorisée et difficile à " +
      "copier pour une grande firme éloignée. L'**expertise en sécurité et en " +
      "conformité**, ensuite : elle répond à la demande montante des PME, mais elle reste " +
      "à construire.",
  ),
  p(
    "Le point faible est la visibilité. Comment une PME sait-elle, avant d'avoir un " +
      "incident, que son fournisseur est compétent en sécurité ? Infosystem peut rendre " +
      "sa différence visible : un délai d'intervention garanti par écrit, un rapport " +
      "d'audit clair remis à chaque client, des certifications obtenues par ses " +
      "techniciens, des cas clients racontés avec leur accord.",
  ),
  terrain(
    "Une différence que le client ne voit pas",
    "Chez Ajinomoto Afrique de l'Ouest, notre glutamate était une fine poudre blanche, " +
      "régulière à l'œil, d'une pureté contrôlée. Sur les marchés circulaient des " +
      "contrefaçons grossières : de gros cristaux irréguliers, mal raffinés. Pour un " +
      "spécialiste, la différence sautait aux yeux. Pour la ménagère qui se méfiait déjà " +
      "du produit, tout se confondait dans la même rumeur. Notre qualité était réelle et " +
      "valorisée, mais elle n'était pas assez visible pour nous protéger. Aider les " +
      "clients à reconnaître le produit authentique faisait partie de la stratégie, au " +
      "même titre que le produit lui-même.",
  ),

  titre("Exercices"),
  exercice({
    type: "qcm",
    id: "e1",
    question:
      "Un hôtel de Kribi investit dans une literie haut de gamme. Ses clients, surtout des " +
      "voyageurs d'affaires d'une nuit, ne le remarquent pas et refusent tout supplément. " +
      "Quelle condition manque ?",
    choix: [
      {
        texte: "La différence n'est pas difficile à copier.",
        explication: "Peut-être, mais le problème apparaît avant : personne ne la paie.",
      },
      {
        texte: "La différence n'est ni visible ni assez valorisée par cette clientèle.",
        explication: "Oui : sans perception ni importance pour le client, pas de supplément.",
      },
      {
        texte: "La différence est trop rentable.",
        explication: "Elle ne rapporte justement rien : elle coûte sans être payée.",
      },
    ],
    bonne: 1,
  }),
  exercice({
    type: "classement",
    id: "e2",
    consigne: "Ces différences sont-elles plutôt faciles ou difficiles à copier ?",
    categories: ["Facile à copier", "Difficile à copier"],
    elements: [
      {
        texte: "Un nouvel emballage aux couleurs vives",
        categorie: 0,
        explication: "Un concurrent peut l'imiter en quelques semaines.",
      },
      {
        texte: "Trente ans de relations avec les grossistes d'un pays",
        categorie: 1,
        explication: "Elles se construisent dans le temps et ne s'achètent pas.",
      },
      {
        texte: "Une remise de lancement de 10 %",
        categorie: 0,
        explication: "N'importe qui peut baisser son prix.",
      },
      {
        texte: "Une réputation de fiabilité auprès des PME de la région",
        categorie: 1,
        explication: "Elle tient aux preuves accumulées, client après client.",
      },
    ],
  }),
  exercice({
    type: "vrai-faux",
    id: "e3",
    consigne: "Vrai ou faux ?",
    affirmations: [
      {
        texte: "Une différence n'a de valeur que si le client la perçoit ou peut la vérifier.",
        vrai: true,
        explication: "Une qualité invisible ne justifie aucun prix.",
      },
      {
        texte: "Les différences liées au produit sont en général les plus durables.",
        vrai: false,
        explication:
          "Elles sont souvent les plus faciles à copier ; " +
          "réputation et réseau tiennent mieux.",
      },
      {
        texte: "Une différenciation peut coûter plus qu'elle ne rapporte.",
        vrai: true,
        explication: "D'où la condition de rentabilité.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Nommez la principale différence de votre organisation. Passez-la au crible des " +
      "quatre conditions, puis proposez une action pour la rendre plus visible.",
    corrige: [
      "Une différence formulée du point de vue du client, pas de l'entreprise.",
      "Les quatre conditions examinées une à une, avec franchise sur celles qui manquent.",
      "Une action concrète de visibilité : garantie écrite, preuve, certification, témoignage.",
      "Une estimation de ce que la différence coûte et de ce qu'elle rapporte.",
    ],
  }),

  appliquez(
    7,
    "Dans la justification de votre position générique, précisez votre différence et " +
      "vérifiez qu'elle remplit les quatre conditions.",
  ),
  fiche(
    "Sources : produit, service, marque, réseau.",
    "Les plus durables s'accumulent avec le temps.",
    "Quatre conditions : valorisée, visible, rentable, difficile à copier.",
    "Une qualité invisible ne protège pas : il faut la rendre visible.",
    "Infosystem : proximité acquise, expertise en sécurité à construire et à montrer.",
  ),
];
