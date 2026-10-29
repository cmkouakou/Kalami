/**
 * =============================================================
 *  Fichier    : step-view.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Contenu d'une étape en lecture seule, pour le corrigé d'un cas et la
 *               comparaison avec l'étude de l'élève : les gabarits des étapes 1 à 8 en mode
 *               corrigé (observateur, sans sauvegarde, coach ni versions), le plan en lecture
 *               pour l'étape 9. Les enjeux, objectifs et options auxquels les étapes 6 à 8
 *               se rattachent viennent du même côté (corrigé déverrouillé ou étude de
 *               l'élève) : rien du corrigé verrouillé n'est envoyé au navigateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: components/strategy/*-editor.tsx, template-frame.tsx, plan-view.tsx
 * =============================================================
 */

import { ActionEditor } from "@/components/strategy/action/action-editor";
import { ChoiceEditor } from "@/components/strategy/choice/choice-editor";
import { DirectionEditor } from "@/components/strategy/direction/direction-editor";
import { ForcesEditor } from "@/components/strategy/forces/forces-editor";
import { InternalEditor } from "@/components/strategy/internal/internal-editor";
import { PestelEditor } from "@/components/strategy/pestel/pestel-editor";
import { StakeholdersEditor } from "@/components/strategy/stakeholders/stakeholders-editor";
import type { LinkOption } from "@/components/strategy/synthesis/link-picker";
import { SynthesisEditor } from "@/components/strategy/synthesis/synthesis-editor";
import type { TemplateFrameProps } from "@/components/strategy/template-frame";
import type { StepNo } from "@/lib/strategy/steps";
import { readAction } from "@/lib/strategy/templates/action";
import { readChoice } from "@/lib/strategy/templates/choice";
import { readDirection } from "@/lib/strategy/templates/direction";
import { readForces } from "@/lib/strategy/templates/forces";
import { readInternal } from "@/lib/strategy/templates/internal";
import { readPestel } from "@/lib/strategy/templates/pestel";
import { readPlan } from "@/lib/strategy/templates/plan";
import { readStakeholders } from "@/lib/strategy/templates/stakeholders";
import { readSynthesis } from "@/lib/strategy/templates/synthesis";

import { PlanView } from "./plan-view";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();

// ==================== TYPES ====================

/** Côté affiché : le corrigé de l'auteur ou l'étude de l'élève. */
export type CaseSide = {
  /** Étude de l'élève, ou vide pour le corrigé. */
  studyId: string;
  companyName: string;
  competitors: string[];
  /** Contenu des étapes lisibles de ce côté (une étape absente compte comme vide). */
  payloads: Partial<Record<StepNo, unknown>>;
};

// ==================== LIENS ENTRE ÉTAPES ====================

/** Enjeux de la synthèse (étape 5), auxquels se rattachent objectifs et options. */
function issuesOf(side: CaseSide): LinkOption[] {
  return readSynthesis(side.payloads[5]).issues.map((issue, index) => ({
    id: issue.id,
    text: issue.title.trim() || `${s.synthesis.issueTitle} ${index + 1}`,
  }));
}

/** Objectifs du cap (étape 6), auxquels se rattachent les indicateurs de l'étape 8. */
function objectivesOf(side: CaseSide): LinkOption[] {
  return readDirection(side.payloads[6]).objectives
    .filter((objective) => objective.text.trim())
    .map((objective) => ({ id: objective.id, text: objective.text }));
}

/** Options retenues à l'étape 7, auxquelles se rattachent les chantiers de l'étape 8. */
function optionsOf(side: CaseSide): LinkOption[] {
  return readChoice(side.payloads[7]).options
    .filter((option) => option.decision === "retained" && option.text.trim())
    .map((option) => ({ id: option.id, text: option.text }));
}

// ==================== COMPOSANT ====================

/**
 * Étape en lecture seule.
 * @param stepNo - Étape affichée (1 à 9)
 * @param side   - Corrigé déverrouillé ou étude de l'élève
 */
export function CaseStepView({ stepNo, side }: { stepNo: StepNo; side: CaseSide }) {
  const payload = side.payloads[stepNo];
  if (stepNo === 9) return <PlanView plan={readPlan(payload)} />;

  const frame: TemplateFrameProps & { revision: number } = {
    studyId: side.studyId,
    stepNo,
    role: "observer",
    status: "validated",
    affectedTitles: [],
    versions: [],
    correction: true,
    revision: 0,
  };

  if (stepNo === 1) return <PestelEditor {...frame} initial={readPestel(payload)} />;
  if (stepNo === 2) {
    return (
      <ForcesEditor
        {...frame}
        initial={readForces(payload, side.companyName, side.competitors)}
      />
    );
  }
  if (stepNo === 3) return <InternalEditor {...frame} initial={readInternal(payload)} />;
  if (stepNo === 4) return <StakeholdersEditor {...frame} initial={readStakeholders(payload)} />;
  if (stepNo === 5) {
    return (
      <SynthesisEditor
        {...frame}
        initial={readSynthesis(payload)}
        sources={{
          pestel: readPestel(side.payloads[1]),
          forces: readForces(side.payloads[2], side.companyName, side.competitors),
          internal: readInternal(side.payloads[3]),
        }}
      />
    );
  }
  if (stepNo === 6) {
    return (
      <DirectionEditor
        {...frame}
        initial={readDirection(payload)}
        companyName={side.companyName}
        competitors={side.competitors}
        issues={issuesOf(side)}
      />
    );
  }
  if (stepNo === 7) {
    return <ChoiceEditor {...frame} initial={readChoice(payload)} issues={issuesOf(side)} />;
  }
  return (
    <ActionEditor
      {...frame}
      initial={readAction(payload)}
      options={optionsOf(side)}
      objectives={objectivesOf(side)}
    />
  );
}
