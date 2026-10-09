/**
 * =============================================================
 *  Fichier    : page.tsx (auteur/profil)
 *  Projet     : Kalami
 *  Description: Profil de l'auteur (/auteur/profil) : fiche publique (nom, biographie,
 *               photo) et coordonnées de versement (privées : l'auteur et l'administration).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/author/queries.ts, lib/author/actions.ts, components/author
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { ImageUpload } from "@/components/admin/image-upload";
import { PayoutForm } from "@/components/author/payout-form";
import { Field, TextArea } from "@/components/ui/form";
import { CARD } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { setOwnPhoto, updateAuthorProfile } from "@/lib/author/actions";
import { getPayoutDetails, requireAuthor } from "@/lib/author/queries";

const t = getDictionary();
const p = t.author.profile;

export const metadata: Metadata = { title: p.title };

export default function AuthorProfilePage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold">{p.title}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}

/** Fiche publique et versements de l'auteur connecté. */
async function ProfileContent() {
  const { author } = await requireAuthor("/auteur/profil");
  const payout = await getPayoutDetails(author.id);

  return (
    <>
      {/* ==================== FICHE PUBLIQUE ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">{p.public}</h2>
          <Link href={`/auteurs/${author.slug}`} className="text-sm text-encre hover:underline">
            {t.admin.common.view}
          </Link>
        </div>
        <div className="grid gap-8 md:grid-cols-[1fr_10rem]">
          <ActionForm action={updateAuthorProfile} submitLabel={t.admin.common.save}>
            <Field
              label={t.author.register.displayName}
              name="display_name"
              required
              maxLength={120}
              defaultValue={author.display_name}
            />
            <TextArea
              label={t.author.register.bio}
              name="bio"
              rows={6}
              maxLength={5000}
              defaultValue={author.bio ?? ""}
            />
          </ActionForm>
          <ImageUpload
            kind="author"
            id={author.id}
            label={p.photo}
            currentPath={author.photo_path}
            save={setOwnPhoto}
          />
        </div>
      </section>

      {/* ==================== VERSEMENTS ==================== */}
      <section className={`${CARD} flex flex-col gap-4 p-6`}>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{p.payout}</h2>
          <p className="text-sm text-ink-muted">{p.payoutHelp}</p>
        </div>
        <PayoutForm payout={payout} />
      </section>
    </>
  );
}
