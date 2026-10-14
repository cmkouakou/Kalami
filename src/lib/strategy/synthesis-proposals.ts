/**
 * =============================================================
 *  Fichier    : synthesis-proposals.ts
 *  Projet     : Kalami Stratégie
 *  Description: Propositions du coach pour la synthèse de l'étape 5 (S6b) : identifiants
 *               connus des étapes 1 à 4, numérotation des propositions (une décision par
 *               proposition), repérage des doublons (décochés par défaut) et application des
 *               propositions cochées, qui complète la synthèse sans rien remplacer
 *               (nouveaux identifiants, liens convertis, plafonds respectés). Fonctions pures.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
 *  Dépendances: coach/schemas.ts, templates/synthesis.ts, templates/forces.ts,
 *               templates/pestel.ts, templates/internal.ts, templates/stakeholders.ts
 * =============================================================
 */

import type {
  IssueProposal,
  Synthesize,
  SynthesizeKnown,
  SwotProposal,
  TowsProposal,
} from "@/lib/strategy/coach/schemas";
import { FORCES } from "@/lib/strategy/templates/forces";
import type { InternalPayload } from "@/lib/strategy/templates/internal";
import type { PestelPayload } from "@/lib/strategy/templates/pestel";
import type { StakeholdersPayload } from "@/lib/strategy/templates/stakeholders";
import {
  ISSUES_MAX,
  ITEM_TEXT_MAX,
  newSwotItem,
  SWOT_ITEMS_MAX,
  SWOT_KEYS,
  TOWS_MAX,
  type Issue,
  type SynthesisPayload,
} from "@/lib/strategy/templates/synthesis";

// ==================== TYPES ====================

/** Contenu des quatre étapes sources (déjà relu par les lecteurs des gabarits). */
export type ProposalSources = {
  pestel: PestelPayload;
  internal: InternalPayload;
  stakeholders: StakeholdersPayload;
};

/** Proposition repérée par son indice global (celui de sa décision). */
export type IndexedProposal =
  | { index: number; kind: "swot"; item: SwotProposal }
  | { index: number; kind: "tows"; item: TowsProposal }
  | { index: number; kind: "issue"; item: IssueProposal };

// ==================== IDENTIFIANTS CONNUS ====================

/**
 * Identifiants auxquels une origine peut renvoyer et éléments déjà présents dans la
 * synthèse (pour le nettoyage des propositions).
 * @param sources - Étapes 1, 3 et 4 (l'étape 2 a des clés fixes : les cinq forces)
 * @param payload - Synthèse enregistrée
 */
export function knownIds(sources: ProposalSources, payload: SynthesisPayload): SynthesizeKnown {
  return {
    sources: {
      1: new Set(sources.pestel.factors.map((factor) => factor.id)),
      2: new Set<string>(FORCES),
      3: new Set([
        ...sources.internal.activities.map((activity) => activity.id),
        ...sources.internal.resources.map((resource) => resource.id),
      ]),
      4: new Set(sources.stakeholders.stakeholders.map((stakeholder) => stakeholder.id)),
    },
    swotIds: new Set(SWOT_KEYS.flatMap((key) => payload.swot[key].map((item) => item.id))),
    towsIds: new Set(payload.tows.map((item) => item.id)),
  };
}

// ==================== NUMÉROTATION ====================

/**
 * Propositions dans l'ordre des décisions : SWOT, puis pistes TOWS, puis enjeux.
 * @param proposals - Propositions nettoyées
 */
export function indexProposals(proposals: Synthesize): IndexedProposal[] {
  const swot = proposals.swot.map((item, i) => ({ index: i, kind: "swot" as const, item }));
  const offset = swot.length;
  const tows = proposals.tows.map((item, i) => ({
    index: offset + i,
    kind: "tows" as const,
    item,
  }));
  const issues = proposals.issues.map((item, i) => ({
    index: offset + tows.length + i,
    kind: "issue" as const,
    item,
  }));
  return [...swot, ...tows, ...issues];
}

// ==================== DOUBLONS ====================

/** Forme comparable d'un texte : minuscules, espaces réduits. */
function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");
}

/** Vrai si l'enjeu n'a encore rien (ni titre, ni explication, ni lien). */
function blankIssue(issue: Issue): boolean {
  return !issue.title.trim() && !issue.explanation.trim() && issue.links.length === 0;
}

/**
 * Indices des propositions qui doublent un contenu déjà présent ou une proposition
 * précédente : même origine ou même texte dans la même case, même texte de piste, même
 * titre d'enjeu.
 * @param proposals - Propositions nettoyées
 * @param payload   - Synthèse actuelle
 */
