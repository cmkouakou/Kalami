/**
 * Fichier    : security.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires du durcissement de sécurité (Sprint 11s, v0.13.0) : en-têtes
 *              HTTP et CSP, protection CSRF du proxy, signature des fichiers déposés, secret
 *              des tâches planifiées, sujets et comptage de la limitation de débit, lecture
 *              d'un événement Stripe charge.refunded.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-22
 */

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
const createSignedUrl = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc, storage: { from: () => ({ createSignedUrl }) } }),
}));

const { contentSecurityPolicy, securityHeaders } = await import("@/lib/security/headers");
const { isCrossSiteMutation } = await import("@/lib/security/csrf");
const { matchesExtension, sniffFileType, storedFileMatchesExtension } = await import(
  "@/lib/security/file-signature"
);
const { constantTimeEqual, isCronAuthorized } = await import("@/lib/security/cron");
const { allowAttempt, allowAttempts, emailSubject, ipSubject, userSubject } = await import(
  "@/lib/security/rate-limit"
);
const { refundNoticeOf } = await import("@/lib/payments/stripe");

const SUPABASE = "https://abc.supabase.co";

/** Octets d'un fichier à partir d'une liste de valeurs. */
const bytesOf = (...values: number[]) => new Uint8Array([...values, ...Array(16).fill(0)]);

const PNG = bytesOf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const HTML = new TextEncoder().encode("<html><script>alert(1)</script>");

afterEach(() => {
  vi.restoreAllMocks();
  rpc.mockReset();
  createSignedUrl.mockReset();
});

// ==================== EN-TÊTES ====================

