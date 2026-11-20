/**
 * =============================================================
 *  Fichier    : m09-l03.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Module 9, leçon 3 — « Intégration verticale et horizontale » : la
 *               filière, l'intégration vers l'amont et vers l'aval, faire ou faire faire,
 *               l'intégration horizontale ; les pistes écartées et retenues pour
 *               Infosystem. Encadré : conditionner sur place à Abidjan. Sources : livre,
 *               modules 2, 8 et 11. Texte, exemples et exercices originaux.
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

export const M09_L03: ContenuLecon = [
  p(
    "Un produit passe par plusieurs mains avant d'arriver chez le client : celui qui " +
      "fournit la matière, celui qui fabrique, celui qui distribue. Une entreprise peut " +
      "croître en prenant à son compte un maillon voisin de cette chaîne, ou en rachetant " +
      "ceux qui occupent le même maillon qu'elle.",
  ),

  titre("La filière"),
  definition(
    "Filière",
    "L'ensemble des étapes qui mènent de la matière première au client final, avec les " +
      "entreprises qui les assurent.",
  ),
  schema(
    "filiere",
    "La filière d'Infosystem : éditeurs et fabricants, puis distributeurs de matériel, " +
      "puis Infosystem, puis les PME clientes. Remonter vers les fournisseurs, c'est " +
      "l'intégration vers l'amont ; descendre vers le client, l'intégration vers l'aval ; " +
      "racheter une firme du même maillon, l'intégration horizontale.",
  ),
  tableau(
    ["Type", "Ce que fait l'entreprise", "Exemple"],
    [
      [
        "Vers l'amont",
        "Prend en charge ce que faisaient ses fournisseurs",
        "Une chocolaterie qui achète des plantations de cacao",
      ],
      [
        "Vers l'aval",
        "Prend en charge ce que faisaient ses clients ou distributeurs",
        "Un brasseur qui ouvre ses propres bars",
      ],
      [
        "Horizontale",
        "Rachète ou absorbe des entreprises du même métier",
        "Une banque qui rachète une banque concurrente",
      ],
    ],
  ),

  titre("Faire ou faire faire"),
  p(
    "Intégrer un maillon, c'est décider de **faire** plutôt que de **faire faire**. La " +
      "décision se pèse avec des arguments des deux côtés.",
  ),
  tableau(
    ["Intégrer apporte", "Intégrer coûte"],
    [
      ["La maîtrise de la qualité et des délais", "Des investissements lourds"],
      ["La marge du maillon repris", "Un métier nouveau à apprendre"],
      ["La sécurité des approvisionnements", "Moins de souplesse si le marché change"],
      ["Un contact direct avec le client final", "Des conflits possibles avec ses partenaires"],
    ],
  ),
  retenir(
    "On intègre un maillon quand il est critique pour l'avantage concurrentiel et mal " +
      "servi par le marché. Sinon, on l'achète à ceux dont c'est le métier.",
  ),
  terrain(
    "Conditionner sur place",
    "À son ouverture à Abidjan, Ajinomoto Afrique de l'Ouest importait le produit fini, " +
      "fabriqué au Nigeria. À partir de 2013, le glutamate est arrivé en vrac du Brésil, " +
      "d'une autre filiale du groupe, et notre usine de Yopougon le conditionnait sur " +
      "place, dans des formats adaptés aux consommateurs locaux. Le groupe n'a pas tout " +
      "intégré : il a gardé la fabrication là où elle était la plus efficace, et rapproché " +
      "du marché le seul maillon qui devait s'adapter au client. Ce choix avait aussi son " +
      "revers : nous dépendions d'intrants venus de loin, comme le film d'emballage importé " +
      "du Japon dont je parlais au module 2.",
  ),

  titre("L'intégration horizontale"),
  p(
    "Racheter un concurrent ou une entreprise du même maillon donne d'un coup des clients, " +
      "des employés et une part de marché. Le risque se trouve dans l'intégration humaine : " +
      "deux équipes, deux façons de travailler, deux cultures. Le module 11 y revient en " +
      "détail.",
  ),

  titre("Ce qu'Infosystem doit en retenir"),
  p(
    "La première édition du livre envisageait deux pistes pour Infosystem : développer " +
      "ses propres logiciels et devenir revendeur de matériel. Les deux sont des " +
      "intégrations **vers l'amont** : Infosystem remplacerait ses propres fournisseurs. " +
      "Elles sont surtout peu cohérentes avec son diagnostic.",
  ),
  liste(
    "**Développer des logiciels** demande des compétences qu'elle n'a pas et " +
      "détournerait des techniciens déjà trop peu nombreux.",
    "**Revendre du matériel** ajouterait des marges, mais aussi des stocks, du crédit " +
      "fournisseur, et un conflit d'intérêts avec son rôle de conseiller neutre.",
    "**Racheter une petite firme** dont le propriétaire part à la retraite apporterait des " +
      "clients et, surtout, des techniciens formés. C'est la piste qui mérite un examen.",
  ),
  piege(
    "Intégrer pour « garder la marge ». Une marge n'est intéressante que si l'entreprise " +
      "sait la gagner : un maillon mal maîtrisé coûte souvent plus qu'il ne rapporte, et " +
      "il peut abîmer la réputation du métier principal.",
  ),

  titre("Exercices"),
  exercice({
    type: "classement",
    id: "e1",
    consigne:
      "Une minoterie de Dakar transforme du blé importé en farine vendue aux boulangeries. " +
      "Quel type d'intégration chaque projet représente-t-il ?",
    categories: ["Vers l'amont", "Vers l'aval", "Horizontale"],
    elements: [
      {
        texte: "Ouvrir sa propre chaîne de boulangeries.",
        categorie: 1,
        explication: "Elle reprend le maillon de ses clients.",
      },
      {
        texte: "Acheter un navire pour importer elle-même le blé.",
        categorie: 0,
        explication: "Elle reprend un maillon de ses fournisseurs.",
      },
      {
        texte: "Racheter une minoterie concurrente à Thiès.",
        categorie: 2,
        explication: "Même métier, même maillon.",
      },
      {
        texte: "Créer sa propre société de commerce de céréales.",
        categorie: 0,
        explication: "L'approvisionnement en matière première est en amont.",
      },
    ],
  }),
  exercice({
    type: "qcm",
    id: "e2",
    question: "Pourquoi la revente de matériel est-elle une mauvaise piste pour Infosystem ?",
    choix: [
      {
        texte: "Parce que la revente de matériel ne rapporte aucune marge.",
        explication: "Elle en rapporte : le problème est ailleurs.",
      },
      {
        texte: "Parce qu'elle ajoute stocks et crédit, et menace sa neutralité de conseiller.",
        explication: "Oui : elle affaiblit l'atout même sur lequel repose sa différenciation.",
      },
      {
        texte: "Parce que c'est une intégration horizontale.",
        explication:
          "C'est une intégration vers l'amont : " +
          "Infosystem remplacerait ses fournisseurs.",
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
        texte: "On a intérêt à intégrer un maillon critique et mal servi par le marché.",
        vrai: true,
        explication: "C'est le cas où faire vaut mieux que faire faire.",
      },
      {
        texte: "L'intégration rend l'entreprise plus souple face aux changements du marché.",
        vrai: false,
        explication: "Elle la rend souvent moins souple : les investissements l'engagent.",
      },
      {
        texte: "Racheter une firme du même métier est une intégration horizontale.",
        vrai: true,
        explication: "Même maillon de la filière.",
      },
    ],
  }),
  exercice({
    type: "ouvert",
    id: "e4",
    question:
      "Dessinez la filière de votre organisation. Identifiez un maillon que vous pourriez " +
      "intégrer et pesez le pour et le contre de faire plutôt que faire faire.",
    corrige: [
      "Une filière complète, de la matière première au client final.",
      "Le maillon choisi et le type d'intégration (amont, aval, horizontale).",
      "Les gains attendus et les coûts : investissement, métier nouveau, souplesse perdue.",
      "Une conclusion liée à l'avantage concurrentiel visé.",
    ],
  }),

  appliquez(
    7,
    "Si une intégration fait partie de vos options, inscrivez-la à l'étape 7 et précisez " +
      "dans le commentaire s'il s'agit de l'amont, de l'aval ou d'un rachat horizontal.",
  ),
  fiche(
    "La filière va de la matière première au client final.",
    "Amont : reprendre le maillon des fournisseurs. Aval : celui des clients.",
    "Horizontale : racheter le même métier.",
    "On intègre ce qui est critique et mal servi ; on achète le reste.",
    "Infosystem : logiciels et matériel écartés, rachat d'une petite firme à examiner.",
  ),
];
