/**
 * =============================================================
 *  Fichier    : lock-screen.tsx (reader)
 *  Projet     : Kalami
 *  Description: Écrans de fin de la liseuse : fin de l'extrait gratuit (feuille avec prix,
 *               retour à la fiche du livre ; aucun paiement avant les sprints dédiés) et fin
 *               du livre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: i18n, components/ui
 * =============================================================
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { IconLock } from "@/components/ui/icons";
import { BUTTON_PRIMARY, BUTTON_TERTIARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";

const t = getDictionary();

/** Feuille centrée commune aux deux écrans de fin. */
const SHEET =
  "mx-auto my-auto flex w-full max-w-md flex-col items-center gap-4 rounded-t-lg " +
  "border border-line bg-surface px-6 py-10 text-center shadow-pop sm:rounded-lg";

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
    <section aria-labelledby="titre-verrou" className={SHEET}>
      <span className="flex size-12 items-center justify-center rounded-full bg-encre-soft
        text-encre">
        <IconLock size={24} />
      </span>
      <h2 id="titre-verrou" className="font-serif text-h2">
        {t.reader.lock.title}
      </h2>
      <p className="text-body text-ink-muted">{interpolate(t.reader.lock.text, { title })}</p>
      <div className="text-h2 text-ocre-text">{price}</div>
      <Link href={back} className={`${BUTTON_PRIMARY} w-full`}>
        {t.reader.lock.backToBook}
      </Link>
      <p className="text-small text-ink-muted">{t.reader.lock.buySoon}</p>
      {!signedIn && (
        <Link
          href={`/connexion?suivant=${encodeURIComponent(`${back}/lire`)}`}
          className={BUTTON_TERTIARY}
        >
          {t.reader.lock.signIn}
        </Link>
      )}
    </section>
  );
}

/** Fin du livre. */
export function EndScreen({ title, slug }: { title: string; slug: string }) {
  return (
    <section aria-labelledby="titre-fin" className={SHEET}>
      <h2 id="titre-fin" className="font-serif text-h2">
        {t.reader.end.title}
      </h2>
      <p className="text-body text-ink-muted">{interpolate(t.reader.end.text, { title })}</p>
      <Link href={`/livres/${slug}`} className={BUTTON_PRIMARY}>
        {t.reader.end.backToBook}
      </Link>
    </section>
  );
}
