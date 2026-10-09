/**
 * =============================================================
 *  Fichier    : author-book-form.tsx
 *  Projet     : Kalami
 *  Description: Fiche d'un livre saisie par son auteur (création ou modification) :
 *               informations, classement et prix. Ni statut, ni mise en avant, ni slug :
 *               ces champs relèvent de l'administration.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: components/admin/action-form.tsx, lib/author/actions.ts
 * =============================================================
 */

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField, TextArea } from "@/components/ui/form";
import { getDictionary } from "@/i18n";
import { createAuthorBook, updateAuthorBook } from "@/lib/author/actions";
import type { AuthorBook } from "@/lib/author/queries";
import { BOOK_LANGUAGES, CURRENCIES, type Currency } from "@/lib/catalog/types";
import { fromMinorUnits } from "@/lib/currency";

const t = getDictionary();
const l = t.admin.books;

type AuthorBookFormProps = {
  book?: AuthorBook;
  categories: { id: string; name: string }[];
};

/** Prix actuel dans une devise, tel qu'affiché dans le champ (vide si non vendu). */
function priceValue(book: AuthorBook | undefined, currency: Currency): string {
  const price = book?.book_prices.find((p) => p.currency === currency);
  return price ? String(fromMinorUnits(price.amount_minor, currency)) : "";
}

/** Sans livre : création ; avec : modification de celui-ci. */
export function AuthorBookForm({ book, categories }: AuthorBookFormProps) {
  const action = book ? updateAuthorBook.bind(null, book.id) : createAuthorBook;

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
        <Field label={l.edition} name="edition" maxLength={60} defaultValue={book?.edition ?? ""} />
        <Field
          label={l.keywords}
          name="keywords"
          maxLength={500}
          defaultValue={book?.keywords ?? ""}
        />
      </div>
      <TextArea
        label={l.summary}
        name="summary"
        rows={8}
        maxLength={10000}
        defaultValue={book?.summary ?? ""}
      />

      {/* ==================== CLASSEMENT ==================== */}
      <div className="grid gap-4 sm:grid-cols-2">
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
          label={l.year}
          name="publication_year"
          type="number"
          min={1900}
          max={2200}
          defaultValue={book?.publication_year ?? ""}
        />
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="pdf_enabled"
          defaultChecked={book?.pdf_enabled ?? false}
          className="size-5"
        />
        {l.pdfEnabled}
      </label>

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
    </ActionForm>
  );
}
