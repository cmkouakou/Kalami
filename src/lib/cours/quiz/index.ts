/**
 * =============================================================
 *  Fichier    : index.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Registre des quiz de module, indexé par identifiant de module
 *               (« m01 »). Contenu côté serveur : les bonnes réponses ne quittent
 *               le serveur qu'une fois le quiz réussi (voir lib/cours/evaluation.ts).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/quiz/m01.ts … m13.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";
import { QUIZ_M01 } from "./m01";
import { QUIZ_M02 } from "./m02";
import { QUIZ_M03 } from "./m03";
import { QUIZ_M04 } from "./m04";
import { QUIZ_M05 } from "./m05";
import { QUIZ_M06 } from "./m06";
import { QUIZ_M07 } from "./m07";
import { QUIZ_M08 } from "./m08";
import { QUIZ_M09 } from "./m09";
import { QUIZ_M10 } from "./m10";
import { QUIZ_M11 } from "./m11";
import { QUIZ_M12 } from "./m12";
import { QUIZ_M13 } from "./m13";

// ==================== REGISTRE ====================

/** Quiz de chaque module, par identifiant de module. */
export const QUIZ: Readonly<Record<string, readonly QuestionQuiz[]>> = {
  m01: QUIZ_M01,
  m02: QUIZ_M02,
  m03: QUIZ_M03,
  m04: QUIZ_M04,
  m05: QUIZ_M05,
  m06: QUIZ_M06,
  m07: QUIZ_M07,
  m08: QUIZ_M08,
  m09: QUIZ_M09,
  m10: QUIZ_M10,
  m11: QUIZ_M11,
  m12: QUIZ_M12,
  m13: QUIZ_M13,
};

/**
 * Questions du quiz d'un module.
 * @param moduleId - Identifiant du module (« m01 »)
 * @returns Les questions, ou null si le module n'a pas de quiz
 */
export function quizDe(moduleId: string): readonly QuestionQuiz[] | null {
  return Object.hasOwn(QUIZ, moduleId) ? QUIZ[moduleId] : null;
}
