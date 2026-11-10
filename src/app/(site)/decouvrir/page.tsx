/**
 * =============================================================
 *  Fichier    : page.tsx (/decouvrir)
 *  Projet     : Kalami
 *  Description: Présentation publique et illustrée du livre « La stratégie d'entreprise »
 *               et de Kalami Stratégie (démarche, neuf étapes, coach IA, publics), avec
 *               captures des pages publiques et schémas dessinés. Page statique, indexée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-09
 *  Dépendances: components/decouvrir/diagrammes.tsx, components/ui/styles.ts,
 *               public/decouvrir/*.webp
 * =============================================================
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SchemaCoach, SchemaDemarche, SchemaEtapes } from "@/components/decouvrir/diagrammes";
import {
  BADGE,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  PAGE,
  PANEL_SAND,
} from "@/components/ui/styles";

// ==================== CONSTANTES ====================

const LIVRE = "/livres/la-strategie-d-entreprise";
const DESCRIPTION =
  "Le livre « La stratégie d'entreprise » enseigne une démarche en neuf étapes ; " +
  "Kalami Stratégie la fait appliquer à votre entreprise, avec un coach IA qui relit.";

export const metadata: Metadata = {
  title: "Découvrir le livre et Kalami Stratégie",
  description: DESCRIPTION,
  alternates: { canonical: "/decouvrir" },
  openGraph: {
    title: "La stratégie d'entreprise et Kalami Stratégie",
    description: DESCRIPTION,
    url: "/decouvrir",
  },
};

/** Ce que l'on fait dans Kalami Stratégie. */
const FONCTIONS = [
  {
    titre: "Décrire l'entreprise",
    texte: "Un questionnaire pose le profil et la question stratégique. Les documents " +
      "joints (rapport, organigramme) aident le coach à préremplir.",
  },
  {
    titre: "Remplir des gabarits",
    texte: "Chaque outil du livre devient un formulaire : grilles et matrices calculées " +
      "à l'écran, sauvegarde automatique.",
  },
  {
    titre: "Valider étape par étape",
    texte: "Si une étape validée change, celles qui en dépendent passent « à revoir ».",
  },
  {
    titre: "Générer le plan",
    texte: "Un plan stratégique en huit sections, chaque affirmation reliée à son étape, " +
      "exporté en PDF ou Word.",
  },
  {
    titre: "Travailler en équipe",
    texte: "Invitations, rôles, commentaires et présence en temps réel sur la même étude.",
  },
  {
    titre: "Enseigner",
    texte: "Une classe, des études distribuées (dont le cas Ajinomoto), le suivi de chaque " +
      "étudiant ; le coach peut être coupé pour une évaluation.",
  },
];

/** Ce que sait faire le coach IA. */
const COACH = [
  "Relire une analyse et signaler les erreurs classiques que le livre apprend à éviter.",
  "Poser des questions d'approfondissement adaptées au secteur et au pays.",
  "Chercher sur le Web (étapes 1 et 2), toujours avec la source citée.",
  "Lire les documents joints et proposer de préremplir le profil.",
  "Préparer la synthèse : SWOT reliée aux étapes 1 à 4, pistes TOWS, enjeux.",
  "Donner un score indicatif avant validation, avec les points à améliorer.",
  "Aider à rédiger le plan stratégique, section par section.",
];

/** Erreurs classiques repérées par le coach. */
const ERREURS = [
  { faux: "« Signer un partenariat » dans les opportunités",
    juste: "C'est une action, pas une opportunité." },
  { faux: "« Le marché est grand » dans le PESTEL",
    juste: "Un constat ; le PESTEL attend une tendance." },
  { faux: "Une vision où l'on peut mettre le nom d'un concurrent",
    juste: "Elle échoue au test du remplacement du nom." },
];

/** Publics visés et message clé pour chacun. */
const PUBLICS = [
  { public: "Dirigeants de PME",
    message: "Votre plan stratégique en neuf étapes, guidé par un coach IA." },
  { public: "Consultants",
    message: "Une méthode éprouvée et des livrables prêts à présenter." },
  { public: "Enseignants",
    message: "Le cas Ajinomoto pour toute la classe, avec le suivi de chaque étudiant." },
  { public: "Étudiants",
    message: "Tous les outils de stratégie appliqués à un seul cas, du diagnostic au plan." },
];

// ==================== COMPOSANTS ====================

/**
 * Capture d'écran encadrée, avec légende et lien vers la page réelle.
 * @param src - Image du dossier public/decouvrir
 * @param alt - Description de la capture
 * @param legende - Texte sous l'image
 * @param href - Page réelle correspondante
 */
