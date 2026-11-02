# Copilot instructions — Quotation System

## Project purpose

This repository is the production unified Loft + Extension quotation system for North London Loft Rooms Ltd.

It is a Next.js App Router application using React, TypeScript, Tailwind CSS, Radix/shadcn-style UI components, dnd-kit and jsPDF.

The old architecture was a single very large Extension-only `app/page.tsx`. That is no longer the production architecture. Do not reintroduce that monolith.

`app/page.tsx` is now the temporary sign-in entry point. The quotation application itself lives under `/unified` and is protected by `app/unified/layout.tsx`.

## Read these files first

Before making behavioural changes, inspect the relevant shared files rather than assuming logic lives in the route page.

Core files:

- `app/page.tsx` — temporary sign-in entry point.
- `app/api/login/route.ts` — temporary login endpoint.
- `app/api/logout/route.ts` — logout endpoint.
- `app/unified/layout.tsx` — server-side route guard for the quotation system.
- `app/unified/page.tsx` — unified Loft/Extension dashboard.
- `components/auth/LoginPage.tsx` — sign-in UI.
- `components/auth/LogoutButton.tsx` — sign-out UI.
- `lib/auth/simpleAuth.ts` — temporary auth constants and credential check.
- `components/quotation/UnifiedQuotationAppClassic.tsx` — shared quote-builder UI.
- `components/quotation/UnifiedAdminApp.tsx` — shared admin UI.
- `components/quotation/ProductSelectionAccordion.tsx` — product selection/value/quantity behaviour.
- `components/quotation/QuoteSummaryArchive.tsx` — quote summary, PDFs and archive actions.
- `components/quotation/BespokeImageManagement.tsx` — quote-specific images.
- `components/quotation/LogoManagement.tsx` — logo management.
- `components/quotation/SignatureManagement.tsx` — editable PDF signature details and image.
- `components/quotation/DataMigrationPanel.tsx` — export/import/restore UI.
- `types/quotation.ts` — canonical shared domain types.
- `config/quote-types.ts` — differences between Loft and Extension.
- `config/company.ts` — fallback NLLR company/signatory defaults.
- `config/default-catalog.ts` — fallback catalogue.
- `lib/quotation/calculations.ts` — pricing and totals.
- `lib/quotation/storage.ts` — browser persistence, legacy import and unified backup/restore.
- `lib/quotation/revisions.ts` — quote-family/revision rules.
- `lib/quotation/search.ts` — quote filtering/sorting.
- `lib/pdf/quotationPdf.ts` — customer quotation PDF.
- `lib/pdf/workingDetailsPdf.ts` — internal/client Working Details PDFs.
- `lib/pdf/descriptionFormatter.ts` — domain-specific description formatting.
- `lib/pdf/layout.ts` — shared PDF page-flow helpers.

## Temporary authentication gate

The current V1 intentionally has a simple first-login gate:

```text
username: admin
password: password123
```

The login endpoint sets an HTTP-only cookie for 12 hours. `app/unified/layout.tsx` checks that cookie server-side before rendering any `/unified/...` route.

This is a temporary access barrier only. The repository is public and the credentials are hard-coded, so it is **not real authentication** and must not be described as secure.

Rules:

- keep the current gate working until proper authentication replaces it;
- do not move the credential check into client-only code;
- do not rely on client-side hiding as route protection;
- do not expand this hard-coded approach into multiple users/roles;
- when real auth is introduced, replace `lib/auth/simpleAuth.ts`, the temporary API routes and cookie gate cleanly;
- do not store sensitive user data in this temporary auth layer.

## Architecture rules

### 1. Keep Loft and Extension on the shared engine

Do not create separate duplicate quote-builder/admin implementations for Loft and Extension.

Use `QuoteType` and `getQuoteTypeConfig(...)` for quote-type-specific differences.

If a feature applies to both quote types, implement it once in the shared component/lib and pass quote type/config where required.

### 2. Preserve the established UI workflow

The current interface intentionally follows the previous NLLR quotation workflow.

Do not redesign core quote-builder or admin flows unless explicitly requested.

