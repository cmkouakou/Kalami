/**
 * =============================================================
 *  Fichier    : link-picker.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Choix des éléments liés à une piste TOWS ou à un enjeu (étape 5) : cases à
 *               cocher regroupées (case de la SWOT, quadrant TOWS), repliables, avec le
 *               nombre d'éléments liés et une limite.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-14
 *  Dépendances: lib/strategy/templates/synthesis.ts
 * =============================================================
 */

"use client";

import { getDictionary } from "@/i18n";
import { LINKS_MAX } from "@/lib/strategy/templates/synthesis";

const t = getDictionary();
const s = t.strategy.synthesis;

/** Longueur maximale d'un libellé d'élément affiché. */
const LABEL_MAX = 90;

/** Élément pouvant être lié. */
export type LinkOption = { id: string; text: string };

/** Groupe d'éléments (une case de la SWOT, un quadrant TOWS). */
export type LinkGroup = { title: string; options: LinkOption[] };

type LinkPickerProps = {
  /** Préfixe unique des identifiants de champs. */
  name: string;
  title: string;
  groups: LinkGroup[];
  selected: string[];
  readOnly: boolean;
  onChange: (links: string[]) => void;
};

/** Libellé court d'un élément (texte tronqué, ou mention « sans texte »). */
export function shortLabel(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return `(${s.untitled})`;
  return clean.length > LABEL_MAX ? `${clean.slice(0, LABEL_MAX - 1)}…` : clean;
}

/** Cases à cocher des éléments liés, dans un bloc repliable. */
export function LinkPicker({
  name,
  title,
  groups,
  selected,
  readOnly,
  onChange,
}: LinkPickerProps) {
  const available = groups.filter((group) => group.options.length > 0);
  const full = selected.length >= LINKS_MAX;

  /** Coche ou décoche un élément. */
  const toggle = (id: string, checked: boolean) =>
    onChange(checked ? [...selected, id] : selected.filter((link) => link !== id));

  return (
    <details className="rounded-md border border-line p-3">
      <summary className="cursor-pointer text-small font-semibold">
        {title} ({selected.length})
      </summary>
      {available.length === 0 ? (
        <p className="mt-2 text-small text-ink-muted">{s.linksNone}</p>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {available.map((group) => (
            <fieldset key={group.title} className="flex flex-col gap-1">
              <legend className="text-caption uppercase text-ink-muted">{group.title}</legend>
              {group.options.map((option) => {
                const checked = selected.includes(option.id);
                return (
                  <label
                    key={option.id}
                    htmlFor={`${name}-${option.id}`}
                    className="flex min-h-11 items-start gap-2 py-1 text-small"
                  >
                    <input
                      id={`${name}-${option.id}`}
                      type="checkbox"
                      className="mt-1 size-4"
                      checked={checked}
                      disabled={readOnly || (full && !checked)}
                      onChange={(event) => toggle(option.id, event.target.checked)}
                    />
                    <span>{shortLabel(option.text)}</span>
                  </label>
                );
              })}
            </fieldset>
          ))}
        </div>
      )}
    </details>
  );
}