function Capture({ src, alt, legende, href }: {
  src: string; alt: string; legende: string; href: string;
}) {
  return (
    <figure className={`${CARD} overflow-hidden`}>
      <Link href={href} className="block">
        <Image src={src} alt={alt} width={1280} height={800}
          sizes="(max-width: 768px) 100vw, 50vw" className="h-auto w-full border-b border-line" />
      </Link>
      <figcaption className="p-3 text-small text-ink-muted">{legende}</figcaption>
    </figure>
  );
}

/** En-tête de section : surtitre, titre (cible de aria-labelledby) et chapeau. */
function EnteteSection({ id, surtitre, titre, children }: {
  id: string; surtitre: string; titre: string; children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 max-w-measure">
      <p className="text-caption uppercase text-ocre-text">{surtitre}</p>
      <h2 id={id} className="mt-1 font-serif text-h2 text-ink">{titre}</h2>
      {children && <p className="mt-2 text-body text-ink-muted">{children}</p>}
    </header>
  );
}

// ==================== PAGE ====================

export default function Page() {
  return (
    <main className={`${PAGE} flex flex-col gap-16 py-10 sm:py-14`}>
      {/* ==================== BANNIÈRE ==================== */}
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <span className={BADGE}>Livre et application</span>
          <h1 className="mt-3 font-serif text-h1 text-ink sm:text-display">
            Apprendre la stratégie, puis l&apos;appliquer à son entreprise
          </h1>
          <p className="mt-4 text-body text-ink-muted">
            Le livre <em>La stratégie d&apos;entreprise</em> explique la méthode.{" "}
            <strong className="text-ink">Kalami Stratégie</strong> la fait appliquer, étape par
            étape, à une vraie entreprise, avec un coach IA qui relit et conseille.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={LIVRE} className={BUTTON_PRIMARY}>Voir le livre</Link>
            <Link href="/strategie" className={BUTTON_SECONDARY}>Essayer Kalami Stratégie</Link>
          </div>
        </div>
        <Capture src="/decouvrir/livre.webp" href={LIVRE}
          alt="Fiche du livre La stratégie d'entreprise sur Kalami, avec sa couverture"
          legende="La fiche du livre sur Kalami : extrait gratuit, carte ou Mobile Money." />
      </section>

      {/* ==================== LE LIVRE ==================== */}
      <section aria-labelledby="titre-livre">
        <EnteteSection id="titre-livre"
          surtitre="Le livre" titre="Une méthode, un fil conducteur">
          Chaque outil est expliqué simplement, puis appliqué aussitôt à la même entreprise
          fictive, <em>Infosystem</em>. On voit toute la démarche se construire sur un seul cas.
        </EnteteSection>
        <SchemaDemarche />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3 text-body text-ink">
            <p>
              Onze modules, environ 25 700 mots. Le module 10 fournit les gabarits d&apos;un
              plan stratégique en huit sections ; le module 11 est un cas réel à résoudre :
              <strong> Ajinomoto en Afrique de l&apos;Ouest (2012-2021)</strong>.
            </p>
            <p className="text-ink-muted">
              Écrit pour un contexte africain francophone (FCFA, OHADA, SYSCOHADA) sans s&apos;y
              limiter. Pour les dirigeants de PME, cadres, consultants, étudiants et enseignants
              en gestion.
            </p>
            <Link href={`${LIVRE}/lire`} className={`${BUTTON_SECONDARY} self-start`}>
              Lire l&apos;extrait gratuit
            </Link>
          </div>
          <Capture src="/decouvrir/liseuse.webp" href={`${LIVRE}/lire`}
            alt="Liseuse Kalami affichant la table des matières du livre"
            legende={"La liseuse : table des matières, marque-pages, surlignage, " +
              "lecture à voix haute."} />
        </div>
      </section>

      {/* ==================== KALAMI STRATÉGIE ==================== */}
      <section aria-labelledby="titre-app">
        <EnteteSection id="titre-app"
          surtitre="L'application" titre="Kalami Stratégie, l'atelier du livre">
          Au lieu de lire la démarche, on l&apos;applique à sa propre entreprise (ou à une
          division) et on repart avec un plan stratégique complet. Même compte que Kalami.
        </EnteteSection>
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <Capture src="/decouvrir/strategie.webp" href="/strategie"
            alt="Page d'accueil de Kalami Stratégie : une démarche en quatre temps"
            legende="L'accueil de Kalami Stratégie." />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {FONCTIONS.map((f) => (
              <li key={f.titre} className="border-l-2 border-ocre pl-3">
                <p className="text-label text-ink">{f.titre}</p>
                <p className="text-small text-ink-muted">{f.texte}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ==================== LES NEUF ÉTAPES ==================== */}
      <section aria-labelledby="titre-etapes" className={`${PANEL_SAND} p-5 sm:p-8`}>
        <EnteteSection id="titre-etapes"
          surtitre="Une étude" titre="Neuf étapes, dans un ordre qui a du sens">
          Les quatre analyses de départ se font en parallèle, pratique pour se répartir le
          travail en équipe. Chaque étape renvoie au chapitre correspondant du livre.
        </EnteteSection>
        <div className={`${CARD} p-3 sm:p-5`}>
          <SchemaEtapes />
        </div>
      </section>

      {/* ==================== LE COACH IA ==================== */}
      <section aria-labelledby="titre-coach">
        <EnteteSection id="titre-coach"
          surtitre="Le coach IA" titre="Un coach, pas un remplaçant">
          Le coach (Claude, d&apos;Anthropic) est réglé sur les règles du livre. Il ne remplit
          jamais un gabarit seul : ses propositions s&apos;affichent comme des suggestions.
        </EnteteSection>
        <SchemaCoach />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-body text-ink">
            {COACH.map((ligne) => <li key={ligne}>{ligne}</li>)}
          </ol>
          <div className="flex flex-col gap-3">
            <p className="text-label text-ink">Des erreurs qu&apos;il repère</p>
            {ERREURS.map((e) => (
              <div key={e.faux} className={`${CARD} p-3`}>
                <p className="text-small text-ink line-through decoration-ocre">{e.faux}</p>
                <p className="text-small text-encre">{e.juste}</p>
              </div>
            ))}
          </div>
        </div>
        <blockquote className={`${PANEL_SAND} mt-8 p-5 text-body text-ink`}>
          <p className="text-caption uppercase text-ink-muted">Une séance type</p>
          <p className="mt-2">
            Une gérante de PME à Abidjan remplit son PESTEL. Le coach signale que « nouer un
            partenariat avec un distributeur » n&apos;est pas une opportunité et propose une
            tendance : « croissance de la distribution moderne en Côte d&apos;Ivoire ». Il
            cherche deux ou trois faits récents avec leurs liens, puis demande : « Quel est
            l&apos;effet de cette tendance sur vos marges ? ». Elle garde ce qui lui convient,
            corrige, et valide l&apos;étape.
          </p>
        </blockquote>
        <p className="mt-4 text-small text-ink-muted">
          Les données d&apos;une étude ne sont visibles que par ses membres et ne servent pas à
          entraîner des modèles d&apos;IA.
        </p>
      </section>

      {/* ==================== CAS AJINOMOTO ==================== */}
      <section aria-labelledby="titre-cas" className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <EnteteSection id="titre-cas"
            surtitre="Cas d'entraînement" titre="Ajinomoto en Afrique de l'Ouest">
            Un géant de l&apos;assaisonnement s&apos;installe à Abidjan, puis dissout sa filiale
            huit ans plus tard. L&apos;étude est préremplie ; le corrigé de l&apos;auteur
            s&apos;ouvre à mesure que l&apos;on valide ses étapes.
          </EnteteSection>
          <Link href="/strategie/cas/ajinomoto" className={BUTTON_SECONDARY}>Voir le cas</Link>
        </div>
        <Capture src="/decouvrir/ajinomoto.webp" href="/strategie/cas/ajinomoto"
          alt="Page du cas Ajinomoto Afrique de l'Ouest dans Kalami Stratégie"
          legende="Le cas : énoncé, annexes chiffrées, corrigé et épilogue." />
      </section>

      {/* ==================== POUR QUI ==================== */}
      <section aria-labelledby="titre-publics">
        <EnteteSection id="titre-publics"
          surtitre="Pour qui" titre="À chacun sa raison de s'y mettre" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PUBLICS.map((p) => (
            <li key={p.public} className={`${CARD} p-4`}>
              <p className="font-serif text-h3 text-ink">{p.public}</p>
              <p className="mt-2 text-small text-ink-muted">« {p.message} »</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-small text-ink-muted">
          Paiement par carte ou par Mobile Money (Wave, Orange Money, MTN MoMo, Moov Money).
          Les prix sont affichés sur les pages du livre et de Kalami Stratégie.
        </p>
      </section>

      {/* ==================== LIENS UTILES ==================== */}
      <section className={`${PANEL_SAND} flex flex-col gap-4 p-6 sm:p-8`}>
        <h2 className="font-serif text-h2 text-ink">Pour aller plus loin</h2>
        <div className="flex flex-wrap gap-3">
          <Link href={LIVRE} className={BUTTON_PRIMARY}>Le livre</Link>
          <Link href={`${LIVRE}/lire`} className={BUTTON_SECONDARY}>L&apos;extrait</Link>
          <Link href="/strategie" className={BUTTON_SECONDARY}>Kalami Stratégie</Link>
          <Link href="/strategie/cas/ajinomoto" className={BUTTON_SECONDARY}>Le cas Ajinomoto</Link>
        </div>
      </section>
    </main>
  );
}
