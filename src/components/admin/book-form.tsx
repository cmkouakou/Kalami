/**
 * =============================================================
 *  Fichier    : book-form.tsx
 *  Projet     : Kalami
 *  Description: Formulaire de création ou de modification d'un livre : informations,
 *               classement, statut de publication et prix dans les trois devises.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: components/admin/action-form.tsx, lib/admin/catalog-actions.ts
 * =============================================================
 */

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField, TextArea } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { createBook, updateBook } from "@/lib/admin/catalog-actions";
import type { AdminBook } from "@/lib/admin/catalog-queries";
import { BOOK_LANGUAGES, BOOK_STATUSES, CURRENCIES, type Currency } from "@/lib/catalog/types";
import { fromMinorUnits } from "@/lib/currency";

const t = getDictionary();

type BookFormProps = {
  book?: AdminBook;
  authors: { id: string; display_name: string }[];
  categories: { id: string; name: string }[];
};

/** Prix actuel dans une devise, tel qu'affiché dans le champ (vide si non vendu). */
function priceValue(book: AdminBook | undefined, currency: Currency): string {
  const price = book?.book_prices.find((p) => p.currency === currency);
  return price ? String(fromMinorUnits(price.amount_minor, currency)) : "";
}

/** Sans livre : création ; avec : modification de celui-ci. */
export function BookForm({ book, authors, categories }: BookFormProps) {
  const l = t.admin.books;
  const action = book ? updateBook.bind(null, book.id) : createBook;

  return (
    <ActionForm action={action} submitLabel={book ? t.admin.common.save : t.admin.common.create}>
      {/* ==================== INFORMATIONS ==================== */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={l.bookTitle}
          name="title"
          required
          maxLength={200}
          defaultValue={book?.title}
        />
        <Field
          label={l.subtitle}
          name="subtitle"
          maxLength={200}
          defaultValue={book?.subtitle ?? ""}
        />
        <Field
          label={t.admin.common.slug}
          name="slug"
          hint={t.admin.common.slugHelp}
          maxLength={80}
          defaultValue={book?.slug}
        />
        <Field label={l.edition} name="edition" maxLength={60} defaultValue={book?.edition ?? ""} />
      </div>
      <TextArea
        label={l.summary}
        name="summary"
        rows={8}
        maxLength={10000}
        defaultValue={book?.summary ?? ""}
      />
      <Field
        label={l.keywords}
        name="keywords"
        maxLength={500}
        defaultValue={book?.keywords ?? ""}
      />

      {/* ==================== CLASSEMENT ==================== */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label={l.author}
          name="author_id"
          required
          defaultValue={book?.author_id ?? ""}
          options={[
            { value: "", label: "—" },
            ...authors.map((a) => ({ value: a.id, label: a.display_name })),
          ]}
        />
        <SelectField
          label={l.category}
          name="category_id"
          defaultValue={book?.category_id ?? ""}
          options={[
            { value: "", label: t.admin.common.none },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <SelectField
          label={l.language}
          name="language"
          defaultValue={book?.language ?? "fr"}
          options={BOOK_LANGUAGES.map((code) => ({
            value: code,
            label: t.catalog.languages[code],
          }))}
        />
        <Field
          label={l.pageCount}
          name="page_count"
          type="number"
          min={1}
          defaultValue={book?.page_count ?? ""}
        />
        <Field
          label={l.chapterCount}
          name="chapter_count"
          type="number"
          min={1}
          defaultValue={book?.chapter_count ?? ""}
        />
        <Field
          label={l.year}
          name="publication_year"
          type="number"
          min={1900}
          max={2200}
          defaultValue={book?.publication_year ?? ""}
        />
      </div>

      {/* ==================== PRIX ==================== */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{l.prices}</legend>
        <p className="text-xs text-ink-muted">{l.pricesHelp}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {CURRENCIES.map((currency) => (
            <Field
              key={currency}
              label={currency}
              name={`price_${currency}`}
              inputMode="decimal"
              maxLength={20}
              defaultValue={priceValue(book, currency)}
            />
          ))}
        </div>
      </fieldset>

      {/* ==================== PUBLICATION ==================== */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={l.status}
          name="status"
          defaultValue={book?.status ?? "draft"}
          options={BOOK_STATUSES.map((status) => ({ value: status, label: l.statuses[status] }))}
        />
        <label className="flex min-h-11 items-center gap-3 self-end text-sm">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={book?.is_featured ?? false}
            className="size-5"
          />
          {l.featured}
        </label>
      </div>
      <TextArea
        label={l.rejectionReason}
        name="rejection_reason"
        rows={2}
        maxLength={2000}
        defaultValue={book?.rejection_reason ?? ""}
      />
    </ActionForm>
  );
}
