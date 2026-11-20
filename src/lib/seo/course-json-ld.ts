/**
 * =============================================================
 *  Fichier    : course-json-ld.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Données structurées schema.org du cours (JSON-LD) : « Course » (programme,
 *               durée, diplôme, mode en ligne) et « FAQPage » (questions fréquentes de la
 *               page de vente). Le prix n'y figure pas : il dépend de la devise du visiteur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/modules.ts
 * =============================================================
 */

import type { ModuleInfo } from "@/lib/cours/modules";

/** Textes publics du cours nécessaires aux données structurées. */
export type SourceCours = {
  titre: string;
  description: string;
  auteur: string;
  plateforme: string;
  diplome: string;
  modules: readonly ModuleInfo[];
  /** Durée totale des leçons, en minutes. */
  minutes: number;
};

/** Adresse publique du cours. */
export const CHEMIN_COURS = "/strategie/cours";

// ==================== COURS ====================

/**
 * Objet JSON-LD « Course » du cours de stratégie.
 * @param c      - Textes et programme du cours
 * @param appUrl - URL publique sans « / » final
 * @returns Objet prêt pour serializeJsonLd
 *
 * Exemple : serializeJsonLd(coursJsonLd(source, APP_URL))
 */
export function coursJsonLd(c: SourceCours, appUrl: string): Record<string, unknown> {
  const url = `${appUrl}${CHEMIN_COURS}`;
  const fournisseur = { "@type": "Organization", name: c.plateforme, url: `${appUrl}/strategie` };
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.titre,
    description: c.description,
    url,
    inLanguage: "fr",
    provider: fournisseur,
    author: { "@type": "Person", name: c.auteur },
    educationalCredentialAwarded: c.diplome,
    syllabusSections: c.modules.map((m) => ({
      "@type": "Syllabus",
      name: `Module ${m.numero} — ${m.titre}`,
      description: m.lecons.map((l) => l.titre).join(" · "),
    })),
    offers: [{ "@type": "Offer", category: "Paid", url }],
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: "Online",
        courseWorkload: `PT${Math.ceil(c.minutes / 60)}H`,
      },
    ],
  };
}

// ==================== QUESTIONS FRÉQUENTES ====================

/**
 * Objet JSON-LD « FAQPage » d'après les questions affichées sur la page.
 * @param faq - Questions et réponses, dans l'ordre d'affichage
 */
export function faqJsonLd(
  faq: readonly { question: string; reponse: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.reponse },
    })),
  };
}
