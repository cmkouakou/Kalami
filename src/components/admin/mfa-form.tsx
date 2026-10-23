/**
 * =============================================================
 *  Fichier    : mfa-form.tsx
 *  Projet     : Kalami
 *  Description: Vérification en deux étapes (TOTP) de l'administrateur :
 *               - aucun facteur vérifié → enrôlement (code QR + clé) puis vérification ;
 *               - facteur existant      → saisie du code à 6 chiffres.
 *               Une fois vérifiée, la session passe au niveau aal2.
 *               v1.1 : émetteur « Kalami » dans l'application d'authentification (et non
 *               l'adresse du site) ; remplacement de l'application : le nouveau facteur est
 *               vérifié avant la suppression de l'ancien.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-22
 *  Dépendances: lib/supabase/client.ts
 * =============================================================
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { FormMessage } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { createClient } from "@/lib/supabase/client";

const t = getDictionary();

/** Nom affiché dans l'application d'authentification (sinon l'adresse du site). */
const ISSUER = "Kalami";

type Enrollment = {
  factorId: string;
  qrCode: string | null;
  secret: string | null;
  /** Facteurs vérifiés à supprimer une fois le nouveau vérifié (remplacement). */
  replaced: string[];
};

/**
 * Prépare le facteur TOTP : réutilise un facteur vérifié, sinon en crée un nouveau
 * (après suppression des tentatives d'enrôlement non terminées).
 * @param replace - Vrai pour créer un nouveau facteur même si un facteur vérifié existe
 */
async function prepareFactor(replace: boolean): Promise<Enrollment> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;

  const verified = data.totp.filter((f) => f.status === "verified");
  if (verified.length > 0 && !replace) {
    return { factorId: verified[0].id, qrCode: null, secret: null, replaced: [] };
  }

  const unfinished = data.all.filter((f) => f.factor_type === "totp" && f.status !== "verified");
  await Promise.all(unfinished.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })));

  // Le nom doit être unique par compte : l'ancien facteur existe encore pendant le remplacement
  const friendlyName = replace ? `${ISSUER} ${new Date().toISOString()}` : ISSUER;
  const enrolled = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
    issuer: ISSUER,
  });
  if (enrolled.error) throw enrolled.error;
  return {
    factorId: enrolled.data.id,
    qrCode: enrolled.data.totp.qr_code,
    secret: enrolled.data.totp.secret,
    replaced: verified.map((f) => f.id),
  };
}

/**
 * Formulaire d'enrôlement ou de vérification TOTP.
 * @param replace - Remplacement de l'application d'authentification (session aal2)
 */
export function MfaForm({ replace = false }: { replace?: boolean }) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    prepareFactor(replace)
      .then(setEnrollment)
      .catch(() => setError(t.auth.errors.generic));
  }, [replace]);

  /** Vérifie le code saisi et ouvre l'administration. */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!enrollment) return;
    setPending(true);
    setError(undefined);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollment.factorId,
        code,
      });
      if (verifyError) {
        setError(t.admin.mfa.invalidCode);
        return;
      }
      // Nouveau facteur vérifié : l'ancienne application peut être retirée
      for (const factorId of enrollment.replaced) {
        await supabase.auth.mfa.unenroll({ factorId });
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError(t.auth.errors.generic);
    } finally {
      setPending(false);
    }
  };

  if (!enrollment) {
    return error ? <FormMessage error={error} /> : <p aria-busy="true">…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {enrollment.qrCode ? (
        <>
          <p className="text-sm text-ink-muted">
            {replace ? t.admin.mfa.replaceIntro : t.admin.mfa.enrollIntro}
          </p>
          {/* Code QR fourni par Supabase sous forme d'image SVG (data URL) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrollment.qrCode}
            alt="Code QR"
            width={192}
            height={192}
            className="mx-auto rounded bg-white p-2"
          />
          <p className="text-sm">
            {t.admin.mfa.secretLabel}{" "}
            <code className="break-all rounded bg-paper px-1">{enrollment.secret}</code>
          </p>
        </>
      ) : (
        <p className="text-sm text-ink-muted">{t.admin.mfa.challengeIntro}</p>
      )}

      <label htmlFor="champ-code" className="text-sm font-medium">
        {t.admin.mfa.code}
      </label>
      <input
        id="champ-code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        className="min-h-11 rounded-md border border-line bg-surface px-3 text-center
          text-2xl tracking-[0.5em]"
      />
      <FormMessage error={error} />
      <button
        type="submit"
        disabled={pending || code.length !== 6}
        className="min-h-11 rounded-md bg-encre px-4 font-medium text-on-encre
          disabled:opacity-60"
      >
        {pending ? "…" : t.admin.mfa.verify}
      </button>
    </form>
  );
}