In particular:

- Bespoke Image Management belongs on the user/quote-builder side, not Admin.
- Admin sections should remain recognisable and compact/collapsible.
- Product editing must continue supporting unit, metre, area and custom-tier pricing.
- Section/product ordering should retain drag-and-drop behaviour.

When uncertain about legacy behaviour, inspect the existing shared implementation before simplifying it.

### 3. Keep domain logic outside route pages

Route files should remain thin.

Do not move pricing, storage, revisions or PDF generation back into `app/page.tsx`.

Pure/shared behaviour belongs in `lib/*`, shared types in `types/*`, and reusable interactive UI in `components/quotation/*`.

### 4. Current persistence is browser-local only

The production V1 still uses `localStorage`.

Do not pretend this is server-backed, multi-user or secure shared storage.

Storage is namespaced by quote type for:

- sections;
- products;
- quotes;
- text;
- financial settings;
- logos.

Folders and company signature settings are shared.

The future multi-tenant backend should replace this persistence layer without unnecessarily rewriting the established frontend workflows.

## Pricing behaviour — preserve exactly

Canonical `ValueType` values are:

```ts
"unit" | "meter" | "meterage"
```

For normal products:

```text
item total = product.price × item.value × item.quantity
```

For custom-pricing products:

1. sort/select tiers by threshold;
2. choose the highest tier where `tier.value <= item.value`;
3. calculate:

```text
item total = tier.price × item.value × item.quantity
```

Important invariants:

- `£0.00` is a valid product price and must not be treated as missing/invalid.
- `0.00` is a valid custom pricing tier threshold.
- do not filter with truthiness checks where zero is valid.
- base cost + markup recalculates the normal final price.
- custom pricing remains separate from ordinary price calculation.

## Product/value UI rules

For user-side quote items:

- `unit`: value represents quantity-like units; do not add a redundant second quantity field unless the existing component requires it.
- `meter`: value is length in metres and has a separate quantity.
- `meterage`: value is area in m² and has a separate quantity.

For Admin product editing, preserve Product Name, Description, Value Type, Base Cost, Supplier, Markup Percentage, Custom Pricing toggle, ordinary price OR custom pricing tiers, and Section.

Custom tier labels/step sizes must reflect the selected value type.

## Description formatting rules

`lib/pdf/descriptionFormatter.ts` contains business-specific formatting and should be treated as intentional domain logic.

Do not casually replace it with generic `quantity × description` output.

Preserve handling for at least:

- structural support beams / UB / Universal Beam lengths;
- structural support columns;
- RHS steel;
- Velux Rooflight;
- Roof Lantern;
- Slimglaze SG2 Double;
- White UPVC;
- Grey Aluminium;
- Glazing Vision.

Multiple steel lengths must remain correctly aggregated, e.g. separate 6m and 5m beams must not collapse incorrectly.

## Quote revision rules

Saved revisions are immutable historical records; saving creates a new revision rather than overwriting the previous one.

Revision numbering uses the highest existing revision in the quote family, not simply the revision currently open.

Example: if Rev 1, Rev 2 and Rev 3 exist and the user opens Rev 2 and saves, the result must be Rev 4.

Client/property identity is based on customer name + property address with whitespace/case normalisation.

Changing either identity field starts a new quote family at Rev 1.

Historical quotes should not silently change because a catalogue product is later edited. When moving to a database backend, preserve/snapshot the data required to reproduce historical quotes.

## Images and branding

### Bespoke quote images

Bespoke images are quote-specific and live in `QuotationFormData.images`.

They must save and reload with each quote revision and remain controlled from the user quote builder.

### Logos

Admin may configure multiple company logos and their PDF positioning.

Do not conflate company logos with bespoke client/property images.

### Signature

Signature settings are shared company settings and currently include signatory name, title, company name, phone, optional email, signature image and image width/height.

The editable signature must be used by customer quotation PDFs and both Working Details variants.

`config/company.ts` provides fallback defaults only; do not hard-code Michael/NLLR details into new PDF code when editable signature settings are available.

## PDF rules