describe("contentSecurityPolicy", () => {
  it("limite les origines au site et au projet Supabase", () => {
    const csp = contentSecurityPolicy(`${SUPABASE}/rest/v1`, false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain(`connect-src 'self' ${SUPABASE} wss://abc.supabase.co`);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("permet unsafe-eval en développement seulement, sans forcer HTTPS", () => {
    const csp = contentSecurityPolicy(SUPABASE, true);
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("se replie sur *.supabase.co si l'URL manque ou est invalide", () => {
    expect(contentSecurityPolicy(undefined, false)).toContain("https://*.supabase.co");
    expect(contentSecurityPolicy("pas une url", false)).toContain("https://*.supabase.co");
  });

  it("n'admet Google Analytics que s'il est configuré", () => {
    expect(contentSecurityPolicy(SUPABASE, false)).not.toContain("googletagmanager");
    const csp = contentSecurityPolicy(SUPABASE, false, true);
    expect(csp).toMatch(/script-src [^;]*https:\/\/\*\.googletagmanager\.com/);
    expect(csp).toMatch(/connect-src [^;]*https:\/\/\*\.google-analytics\.com/);
    expect(csp).toMatch(/img-src [^;]*https:\/\/\*\.google-analytics\.com/);
    expect(csp).toContain("frame-src 'none'");
  });
});

describe("securityHeaders", () => {
  const keys = (isDev: boolean) => securityHeaders(SUPABASE, isDev).map((h) => h.key);

  it("envoie HSTS hors développement", () => {
    expect(keys(false)).toContain("Strict-Transport-Security");
    expect(keys(true)).not.toContain("Strict-Transport-Security");
  });

  it("refuse l'affichage en cadre et le reniflage de type", () => {
    const list = securityHeaders(SUPABASE, false);
    const headers = Object.fromEntries(list.map((h) => [h.key, h.value]));
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });
});

// ==================== CSRF ====================

describe("isCrossSiteMutation", () => {
  const check = (method: string, path: string, headers: Record<string, string>) =>
    isCrossSiteMutation(method, path, new Headers(headers));

  it("laisse passer les méthodes sans effet", () => {
    expect(check("GET", "/", { "sec-fetch-site": "cross-site" })).toBe(false);
  });

  it("laisse passer une requête du même site", () => {
    const headers = { origin: "https://kalami-livres.com", host: "kalami-livres.com" };
    expect(check("POST", "/compte", headers)).toBe(false);
  });

  it("refuse une origine étrangère ou invalide", () => {
    expect(check("POST", "/compte", { origin: "https://evil.com", host: "kalami-livres.com" }))
      .toBe(true);
    expect(check("POST", "/compte", { origin: "null", host: "kalami-livres.com" })).toBe(true);
    expect(check("POST", "/compte", { "sec-fetch-site": "cross-site" })).toBe(true);
  });

  it("préfère x-forwarded-host derrière Vercel", () => {
    const headers = {
      origin: "https://kalami-livres.com",
      host: "interne.vercel.app",
      "x-forwarded-host": "kalami-livres.com",
    };
    expect(check("POST", "/", headers)).toBe(false);
  });

  it("refuse une action serveur sans Origin, accepte un autre appel sans Origin", () => {
    expect(check("POST", "/compte", { "next-action": "abc" })).toBe(true);
    expect(check("POST", "/api/x", {})).toBe(false);
  });

  it("exclut le webhook Stripe", () => {
    expect(check("POST", "/api/stripe/webhook", { "sec-fetch-site": "cross-site" })).toBe(false);
  });
});

// ==================== SIGNATURE DES FICHIERS ====================

describe("sniffFileType / matchesExtension", () => {
  it("reconnaît les formats admis", () => {
    expect(sniffFileType(bytesOf(0x25, 0x50, 0x44, 0x46, 0x2d))).toBe("pdf");
    expect(sniffFileType(PNG)).toBe("png");
    expect(sniffFileType(bytesOf(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
    expect(sniffFileType(bytesOf(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe("gif");
    const webp = bytesOf(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50);
    expect(sniffFileType(webp)).toBe("webp");
    expect(sniffFileType(bytesOf(0x50, 0x4b, 0x03, 0x04))).toBe("zip");
    expect(sniffFileType(HTML)).toBeNull();
  });

  it("refuse un contenu qui ne correspond pas à l'extension", () => {
    expect(matchesExtension(PNG, "PNG")).toBe(true);
    expect(matchesExtension(HTML, "png")).toBe(false);
    expect(matchesExtension(PNG, "jpg")).toBe(false);
    expect(matchesExtension(PNG, "svg")).toBe(false);
    expect(matchesExtension(bytesOf(0x50, 0x4b, 0x03, 0x04), "docx")).toBe(true);
  });
});

describe("storedFileMatchesExtension", () => {
  it("lit seulement les premiers octets du fichier déposé", async () => {
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://s/x" }, error: null });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(PNG));
    expect(await storedFileMatchesExtension("covers", "livres/a/b.png")).toBe(true);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Range).toBe("bytes=0-15");
  });

  it("refuse un fichier forgé, absent ou illisible", async () => {
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://s/x" }, error: null });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(HTML));
    expect(await storedFileMatchesExtension("covers", "livres/a/b.png")).toBe(false);

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("réseau"));
    expect(await storedFileMatchesExtension("covers", "livres/a/b.png")).toBe(false);

    createSignedUrl.mockResolvedValue({ data: null, error: { message: "absent" } });
    expect(await storedFileMatchesExtension("covers", "livres/a/b.png")).toBe(false);
  });
});

// ==================== TÂCHES PLANIFIÉES ====================

describe("isCronAuthorized", () => {
  const withAuth = (value: string) => new Headers({ authorization: value });

  it("compare le secret en temps constant", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });

  it("accepte seulement le bon secret, refuse si le secret n'est pas configuré", () => {
    expect(isCronAuthorized(withAuth("Bearer s3cret"), "s3cret")).toBe(true);
    expect(isCronAuthorized(withAuth("Bearer autre"), "s3cret")).toBe(false);
    expect(isCronAuthorized(new Headers(), "s3cret")).toBe(false);
    expect(isCronAuthorized(withAuth("Bearer "), "")).toBe(false);
    expect(isCronAuthorized(withAuth("Bearer undefined"), undefined)).toBe(false);
  });
});

// ==================== LIMITATION DE DÉBIT ====================

describe("sujets de limitation", () => {
  it("prend la première adresse transmise par le proxy", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(ipSubject(headers)).toBe("ip:1.2.3.4");
    expect(ipSubject(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("ip:5.6.7.8");
    expect(ipSubject(new Headers())).toBe("ip:inconnue");
  });

  it("ne conserve jamais le courriel en clair", () => {
    const subject = emailSubject(" Marie@Exemple.com ");
    expect(subject).toBe(emailSubject("marie@exemple.com"));
    expect(subject).toMatch(/^email:[0-9a-f]{32}$/);
    expect(subject).not.toContain("marie");
    expect(userSubject("u1")).toBe("user:u1");
  });
});

describe("allowAttempt", () => {
  it("transmet la limite du compartiment et suit la réponse de la base", async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null });
    expect(await allowAttempt("promo_user", "user:u1")).toBe(false);
    expect(rpc).toHaveBeenCalledWith("hit_rate_limit", {
      p_bucket: "promo_user",
      p_subject: "user:u1",
      p_limit: 10,
      p_window_seconds: 600,
    });
  });

  it("laisse passer pendant une panne de la base", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    rpc.mockResolvedValueOnce({ data: null, error: { code: "500", message: "panne" } });
    expect(await allowAttempt("login_ip", "ip:1.2.3.4")).toBe(true);
  });

  it("refuse si l'un des compartiments est saturé, en les comptant tous", async () => {
    rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null });
    const allowed = await allowAttempts([
      ["login_ip", "ip:1.2.3.4"],
      ["login_email", "email:x"],
    ]);
    expect(allowed).toBe(false);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});

// ==================== REMBOURSEMENT STRIPE ====================

describe("refundNoticeOf", () => {
  it("lit un remboursement total ou partiel", () => {
    expect(refundNoticeOf({ payment_intent: "pi_1", refunded: true, amount_refunded: 500 }))
      .toEqual({ paymentId: "pi_1", full: true });
    expect(refundNoticeOf({ payment_intent: "pi_1", refunded: false, amount_refunded: 100 }))
      .toEqual({ paymentId: "pi_1", full: false });
  });

  it("ignore une charge non remboursée ou sans paiement valide", () => {
    expect(refundNoticeOf({ payment_intent: "pi_1", refunded: false, amount_refunded: 0 }))
      .toBeNull();
    expect(refundNoticeOf({ payment_intent: "ch_1", refunded: true })).toBeNull();
    expect(refundNoticeOf({ payment_intent: "pi_1'; drop", refunded: true })).toBeNull();
    expect(refundNoticeOf(null)).toBeNull();
  });
});
