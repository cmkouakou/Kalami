/**
 * =============================================================
 *  Fichier    : couche-annotations.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Annotations d'une leçon : suit la sélection et les clics sur les
 *               surlignages, affiche le menu de la liseuse (couleurs, note, citer,
 *               partager, retrait) et ses fenêtres. Enregistrement par les actions
 *               serveur du cours.
 *               v1.1 (v0.38.1) : citation (APA, MLA, Chicago) et partage en image, comme
 *               dans la liseuse des livres ; la référence vise la leçon.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-20
 *  Dépendances: components/reader/{highlight-dom,selection-menu,note-dialog,cite-dialog,
 *               share-dialog}, lib/cours/{actions,modules}.ts
 * =============================================================
 */

"use client";

import { type RefObject, useEffect, useState } from "react";

import {
  highlightAt,
  readSelection,
  type SelectionInfo,
} from "@/components/reader/highlight-dom";
import { CiteDialog } from "@/components/reader/cite-dialog";
import { NoteDialog } from "@/components/reader/note-dialog";
import { SelectionMenu } from "@/components/reader/selection-menu";
import type { ShareCardData } from "@/components/reader/share-card";
import { ShareDialog } from "@/components/reader/share-dialog";
import { getCourseDictionary } from "@/i18n/course";
import { authPath } from "@/lib/auth/routes";
import { APP_URL } from "@/lib/config";
import {
  creerAnnotation,
  modifierAnnotation,
  supprimerAnnotation,
} from "@/lib/cours/actions";
import { leconParId } from "@/lib/cours/modules";
import type { CitationSource } from "@/lib/reader/citation";
import type { Highlight, HighlightColor } from "@/lib/reader/types";

const t = getCourseDictionary();

/** Délai de stabilisation de la sélection avant d'afficher le menu (ms). */
const DELAI_SOURIS = 250;
/** Au doigt : le menu attend que les poignées soient relâchées (ms). */
const DELAI_DOIGT = 700;
/** Couleur d'un passage annoté d'une note sans couleur choisie. */
const COULEUR_DEFAUT: HighlightColor = "jaune";

/** Fenêtre ouverte depuis le menu. */
type Fenetre = "note" | "cite" | "share";

/** Passage visé : nouvelle sélection ou surlignage existant. */
type Cible =
  | ({ kind: "new" } & SelectionInfo)
  | { kind: "existing"; highlight: Highlight; rect: DOMRect };

type Props = {
  zoneRef: RefObject<HTMLElement | null>;
  leconId: string;
  /** Adresse de la leçon (retour après connexion). */
  adresse: string;
  connecte: boolean;
  surlignages: Highlight[];
  onChange: (maj: (liste: Highlight[]) => Highlight[]) => void;
  onAvis: (message: string) => void;
};

/**
 * Source de citation d'une leçon : le cours tient lieu d'ouvrage, le module de chapitre.
 * @param leconId - Identifiant de la leçon (« m01-l01 »)
 * @param adresse - Adresse de la leçon dans le site
 */
function sourceLecon(leconId: string, adresse: string): CitationSource {
  const c = t.lecon.citation;
  const trouve = leconParId(leconId);
  const titre = trouve
    ? `${trouve.module.numero}.${trouve.lecon.numero} ${trouve.lecon.titre}`
    : "";
  return {
    author: c.auteur,
    title: t.diplome.pdf.intitule,
    chapterTitle: titre,
    chapter: trouve?.module.numero ?? 1,
    edition: null,
    year: c.annee,
    platform: c.plateforme,
    url: `${APP_URL}${adresse}`,
  };
}

/**
 * Carte de partage d'un extrait (police de la zone de lecture, lien vers le cours).
 * @param zone    - Zone de la leçon
 * @param extrait - Passage partagé
 */
function carteLecon(zone: HTMLElement | null, extrait: string): ShareCardData {
  // Police réellement affichée dans la leçon (Literata, chargée par next/font)
  const police = zone ? getComputedStyle(zone).fontFamily.trim() : "";
  return {
    quote: extrait,
    title: t.diplome.pdf.intitule,
    author: t.lecon.citation.auteur,
    coverUrl: null,
    link: `${APP_URL}/strategie/cours`,
    fontFamily: police || "Georgia",
  };
}

/** Efface la sélection du document (le surlignage la remplace). */
function effacerSelection(): void {
  window.getSelection()?.removeAllRanges();
}

/**
 * Suit la sélection et les clics dans la zone de texte.
 * @param zoneRef     - Zone de la leçon
 * @param surlignages - Surlignages affichés (pour retrouver celui qu'on clique)
 * @param actif       - Faux pendant qu'une fenêtre est ouverte
 * @param setCible    - Mise à jour du passage visé
 */
