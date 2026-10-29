/**
 * Fichier    : reader-voices.test.ts
 * Projet     : Kalami
 * Description: Tests du choix des voix (classement, libellés) et du découpage du texte
 *              en énoncés courts pour la lecture à voix haute.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-29
 */

import { describe, expect, it } from "vitest";

import {
  MAX_CHUNK_LENGTH,
  rankVoices,
  splitForSpeech,
  voiceLabel,
  type VoiceInfo,
} from "@/lib/reader/voices";

/** Voix de test (seuls le nom et la langue comptent). */
const voice = (name: string, lang: string): VoiceInfo => ({
  name,
  lang,
  voiceURI: name,
  localService: true,
});

describe("rankVoices", () => {
  const voices = [
    voice("Microsoft Hortense - French (France)", "fr-FR"),
    voice("Google français", "fr-FR"),
    voice("Microsoft Denise Online (Natural) - French (France)", "fr-FR"),
    voice("Microsoft Sylvie Online (Natural) - French (Canada)", "fr-CA"),
    voice("eSpeak French", "fr"),
    voice("Samantha", "en-US"),
  ];

  it("garde la langue du livre et place les voix neuronales en tête", () => {
    const names = rankVoices(voices, "fr").map((item) => item.name);
    expect(names).toEqual([
      "Microsoft Denise Online (Natural) - French (France)",
      "Microsoft Sylvie Online (Natural) - French (Canada)",
      "Google français",
      "Microsoft Hortense - French (France)",
      "eSpeak French",
    ]);
  });

  it("reconnaît les langues au format Android (fr_FR)", () => {
    expect(rankVoices([voice("Français", "fr_FR")], "fr")).toHaveLength(1);
  });

  it("ne confond pas deux langues au début semblable", () => {
    expect(rankVoices([voice("Frisian", "fry-NL")], "fr")).toHaveLength(0);
  });
});

describe("voiceLabel", () => {
  it("abrège le nom des voix Microsoft", () => {
    expect(
      voiceLabel(voice("Microsoft Denise Online (Natural) - French (France)", "fr-FR")),
    ).toBe("Denise (fr-FR)");
  });
});

describe("splitForSpeech", () => {
  it("regroupe les phrases courtes", () => {
    expect(splitForSpeech("  Il pleut.\n Elle sort. ")).toEqual(["Il pleut. Elle sort."]);
  });

  it("ignore un bloc vide", () => {
    expect(splitForSpeech("   ")).toEqual([]);
  });

  it("coupe un long passage en énoncés courts sans perdre de texte", () => {
    const sentence = "Le marché évolue vite, les clients changent, ".repeat(12) + "fin.";
    const text = `${sentence} Deuxième phrase.`;
    const chunks = splitForSpeech(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(MAX_CHUNK_LENGTH);
    expect(chunks.join(" ")).toBe(text.replace(/\s+/g, " ").trim());
  });
});
