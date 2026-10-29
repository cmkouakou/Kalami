/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/cas/[code])
 *  Projet     : Kalami Stratégie
 *  Description: Page d'un cas d'entraînement (S10b). Sans accès : présentation, questions
 *               et bouton d'achat (Stripe, Mobile Money, code promo). Avec accès, deux
 *               onglets choisis par ?onglet= : « Dossier du cas » (ouverture de l'étude
 *               préremplie, énoncé, annexes, questions reliées aux étapes, pistes, sources)
 *               et « Corrigé » (une étape à la fois par ?etape=, verrouillée tant qu'elle
 *               n'est pas validée dans l'étude ; ?vue= compare le corrigé de l'auteur et la
 *               réponse de l'élève ; plan et épilogue avec les étapes 1 à 8). Cas inconnu,
 *               ou fermé sans accès : 404. Deux parcours (v0.14.3) : l'exercice, et le cas
 *               résolu (étapes 1 à 8 remplies par l'auteur, plan à générer).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-24
 *  Dépendances: components/strategy/cases/*, lib/strategy/cases/*, components/catalog
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { BuyButton } from "@/components/catalog/buy-button";
import { CaseBlocks } from "@/components/strategy/cases/case-blocks";
import { CaseStepView, type CaseSide } from "@/components/strategy/cases/step-view";
import { IconLock } from "@/components/ui/icons";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, PANEL_SAND } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCurrentUser } from "@/lib/auth/dal";
import { authPath } from "@/lib/auth/routes";
import { getPreferredCurrency } from "@/lib/currency-server";
import { pricesOf } from "@/lib/payments/offers";
import { startPracticeCase, startPracticeCaseExample } from "@/lib/strategy/cases/actions";
import {
  getCaseForSale,
  getMyCaseAccess,
  unlockedCaseCorrections,
} from "@/lib/strategy/cases/queries";
import { getPracticeCase, type PracticeCase } from "@/lib/strategy/cases/registry";
import {
  type CaseAccess,
  isCorrectionUnlocked,
  isEpilogueUnlocked,
} from "@/lib/strategy/cases/unlock";
import { getSourcePayloads, getStudy } from "@/lib/strategy/queries";
import { isStepNo, PLAN_STEP, type StepNo } from "@/lib/strategy/steps";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const c = s.cases;

const TABS = { dossier: c.tabs.statement, corrige: c.tabs.correction };
type Tab = keyof typeof TABS;

const VIEWS = { auteur: c.views.author, moi: c.views.mine };
type View = keyof typeof VIEWS;

const STEPS: StepNo[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const TAB_CLASS = "-mb-px min-h-11 border-b-2 px-3 py-2 text-small";
const TAB_ACTIVE = "border-encre font-semibold text-encre";
const TAB_IDLE = "border-transparent text-ink-muted hover:text-encre";

type Query = Record<string, string | string[] | undefined>;

export const metadata: Metadata = { title: c.kicker };

export default function PracticeCasePage({
  params,
  searchParams,
}: PageProps<"/strategie/cas/[code]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
      <CaseView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

// ==================== FONCTIONS UTILITAIRES ====================

/** Clé connue d'un paramètre de l'adresse, ou la valeur par défaut. */
function keyOf<K extends string>(value: unknown, keys: Record<K, string>, fallback: K): K {
  return typeof value === "string" && Object.hasOwn(keys, value) ? (value as K) : fallback;
}

/** Étape demandée par ?etape=, sinon la première dont le corrigé est ouvert. */
function stepOf(value: unknown, access: CaseAccess): StepNo {
  const no = Number(value);
  if (isStepNo(no)) return no;
  return STEPS.find((step) => isCorrectionUnlocked(access, step)) ?? 1;
}

// ==================== PAGE ====================

/** Charge le cas et l'accès du visiteur, puis la vente ou les onglets de l'acheteur. */
async function CaseView({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Query>;
}) {
  const [{ code }, query] = await Promise.all([params, searchParams]);
  const practiceCase = getPracticeCase(code);
  if (!practiceCase) notFound();
  const user = await getCurrentUser();
  const access = user ? await getMyCaseAccess(code) : null;
  if (!user || !access) {
    return <CaseSale practiceCase={practiceCase} signedIn={Boolean(user)} query={query} />;
  }

  const tab = keyOf(query.onglet, TABS, "dossier");
  const base = `/strategie/cas/${code}`;
  const statement = practiceCase.statement;

  return (
    <main className="flex flex-col gap-6">
      <Link href="/strategie" className="w-fit text-sm text-encre hover:underline">
        ← {c.back}
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">{c.kicker}</p>
        <h1 className="font-serif text-h1 font-semibold">{statement.title}</h1>
        <p className="max-w-3xl text-ink-muted">{statement.lead}</p>
      </header>

      {/* ==================== ONGLETS ==================== */}
      <nav aria-label={statement.title} className="flex flex-wrap gap-1 border-b border-line">
        {(Object.keys(TABS) as Tab[]).map((key) => (
          <Link
            key={key}
            href={`${base}?onglet=${key}`}
            aria-current={key === tab ? "page" : undefined}
            className={`${TAB_CLASS} ${key === tab ? TAB_ACTIVE : TAB_IDLE}`}
          >
            {TABS[key]}
          </Link>
        ))}
      </nav>

      {tab === "dossier" ? (
        <Statement practiceCase={practiceCase} access={access} />
      ) : (
        <Correction
          practiceCase={practiceCase}
          access={access}
          userId={user.id}
          query={query}
        />
      )}
    </main>
  );
}

// ==================== VENTE ====================

/**
 * Présentation du cas à un visiteur sans accès : ce qu'il contient, ses questions, puis
 * l'achat (ou la connexion). Cas fermé à la vente : 404.
 */
async function CaseSale({
  practiceCase,
  signedIn,
  query,
}: {
  practiceCase: PracticeCase;
  signedIn: boolean;
  query: Query;
}) {
  const [sale, currency] = await Promise.all([
    getCaseForSale(practiceCase.code),
    getPreferredCurrency(),
  ]);
  if (!sale) notFound();
  const prices = pricesOf(sale);
  const statement = practiceCase.statement;
  const path = `/strategie/cas/${practiceCase.code}`;

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">{c.kicker}</p>
        <h1 className="font-serif text-h1 font-semibold">{statement.title}</h1>
        <p className="max-w-3xl text-ink-muted">{statement.lead}</p>
      </header>

      {query.paiement === "annule" && (
        <p role="status" className={`${PANEL_SAND} p-4 text-small`}>{c.canceled}</p>
      )}

      <p className="max-w-3xl">{c.pitch}</p>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-h2 font-semibold">{c.includedTitle}</h2>
        <ul className="flex list-disc flex-col gap-1 pl-6">
          {c.included.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-h2 font-semibold">{c.questionsTitle}</h2>
        <ol className="flex list-decimal flex-col gap-1 pl-6">
          {statement.questions.map((question) => <li key={question.id}>{question.title}</li>)}
        </ol>
      </section>

      <section className={`${CARD} flex flex-col gap-3 p-4 sm:p-6`}>
        <h2 className="font-serif text-h2 font-semibold">{c.buyTitle}</h2>
        {signedIn && prices.length > 0 && (
          <BuyButton
            item={{ item: "practice_case", code: practiceCase.code }}
            groupName={`cas-${practiceCase.code}`}
            prices={prices}
            initialCurrency={currency}
          />
        )}
        {!signedIn && (
          <>
            <p className="text-small text-ink-muted">{c.signIn}</p>
            <Link href={authPath("connexion", path)} className={`${BUTTON_PRIMARY} w-fit`}>
              {c.signInLink}
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

// ==================== DOSSIER DU CAS ====================

/** Énoncé complet, avec l'ouverture de l'étude et les questions reliées aux étapes. */
function Statement({ practiceCase, access }: { practiceCase: PracticeCase; access: CaseAccess }) {
  const statement = practiceCase.statement;
  const { studyId, exampleStudyId } = access;

  return (
    <div className="flex flex-col gap-8">
      {/* ==================== DEUX PARCOURS ==================== */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className={`${PANEL_SAND} flex flex-col gap-3 p-4 sm:p-6`}>
          <h2 className="font-serif text-h3 font-semibold">{c.exerciseTitle}</h2>
          {studyId ? (
            <Link href={`/strategie/etudes/${studyId}`} className={`${BUTTON_PRIMARY} w-fit`}>
              {c.open}
            </Link>
          ) : (
            <ActionForm
              action={startPracticeCase.bind(null, practiceCase.code)}
              submitLabel={c.start}
            >
              <p className="text-small text-ink-muted">{c.startHint}</p>
            </ActionForm>
          )}
        </section>

        <section className={`${CARD} flex flex-col gap-3 p-4 sm:p-6`}>
          <h2 className="font-serif text-h3 font-semibold">{c.exampleTitle}</h2>
          {exampleStudyId ? (
            <Link
              href={`/strategie/etudes/${exampleStudyId}`}
              className={`${BUTTON_SECONDARY} w-fit`}
            >
              {c.exampleOpen}
            </Link>
          ) : (
            <ActionForm
              action={startPracticeCaseExample.bind(null, practiceCase.code)}
              submitLabel={c.exampleStart}
            >
              <p className="text-small text-ink-muted">{c.exampleHint}</p>
            </ActionForm>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-h2 font-semibold">{c.introTitle}</h2>
        <CaseBlocks blocks={statement.intro} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-h2 font-semibold">{c.storyTitle}</h2>
        <CaseBlocks blocks={statement.story} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-h2 font-semibold">{c.annexesTitle}</h2>
        <CaseBlocks blocks={statement.annexes} />
      </section>

      {/* ==================== QUESTIONS ==================== */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-h2 font-semibold">{c.questionsTitle}</h2>
        {statement.questions.map((question) => (
          <article key={question.id} className={`${CARD} flex max-w-3xl flex-col gap-2 p-4`}>
            <h3 className="font-semibold">{question.title}</h3>
            <p className="text-caption text-ink-muted">
              {interpolate(c.stepRef, {
                no: String(question.step),
                title: s.steps[question.step].title,
              })}
              {question.module !== null &&
                ` · ${interpolate(c.moduleRef, { module: String(question.module) })}`}
            </p>
            <p>{question.text}</p>
            {studyId && (
              <Link
                href={`/strategie/etudes/${studyId}/etapes/${question.step}`}
                className="w-fit text-small text-encre underline"
              >
                {interpolate(c.answerStep, { no: String(question.step) })}
              </Link>
            )}
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-h2 font-semibold">{c.hintsTitle}</h2>
        <ul className="flex max-w-3xl list-disc flex-col gap-1 pl-6">
          {statement.hints.map((hint) => <li key={hint}>{hint}</li>)}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-h2 font-semibold">{c.sourcesTitle}</h2>
        <ul className="flex max-w-3xl flex-col gap-1 text-small text-ink-muted">
          {statement.sources.map((source) => <li key={source}>{source}</li>)}
        </ul>
      </section>
    </div>
  );
}

// ==================== CORRIGÉ ====================

/** Corrigé d'une étape à la fois, avec la navigation entre étapes et la comparaison. */
async function Correction({
  practiceCase,
  access,
  userId,
  query,
}: {
  practiceCase: PracticeCase;
  access: CaseAccess;
  userId: string;
  query: Query;
}) {
  const step = stepOf(query.etape, access);
  const view = keyOf(query.vue, VIEWS, "auteur");
  const base = `/strategie/cas/${practiceCase.code}?onglet=corrige`;

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl">{c.correctionIntro}</p>
      {access.unlockImmediately && <p className="text-small text-success">{c.immediate}</p>}

      {/* ==================== ÉTAPES ==================== */}
      <nav aria-label={c.stepsNav} className="flex flex-wrap gap-1 border-b border-line">
        {STEPS.map((no) => {
          const open = isCorrectionUnlocked(access, no);
          return (
            <Link
              key={no}
              href={`${base}&etape=${no}&vue=${view}`}
              aria-current={no === step ? "page" : undefined}
              title={s.steps[no].title}
              className={`${TAB_CLASS} flex items-center gap-1 ${
                no === step ? TAB_ACTIVE : TAB_IDLE
              }`}
            >
              {no}
              {!open && <IconLock size={14} />}
              <span className="sr-only">
                {" "}{s.steps[no].title}{!open && ` (${c.lockedLabel})`}
              </span>
            </Link>
          );
        })}
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-h2 font-semibold">
          {interpolate(c.stepRef, { no: String(step), title: s.steps[step].title })}
        </h2>
        <div className="flex gap-2">
          {(Object.keys(VIEWS) as View[]).map((key) => (
            <Link
              key={key}
              href={`${base}&etape=${step}&vue=${key}`}
              aria-current={key === view ? "page" : undefined}
              className={key === view ? BUTTON_PRIMARY : BUTTON_SECONDARY}
            >
              {VIEWS[key]}
            </Link>
          ))}
        </div>
      </header>

      {view === "auteur" ? (
        <AuthorView practiceCase={practiceCase} access={access} step={step} />
      ) : (
        <MyView practiceCase={practiceCase} access={access} userId={userId} step={step} />
      )}
    </div>
  );
}

/** Corrigé de l'auteur pour l'étape, ou ce qu'il faut valider pour l'ouvrir. */
function AuthorView({
  practiceCase,
  access,
  step,
}: {
  practiceCase: PracticeCase;
  access: CaseAccess;
  step: StepNo;
}) {
  if (!isCorrectionUnlocked(access, step)) {
    return (
      <p className={`${CARD} flex items-center gap-2 border-dashed p-4 text-small`}>
        <IconLock size={18} />
        {step === PLAN_STEP ? c.lockedPlan : interpolate(c.locked, { no: String(step) })}
      </p>
    );
  }

  // Seuls les corrigés déjà ouverts servent aux liens entre étapes (aucune fuite)
  const side: CaseSide = {
    studyId: "",
    companyName: practiceCase.companyName,
    competitors: practiceCase.profile.competitors,
    payloads: unlockedCaseCorrections(practiceCase.code, access),
  };
  const epilogue = practiceCase.epilogue;

  return (
    <div className="flex flex-col gap-6">
      <CaseStepView stepNo={step} side={side} />
      {step === PLAN_STEP && isEpilogueUnlocked(access) && (
        <section className={`${PANEL_SAND} flex flex-col gap-3 p-4 sm:p-6`}>
          <h2 className="font-serif text-h2 font-semibold">
            {c.epilogueTitle} · {epilogue.title}
          </h2>
          <CaseBlocks blocks={epilogue.blocks} />
        </section>
      )}
    </div>
  );
}

/** Réponse de l'élève à l'étape, lue dans son étude du cas. */
async function MyView({
  practiceCase,
  access,
  userId,
  step,
}: {
  practiceCase: PracticeCase;
  access: CaseAccess;
  userId: string;
  step: StepNo;
}) {
  const study = access.studyId ? await getStudy(access.studyId, userId) : null;
  if (!study) return <p className={`${PANEL_SAND} p-4 text-small`}>{c.noStudy}</p>;

  const goTo = (
    <Link
      href={`/strategie/etudes/${study.id}/etapes/${step}`}
      className="w-fit text-small text-encre underline"
    >
      {interpolate(c.goToStep, { no: String(step) })}
    </Link>
  );
  if (study.steps[step].status === "todo") {
    return (
      <div className="flex flex-col gap-2">
        <p className={`${PANEL_SAND} p-4 text-small`}>{c.noAnswer}</p>
        {goTo}
      </div>
    );
  }

  const side: CaseSide = {
    studyId: study.id,
    companyName: study.company_name || practiceCase.companyName,
    competitors: study.profile.competitors,
    payloads: await getSourcePayloads(study.id, STEPS),
  };
  return (
    <div className="flex flex-col gap-4">
      {goTo}
      <CaseStepView stepNo={step} side={side} />
    </div>
  );
}
