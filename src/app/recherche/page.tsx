/**
 * =============================================================
 *  Fichier    : page.tsx (recherche)
 *  Projet     : Kalami
 *  Description: Catalogue et recherche : texte libre (titre, auteur, mots-clés, résumé),
 *               filtres catégorie, langue et prix maximal dans la devise du visiteur.
 *               Formulaire GET : chaque recherche a une URL partageable.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: lib/catalog/queries.ts, lib/currency.ts, components/catalog
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BookGrid } from "@/components/catalog/book-card";
import { getDictionary } from "@/i18n";
import { getCategories, searchBooks } from "@/lib/catalog/queries";
import { BOOK_LANGUAGES, type BookLanguage, type BookSearch } from "@/lib/catalog/types";
import { toMinorUnits } from "@/lib/currency";
import { getPreferredCurrency } from "@/lib/currency-server";

const t = getDictionary();

export const metadata: Metadata = {
  title: t.catalog.search.title,
  alternates: { canonical: "/recherche" },
};

type RawParams = Record<string, string | string[] | undefined>;

/** Critères lus dans l'URL, tels qu'affichés dans le formulaire. */
type FormValues = { q: string; categorie: string; langue: string; prixMax: string };

// ==================== FONCTIONS UTILITAIRES ====================

/** Première valeur d'un paramètre d'URL, nettoyée et bornée en longueur. */
function first(value: string | string[] | undefined, maxLength = 100): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim().slice(0, maxLength);
}

/** Construit l'URL d'une page de résultats en conservant les filtres. */
function pageHref(values: FormValues, page: number): string {
  const params = new URLSearchParams();
  if (values.q) params.set("q", values.q);
  if (values.categorie) params.set("categorie", values.categorie);
  if (values.langue) params.set("langue", values.langue);
  if (values.prixMax) params.set("prix_max", values.prixMax);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/recherche?${query}` : "/recherche";
}

// ==================== PAGE ====================

export default function SearchPage({ searchParams }: PageProps<"/recherche">) {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{t.catalog.search.title}</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-60 animate-pulse" />}>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** Lit les critères, lance la recherche (en cache) et affiche formulaire et résultats. */
async function SearchContent({ searchParams }: { searchParams: Promise<RawParams> }) {
  const raw = await searchParams;
  const values: FormValues = {
    q: first(raw.q, 200),
    categorie: first(raw.categorie),
    langue: first(raw.langue),
    prixMax: first(raw.prix_max, 20),
  };
  const page = Math.min(Math.max(Number.parseInt(first(raw.page), 10) || 1, 1), 100);

  const [currency, categories] = await Promise.all([getPreferredCurrency(), getCategories()]);
  const language = (BOOK_LANGUAGES as readonly string[]).includes(values.langue)
    ? (values.langue as BookLanguage)
    : undefined;
  const maxPriceMinor = values.prixMax ? toMinorUnits(values.prixMax, currency) : null;

  const search: BookSearch = {
    query: values.q || undefined,
    category: categories.some((c) => c.slug === values.categorie) ? values.categorie : undefined,
    language,
    currency: maxPriceMinor ? currency : undefined,
    maxPriceMinor: maxPriceMinor ?? undefined,
    page,
  };
  const { books, hasMore } = await searchBooks(search);

  return (
    <>
      <SearchForm values={values} categories={categories} currency={currency} />
      <BookGrid books={books} emptyText={t.catalog.search.noResults} />
      {(page > 1 || hasMore) && (
        <nav aria-label="Pagination" className="flex justify-between gap-4">
          {page > 1 ? (
            <Link href={pageHref(values, page - 1)} className="min-h-11 py-2 text-principale">
              ← {t.catalog.search.previous}
            </Link>
          ) : (
            <span />
          )}
          {hasMore && (
            <Link href={pageHref(values, page + 1)} className="min-h-11 py-2 text-principale">
              {t.catalog.search.next} →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

// ==================== FORMULAIRE ====================

type SearchFormProps = {
  values: FormValues;
  categories: { slug: string; name: string }[];
  currency: string;
};

/** Formulaire de recherche (GET, fonctionne sans JavaScript). */
function SearchForm({ values, categories, currency }: SearchFormProps) {
  const fieldClass = "min-h-11 rounded-md border border-bordure bg-surface px-3 text-base";

  return (
    <form
      action="/recherche"
      method="get"
      role="search"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
        <label htmlFor="champ-q" className="text-sm font-medium">
          {t.catalog.search.query}
        </label>
        <input
          id="champ-q"
          name="q"
          type="search"
          defaultValue={values.q}
          maxLength={200}
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="champ-categorie" className="text-sm font-medium">
          {t.catalog.search.category}
        </label>
        <select
          id="champ-categorie"
          name="categorie"
          defaultValue={values.categorie}
          className={fieldClass}
        >
          <option value="">{t.catalog.search.anyCategory}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="champ-langue" className="text-sm font-medium">
          {t.catalog.search.language}
        </label>
        <select id="champ-langue" name="langue" defaultValue={values.langue} className={fieldClass}>
          <option value="">{t.catalog.search.anyLanguage}</option>
          {BOOK_LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {t.catalog.languages[code]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="champ-prix" className="text-sm font-medium">
          {t.catalog.search.maxPrice} ({currency})
        </label>
        <input
          id="champ-prix"
          name="prix_max"
          inputMode="decimal"
          defaultValue={values.prixMax}
          maxLength={20}
          className={fieldClass}
        />
      </div>
      <button
        type="submit"
        className="min-h-11 rounded-md bg-principale px-5 font-medium text-principale-texte"
      >
        {t.catalog.search.submit}
      </button>
    </form>
  );
}
