# Quotation System

Unified Loft and Extension quotation system for North London Loft Rooms Ltd.

The project is a Next.js application that provides one shared quotation engine for both Loft and Extension work while keeping each quote type's catalogue, financial settings, text and saved quote history isolated.

**Production:** https://extension-app.vercel.app

## Current status

This repository now contains the production unified quotation system on `main`.

The current version is still browser-storage based:

- products, sections, saved quotes and quote settings are stored in `localStorage`;
- Loft and Extension data are namespaced separately;
- folders and the company signature are shared;
- there is no real authentication or cloud database yet;
- multi-user and multi-company support are the next major architecture phase.

Do not treat the current localStorage implementation as a secure multi-user backend.

## Main features

- One dashboard for Loft and Extension quotations.
- Separate Loft and Extension product catalogues and settings.
- Product types for:
  - unit quantities;
  - metres/length;
  - square metre area;
  - custom pricing tiers.
- Admin product management with base cost, supplier, markup and final price.
- Drag-and-drop section ordering.
- Saved quotations with revision families and optional revision names.
- Quote folders/project organisation.
- Search, date filtering and sorting for saved quotes.
- Quote-specific bespoke images with PDF positioning controls.
- Editable company logos.
- Editable company/PDF signature including signature image.
- Customer quotation PDF generation.
- Internal Working Details PDF with costs and supplier information.
- Client Working Details PDF without internal financial information.
- Import of legacy Loft and Extension app exports.
- Export and restore of current unified data as JSON backups.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Production unified dashboard |
| `/unified` | Unified dashboard alias |
| `/unified/extension` | Extension quote builder |
| `/unified/extension/admin` | Extension admin |
| `/unified/loft` | Loft quote builder |
| `/unified/loft/admin` | Loft admin |
| `/unified/migrate` | Backup, restore and legacy data migration |

## Architecture

The previous Extension-only application was a single large `app/page.tsx`. That architecture is no longer the production design.

`app/page.tsx` now points to the unified dashboard. Shared behaviour is split into reusable domain, storage, PDF and UI modules.

Important locations:

```text
app/
  page.tsx                         Production entry point
  unified/
    page.tsx                       Unified dashboard
    extension/                     Extension routes
    loft/                          Loft routes
    migrate/                       Backup/import route

components/quotation/
  UnifiedQuotationAppClassic.tsx   Shared quote-builder UI
  UnifiedAdminApp.tsx              Shared admin UI
  ProductSelectionAccordion.tsx    Product selection and quantities
  QuoteSummaryArchive.tsx          Totals, PDFs and saved quote archive
  BespokeImageManagement.tsx       Quote-specific PDF images
  LogoManagement.tsx               Company logo management
  SignatureManagement.tsx          Editable signature details/image
  DataMigrationPanel.tsx           Export/import/restore UI

config/
  company.ts                       NLLR fallback company defaults
  default-catalog.ts               Fallback catalogue data
  quote-types.ts                   Loft/Extension configuration

lib/quotation/
  calculations.ts                  Pricing and quote totals
  revisions.ts                     Revision-family logic
  search.ts                        Quote filtering/sorting
  storage.ts                       Namespaced localStorage + backup/import

lib/pdf/
  quotationPdf.ts                  Customer quotation PDF
  workingDetailsPdf.ts             Internal/client workings PDFs
  descriptionFormatter.ts          Product description formatting rules
  layout.ts                        Shared PDF page-flow helpers

types/
  quotation.ts                     Shared quotation domain types
```

## Data model and storage

Current browser storage is intentionally namespaced by quote type.

Examples include separate storage for:

- sections;
- products;
- saved quotes;
- PDF text;
- financial settings;
- logos.

Folders and company signature settings are shared across Loft and Extension.

Saved quote data includes the quote form itself, including quote-specific bespoke images.

### Backup and migration

The Data Migration page supports both directions:

1. **Export Current Data** creates a JSON backup of the selected Loft or Extension system, including its catalogue, quotes, settings and logos plus shared folders/signature settings.
2. **Import / Restore Data** restores one of those unified backups.
3. Legacy JSON exports from the original Loft and Extension apps are also supported.

Because the current application uses browser `localStorage`, data belongs to the browser/origin where it was created. Deploying new code does not automatically move old browser data between sites or domains.

## Pricing rules that must remain compatible

A product has a `valueType` of:

- `unit`;
- `meter`;
- `meterage`.

Standard product total:

```text
price × value × quantity
```

For custom pricing, the application selects the highest pricing tier whose threshold is less than or equal to the entered value, then calculates:

```text
tier price × value × quantity
```

Important compatibility behaviour:

- products may legitimately have a price of `£0.00`;
- custom pricing tier thresholds may legitimately be `0.00`;
- base cost + markup is used to calculate the normal final product price;
- existing description formatting for steels, columns, RHS, windows and glazing must be preserved.

## Quote revisions

Saving an existing quote creates a new revision rather than overwriting the previous revision.

Revision numbers are calculated across the full quote family. If revisions 1, 2 and 3 exist, saving from revision 2 creates revision 4.

Changing the client name or property address creates a new quote family beginning at revision 1.

## PDFs

The project uses `jsPDF` for generated quotation documents.

Customer quotation PDFs include:

- company logo(s);
- client details;
- bespoke quote images;
- brief;
- formatted description of works;
- pricing summary;
- quotation text;
- editable signatory details and signature image;
- terms and conditions.

Working Details has two variants:

- **Internal Copy** — includes prices, base cost, markup, supplier and financial detail.
- **Client Copy** — retains useful project/item detail but removes internal cost information.

PDF page flow should use the shared helpers in `lib/pdf/layout.ts` rather than introducing fixed single-page layouts that can overflow.

## Development

Requirements:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build production output:

```bash
npm run build
npm run start
```

Lint:

```bash
npm run lint
```

## Technology

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix/shadcn-style UI components
- dnd-kit
- jsPDF
- lucide-react

## Deployment

`main` is the production branch and is deployed through Vercel.

Production changes should be build-tested before being pushed to `main`.

## Next major phase

The next architecture phase is to turn the current single-company browser-storage application into a multi-user, multi-company product.

The intended direction is:

- authenticated users;
- organisations/contractors as tenants;
- Owner/Admin/Estimator roles;
- PostgreSQL-backed products, quotes, folders and settings;
- strict organisation-level data isolation;
- company-specific logos, signatures and PDF branding;
- invitation-based team access;
- migration of existing NLLR browser data into the first organisation;
- subscription/billing later, after multi-tenant quoting is stable.

The current unified frontend should be preserved during that migration. The backend should replace the persistence layer rather than unnecessarily redesigning the established quote-builder/admin workflow.
