/**
 * =============================================================
 *  Fichier    : editeur-avance.ts (nettoyer-transformer)
 *  Projet     : Kalami Données
 *  Description: Résumé de la leçon « L'Éditeur avancé et le code M » : la structure
 *               let / in, la lecture du code généré, et le risque du réordonnancement.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 * =============================================================
 */

import {
  code,
  examen,
  liste,
  memo,
  note,
  p,
  tableau,
  titre,
  type LessonContent,
} from "@/lib/powerbi/content";

const contenu: LessonContent = [
  titre("L'idée centrale"),
  p(
    "La section la plus courte du module, et celle qui lève le rideau. Chaque clic fait dans " +
      "Power Query écrit du code à notre insu. C'est ici qu'on peut le lire.",
  ),
  memo(
    "L'interface de Power Query est un enregistreur de macros : on fait les actions, il écrit le " +
      "script. L'Éditeur avancé est simplement la fenêtre du script.",
  ),

  titre("Le M est toujours là"),
  tableau(
    ["Affirmation", "Implication"],
    [
      ["Le langage M est toujours lisible et modifiable", "Rien n'est caché"],
      ["Son usage n'est pas obligatoire", "L'interface suffit pour l'essentiel"],
      ["On en écrit rarement, mais ça peut servir", "Savoir le lire, en écrire à l'occasion"],
    ],
  ),
  note(
    "L'angle pédagogique souligné par Microsoft : puisque chaque étape est écrite en M, qu'on " +
      "l'ait écrite ou non, ces étapes servent à apprendre le langage. L'interface est le " +
      "professeur.",
  ),
  examen(
    "M n'est pas DAX. Le M vit dans Power Query et transforme les données avant le chargement ; " +
      "le DAX vit dans le modèle et calcule après. Deux langages, deux moments, deux fenêtres.",
  ),

  titre("Comment l'ouvrir"),
  p(
    "Ruban Affichage, puis Éditeur avancé — le même ruban que les outils de profilage, pas " +
      "Accueil ni Transformer.",
  ),

  titre("Comment lire du code M"),
  p(
    "Chaque étape de Power Query correspond grosso modo à une ou deux lignes de code M. Nul " +
      "besoin d'être expert pour le lire, et on peut même expérimenter en le modifiant : changer " +
      "le nom d'une base de données, par exemple, puis valider par Terminé.",
  ),

  titre("La structure"),
  code(
    `let
    Source = ...,
    #"Colonnes supprimées" = Table.RemoveColumns(Source, {...}),
    #"Lignes filtrées" = Table.SelectRows(#"Colonnes supprimées", each ...)
in
    #"Lignes filtrées"`,
    "m",
  ),
  liste(
    "Le M s'écrit de haut en bas : chaque étape référence la précédente par le nom placé à gauche du signe égal.",
    "Réordonner est dangereux : cela peut ruiner les dépendances entre instructions.",
    "L'instruction in désigne le résultat à renvoyer, presque toujours la dernière étape.",
  ),
  memo(
    "Le M est une course de relais : chaque ligne prend le témoin de celle qu'elle nomme. " +
      "Intervertir deux coureurs envoie le témoin vers quelqu'un qui n'a pas encore couru — la " +
      "chaîne casse.",
  ),
];

export default contenu;
