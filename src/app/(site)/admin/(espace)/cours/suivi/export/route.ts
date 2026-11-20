/**
 * =============================================================
 *  Fichier    : route.ts (admin/cours/suivi/export)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Export CSV du suivi des apprenants (v0.29.0), pour toutes les cohortes
 *               ou une seule (?cohorte=…). Réservé à l'administrateur (aal2) ; la
 *               fonction SQL vérifie aussi le rôle. Fichier jamais mis en cache.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/admin-queries.ts, lib/cours/suivi.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/dal";
import { listerApprenants, listerCohortes } from "@/lib/cours/admin-queries";
import { exporterCsv, trier } from "@/lib/cours/suivi";

/**
 * Nom de fichier sûr : lettres, chiffres et tirets seulement.
 * @param texte - Nom de la cohorte
 */
function nomFichier(texte: string): string {
  const simple = texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return simple || "cohorte";
}

/**
 * GET /admin/cours/suivi/export[?cohorte=<uuid>]
 * @returns 200 fichier CSV (UTF-8, séparateur « ; »)
 */
export async function GET(request: Request) {
  await requireAdmin();
  const brut = new URL(request.url).searchParams.get("cohorte");
  const cohorte = isUuid(brut) ? brut : null;
  const [apprenants, cohortes] = await Promise.all([
    listerApprenants(cohorte),
    cohorte ? listerCohortes() : Promise.resolve([]),
  ]);

  const nom = cohortes.find((c) => c.id === cohorte)?.name;
  const jour = new Date().toISOString().slice(0, 10);
  const fichier = `suivi-cours-${nom ? nomFichier(nom) : "toutes"}-${jour}.csv`;

  return new Response(exporterCsv(trier(apprenants, "email", "asc")), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fichier}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