function useSuiviSelection(
  zoneRef: RefObject<HTMLElement | null>,
  surlignages: Highlight[],
  actif: boolean,
  setCible: (maj: (c: Cible | null) => Cible | null) => void,
) {
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone || !actif) return;
    let minuterie: ReturnType<typeof setTimeout> | undefined;
    const delai = window.matchMedia("(pointer: coarse)").matches
      ? DELAI_DOIGT
      : DELAI_SOURIS;

    const surSelection = () => {
      clearTimeout(minuterie);
      minuterie = setTimeout(() => {
        const info = readSelection(zone);
        setCible((c) =>
          info ? { kind: "new", ...info } : c?.kind === "new" ? null : c,
        );
      }, delai);
    };
    const surClic = (ev: MouseEvent) => {
      if (!window.getSelection()?.isCollapsed) return;
      if (ev.target instanceof Element && ev.target.closest(".liseuse-menu"))
        return;
      const id = highlightAt(ev.target);
      const highlight = id ? surlignages.find((h) => h.id === id) : undefined;
      if (highlight && ev.target instanceof Element) {
        const rect = (
          ev.target.closest("mark") ?? ev.target
        ).getBoundingClientRect();
        setCible(() => ({ kind: "existing", highlight, rect }));
      } else {
        setCible((c) => (c?.kind === "existing" ? null : c));
      }
    };
    const surDefilement = () => setCible(() => null);
    const surTouche = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setCible(() => null);
    };

    document.addEventListener("selectionchange", surSelection);
    zone.addEventListener("click", surClic);
    window.addEventListener("scroll", surDefilement, { passive: true });
    document.addEventListener("keydown", surTouche);
    return () => {
      clearTimeout(minuterie);
      document.removeEventListener("selectionchange", surSelection);
      zone.removeEventListener("click", surClic);
      window.removeEventListener("scroll", surDefilement);
      document.removeEventListener("keydown", surTouche);
    };
  }, [zoneRef, surlignages, actif, setCible]);
}

/** Menu et fenêtre de note d'une leçon. */
export function CoucheAnnotations({
  zoneRef,
  leconId,
  adresse,
  connecte,
  surlignages,
  onChange,
  onAvis,
}: Props) {
  const [cible, setCible] = useState<Cible | null>(null);
  const [fenetre, setFenetre] = useState<Fenetre | null>(null);
  const [occupe, setOccupe] = useState(false);

  useSuiviSelection(zoneRef, surlignages, fenetre === null, setCible);

  /** Surligne la sélection ; avec une note, l'ajoute aussitôt. */
  async function creer(
    sel: SelectionInfo,
    couleur: HighlightColor,
    texteNote: string | null,
  ) {
    const r = await creerAnnotation(
      leconId,
      { start: sel.start, end: sel.end },
      couleur,
      sel.text,
    );
    if (!r.ok) {
      onAvis(r.error);
      return false;
    }
    let cree = r.highlight;
    if (texteNote) {
      const m = await modifierAnnotation(cree.id, { note: texteNote });
      if (m.ok) cree = m.highlight;
      else onAvis(m.error);
    }
    onChange((liste) => [...liste, cree]);
    effacerSelection();
    return true;
  }

  /** Change la couleur ou la note d'un surlignage existant. */
  async function modifier(
    h: Highlight,
    changement: { color?: HighlightColor; note?: string },
  ) {
    const r = await modifierAnnotation(h.id, changement);
    if (!r.ok) {
      onAvis(r.error);
      return false;
    }
    onChange((liste) => liste.map((x) => (x.id === h.id ? r.highlight : x)));
    return true;
  }

  /** Choix d'une couleur dans le menu. */
  async function surCouleur(couleur: HighlightColor) {
    if (!cible) return;
    setOccupe(true);
    const fait =
      cible.kind === "new"
        ? await creer(cible, couleur, null)
        : await modifier(cible.highlight, { color: couleur });
    setOccupe(false);
    if (fait) setCible(null);
  }

  /** Enregistrement de la note (nouveau passage : surligné en jaune). */
  async function surNote(texte: string) {
    if (!cible) return;
    const fait =
      cible.kind === "new"
        ? await creer(cible, COULEUR_DEFAUT, texte)
        : await modifier(cible.highlight, { note: texte });
    if (fait) fermer();
  }

  /** Retrait du surlignage visé. */
  async function surRetrait() {
    if (cible?.kind !== "existing") return;
    setOccupe(true);
    const id = cible.highlight.id;
    const r = await supprimerAnnotation(id);
    setOccupe(false);
    if (!r.ok) {
      onAvis(r.error);
      return;
    }
    onChange((liste) => liste.filter((h) => h.id !== id));
    setCible(null);
  }

  /** Ferme la fenêtre ouverte et le menu. */
  function fermer() {
    setFenetre(null);
    setCible(null);
  }

  if (!cible) return null;
  const existant = cible.kind === "existing" ? cible.highlight : null;

  const extrait = existant ? existant.quote : cible.kind === "new" ? cible.text : "";

  if (fenetre === "note") {
    return (
      <NoteDialog
        quote={extrait}
        initialNote={existant?.note ?? null}
        onSave={surNote}
        onClose={fermer}
      />
    );
  }
  if (fenetre === "cite") {
    return (
      <CiteDialog source={sourceLecon(leconId, adresse)} quote={extrait} onClose={fermer} />
    );
  }
  if (fenetre === "share") {
    return <ShareDialog card={carteLecon(zoneRef.current, extrait)} onClose={fermer} />;
  }

  return (
    <SelectionMenu
      rect={cible.rect}
      color={existant?.color ?? null}
      hasNote={Boolean(existant?.note)}
      signInHref={connecte ? null : authPath("connexion", adresse)}
      busy={occupe}
      onColor={surCouleur}
      onNote={() => setFenetre("note")}
      onCite={() => setFenetre("cite")}
      onShare={() => setFenetre("share")}
      onRemove={existant ? surRetrait : null}
    />
  );
}
