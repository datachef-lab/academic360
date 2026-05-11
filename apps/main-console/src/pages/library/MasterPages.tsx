import ArticlesMasterPage from "./ArticlesMasterPage";
import LibraryDocumentsMasterPage from "./LibraryDocumentsMasterPage";
import JournalTypesMasterPage from "./JournalTypesMasterPage";
import RacksMasterPage from "./RacksMasterPage";
import ShelvesMasterPage from "./ShelvesMasterPage";
import StatusesMasterPage from "./StatusesMasterPage";

// function LibraryMasterPlaceholderPage({
//   title,
//   description,
// }: {
//   title: string;
//   description: string;
// }) {
//   return (
//     <div className="p-6 md:p-8">
//       <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
//       <p className="mt-2 text-sm text-slate-600">{description}</p>
//     </div>
//   );
// }

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

export function ArticlesPage() {
  return <ArticlesMasterPage />;
}

export function LibraryDocumentsPage() {
  return <LibraryDocumentsMasterPage />;
}
