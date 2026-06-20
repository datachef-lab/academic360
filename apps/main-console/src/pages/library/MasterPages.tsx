import ArticlesMasterPage from "./ArticlesMasterPage";
import LibraryDocumentsMasterPage from "./LibraryDocumentsMasterPage";
import JournalTypesMasterPage from "./JournalTypesMasterPage";
import RacksMasterPage from "./RacksMasterPage";
import ShelvesMasterPage from "./ShelvesMasterPage";
import StatusesMasterPage from "./StatusesMasterPage";
import AuthorTypesMasterPage from "./AuthorTypesMasterPage";
import AuthorsMasterPage from "./AuthorsMasterPage";
import VendorsMasterPage from "./VendorsMasterPage";
import HolidaysMasterPage from "./HolidaysMasterPage";
import ClassHolidaysMasterPage from "./ClassHolidaysMasterPage";
import BranchesMasterPage from "./BranchesMasterPage";
import PatronCategoriesMasterPage from "./PatronCategoriesMasterPage";
import ItemCategoriesMasterPage from "./ItemCategoriesMasterPage";
import CirculationPoliciesMasterPage from "./CirculationPoliciesMasterPage";

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

export function AuthorTypesPage() {
  return <AuthorTypesMasterPage />;
}

export function AuthorsPage() {
  return <AuthorsMasterPage />;
}

export function VendorsPage() {
  return <VendorsMasterPage />;
}

export function HolidaysPage() {
  return <HolidaysMasterPage />;
}

export function ClassHolidaysPage() {
  return <ClassHolidaysMasterPage />;
}

export function BranchesPage() {
  return <BranchesMasterPage />;
}

export function PatronCategoriesPage() {
  return <PatronCategoriesMasterPage />;
}

export function ItemCategoriesPage() {
  return <ItemCategoriesMasterPage />;
}

export function CirculationPoliciesPage() {
  return <CirculationPoliciesMasterPage />;
}
