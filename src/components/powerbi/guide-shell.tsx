/**
 * =============================================================
 *  Fichier    : guide-shell.tsx
 *  Projet     : Kalami Données
 *  Description: Cadre commun des pages de l'espace, repris du guide powerbi4you :
 *               en-tête de page (surtitre, titre, introduction, pastille d'avancement),
 *               sommaire latéral et pied de carte « précédent / suivant ».
 *  Auteur     : Claude Marcel
 *               v1.1 (v0.21.2) : mention de fin « Chantier terminé ».
 *  Version    : 1.1
 *  Date       : 2026-11-05
 *  Dépendances: progress-ring.tsx, powerbi.css (classes .topbar, nav.sprints, .footfoot)
 * =============================================================
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { getPowerbiDictionary } from "@/i18n/powerbi";

import { Etiquette } from "./lesson-blocks";
import { ProgressRing } from "./progress-ring";

const d = getPowerbiDictionary();

// ==================== EN-TÊTE DE PAGE ====================

type TopbarProps = {
  surtitre: ReactNode;
  titre: string;
  intro?: ReactNode;
  /** Avancement affiché dans la pastille de droite. */
  avancement?: { valeur: number; total: number; libelle: string };
  /** Légende ou autre contenu sous l'introduction. */
  children?: ReactNode;
};

/**
 * En-tête de page : surtitre, titre principal, introduction et pastille d'avancement.
 * @param props - Textes de l'en-tête et avancement facultatif
 */
export function Topbar({ surtitre, titre, intro, avancement, children }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{surtitre}</p>
        <h1>{titre}</h1>
        {intro && <p className="sub">{intro}</p>}
        {children}
      </div>
      {avancement && (
        <div className="progress-chip">
          <ProgressRing valeur={avancement.valeur} total={avancement.total} />
          <p className="txt">
            <b>
              {avancement.valeur} / {avancement.total}
            </b>
            {avancement.libelle}
          </p>
        </div>
      )}
    </header>
  );
}

/** Légende des trois étiquettes de section du chantier, reprise du guide d'origine. */
export function LegendeChantier() {
  return (
    <ul className="legend" aria-label={d.chantier.legendeTitre}>
      {(["pratique", "info", "repere"] as const).map((tag) => (
        <li key={tag} className="item">
          <Etiquette tag={tag} />
          {d.chantier.legende[tag]}
        </li>
      ))}
    </ul>
  );
}

// ==================== SOMMAIRE LATÉRAL ====================

/** Une entrée du sommaire. */
export type EntreeSommaire = {
  href: string;
  num: string;
  libelle: string;
  /** Terminé : la pastille passe au vert. */
  fait?: boolean;
  /** Page affichée : entrée surlignée. */
  courant?: boolean;
};

type SommaireProps = {
  /** Nom accessible du sommaire. */
  nom: string;
  entrees: EntreeSommaire[];
  /** Lien facultatif sur l'intitulé « Sommaire ». */
  lienTete?: string;
};

/**
 * Sommaire latéral : une ligne par sprint, module ou leçon.
 * @param props - Nom accessible, entrées et lien d'en-tête facultatif
 */
export function Sommaire({ nom, entrees, lienTete }: SommaireProps) {
  return (
    <nav className="sprints" aria-label={nom}>
      <div className="head">
        {lienTete ? <Link href={lienTete}>{d.sommaire}</Link> : d.sommaire}
      </div>
      {entrees.map((e) => (
        <Link
          key={e.href}
          href={e.href}
          className={e.fait ? "sprint-tab done" : "sprint-tab"}
          aria-current={e.courant ? "page" : undefined}
        >
          <span className="dot" aria-hidden="true" />
          <span className="num">{e.num}</span>
          <span className="lbl">{e.libelle}</span>
        </Link>
      ))}
    </nav>
  );
}

// ==================== PIED DE CARTE ====================

/** Lien vers la page voisine. */
type Voisin = { href: string; libelle: string };

type FootfootProps = {
  nom: string;
  position: string;
  precedent?: Voisin | null;
  suivant?: Voisin | null;
  /** Mots d'appel : « ← Précédent : » / « Prochain : ». */
  motPrecedent: string;
  motSuivant: string;
  /** Mention affichée à la place du lien suivant, sur la dernière page. */
  fin?: string;
};

/**
 * Pied de carte : lien précédent, position courante, lien suivant.
 * @param props - Position, voisins et mots d'appel
 */
export function Footfoot(props: FootfootProps) {
  const { nom, position, precedent, suivant, motPrecedent, motSuivant, fin } = props;
  return (
    <nav className="footfoot" aria-label={nom}>
      {precedent && (
        <Link href={precedent.href} className="footfoot-nav">
          <span aria-hidden="true">← </span>
          {motPrecedent} : <b>{precedent.libelle}</b>
        </Link>
      )}
      <span>{position}</span>
      {suivant && (
        <Link href={suivant.href} className="footfoot-nav">
          {motSuivant} : <b>{suivant.libelle}</b>
          <span aria-hidden="true"> →</span>
        </Link>
      )}
      {!suivant && fin && <b className="fin">{fin}</b>}
    </nav>
  );
}
