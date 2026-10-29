/**
 * Fichier    : env-example.test.ts
 * Projet     : Kalami
 * Description: Garde-fou de maintenance : toute variable d'environnement lue par le code
 *              (process.env.X) doit être documentée dans .env.example, pour qu'un nouvel
 *              administrateur sache quoi définir dans Vercel.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-29
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/** Variables fournies par Node ou Next.js, jamais à définir soi-même. */
const BUILT_IN = new Set(["NODE_ENV"]);

/**
 * Liste récursivement les fichiers .ts/.tsx d'un dossier.
 * @param dir - Dossier de départ
 * @returns Chemins des fichiers
 */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe(".env.example", () => {
  it("documente chaque variable lue par le code", () => {
    const used = new Set<string>();
    for (const file of sourceFiles("src")) {
      for (const match of readFileSync(file, "utf8").matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
        if (!BUILT_IN.has(match[1])) used.add(match[1]);
      }
    }
    const documented = new Set(
      [...readFileSync(".env.example", "utf8").matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]),
    );
    const missing = [...used].filter((name) => !documented.has(name)).sort();
    expect(missing).toEqual([]);
  });
});
