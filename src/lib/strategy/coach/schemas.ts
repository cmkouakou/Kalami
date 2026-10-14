/**
 * =============================================================
 *  Fichier    : schemas.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Forme des réponses du coach : relecture, questions d'approfondissement (S4b)
 *               évaluation sur 100 avec quatre critères (S4b) et faits d'une recherche Web
 *               (S5a), dont les sources passent par une liste blanche, et propositions de
 *               synthèse (S6b : SWOT avec origine vérifiée, pistes TOWS, enjeux, liens
 *               connus). Le schéma envoyé à l'API reste sans bornes (les sorties
 *               structurées n'acceptent pas ces contraintes) ; le nettoyage qui suit tronque, borne, limite et écarte les codes
 *               de règle inconnus. Utilisable côté client (lecture d'un résultat enregistré).
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-10-14
 *  Dépendances: zod, templates/pestel.ts, templates/forces.ts, templates/synthesis.ts
 * =============================================================
 */

import { z } from "zod";

import { FORCES, type ForceKey } from "@/lib/strategy/templates/forces";
import {
  NATURES,
  PESTEL_DIMENSIONS,
  type Nature,
  type PestelDimension,
} from "@/lib/strategy/templates/pestel";
import {
  ISSUE_EXPLANATION_MAX,
  ISSUE_TITLE_MAX,
  ISSUES_MAX,
  ITEM_TEXT_MAX,
  SOURCE_STEPS,
  SWOT_KEYS,
  TOWS_QUADRANTS,
  type SourceStep,
  type SwotKey,
  type SwotOrigin,
  type TowsQuadrant,
} from "@/lib/strategy/templates/synthesis";

// ==================== CONSTANTES ====================

export const MAX_SUGGESTIONS = 12;
const MAX_SUMMARY = 1500;
const MAX_TITLE = 200;
const MAX_EXPLANATION = 2000;
const MAX_PROPOSAL = 2000;
export const MAX_QUESTIONS = 8;
export const MAX_IMPROVEMENTS = 8;
const MAX_STRENGTHS = 3;
const MAX_QUESTION = 500;
const MAX_WHY = 1000;
const MAX_COMMENT = 600;
const FIELD_PATTERN = /^[a-zA-Z]{1,40}$/;
const ID_PATTERN = /^[A-Za-z0-9-]{1,40}$/;

// ==================== SCHÉMA ENVOYÉ À L'API ====================

/** Réponse brute attendue du modèle (relecture). */
export const reviewOutputSchema = z.object({
  summary: z.string(),
  suggestions: z.array(
    z.object({
      title: z.string(),
      explanation: z.string(),
      ruleCode: z.string().nullable(),
      targetId: z.string().nullable(),
      field: z.string().nullable(),
      proposal: z.string().nullable(),
    }),
  ),
});

export type ReviewOutput = z.infer<typeof reviewOutputSchema>;

/** Suggestion nettoyée, telle qu'enregistrée et affichée. */
export type Suggestion = ReviewOutput["suggestions"][number];

/** Relecture nettoyée. */
export type Review = { summary: string; suggestions: Suggestion[] };

// ==================== NETTOYAGE ====================