export function duplicateIndexes(proposals: Synthesize, payload: SynthesisPayload): Set<number> {
  const seen = new Set<string>();
  for (const key of SWOT_KEYS) {
    for (const item of payload.swot[key]) {
      seen.add(`swot:${key}:${normalize(item.text)}`);
      if (item.origin) seen.add(`origin:${key}:${item.origin.step}:${item.origin.ref}`);
    }
  }
  for (const item of payload.tows) seen.add(`tows:${normalize(item.text)}`);
  for (const issue of payload.issues) seen.add(`issue:${normalize(issue.title)}`);

  const duplicates = new Set<number>();
  for (const entry of indexProposals(proposals)) {
    const keys: string[] = [];
    if (entry.kind === "swot") {
      keys.push(`swot:${entry.item.key}:${normalize(entry.item.text)}`);
      const { origin } = entry.item;
      if (origin) keys.push(`origin:${entry.item.key}:${origin.step}:${origin.ref}`);
    } else if (entry.kind === "tows") {
      keys.push(`tows:${normalize(entry.item.text)}`);
    } else {
      keys.push(`issue:${normalize(entry.item.title)}`);
    }
    if (keys.some((key) => seen.has(key))) duplicates.add(entry.index);
    for (const key of keys) seen.add(key);
  }
  return duplicates;
}

/**
 * Indices cochés par défaut : toutes les propositions sauf les doublons.
 * @param proposals - Propositions nettoyées
 * @param payload   - Synthèse actuelle
 */
export function defaultSelection(proposals: Synthesize, payload: SynthesisPayload): Set<number> {
  const duplicates = duplicateIndexes(proposals, payload);
  return new Set(
    indexProposals(proposals)
      .map((entry) => entry.index)
      .filter((index) => !duplicates.has(index)),
  );
}

// ==================== APPLICATION ====================

/**
 * Ajoute à la synthèse les propositions cochées, sans rien remplacer.
 *
 * Chaque proposition reçoit un nouvel identifiant ; les liens vers une proposition non
 * ajoutée sont retirés. Les doublons et ce qui dépasse les plafonds (30 éléments par case,
 * 40 pistes, 3 enjeux) sont ignorés. Un enjeu vide existant est rempli avant d'en créer un.
 * Un élément tiré du profil seul (sans origine) est préfixé par la mention « à vérifier ».
 *
 * @param payload   - Synthèse actuelle
 * @param proposals - Propositions nettoyées
 * @param selected  - Indices cochés
 * @param newId     - Fabrique d'identifiants (crypto.randomUUID côté navigateur)
 * @param toVerify  - Préfixe d'un élément à vérifier (ex. « À vérifier : »)
 * @returns Nouvelle synthèse et indices réellement ajoutés
 *
 * Exemple d'utilisation :
 *   const { payload: next, applied } = applyProposals(value, output, checked, uuid, label);
 */
export function applyProposals(
  payload: SynthesisPayload,
  proposals: Synthesize,
  selected: ReadonlySet<number>,
  newId: () => string,
  toVerify: string,
): { payload: SynthesisPayload; applied: Set<number> } {
  const duplicates = duplicateIndexes(proposals, payload);
  const wanted = (index: number) => selected.has(index) && !duplicates.has(index);
  const applied = new Set<number>();
  // Ref d'une proposition ajoutée vers son nouvel identifiant
  const ids = new Map<string, string>();
  const swotIds = new Set(SWOT_KEYS.flatMap((key) => payload.swot[key].map((item) => item.id)));
  const towsIds = new Set(payload.tows.map((item) => item.id));
  const convert = (links: readonly string[], existing: (id: string) => boolean) => [
    ...new Set(links.flatMap((link) => {
      if (ids.has(link)) return [ids.get(link) as string];
      return existing(link) ? [link] : [];
    })),
  ];

  const swot = { ...payload.swot };
  const tows = [...payload.tows];
  const issues = [...payload.issues];

  for (const entry of indexProposals(proposals)) {
    if (!wanted(entry.index)) continue;
    const id = newId();

    if (entry.kind === "swot") {
      const { key, text, origin, ref } = entry.item;
      if (swot[key].length >= SWOT_ITEMS_MAX) continue;
      const body = origin ? text : `${toVerify} ${text}`.slice(0, ITEM_TEXT_MAX);
      swot[key] = [...swot[key], newSwotItem(id, body, origin)];
      ids.set(ref, id);
    } else if (entry.kind === "tows") {
      if (tows.length >= TOWS_MAX) continue;
      const { quadrant, text, links, ref } = entry.item;
      tows.push({ id, quadrant, text, links: convert(links, (link) => swotIds.has(link)) });
      ids.set(ref, id);
    } else {
      const { title, explanation, links } = entry.item;
      const slot = issues.findIndex(blankIssue);
      if (slot < 0 && issues.length >= ISSUES_MAX) continue;
      const issue = {
        id: slot < 0 ? id : issues[slot].id,
        title,
        explanation,
        links: convert(links, (link) => swotIds.has(link) || towsIds.has(link)),
      };
      if (slot < 0) issues.push(issue);
      else issues[slot] = issue;
    }
    applied.add(entry.index);
  }

  return { payload: { swot, tows, issues }, applied };
}
