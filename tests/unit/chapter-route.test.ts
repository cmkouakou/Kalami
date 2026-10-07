/**
 * Fichier    : chapter-route.test.ts
 * Projet     : Kalami
 * Description: Tests des API de contenu avec une base simulée.
 *              GET /api/livres/{id}/chapitres/{n} : chapitre 2 sans droit → 403 (test
 *              critique), extrait servi et coupé, droit de lecture → 200, limite de débit
 *              → 429, livre non publié → 404, en-têtes.
 *              GET /api/livres/{id}/recherche : jamais de résultat hors des parties
 *              autorisées (test critique), requête invalide → 400, limite → 429.
 * Auteur     : Claude Marcel
 * Version    : 1.1
 * Date       : 2026-10-09
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/livres/[id]/chapitres/[n]/route";
import { GET as SEARCH } from "@/app/api/livres/[id]/recherche/route";
import type { CurrentUser } from "@/lib/auth/dal";

vi.mock("server-only", () => ({}));

const BOOK_ID = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const READER = { id: "11111111-2222-4333-8444-555555555555", aal: "aal1" } as CurrentUser;

/** Chapitres de la version courante (recherche) : le mot « secret » n'est qu'au chapitre 2. */
const CHAPTERS = [
  { position: 1, title: "Un", blocks: ["<p>le chat dort</p>", "<p>le chat mange</p>"] },
  { position: 2, title: "Deux", blocks: ["<p>le chat secret</p>"] },
];

// ==================== BASE SIMULÉE ====================

/** État de la base simulée, réinitialisé avant chaque test. */
const db = {
  book: {} as Record<string, unknown>,
  entitled: false,
  rateAllowed: true,
  user: null as CurrentUser | null,
};

/** Résultat renvoyé pour une table (maxPosition : filtre .lte("position", n) éventuel). */
function tableResult(table: string, list: boolean, maxPosition: number) {
  if (table === "books") return { data: db.book, error: null };
  if (table === "profiles") return { data: { is_admin: false }, error: null };
  if (table === "entitlements") return { data: db.entitled ? { id: "e1" } : null, error: null };
  if (table === "chapters" && list) {
    return { data: CHAPTERS.filter((chapter) => chapter.position <= maxPosition), error: null };
  }
  if (table === "chapters") {
    const blocks = ["<p>1</p>", "<p>2</p>", "<p>3</p>", "<p>4</p>"];
    return { data: { title: "Titre", blocks }, error: null };
  }
  throw new Error(`Table inattendue : ${table}`);
}

/** Requête chaînable minimale ; .order() signale une liste (recherche). */
function query(table: string) {
  let list = false;
  let maxPosition = Infinity;
  const builder = {
    select: () => builder,
    eq: () => builder,
    is: () => builder,
    lte: (_column: string, value: number) => {
      maxPosition = value;
      return builder;
    },
    order: () => {
      list = true;
      return builder;
    },
    maybeSingle: () => Promise.resolve(tableResult(table, list, maxPosition)),
    then: (resolve: (value: unknown) => unknown) => resolve(tableResult(table, list, maxPosition)),
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => query(table),
    rpc: async () => ({ data: db.rateAllowed, error: null }),
  }),
}));

vi.mock("@/lib/auth/dal", () => ({ getCurrentUser: async () => db.user }));

/** Appelle la route des chapitres comme le ferait Next.js. */
function call(position: string, id = BOOK_ID) {
  const request = new NextRequest(`http://localhost/api/livres/${id}/chapitres/${position}`);
  return GET(request, { params: Promise.resolve({ id, n: position }) });
}

/** Appelle la route de recherche. */
async function search(q: string, id = BOOK_ID) {
  const url = `http://localhost/api/livres/${id}/recherche?q=${encodeURIComponent(q)}`;
  return SEARCH(new NextRequest(url), { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  db.book = {
    id: BOOK_ID,
    status: "published",
    preview_chapters: 1,
    preview_cut_block: null,
    current_version_id: "v1",
    chapter_count: 3,
    author: { user_id: null },
  };
  db.entitled = false;
  db.rateAllowed = true;
  db.user = null;
});

// ==================== TESTS — CHAPITRES ====================

describe("GET /api/livres/[id]/chapitres/[n]", () => {
  it("refuse le chapitre 2 sans droit de lecture (403, aucun contenu)", async () => {
    const response = await call("2");
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("locked");
    expect(body).not.toHaveProperty("blocks");
  });

  it("refuse aussi le chapitre 2 à un lecteur connecté sans droit", async () => {
    db.user = READER;
    expect((await call("2")).status).toBe(403);
  });

  it("sert le chapitre 1 en extrait, sans cache", async () => {
    const response = await call("1");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(await response.json()).toMatchObject({ is_preview: true, truncated: false });
  });

  it("coupe le dernier chapitre de l'extrait", async () => {
    db.book.preview_cut_block = 2;
    const body = await (await call("1")).json();
    expect(body.blocks).toEqual(["<p>1</p>", "<p>2</p>"]);
    expect(body.truncated).toBe(true);
  });

  it("sert le chapitre 2 au lecteur qui a un droit de lecture", async () => {
    db.user = READER;
    db.entitled = true;
    const response = await call("2");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ position: 2, is_preview: false });
  });

  it("répond 429 au-delà de la limite de débit", async () => {
    db.rateAllowed = false;
    const response = await call("1");
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
  });

  it("répond 404 pour un livre non publié, un identifiant ou un numéro invalide", async () => {
    db.book.status = "draft";
    expect((await call("1")).status).toBe(404);
    expect((await call("1", "pas-un-uuid")).status).toBe(404);
    expect((await call("0")).status).toBe(404);
  });
});

// ==================== TESTS — RECHERCHE ====================

describe("GET /api/livres/[id]/recherche", () => {
  it("ne trouve rien hors de l'extrait sans droit de lecture", async () => {
    const response = await search("secret");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(await response.json()).toEqual({ hits: [], limited: false });
  });

  it("respecte la coupure du dernier chapitre de l'extrait", async () => {
    db.book.preview_cut_block = 1;
    const body = await (await search("chat")).json();
    expect(body.hits).toHaveLength(1);
    expect(body.hits[0]).toMatchObject({ chapter: 1, block: 0 });
  });

  it("cherche dans tout le livre avec un droit de lecture", async () => {
    db.user = READER;
    db.entitled = true;
    const body = await (await search("chat")).json();
    expect(body.hits.map((hit: { chapter: number }) => hit.chapter)).toEqual([1, 1, 2]);
    const secret = await (await search("secret")).json();
    expect(secret.hits[0]).toMatchObject({ chapter: 2, title: "Deux" });
  });

  it("répond 400 pour une recherche trop courte, 404 pour un identifiant invalide", async () => {
    expect((await search("a")).status).toBe(400);
    expect((await search("chat", "pas-un-uuid")).status).toBe(404);
  });

  it("répond 429 au-delà de la limite de débit", async () => {
    db.rateAllowed = false;
    expect((await search("chat")).status).toBe(429);
  });
});
