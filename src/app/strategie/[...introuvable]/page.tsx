/**
 * =============================================================
 *  Fichier    : page.tsx (strategie/[...introuvable])
 *  Projet     : Kalami Stratégie
 *  Description: Attrape les adresses inconnues sous /strategie pour afficher la 404 de
 *               Kalami Stratégie (strategie/not-found.tsx) plutôt que celle de la librairie.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: strategie/not-found.tsx
 * =============================================================
 */

import { notFound } from "next/navigation";

export default function Page() {
  notFound();
}
