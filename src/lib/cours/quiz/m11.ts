/**
 * =============================================================
 *  Fichier    : m11.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Quiz du module 11 — Croissance interne, alliances et acquisitions :
 *               choisir la voie, causes d'échec, vérifier-signer-intégrer, formes
 *               d'alliance. Questions originales.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/content.ts
 * =============================================================
 */

import type { QuestionQuiz } from "@/lib/cours/content";

// ==================== QUESTIONS ====================

export const QUIZ_M11: QuestionQuiz[] = [
  {
    type: "qcm",
    id: "q1",
    question: "Quand la croissance interne est-elle généralement préférable ?",
    choix: [
      {
        texte: "Quand il faut entrer très vite sur un marché bien protégé.",
        explication: "La vitesse plaide plutôt pour l'acquisition.",
      },
      {
        texte: "Quand on a le temps et que la compétence peut se construire en interne.",
        explication: "Oui : on garde le contrôle et la culture.",
      },
      {
        texte: "Quand la compétence manque et ne peut pas s'apprendre.",
        explication: "Il faut alors l'acheter ou s'allier.",
      },
    ],
    bonne: 1,
  },
  {
    type: "qcm",
    id: "q2",
    question: "Quelle est une cause fréquente d'échec des acquisitions ?",
    choix: [
      {
        texte: "Payer trop cher, en surestimant les synergies.",
        explication: "Oui : le prix payé dévore la valeur espérée.",
      },
      {
        texte: "Acheter une entreprise rentable.",
        explication: "La rentabilité de la cible n'est pas en soi une cause d'échec.",
      },
      {
        texte: "Préparer l'intégration avant la signature.",
        explication: "C'est au contraire une bonne pratique.",
      },
    ],
    bonne: 0,
  },
  {
    type: "qcm",
    id: "q3",
    question: "Dans une acquisition, quelle étape est la plus souvent négligée ?",
    choix: [
      {
        texte: "La signature.",
        explication: "Elle attire toute l'attention.",
      },
      {
        texte: "La négociation du prix.",
        explication: "Elle aussi occupe beaucoup les dirigeants.",
      },
      {
        texte: "L'intégration après l'achat.",
        explication: "Oui : c'est pourtant là que la valeur se crée ou se perd.",
      },
    ],
    bonne: 2,
  },
  {
    type: "qcm",
    id: "q4",
    question:
      "Deux transitaires créent ensemble une société commune pour gérer un entrepôt au port. " +
      "De quelle forme d'alliance s'agit-il ?",
    choix: [
      {
        texte: "Un contrat de licence.",
        explication: "Une licence cède un droit d'usage, sans société commune.",
      },
      {
        texte: "Une franchise.",
        explication: "La franchise reproduit un concept, sans société commune.",
      },
      {
        texte: "Un simple accord commercial.",
        explication: "Un accord ne crée pas de nouvelle entité.",
      },
      {
        texte: "Une coentreprise.",
        explication: "Oui : une entité nouvelle, détenue en commun.",
      },
    ],
    bonne: 3,
  },
  {
    type: "qcm",
    id: "q5",
    question: "Quel est un risque propre aux alliances ?",
    choix: [
      {
        texte: "Le partenaire apprend vos savoir-faire et devient un concurrent.",
        explication: "Oui : protéger le cœur de son savoir-faire est une clé.",
      },
      {
        texte: "L'alliance coûte toujours plus cher qu'une acquisition.",
        explication: "C'est souvent l'inverse.",
      },
      {
        texte: "On ne peut jamais sortir d'une alliance.",
        explication: "On peut prévoir les conditions de sortie dès le départ.",
      },
    ],
    bonne: 0,
  },
  {
    type: "vrai-faux",
    id: "q6",
    consigne: "Acquisitions : vrai ou faux ?",
    affirmations: [
      {
        texte: "La vérification préalable sert à découvrir ce que le vendeur ne dit pas.",
        vrai: true,
        explication: "Dettes, litiges, clients fragiles : avant de signer.",
      },
      {
        texte: "Une fois l'acte signé, la valeur de l'acquisition est acquise.",
        vrai: false,
        explication: "Elle dépend surtout de l'intégration.",
      },
      {
        texte: "Les différences de culture peuvent faire échouer une acquisition.",
        vrai: true,
        explication: "Les meilleurs employés partent quand la culture se heurte.",
      },
    ],
  },
  {
    type: "vrai-faux",
    id: "q7",
    consigne: "Alliances : vrai ou faux ?",
    affirmations: [
      {
        texte: "Une alliance réussie suppose des objectifs clairs pour chaque partenaire.",
        vrai: true,
        explication: "Chacun doit savoir ce qu'il y gagne.",
      },
      {
        texte: "La confiance rend inutile tout contrat écrit.",
        vrai: false,
        explication: "La confiance aide ; le contrat règle les désaccords.",
      },
      {
        texte: "Une alliance permet de partager les risques d'un projet.",
        vrai: true,
        explication: "C'est l'une de ses raisons d'être.",
      },
    ],
  },
  {
    type: "classement",
    id: "q8",
    consigne: "Une entreprise de logistique veut grandir : quelle voie chaque cas illustre-t-il ?",
    categories: ["Croissance interne", "Alliance", "Acquisition"],
    elements: [
      {
        texte: "Elle forme ses propres chauffeurs et ouvre un second dépôt.",
        categorie: 0,
      },
      {
        texte: "Elle rachète un transporteur concurrent de Kumasi.",
        categorie: 2,
      },
      {
        texte: "Elle partage ses camions avec un grossiste pour les trajets de retour.",
        categorie: 1,
      },
      {
        texte: "Elle développe elle-même un logiciel de suivi des colis.",
        categorie: 0,
      },
    ],
  },
];
