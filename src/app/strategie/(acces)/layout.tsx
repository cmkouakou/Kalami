/**
 * =============================================================
 *  Fichier    : layout.tsx (strategie/acces)
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit des pages de connexion de Kalami Stratégie (carte centrée, mobile
 *               d'abord), affichées sous l'en-tête de l'application.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 * =============================================================
 */

export default function StrategyAuthLayout({ children }: LayoutProps<"/strategie">) {
  return (
    <main className="mx-auto w-full max-w-md py-4">
      <div className="rounded-lg border border-line bg-surface p-6">{children}</div>
    </main>
  );
}
