function LibraryMasterPlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

export function PublicationsPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Publications"
      description="Publications master management UI will be available here."
    />
  );
}

export function EnclosuresPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Enclosure / Attachments"
      description="Enclosure and attachments master management UI will be available here."
    />
  );
}

export function EntryModesPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Entry Mode"
      description="Entry mode master management UI will be available here."
    />
  );
}

export function JournalTypesPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Journal Type"
      description="Journal type master management UI will be available here."
    />
  );
}

export function StatusesPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Status"
      description="Status master management UI will be available here."
    />
  );
}

export function RacksPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Rack"
      description="Rack master management UI will be available here."
    />
  );
}

export function ShelvesPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Shelf"
      description="Shelf master management UI will be available here."
    />
  );
}

export function BindingTypesPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Binding Type"
      description="Binding type master management UI will be available here."
    />
  );
}

export function PeriodsPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Period / Frequency"
      description="Period and frequency master management UI will be available here."
    />
  );
}

export function ArticlesPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Article"
      description="Article master management UI will be available here."
    />
  );
}

export function LibraryDocumentsPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Library Document"
      description="Library document master management UI will be available here."
    />
  );
}

export function BorrowingTypesPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Borrowing Type"
      description="Borrowing type master management UI will be available here."
    />
  );
}
