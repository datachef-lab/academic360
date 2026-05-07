import ArticlesMasterPage from "./ArticlesMasterPage";
import LibraryDocumentsMasterPage from "./LibraryDocumentsMasterPage";
import JournalTypesMasterPage from "./JournalTypesMasterPage";
import RacksMasterPage from "./RacksMasterPage";
import ShelvesMasterPage from "./ShelvesMasterPage";
import StatusesMasterPage from "./StatusesMasterPage";

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
  return <JournalTypesMasterPage />;
}

export function StatusesPage() {
  return <StatusesMasterPage />;
}

export function RacksPage() {
  return <RacksMasterPage />;
}

export function ShelvesPage() {
  return <ShelvesMasterPage />;
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
  return <ArticlesMasterPage />;
}

export function LibraryDocumentsPage() {
  return <LibraryDocumentsMasterPage />;
}

export function BorrowingTypesPage() {
  return (
    <LibraryMasterPlaceholderPage
      title="Borrowing Type"
      description="Borrowing type master management UI will be available here."
    />
  );
}
