/**
 * =============================================================
 *  Fichier    : actions.ts (lib/legal)
 *  Projet     : Kalami
 *  Description: Actions serveur des textes légaux : choix du bandeau des témoins (registre
 *               des consentements + témoin) et publication d'une nouvelle version par
 *               l'administrateur.
 *               v1.1 : registre écrit par le rôle service, débit limité par adresse IP.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-22
 *  Dépendances: lib/legal/consent.ts, lib/legal/kinds.ts, lib/supabase/server.ts,
 *               lib/supabase/admin.ts, lib/security/rate-limit.ts
 * =============================================================
 */

"use server";

import { refresh, updateTag } from "next/cache";
import { cookies, headers } from "next/headers";

import { getDictionary } from "@/i18n";
import { attempt, requiredText } from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { getCurrentUser, requireAdmin } from "@/lib/auth/dal";
import { allowAttempt, ipSubject } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_VERSION,
  isConsentChoice,
  parseConsent,
  serializeConsent,
} from "./consent";
import { LEGAL_TAG } from "./documents";
import { isLegalKind, type LegalKind } from "./kinds";

const t = getDictionary();

/**
 * Enregistre le choix du bandeau des témoins dans le registre, puis pose le témoin.
 * L'identifiant du visiteur est conservé d'un choix à l'autre (historique du registre).
 *
 * @param choice - « accepted » ou « refused »
 * @returns ok à faux si le choix est invalide ou n'a pas pu être enregistré
 */
export async function recordConsent(choice: unknown): Promise<{ ok: boolean }> {
  if (!isConsentChoice(choice)) return { ok: false };

  const cookieStore = await cookies();
  const previous = parseConsent(cookieStore.get(CONSENT_COOKIE)?.value);
  const visitorId = previous?.visitorId ?? crypto.randomUUID();

  // Registre écrit par le rôle service seulement (v0.13.1) : débit compté par adresse IP
  if (!(await allowAttempt("consent_ip", ipSubject(await headers())))) return { ok: false };
  const user = await getCurrentUser();
  const { error } = await createAdminClient().rpc("record_consent", {
    p_visitor_id: visitorId,
    p_choice: choice,
    p_consent_version: CONSENT_VERSION,
    p_user_id: user?.id ?? null,
  });
  if (error) return { ok: false };

  cookieStore.set(
    CONSENT_COOKIE,
    serializeConsent({ choice, version: CONSENT_VERSION, visitorId }),
    {
      path: "/",
      maxAge: CONSENT_MAX_AGE_SECONDS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );
  return { ok: true };
}

/**
 * Publie une nouvelle version d'un texte légal (type lié par .bind).
 * @param kind     - Type de texte
 * @param formData - Champs title et body
 */
export async function publishLegalDocument(
  kind: LegalKind,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!isLegalKind(kind)) return { error: t.admin.errors.generic };
  // Mêmes limites que la base : titre ≤ 200, texte ≤ 100 000 caractères
  const l = t.admin.legal;
  const parsed = attempt(() => ({
    title: requiredText(formData, "title", l.docTitle, 200),
    body: requiredText(formData, "body", l.body, 100_000),
  }));
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_publish_legal_document", {
    p_kind: kind,
    p_title: parsed.value.title,
    p_body: parsed.value.body,
  });
  if (error) return { error: t.admin.errors.generic };

  updateTag(LEGAL_TAG);
  refresh();
  return { message: t.admin.legal.published };
}
