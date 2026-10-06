/**
 * =============================================================
 *  Fichier    : env.ts
 *  Projet     : Kalami
 *  Description: Lecture et vérification des variables d'environnement publiques de Supabase.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 * =============================================================
 */

/**
 * Retourne l'URL et la clé publique Supabase, ou lève une erreur explicite si elles manquent.
 * @returns { url, publishableKey }
 */
export function getSupabasePublicEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Configuration Supabase manquante : définir NEXT_PUBLIC_SUPABASE_URL et " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (voir .env.example).",
    );
  }
  return { url, publishableKey };
}
