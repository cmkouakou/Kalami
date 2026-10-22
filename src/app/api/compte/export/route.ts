/**
 * =============================================================
 *  Fichier    : route.ts (api/compte/export)
 *  Projet     : Kalami
 *  Description: Téléchargement des renseignements personnels de l'utilisateur connecté au
 *               format JSON (Loi 25). Lecture avec la session : la RLS limite chaque table
 *               aux lignes de l'utilisateur. Cinq exports par heure au plus (Sprint 11s).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-22
 *  Dépendances: lib/account/export.ts, lib/auth/dal.ts, lib/security/rate-limit.ts,
 *               lib/supabase/server.ts
 * =============================================================
 */

import {
  buildPersonalDataExport,
  EXPORT_SECTIONS,
  exportFileName,
} from "@/lib/account/export";
import { getCurrentUser } from "@/lib/auth/dal";
import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";
import { allowAttempt, userSubject } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/compte/export
 * @returns 200 fichier JSON en pièce jointe ; 401 sans session ; 429 trop d'exports ;
 *          500 si une lecture échoue
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse(401);
  if (!(await allowAttempt("export_user", userSubject(user.id)))) return errorResponse(429);

  const supabase = await createClient();
  const results = await Promise.all(
    EXPORT_SECTIONS.map(({ table, column }) =>
      supabase.from(table).select("*").eq(column, user.id),
    ),
  );

  // Un export incomplet serait trompeur : on refuse plutôt que d'omettre une section
  const sections: Record<string, unknown[]> = {};
  for (const [index, { key }] of EXPORT_SECTIONS.entries()) {
    const { data, error } = results[index];
    if (error) {
      return Response.json(
        { error: "export_failed", section: key },
        { status: 500, headers: PRIVATE_HEADERS },
      );
    }
    sections[key] = data ?? [];
  }

  const now = new Date();
  const document = buildPersonalDataExport(
    { id: user.id, email: user.email ?? null },
    sections,
    now,
  );
  return new Response(JSON.stringify(document, null, 2), {
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(now)}"`,
    },
  });
}
