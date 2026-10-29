/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/etudes/[id]/coach)
 *  Projet     : Kalami Stratégie
 *  Description: Page du coach d'une étude (v0.11.1) : état du forfait (verrouillé, en
 *               cours, épuisé) avec la jauge en pourcentage, consommation par étape et par
 *               fonction, puis forfaits proposés (≈ nombre de relectures, prix dans la devise
 *               du visiteur). Achat par carte (v0.10.2) pour le propriétaire et l'enseignant
 *               (remise enseignant) ; ouverte à tous les membres ; jamais de
 *               dollars US de coût affichés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-19
 *  Dépendances: lib/strategy/queries.ts, lib/strategy/coach/queries.ts, lib/currency.ts,
 *               lib/currency-server.ts, lib/payments/offers.ts, lib/strategy/class-queries.ts,
 *               components/strategy/coach-panel.tsx, components/catalog/buy-button.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BuyButton } from "@/components/catalog/buy-button";
import { UsageGauge } from "@/components/strategy/coach-panel";
import { CARD, PANEL_SAND } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/currency";
import { getPreferredCurrency } from "@/lib/currency-server";
import { pricesOf } from "@/lib/payments/offers";
import { getStudyClass } from "@/lib/strategy/class-queries";
import { getCoachOverview } from "@/lib/strategy/coach/queries";
import { getStudy } from "@/lib/strategy/queries";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();
const cp = s.coachPage;

const PCT_FORMAT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export const metadata: Metadata = { title: cp.title };

export default function StudyCoachPage({ params }: PageProps<"/strategie/etudes/[id]/coach">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
      <StudyCoach params={params} />
    </Suspense>
  );
}

// ==================== FONCTIONS UTILITAIRES ====================

/** Libellé d'une fonction du coach (code inconnu affiché tel quel). */
function functionLabel(fn: string): string {
  const labels: Record<string, string> = cp.functions;
  return labels[fn] ?? fn;
}

// ==================== CONTENU ====================

/** Charge l'étude, sa consommation et les forfaits proposés. */
async function StudyCoach({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/strategie/etudes/${id}/coach`);
  const study = await getStudy(id, user.id);
  if (!study) notFound();

  const [{ usage, breakdown, offers }, currency, studyClass] = await Promise.all([
    getCoachOverview(study.id),
    getPreferredCurrency(),
    getStudyClass(study.id),
  ]);
  const exhausted = usage.unlocked && usage.usedPct >= 100;
  // Achat réservé au propriétaire et à l'enseignant de la classe (contrôlé aussi en base)
  const isTeacher = studyClass?.teacher_id === user.id;
  const canBuy = usage.enabled && (study.role === "owner" || isTeacher);

  return (
    <main className="flex flex-col gap-6">
      <Link href={`/strategie/etudes/${study.id}`} className="w-fit text-sm text-encre
        hover:underline"
      >
        ← {cp.back}
      </Link>

      {/* ==================== EN-TÊTE ==================== */}
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-ink-muted">{study.company_name}</p>
        <h1 className="font-serif text-h1 font-semibold">{cp.title}</h1>
        <p className="max-w-2xl text-ink-muted">{cp.intro}</p>
      </header>

      {/* ==================== ÉTAT DU FORFAIT ==================== */}
      {!usage.enabled ? (
        <p className={`${PANEL_SAND} p-4`}>{s.coach.disabled}</p>
      ) : !usage.unlocked ? (
        <section className={`${PANEL_SAND} flex flex-col gap-2 p-4`}>
          <h2 className="font-semibold">{cp.lockedTitle}</h2>
          <p>{cp.lockedIntro}</p>
        </section>
      ) : (
        <section className={`${CARD} flex flex-col gap-3 p-4`}>
          <h2 className="font-semibold">{exhausted ? cp.exhaustedTitle : cp.gaugeTitle}</h2>
          {exhausted && <p className="text-warning">{cp.exhaustedIntro}</p>}
          <UsageGauge usage={usage} studyId={study.id} />
        </section>
      )}

      {/* ==================== CONSOMMATION ==================== */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-h2 font-semibold">{cp.breakdownTitle}</h2>
        <p className="text-small text-ink-muted">{cp.breakdownIntro}</p>
        {breakdown.length === 0 ? (
          <p className="text-ink-muted">{cp.noUsage}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th className="py-2 pr-4 font-medium">{cp.columns.step}</th>
                  <th className="py-2 pr-4 font-medium">{cp.columns.fn}</th>
                  <th className="py-2 pr-4 font-medium">{cp.columns.requests}</th>
                  <th className="py-2 font-medium">{cp.columns.pct}</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row) => (
                  <tr key={`${row.stepNo ?? "pieces"}-${row.fn}`} className="border-b border-line">
                    <td className="py-2 pr-4">
                      {row.stepNo === null ? cp.attachments : s.steps[row.stepNo].title}
                    </td>
                    <td className="py-2 pr-4">{functionLabel(row.fn)}</td>
                    <td className="py-2 pr-4">{row.requests}</td>
                    <td className="py-2">
                      {interpolate(cp.pct, { pct: PCT_FORMAT.format(row.pct) })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ==================== FORFAITS ==================== */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-h2 font-semibold">
          {usage.unlocked ? cp.rechargeTitle : cp.offersTitle}
        </h2>
        <p className="text-small text-ink-muted">{cp.offersIntro}</p>
        {offers.length === 0 ? (
          <p className="text-ink-muted">{cp.noOffers}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-3">
            {offers.map((offer) => {
              const discount = isTeacher ? offer.teacherDiscountPct : 0;
              const prices = pricesOf(offer, discount);
              const shown = prices.find((p) => p.currency === currency) ?? prices[0];
              return (
                <li key={offer.id} className={`${CARD} flex flex-col gap-2 p-4`}>
                  <h3 className="font-semibold">{offer.name}</h3>
                  <p className="text-ink-muted">
                    {interpolate(cp.approxReviews, { count: String(offer.approxReviews) })}
                  </p>
                  {discount > 0 && (
                    <p className="text-small text-success">
                      {interpolate(cp.teacherPrice, { pct: String(discount) })}
                    </p>
                  )}
                  {!shown ? (
                    <p className="text-lg font-semibold">{cp.paymentSoon}</p>
                  ) : canBuy ? (
                    <BuyButton
                      item={{ item: "coach_pack", packId: offer.id, studyId: study.id }}
                      groupName={`forfait-${offer.id}`}
                      prices={prices}
                      initialCurrency={currency}
                      className="mt-auto"
                    />
                  ) : (
                    <p className="text-lg font-semibold">
                      {formatPrice(shown.amount_minor, shown.currency)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className={`${PANEL_SAND} p-4 text-small`}>{canBuy ? cp.buyHelp : cp.buyersOnly}</p>
      </section>
    </main>
  );
}
