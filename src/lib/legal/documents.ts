/**
 * =============================================================
 *  Fichier    : documents.ts
 *  Projet     : Kalami
 *  Description: Lectures des textes légaux (confidentialité, conditions d'utilisation et de
 *               vente) : version en vigueur, mise en cache ('use cache') et invalidée à
 *               chaque publication par l'administrateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/supabase/public.ts, lib/legal/kinds.ts
 * =============================================================
 */

import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";

import type { LegalKind } from "./kinds";

/** Étiquette de cache des textes légaux. */
export const LEGAL_TAG = "textes-legaux";

/** Version publiée d'un texte légal. */
export type LegalDocument = {
  id: string;
  kind: LegalKind;
  version: number;
  title: string;
  body: string;
  published_at: string;
};

/**
 * Version en vigueur (la plus récente) d'un texte légal.
 * @param kind - Type de texte
 * @returns Le texte, ou null s'il n'a jamais été publié
 */
export async function getLegalDocument(kind: LegalKind): Promise<LegalDocument | null> {
  "use cache";
  cacheLife("days");
  cacheTag(LEGAL_TAG);

  const { data, error } = await createPublicClient()
    .from("legal_documents")
    .select("id, kind, version, title, body, published_at")
    .eq("kind", kind)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<LegalDocument>();
  if (error) throw new Error(`Lecture du texte légal impossible : ${error.message}`);
  return data;
}
