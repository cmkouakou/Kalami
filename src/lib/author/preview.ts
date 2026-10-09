/**
 * =============================================================
 *  Fichier    : preview.ts
 *  Projet     : Kalami
 *  Description: Données de départ de la liseuse en mode « aperçu » : version en attente
 *               de validation (sinon la version publiée), réservée à l'auteur du livre et à
 *               l'administration. Ni position, ni signets, ni surlignages enregistrés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/auth/dal.ts, lib/catalog/images.ts, supabase
 * =============================================================
 */

import "server-only";

import { requireUser } from "@/lib/auth/dal";
import { publicImageUrl } from "@/lib/catalog/images";
import type { BookLanguage, Price, TocEntry } from "@/lib/catalog/types";
import type { ReaderBootstrap } from "@/lib/reader/types";
import { createClient } from "@/lib/supabase/server";

type PreviewBookRow = {
  id: string;
  slug: string;
  title: string;
  language: BookLanguage;
  edition: string | null;
  publication_year: number | null;
  cover_path: string | null;
  book_prices: Price[];
  author: { display_name: string; user_id: string | null };
};

/**
 * Prépare la liseuse pour prévisualiser un livre.
 * @param bookId    - Identifiant du livre (uuid déjà validé)
 * @param chapter   - Chapitre demandé dans l'URL, ou null
 * @returns Données de départ, ou null si le livre est invisible ou sans version
 */
export async function getPreviewData(
  bookId: string,
  chapter: number | null,
): Promise<ReaderBootstrap | null> {
  const user = await requireUser(`/apercu/${bookId}`);
  const supabase = await createClient();

  // RLS : l'auteur voit ses livres, l'administrateur tous ; la fonction SQL revérifie
  const [bookResult, tocResult] = await Promise.all([
    supabase
      .from("books")
      .select(
        "id, slug, title, language, edition, publication_year, cover_path, " +
          "book_prices(currency, amount_minor), author:authors!inner(display_name, user_id)",
      )
      .eq("id", bookId)
      .maybeSingle(),
    supabase.rpc("get_book_preview_toc", { p_book_id: bookId }),
  ]);
  if (bookResult.error || tocResult.error) return null;
  const book = bookResult.data as unknown as PreviewBookRow | null;
  const toc = (tocResult.data ?? []) as Omit<TocEntry, "is_preview">[];
  if (!book || toc.length === 0) return null;

  const isAuthor = book.author.user_id === user.id;
  return {
    book: {
      id: book.id,
      slug: book.slug,
      title: book.title,
      authorName: book.author.display_name,
      language: book.language,
      prices: book.book_prices,
      edition: book.edition,
      publicationYear: book.publication_year,
      coverUrl: publicImageUrl(book.cover_path),
    },
    toc: toc.map((entry) => ({ ...entry, is_preview: true })),
    access: "full",
    // Sans lecteur : la liseuse n'enregistre ni position ni annotations
    reader: null,
    watermark: null,
    position: null,
    bookmarks: [],
    highlights: [],
    requestedChapter: chapter,
    preview: { closeHref: isAuthor ? `/auteur/livres/${book.id}` : `/admin/livres/${book.id}` },
  };
}