/** Coupe un texte trop long et retire les espaces superflus. */
function clip(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/**
 * Nettoie une relecture produite par le modèle.
 *
 * Les suggestions sans titre ni explication sont écartées ; un code de règle inconnu, un
 * identifiant ou un champ mal formé est mis à null ; une proposition n'est conservée que si
 * elle vise un élément et un champ précis.
 *
 * @param raw        - Réponse validée par reviewOutputSchema
 * @param ruleCodes  - Codes des règles transmises au modèle
 * @returns Relecture prête à enregistrer
 */
export function sanitizeReview(raw: ReviewOutput, ruleCodes: readonly string[]): Review {
  const suggestions = raw.suggestions
    .map((item): Suggestion => {
      const targetId = item.targetId && ID_PATTERN.test(item.targetId) ? item.targetId : null;
      const field = item.field && FIELD_PATTERN.test(item.field) ? item.field : null;
      const proposal = item.proposal?.trim() ? clip(item.proposal, MAX_PROPOSAL) : null;
      const precise = Boolean(targetId && field && proposal);
      return {
        title: clip(item.title, MAX_TITLE),
        explanation: clip(item.explanation, MAX_EXPLANATION),
        ruleCode: item.ruleCode && ruleCodes.includes(item.ruleCode) ? item.ruleCode : null,
        targetId: precise ? targetId : null,
        field: precise ? field : null,
        proposal: precise ? proposal : null,
      };
    })
    .filter((item) => item.title || item.explanation)
    .slice(0, MAX_SUGGESTIONS);

  return { summary: clip(raw.summary, MAX_SUMMARY), suggestions };
}

/**
 * Relit une relecture enregistrée en base (colonne output) ; null si elle est illisible.
 * @param raw - Valeur JSON lue en base
 */
export function readReview(raw: unknown): Review | null {
  const parsed = reviewOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return { summary: parsed.data.summary, suggestions: parsed.data.suggestions };
}

// ==================== QUESTIONS D'APPROFONDISSEMENT ====================

/** Réponse brute attendue du modèle (questions). */
export const deepenOutputSchema = z.object({
  intro: z.string(),
  questions: z.array(z.object({ question: z.string(), why: z.string() })),
});

export type DeepenOutput = z.infer<typeof deepenOutputSchema>;

/** Questions nettoyées. */
export type Deepen = DeepenOutput;

/**
 * Nettoie les questions produites par le modèle : textes coupés, questions vides écartées,
 * nombre limité.
 * @param raw - Réponse validée par deepenOutputSchema
 */
export function sanitizeDeepen(raw: DeepenOutput): Deepen {
  const questions = raw.questions
    .map((item) => ({ question: clip(item.question, MAX_QUESTION), why: clip(item.why, MAX_WHY) }))
    .filter((item) => item.question)
    .slice(0, MAX_QUESTIONS);
  return { intro: clip(raw.intro, MAX_SUMMARY), questions };
}

/**
 * Relit des questions enregistrées ; null si elles sont illisibles.
 * @param raw - Valeur JSON lue en base
 */
export function readDeepen(raw: unknown): Deepen | null {
  const parsed = deepenOutputSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

// ==================== ÉVALUATION ====================

/** Critères de l'évaluation, dans l'ordre d'affichage. */
export const SCORE_CRITERIA = ["completeness", "precision", "rules", "coherence"] as const;
export type ScoreCriterion = (typeof SCORE_CRITERIA)[number];

/** Réponse brute attendue du modèle (évaluation). */
export const scoreOutputSchema = z.object({
  summary: z.string(),
  score: z.number(),
  criteria: z.array(
    z.object({ key: z.enum(SCORE_CRITERIA), score: z.number(), comment: z.string() }),
  ),
  strengths: z.array(z.string()),
  improvements: z.array(
    z.object({ title: z.string(), explanation: z.string(), ruleCode: z.string().nullable() }),
  ),
});

export type ScoreOutput = z.infer<typeof scoreOutputSchema>;

/** Évaluation nettoyée. */
export type Score = ScoreOutput;

/** Note entière bornée entre 0 et 100. */
function bound(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
}

/**
 * Nettoie une évaluation produite par le modèle : notes bornées et arrondies, un seul
 * commentaire par critère (dans l'ordre de SCORE_CRITERIA), points vides écartés, codes de
 * règle inconnus mis à null.
 * @param raw       - Réponse validée par scoreOutputSchema
 * @param ruleCodes - Codes des règles transmises au modèle
 */
export function sanitizeScore(raw: ScoreOutput, ruleCodes: readonly string[]): Score {
  const criteria = SCORE_CRITERIA.flatMap((key) => {
    const item = raw.criteria.find((criterion) => criterion.key === key);
    if (!item) return [];
    return [{ key, score: bound(item.score), comment: clip(item.comment, MAX_COMMENT) }];
  });
  const improvements = raw.improvements
    .map((item) => ({
      title: clip(item.title, MAX_TITLE),
      explanation: clip(item.explanation, MAX_EXPLANATION),
      ruleCode: item.ruleCode && ruleCodes.includes(item.ruleCode) ? item.ruleCode : null,
    }))
    .filter((item) => item.title || item.explanation)
    .slice(0, MAX_IMPROVEMENTS);
  const strengths = raw.strengths
    .map((item) => clip(item, MAX_EXPLANATION))
    .filter(Boolean)
    .slice(0, MAX_STRENGTHS);
  return {
    summary: clip(raw.summary, MAX_SUMMARY),
    score: bound(raw.score),
    criteria,
    strengths,
    improvements,
  };
}

/**
 * Relit une évaluation enregistrée ; null si elle est illisible.
 * @param raw - Valeur JSON lue en base
 */
export function readScore(raw: unknown): Score | null {
  const parsed = scoreOutputSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

// ==================== RECHERCHE WEB ====================

export const MAX_FACTS = 10;
const MAX_FACT = 1000;
const MAX_SOURCES_PER_FACT = 3;
const MAX_URL = 2000;
const MAX_SOURCE_TITLE = 500;
const MAX_PAGE_AGE = 100;

/** Contenu attendu de l'outil client soumettre_faits (non borné, comme les autres). */
export const researchOutputSchema = z.object({
  summary: z.string(),
  facts: z.array(
    z.object({
      text: z.string(),
      target: z.string(),
      nature: z.string().nullable(),
      sourceUrls: z.array(z.string()),
    }),
  ),
});

export type ResearchOutput = z.infer<typeof researchOutputSchema>;

/** Résultat de recherche renvoyé par l'API (seule origine admise d'une URL). */
export type SearchHit = { url: string; title: string; pageAge: string | null };

/** Source vérifiée d'un fait. */
export type WebSource = { url: string; title: string; site: string; pageAge: string | null };

/** Fait nettoyé ; sans source vérifiée, il est présenté comme une hypothèse à vérifier. */
export type ResearchFact = {
  text: string;
  target: PestelDimension | ForceKey;
  nature: Nature | null;
  sources: WebSource[];
};

/** Recherche nettoyée. */
export type Research = { summary: string; facts: ResearchFact[] };

/**
 * Forme comparable d'une URL http(s) : sans fragment ni barre oblique finale.
 * @param raw - URL telle que fournie
 * @returns Clé de comparaison, ou null si l'URL n'est pas http(s)
 */
export function urlKey(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.href.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

/** Nom du site d'une URL, sans « www. ». */
function siteOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

/** Cibles admises selon l'étape : dimensions PESTEL (1) ou forces (2). */
export function researchTargets(stepNo: number): readonly string[] {
  return stepNo === 1 ? PESTEL_DIMENSIONS : FORCES;
}

/**
 * Nettoie les faits remis par le modèle.
 *
 * Un fait sans texte ou dont la cible ne correspond pas à l'étape est écarté. Une source
 * n'est gardée que si son URL figure dans les résultats de recherche renvoyés par l'API
 * (jamais une URL fournie seulement par le modèle) ; titre et date viennent de ces résultats.
 * La nature n'a de sens qu'à l'étape 1.
 *
 * @param raw    - Contenu validé par researchOutputSchema
 * @param stepNo - Étape de la demande (1 ou 2)
 * @param hits   - Résultats de recherche réellement renvoyés
 * @returns Recherche prête à enregistrer
 */
export function sanitizeResearch(
  raw: ResearchOutput,
  stepNo: number,
  hits: readonly SearchHit[],
): Research {
  const known = new Map<string, SearchHit>();
  for (const hit of hits) {
    const key = urlKey(hit.url);
    if (key && hit.url.length <= MAX_URL && !known.has(key)) known.set(key, hit);
  }
  const targets = researchTargets(stepNo);

  const facts = raw.facts
    .filter((item) => item.text.trim() && targets.includes(item.target))
    .map((item): ResearchFact => {
      const sources: WebSource[] = [];
      for (const candidate of item.sourceUrls) {
        const key = urlKey(candidate);
        const hit = key ? known.get(key) : undefined;
        if (!hit || sources.some((source) => source.url === hit.url)) continue;
        sources.push({
          url: hit.url,
          title: clip(hit.title, MAX_SOURCE_TITLE),
          site: siteOf(hit.url),
          pageAge: hit.pageAge ? clip(hit.pageAge, MAX_PAGE_AGE) : null,
        });
      }
      const nature = NATURES.find((value) => value === item.nature) ?? null;
      return {
        text: clip(item.text, MAX_FACT),
        target: item.target as PestelDimension | ForceKey,
        nature: stepNo === 1 ? nature : null,
        sources: sources.slice(0, MAX_SOURCES_PER_FACT),
      };
    })
    .slice(0, MAX_FACTS);

  return { summary: clip(raw.summary, MAX_SUMMARY), facts };
}

/** Forme enregistrée d'une recherche nettoyée. */
const storedResearchSchema = z.object({
  summary: z.string(),
  facts: z.array(
    z.object({
      text: z.string(),
      target: z.enum([...PESTEL_DIMENSIONS, ...FORCES]),
      nature: z.enum(NATURES).nullable(),
      sources: z.array(
        z.object({
          url: z.string(),
          title: z.string(),
          site: z.string(),
          pageAge: z.string().nullable(),
        }),
      ),
    }),
  ),
});

/**
 * Relit une recherche enregistrée ; null si elle est illisible. Les liens non http(s) sont
 * retirés par précaution (ils sont affichés comme liens cliquables).
 * @param raw - Valeur JSON lue en base
 */
export function readResearch(raw: unknown): Research | null {
  const parsed = storedResearchSchema.safeParse(raw);
  if (!parsed.success) return null;
  return {
    summary: parsed.data.summary,
    facts: parsed.data.facts.map((fact) => ({
      ...fact,
      sources: fact.sources.filter((source) => urlKey(source.url) !== null),
    })),
  };
}

// ==================== PROPOSITIONS DE SYNTHÈSE ====================

/** Propositions au plus : 8 par case de la SWOT, 8 pistes TOWS, 3 enjeux (43 < 50 décisions). */
export const MAX_SWOT_PROPOSALS = 8;
export const MAX_TOWS_PROPOSALS = 8;
const MAX_LINKS = 20;

/** Réponse brute attendue du modèle (synthèse), sans bornes comme les autres. */
export const synthesizeOutputSchema = z.object({
  summary: z.string(),
  swot: z.array(
    z.object({
      ref: z.string(),
      key: z.enum(SWOT_KEYS),
      text: z.string(),
      sourceStep: z.number().nullable(),
      sourceId: z.string().nullable(),
    }),
  ),
  tows: z.array(
    z.object({
      ref: z.string(),
      quadrant: z.enum(TOWS_QUADRANTS),
      text: z.string(),
      links: z.array(z.string()),
    }),
  ),
  issues: z.array(
    z.object({ title: z.string(), explanation: z.string(), links: z.array(z.string()) }),
  ),
});

export type SynthesizeOutput = z.infer<typeof synthesizeOutputSchema>;

/** Élément de SWOT proposé ; origin null = tiré du profil seul, à vérifier. */
export type SwotProposal = { ref: string; key: SwotKey; text: string; origin: SwotOrigin | null };

/** Piste TOWS proposée ; links : ref d'une proposition ou id d'un élément existant. */
export type TowsProposal = { ref: string; quadrant: TowsQuadrant; text: string; links: string[] };

/** Enjeu proposé. */
export type IssueProposal = { title: string; explanation: string; links: string[] };

/** Propositions nettoyées, telles qu'enregistrées et affichées. */
export type Synthesize = {
  summary: string;
  swot: SwotProposal[];
  tows: TowsProposal[];
  issues: IssueProposal[];
};

/** Identifiants connus pour le nettoyage des propositions. */
export type SynthesizeKnown = {
  /** Identifiants des éléments de chaque étape source (clés des forces pour l'étape 2). */
  sources: Record<SourceStep, ReadonlySet<string>>;
  /** Éléments déjà présents dans la synthèse. */
  swotIds: ReadonlySet<string>;
  towsIds: ReadonlySet<string>;
};

/** Liens uniques, connus, en nombre limité. */
function keepLinks(links: readonly string[], known: ReadonlySet<string>): string[] {
  return [...new Set(links.filter((link) => known.has(link)))].slice(0, MAX_LINKS);
}

/**
 * Nettoie les propositions de synthèse produites par le modèle.
 *
 * Les textes vides sont écartés et les autres coupés. Une origine n'est gardée que si
 * l'élément cité existe dans l'étape source ; sinon l'élément est à vérifier (origin null).
 * Une ref mal formée, en double ou égale à un id existant est remplacée par une ref
 * inaccessible aux liens. Les liens inconnus sont retirés : une piste ne vise que des
 * éléments de SWOT, un enjeu des éléments de SWOT ou des pistes.
 *
 * @param raw   - Réponse validée par synthesizeOutputSchema
 * @param known - Identifiants des étapes sources et de la synthèse actuelle
 * @returns Propositions prêtes à enregistrer
 */
export function sanitizeSynthesize(raw: SynthesizeOutput, known: SynthesizeKnown): Synthesize {
  const used = new Set<string>([...known.swotIds, ...known.towsIds]);
  let spare = 0;
  // Ref utilisable pour les liens, ou ref de remplacement que le modèle n'a pas pu citer
  const claim = (ref: string): { ref: string; linkable: boolean } => {
    const trimmed = ref.trim();
    if (ID_PATTERN.test(trimmed) && !used.has(trimmed)) {
      used.add(trimmed);
      return { ref: trimmed, linkable: true };
    }
    spare += 1;
    return { ref: `~${spare}`, linkable: false };
  };

  const counts = new Map<SwotKey, number>();
  const swotRefs = new Set<string>(known.swotIds);
  const swot: SwotProposal[] = [];
  for (const item of raw.swot) {
    const text = clip(item.text, ITEM_TEXT_MAX);
    const count = counts.get(item.key) ?? 0;
    if (!text || count >= MAX_SWOT_PROPOSALS) continue;
    counts.set(item.key, count + 1);
    const step = SOURCE_STEPS.find((no) => no === item.sourceStep);
    const ref = item.sourceId?.trim() ?? "";
    const origin = step && known.sources[step].has(ref) ? { step, ref } : null;
    const claimed = claim(item.ref);
    if (claimed.linkable) swotRefs.add(claimed.ref);
    swot.push({ ref: claimed.ref, key: item.key, text, origin });
  }

  const towsRefs = new Set<string>(known.towsIds);
  const tows: TowsProposal[] = [];
  for (const item of raw.tows) {
    const text = clip(item.text, ITEM_TEXT_MAX);
    if (!text || tows.length >= MAX_TOWS_PROPOSALS) continue;
    const claimed = claim(item.ref);
    if (claimed.linkable) towsRefs.add(claimed.ref);
    tows.push({ ref: claimed.ref, quadrant: item.quadrant, text,
      links: keepLinks(item.links, swotRefs) });
  }

  const issueTargets = new Set<string>([...swotRefs, ...towsRefs]);
  const issues = raw.issues
    .map((item) => ({
      title: clip(item.title, ISSUE_TITLE_MAX),
      explanation: clip(item.explanation, ISSUE_EXPLANATION_MAX),
      links: keepLinks(item.links, issueTargets),
    }))
    .filter((item) => item.title)
    .slice(0, ISSUES_MAX);

  return { summary: clip(raw.summary, MAX_SUMMARY), swot, tows, issues };
}

/** Forme enregistrée de propositions nettoyées. */
const storedSynthesizeSchema = z.object({
  summary: z.string(),
  swot: z.array(
    z.object({
      ref: z.string(),
      key: z.enum(SWOT_KEYS),
      text: z.string(),
      origin: z
        .object({ step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
          ref: z.string() })
        .nullable(),
    }),
  ),
  tows: z.array(
    z.object({
      ref: z.string(),
      quadrant: z.enum(TOWS_QUADRANTS),
      text: z.string(),
      links: z.array(z.string()),
    }),
  ),
  issues: z.array(
    z.object({ title: z.string(), explanation: z.string(), links: z.array(z.string()) }),
  ),
});

/**
 * Relit des propositions de synthèse enregistrées ; null si elles sont illisibles.
 * @param raw - Valeur JSON lue en base
 */
export function readSynthesize(raw: unknown): Synthesize | null {
  const parsed = storedSynthesizeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
