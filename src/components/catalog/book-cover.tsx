/**
 * =============================================================
 *  Fichier    : book-cover.tsx
 *  Projet     : Kalami
 *  Description: Couverture d'un livre (image optimisée), ou vignette de remplacement avec
 *               le titre quand aucune couverture n'a encore été envoyée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: next/image, lib/catalog/images.ts
 * =============================================================
 */

import Image from "next/image";

import { getDictionary } from "@/i18n";
import { publicImageUrl } from "@/lib/catalog/images";

const t = getDictionary();

type BookCoverProps = {
  title: string;
  coverPath: string | null;
  /** Largeurs d'affichage, pour le choix de la taille d'image (attribut sizes). */
  sizes: string;
  priority?: boolean;
};

/** Couverture au format 2:3, avec repli typographique. */
export function BookCover({ title, coverPath, sizes, priority = false }: BookCoverProps) {
  const src = publicImageUrl(coverPath);

  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm bg-surface
      shadow-book">
      {src ? (
        <Image
          src={src}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full flex-col justify-between bg-encre-soft p-3">
          <span className="font-serif text-book-title text-encre">{title}</span>
          <span className="text-caption text-ink-muted uppercase">{t.catalog.noCover}</span>
        </div>
      )}
    </div>
  );
}
