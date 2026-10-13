/**
 * =============================================================
 *  Fichier    : client.ts
 *  Projet     : Kalami Stratégie
 *  Description: Client de l'API Claude pour le coach IA, réservé au serveur.
 *               La clé est lue par le SDK dans ANTHROPIC_API_KEY (jamais dans le code) ;
 *               la fédération d'identité (WIF) est prévue au sprint S12.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: @anthropic-ai/sdk
 * =============================================================
 */

import "server-only";

import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Vrai si la clé de l'API est configurée dans l'environnement. */
export function isCoachConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Renvoie le client partagé ; deux nouvelles tentatives automatiques et 4 minutes au plus. */
export function getCoachClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ maxRetries: 2, timeout: 240_000 });
  }
  return client;
}
