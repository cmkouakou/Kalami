/**
 * Fichier    : email-send.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires de l'envoi par Resend (v0.11.2) : envoi réussi, variables
 *              absentes, refus de Resend noté avec sa raison (sans la clé), service
 *              injoignable.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-16
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { sendEmail } = await import("@/lib/email/send");

const MESSAGE = {
  to: "membre@exemple.com",
  subject: "Invitation",
  html: "<p>Lien</p>",
  text: "Lien",
};
const KEY = "re_cle_de_test";

describe("sendEmail", () => {
  let logged: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", KEY);
    vi.stubEnv("EMAIL_FROM", "Kalami <invitations@exemple.com>");
    logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("envoie et ne note rien si Resend accepte", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(MESSAGE)).toBe("sent");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.to).toEqual(["membre@exemple.com"]);
    expect(logged).not.toHaveBeenCalled();
  });

  it("n'appelle pas Resend et nomme la variable absente", async () => {
    vi.stubEnv("EMAIL_FROM", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(MESSAGE)).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(String(logged.mock.calls[0][0])).toContain("EMAIL_FROM");
  });

  it("note la raison du refus de Resend, jamais la clé", async () => {
    const refusal = { name: "validation_error", message: "Domaine non vérifié" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify(refusal), { status: 403 }),
    ));
    expect(await sendEmail(MESSAGE)).toBe("failed");
    const line = logged.mock.calls[0].join(" ");
    expect(line).toContain("403");
    expect(line).toContain("validation_error");
    expect(line).toContain("Domaine non vérifié");
    expect(line).not.toContain(KEY);
  });

  it("échoue sans lever d'erreur si Resend est injoignable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(await sendEmail(MESSAGE)).toBe("failed");
    expect(logged.mock.calls[0].join(" ")).toContain("TypeError");
  });
});
