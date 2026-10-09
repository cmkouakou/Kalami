/**
 * =============================================================
 *  Fichier    : layout.tsx
 *  Projet     : Kalami
 *  Description: Gabarit des pages d'authentification (carte centrée, mobile d'abord).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 * =============================================================
 */

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-lg border border-line bg-surface p-6">{children}</div>
    </main>
  );
}
