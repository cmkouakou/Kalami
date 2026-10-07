/**
 * Fichier    : position-route.test.ts
 * Projet     : Kalami
 * Description: Tests de l'API PUT /api/livres/{id}/position (base simulée) : autre origine
 *              → 403 (CSRF), visiteur → 401, corps invalide → 400, livre absent → 404,
 *              enregistrement → 204 avec l'avancement arrondi.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-09
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/livres/[id]/position/route";
import type { CurrentUser } from "@/lib/auth/dal";

const BOOK_ID = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const READER = { id: "11111111-2222-4333-8444-555555555555", aal: "aal1" } as CurrentUser;

// ==================== BASE SIMULÉE ====================

const db = {
  user: null as CurrentUser | null,
  error: null as { code: string; message: string } | null,
  upserts: [] as Record<string, unknown>[],
};

vi.mock("@/lib/auth/dal", () => ({ getCurrentUser: async () => db.user }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      upsert: async (row: Record<string, unknown>) => {
        db.upserts.push(row);
        return { error: db.error };
      },
    }),
  }),
}));

/** Appelle la route ; origin null = aucun en-tête Origin. */
function put(body: unknown, { id = BOOK_ID, origin = "http://localhost" as string | null } = {}) {
  const headers: Record<string, string> = { host: "localhost", "content-type": "application/json" };
  if (origin) headers.origin = origin;
  const request = new NextRequest(`http://localhost/api/livres/${id}/position`, {
    method: "PUT",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return PUT(request, { params: Promise.resolve({ id }) });
}

const VALID = { chapter: 2, block: 5, offset: 120, progress: 0.123456 };

beforeEach(() => {
  db.user = READER;
  db.error = null;
  db.upserts = [];
});

// ==================== TESTS ====================

describe("PUT /api/livres/[id]/position", () => {
  it("enregistre la position du lecteur (204, avancement arrondi)", async () => {
    const response = await put(VALID);
    expect(response.status).toBe(204);
    expect(db.upserts[0]).toMatchObject({
      user_id: READER.id,
      book_id: BOOK_ID,
      chapter_position: 2,
      block_index: 5,
      char_offset: 120,
      progress: 0.1235,
    });
  });

  it("refuse une requête venue d'un autre site ou sans origine (403)", async () => {
    expect((await put(VALID, { origin: "https://pirate.example" })).status).toBe(403);
    expect((await put(VALID, { origin: null })).status).toBe(403);
    expect(db.upserts).toHaveLength(0);
  });

  it("refuse un visiteur (401)", async () => {
    db.user = null;
    expect((await put(VALID)).status).toBe(401);
  });

  it("refuse un corps invalide (400)", async () => {
    expect((await put("pas du json")).status).toBe(400);
    expect((await put({ ...VALID, progress: 2 })).status).toBe(400);
    expect((await put({ ...VALID, chapter: 0 })).status).toBe(400);
    expect((await put({ ...VALID, block: 1.5 })).status).toBe(400);
    expect((await put("x".repeat(2000))).status).toBe(400);
    expect(db.upserts).toHaveLength(0);
  });

  it("répond 404 pour un identifiant invalide ou un livre inexistant", async () => {
    expect((await put(VALID, { id: "pas-un-uuid" })).status).toBe(404);
    db.error = { code: "23503", message: "fk" };
    expect((await put(VALID)).status).toBe(404);
  });
});
