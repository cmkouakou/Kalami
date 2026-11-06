/**
 * =============================================================
 *  Fichier    : powerbi-chrome.tsx
 *  Projet     : Kalami Données
 *  Description: En-tête et pied de page propres à Kalami Données : l'espace se suffit à
 *               lui-même, connexion et déconnexion ramènent à /powerbi. Une pastille
 *               rappelle que la section est privée pendant sa construction, et le pied
 *               de page porte la mention d'absence d'affiliation avec Microsoft.
 *               v1.1 (v0.18.0) : liens vers le parcours et le chantier.
 *               v1.2 (v0.21.0) : classes de la charte powerbi4you (powerbi.css).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-11-05
 *  Dépendances: lib/auth/dal.ts, lib/auth/actions.ts, lib/auth/routes.ts, i18n
 * =============================================================
 */

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { LegalLinks } from "@/components/legal/legal-links";
import { getDictionary, interpolate } from "@/i18n";
import { getPowerbiDictionary } from "@/i18n/powerbi";
import { signOut } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/dal";
import { authPath, POWERBI_HOME } from "@/lib/auth/routes";
import { APP_NAME } from "@/lib/config";

import { PowerbiNav } from "./powerbi-nav";

const t = getDictionary();
const d = getPowerbiDictionary();

// ==================== EN-TÊTE ====================

/** En-tête de l'espace : marque, pastille « privé », onglets et compte. */
export function PowerbiHeader() {
  return (
    <header className="entete">
      <nav aria-label={d.title} className="shell">
        <Link href={POWERBI_HOME} className="marque">
          <Image src="/brand/kalami-mark.svg" alt="" width={26} height={26} />
          {d.title}
        </Link>
        <span className="pastille" title={d.prive.explication}>
          {d.prive.badge}
        </span>
        <PowerbiNav />
        <div className="compte">
          {/* Session lue en flux : l'en-tête reste statique et instantané */}
          <Suspense fallback={<PowerbiSignInLink />}>
            <PowerbiUserMenu />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

/** Lien de connexion qui ramène à l'espace. */
function PowerbiSignInLink() {
  return <Link href={authPath("connexion", POWERBI_HOME)}>{d.nav.signIn}</Link>;
}

/** Nom de l'utilisateur et déconnexion (retour à l'accueil de l'espace). */
async function PowerbiUserMenu() {
  const user = await getCurrentUser();
  if (!user) return <PowerbiSignInLink />;

  return (
    <form action={signOut} className="compte">
      <input type="hidden" name="suivant" value={POWERBI_HOME} />
      {user.email && <span>{interpolate(d.nav.signedInAs, { name: user.email })}</span>}
      <Link href="/compte">{t.account.title}</Link>
      <button type="submit">{d.nav.signOut}</button>
    </form>
  );
}

// ==================== PIED DE PAGE ====================

/** Pied de page sobre, avec la mention d'absence d'affiliation. */
export function PowerbiFooter() {
  return (
    <footer className="pied">
      <div className="shell">
        <div className="ligne">
          <p>
            © {APP_NAME}. {d.footer.tagline}
          </p>
          <nav aria-label={t.footer.legal}>
            <LegalLinks space="site" linkClassName="" />
          </nav>
        </div>
        <p>{d.footer.avertissement}</p>
      </div>
    </footer>
  );
}
