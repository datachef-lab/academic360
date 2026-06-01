import ArticlesMasterPage from "./ArticlesMasterPage";
import AuthorDetailsMasterPage from "./AuthorDetailsMasterPage";
import AuthorsMasterPage from "./AuthorsMasterPage";
import AuthorTypesMasterPage from "./AuthorTypesMasterPage";
import ClassHolidaysMasterPage from "./ClassHolidaysMasterPage";
import HolidaysMasterPage from "./HolidaysMasterPage";
import LibraryDocumentsMasterPage from "./LibraryDocumentsMasterPage";
import JournalTypesMasterPage from "./JournalTypesMasterPage";
import RacksMasterPage from "./RacksMasterPage";
import ShelvesMasterPage from "./ShelvesMasterPage";
import StatusesMasterPage from "./StatusesMasterPage";
import VenderPage from "./VendorPage";

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

export function HolidaysPage() {
  return <HolidaysMasterPage />;
}

export function AuthorTypesPage() {
  return <AuthorTypesMasterPage />;
}

export function AuthorsPage() {
  return <AuthorsMasterPage />;
}

export function AuthorDetailsPage() {
  return <AuthorDetailsMasterPage />;
}

export function ClassHolidaysPage() {
  return <ClassHolidaysMasterPage />;
}

export function VendorPage() {
  return <VenderPage />;
}