Use the shared PDF modules. Do not recreate PDF generation inside UI components.

Customer PDF includes logos, client name/address, first-page content/testimonials, quote-specific bespoke images, brief, description of work, pricing summary, establishing-quote text, signature and terms and conditions.

Working Details:

- Internal copy includes costs, supplier, base cost, markup and financial summary.
- Client copy removes internal financial/cost information while retaining useful project detail.

Use `lib/pdf/layout.ts` helpers for multi-page flow. Avoid fixed layouts that cause long content to run off a page.

When adding images, ensure jsPDF format handling matches accepted upload types. Do not silently accept browser formats that the PDF renderer cannot handle.

## Backup / migration rules

`/unified/migrate` is both a migration screen and a backup/restore screen.

Unified exports should include the selected quote type's sections, products, quotes, text, financial settings and logos, plus shared folders and signature settings.

The importer must continue accepting legacy exports from the original separate Loft and Extension apps.

Do not remove backwards compatibility without an explicit migration plan.

Remember: browser localStorage is origin-specific. A deployment cannot automatically access another site's/local origin's old data.

## Admin financial settings

Current labels are:

- Admin (%)
- Marketing (%)
- Commission (%)
- VAT Rate (%)

Do not silently change stored/default percentages while performing unrelated refactors.

## UI conventions

- Use the `@/...` path alias.
- Reuse components in `components/ui` rather than duplicating primitives.
- Use Tailwind classes for styling.
- Use `lucide-react` for icons.
- Use dnd-kit for existing sortable behaviour.
- Keep TypeScript strict and shared props/types explicit.
- Respect client/server boundaries; anything using hooks, localStorage, FileReader or browser APIs must remain client-side.

## Before changing storage or data shapes

Check:

1. `types/quotation.ts`
2. `lib/quotation/storage.ts`
3. quote save/load code in `UnifiedQuotationAppClassic.tsx`
4. backup/import compatibility
5. PDF consumers

If a data shape changes, provide backwards compatibility or an explicit migration path for existing browser data.

## Behavioural regression checklist

For material changes, verify at minimum:

- unauthenticated `/unified` redirects to `/`;
- `admin` / `password123` signs in;
- sign out clears access;
- Extension quote builder loads;
- Loft quote builder loads;
- Admin loads for both quote types;
- normal unit product calculation;
- normal metre product calculation;
- normal m² product calculation;
- custom pricing tiers, including a `0.00` threshold;
- a product priced at `£0.00`;
- product edit/save;
- section rename and DnD reorder;
- multiple bespoke images;
- bespoke images survive save/reload of a revision;
- customer PDF generation;
- internal Working Details PDF;
- client Working Details PDF;
- editable signature appears in PDFs;
- quote revisions increment correctly from old revisions;
- changing client/address starts a new revision family;
- backup export works;
- unified restore works;
- legacy import still works;
- steel description formatting with different lengths (e.g. 6m + 5m).

Run:

```bash
npm run build
npm run lint
```

before production changes where possible.

## Production/deployment expectations

`main` is the production branch and is deployed to Vercel.

The production homepage `/` is the temporary sign-in screen. Authenticated users enter the quotation system at `/unified`.

Do not restore the old Extension-only app as the root entry point.

This repository is the canonical Loft + Extension quotation codebase. Do not create separate duplicated repositories for each quote type or future contractor.

## Next architecture phase: multi-user / multi-company

The intended SaaS direction is one codebase serving many contractor organisations, not separate cloned repositories per contractor.

Preferred conceptual model:

- `organisations`
- `organisation_members`
- roles such as Owner/Admin/Estimator
- organisation-scoped products, sections, folders, quotes and settings
- company-specific logos/signatures/branding
- proper authenticated users
- PostgreSQL-backed persistence
- server-enforced organisation isolation / row-level security

NLLR should become the first tenant rather than remain hard-coded throughout the application.

When implementing this phase, preserve the current quote builder/admin UX and migrate storage behind it incrementally.

The current hard-coded `admin` / `password123` gate is a deliberate temporary exception only. Replace it with proper authentication; do not extend it into the SaaS user model.
