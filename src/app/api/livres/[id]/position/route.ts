/**
 * =============================================================
 *  Fichier    : route.ts (api/livres/[id]/position)
 *  Projet     : Kalami
 *  Description: Marque-page automatique : enregistre la position de lecture du lecteur
 *               connecté (synchronisée entre ses appareils). Route plutôt qu'action serveur
 *               pour accepter les envois « keepalive » à la fermeture de l'onglet.
 *               Écriture avec le client utilisateur : la RLS limite à ses propres lignes.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/supabase/server.ts, lib/reader/position.ts, lib/content/responses.ts
 * =============================================================
 */

import type { NextRequest } from "next/server";

import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import { errorResponse, PRIVATE_HEADERS } from "@/lib/content/responses";
import { parsePosition } from "@/lib/reader/position";
import { createClient } from "@/lib/supabase/server";

/** Taille maximale du corps de requête (une position tient en moins de 100 octets). */
const MAX_BODY_BYTES = 1024;

/** Code PostgreSQL : clé étrangère absente (livre inexistant). */
const FOREIGN_KEY_VIOLATION = "23503";

/**
 * Refuse les requêtes venues d'un autre site (protection CSRF) : l'en-tête Origin, envoyé
 * par les navigateurs pour toute requête PUT, doit désigner ce site.
 */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/** Lit et valide le corps : position + avancement (0 à 1). */
async function readBody(request: NextRequest) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }
  const position = parsePosition(body);
  const progress = (body as { progress?: unknown }).progress;
  if (!position || typeof progress !== "number" || !(progress >= 0 && progress <= 1)) {
    return null;
  }
  return { ...position, progress: Math.round(progress * 10000) / 10000 };
}

/**
 * PUT /api/livres/{id}/position — corps { chapter, block, offset, progress }
 * @returns 204 ; 400 corps invalide ; 401 non connecté ; 403 autre origine ; 404 livre absent
 */
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/livres/[id]/position">) {
  if (!isSameOrigin(request)) return errorResponse(403);
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(404);

  const user = await getCurrentUser();
  if (!user) return errorResponse(401);

  const saved = await readBody(request);
  if (!saved) return errorResponse(400);

  const supabase = await createClient();
  const { error } = await supabase.from("reading_positions").upsert(
    {
      user_id: user.id,
      book_id: id,
      chapter_position: saved.chapter,
      block_index: saved.block,
      char_offset: saved.offset,
      progress: saved.progress,
    },
    { onConflict: "user_id,book_id" },
  );
  if (error?.code === FOREIGN_KEY_VIOLATION) return errorResponse(404);
  if (error) throw new Error(`Enregistrement de la position impossible : ${error.message}`);

  return new Response(null, { status: 204, headers: PRIVATE_HEADERS });
}
