/**
 * =============================================================
 *  Fichier    : profil.ts
 *  Projet     : Kalami Stratégie
 *  Description: Cas d'entraînement Ajinomoto Afrique de l'Ouest (module 11 du livre) :
 *               nom, question stratégique et profil du corrigé, à l'échelle de toute la
 *               filiale, au début de 2016. Données tirées du récit et des annexes 1 à 5.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/profile.ts
 * =============================================================
 */

import "server-only";

import type { ProfileData } from "@/lib/strategy/profile";

// ==================== IDENTITÉ DE L'ÉTUDE ====================

export const CASE_COMPANY_NAME = "Ajinomoto Afrique de l'Ouest (AAO)";

export const CASE_STRATEGIC_QUESTION =
  "Début 2016 : AAO peut-elle atteindre l'objectif d'environ 2,5 milliards de yens de ventes " +
  "fixé par le groupe et, sinon, quelle stratégie adopter pour 2016-2018 (produit, clients " +
  "visés, distribution, organisation, place même d'une filiale autonome) ?";

// ==================== PROFIL ====================

export const CASE_PROFILE: ProfileData = {
  scope: "company",
  parentCompany: "Groupe Ajinomoto Co. (Tokyo, Japon)",
  sector:
    "Assaisonnements culinaires : importation, reconditionnement et vente de glutamate",
  employees: 60,
  revenueRange: "Non publié ; vente directe ≈ 196 M FCFA HT par an (annexe 5)",
  foundedYear: 2012,
  countries: [
    "Côte d'Ivoire (siège et usine)",
    "Mali",
    "Burkina Faso",
    "Togo",
    "Sénégal",
    "Guinée-Bissau",
    "Ghana",
    "Guinée",
    "Liberia",
    "Sierra Leone",
    "Gambie",
  ],
  cities: [
    "Abidjan : siège, usine de Yopougon, agence de vente (5 équipes)",
    "Bouaké : agence de vente (2 équipes)",
    "Daloa : dépôt",
  ],
  markets: [
    "Cuisine en volume : restaurants, maquis, rôtisseurs",
    "Ménages (achats faibles)",
    "Export vers les pays voisins de la zone visée",
  ],
  teams: [
    { role: "Direction générale (équipe japonaise)", headcount: null },
    {
      role: "Usine de reconditionnement (production, qualité, maintenance)",
      headcount: null,
    },
    {
      role: "Département commercial (ventes, export, marketing, logistique)",
      headcount: null,
    },
  ],
  offers: [
    "AJI-NO-MOTO® : glutamate monosodique pur, en petits formats reconditionnés à Abidjan",
    "AjiGoût : glutamate coupé de sel et d'épices locales (poivre, soumara)",
  ],
  clients: [
    "Grossistes et demi-grossistes",
    "Détaillantes des marchés, souvent en coopératives de femmes",
    "Restaurants et rôtisseurs",
    "Distributeurs des pays voisins (export)",
  ],
  competitors: [
    "Maggi (Nestlé), environ 75 % des bouillons en Côte d'Ivoire : substitut",
    "Jumbo (GB Foods), Doli (Patisen), Maxi Goût, marques régionales : substituts",
    "Contrefaçons et imitations de glutamate (Jakomo et autres, gros cristaux irréguliers)",
  ],
};
