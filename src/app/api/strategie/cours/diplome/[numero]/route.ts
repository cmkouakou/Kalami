/**
 * =============================================================
 *  Fichier    : route.ts (api/strategie/cours/diplome/[numero])
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Téléchargement du diplôme en PDF, produit à la demande et jamais stocké.
 *               Le titulaire n'accède qu'à son propre diplôme ; l'administrateur à tous
 *               (politique RLS de course_diplomas). Lien simple (GET) : la réponse ne
 *               contient que les données du compte connecté, sans effet de bord.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/{acces,diplome-pdf,note-finale}.ts, lib/content/responses.ts,
 *               lib/security/rate-limit.ts
 * =============================================================
 */

import { getCurrentUser } from "@/lib/auth/dal";
import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";
import { COLONNES_DIPLOME, versDiplome } from "@/lib/cours/acces";
import { pdfDiplome } from "@/lib/cours/diplome-pdf";
import { lireNumero } from "@/lib/cours/note-finale";
import { allowAttempt, userSubject } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

/** Durée maximale : lancement de Chromium et impression. */
export const maxDuration = 60;

/**
 * GET /api/strategie/cours/diplome/{numero}
 * @returns 200 PDF en pièce jointe ; 401 non connecté ; 404 numéro invalide ou diplôme
 *          inaccessible ; 429 trop de téléchargements
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/strategie/cours/diplome/[numero]">,
) {
  const numero = lireNumero((await ctx.params).numero);
  if (!numero) return errorResponse(404);

  const user = await getCurrentUser();
  if (!user) return errorResponse(401);
  // Chromium est coûteux : débit limité par compte
  if (!(await allowAttempt("diploma_pdf_user", userSubject(user.id)))) return errorResponse(429);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_diplomas")
    .select(COLONNES_DIPLOME)
    .eq("number", numero)
    .maybeSingle();
  const diplome = error ? null : versDiplome(data as Record<string, unknown> | null);
  if (!diplome) return errorResponse(404);

  const octets = await pdfDiplome(diplome);
  return new Response(Buffer.from(octets), {
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Diplome_${diplome.numero}.pdf"`,
      "Content-Length": String(octets.byteLength),
    },
  });
}
