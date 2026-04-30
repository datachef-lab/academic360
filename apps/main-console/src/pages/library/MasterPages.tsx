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
