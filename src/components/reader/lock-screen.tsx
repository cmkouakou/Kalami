/**
 * =============================================================
 *  Fichier    : lock-screen.tsx (reader)
 *  Projet     : Kalami
 *  Description: Écrans de fin de la liseuse : fin de l'extrait gratuit (prix, bouton
 *               « Acheter » inactif jusqu'au Sprint 5, connexion pour un acheteur) et fin
 *               du livre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: i18n
 * =============================================================
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { getDictionary, interpolate } from "@/i18n";

const t = getDictionary();

type LockScreenProps = {
  title: string;
  slug: string;
  /** Prix affiché dans la devise du lecteur (composant serveur PriceTag) */
  price: ReactNode;
  signedIn: boolean;
};

/** Fin de l'extrait : la suite est réservée aux acheteurs. */
export function LockScreen({ title, slug, price, signedIn }: LockScreenProps) {
  const back = `/livres/${slug}`;
  return (
    <section
      aria-labelledby="titre-verrou"
      className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-12 text-center"
    >
      <span aria-hidden="true" className="text-4xl">
        🔒
      </span>
      <h2 id="titre-verrou" className="font-serif text-2xl font-semibold">
        {t.reader.lock.title}
      </h2>
      <p>{interpolate(t.reader.lock.text, { title })}</p>
      <div className="text-2xl">{price}</div>
      <button
        type="button"
        disabled
        className="min-h-11 rounded-md bg-principale px-6 font-medium text-principale-texte
          opacity-60"
      >
        {t.reader.lock.buy}
      </button>
      <p className="text-sm opacity-80">{t.reader.lock.buySoon}</p>
      {!signedIn && (
        <Link
          href={`/connexion?suivant=${encodeURIComponent(`${back}/lire`)}`}
          className="underline"
        >
          {t.reader.lock.signIn}
        </Link>
      )}
      <Link href={back} className="underline">
        {t.reader.lock.backToBook}
      </Link>
    </section>
  );
}

/** Fin du livre. */
export function EndScreen({ title, slug }: { title: string; slug: string }) {
  return (
    <section
      aria-labelledby="titre-fin"
      className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-12 text-center"
    >
      <h2 id="titre-fin" className="font-serif text-2xl font-semibold">
        {t.reader.end.title}
      </h2>
      <p>{interpolate(t.reader.end.text, { title })}</p>
      <Link href={`/livres/${slug}`} className="underline">
        {t.reader.end.backToBook}
      </Link>
    </section>
  );
}
