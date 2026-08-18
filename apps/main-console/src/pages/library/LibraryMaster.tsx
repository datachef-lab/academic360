import { Outlet, useLocation } from "react-router-dom";
import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import {
  Book,
  BookOpenCheck,
  BookText,
  BookMarked,
  Building,
  Building2,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  FileBarChart,
  FileSearch,
  IdCard,
  FolderArchive,
  LayoutDashboard,
  LibraryBig,
  MapPin,
  Newspaper,
  Package2,
  Rows3,
  ScanBarcode,
  Scale,
  ScrollText,
  ShieldCheck,
  Tags,
  UserCog,
  UserRoundCheck,
  Users,
  Workflow,
} from "lucide-react";
import { useRestrictTempUsers, getLibraryStaffAllowedPaths } from "@/hooks/use-restrict-temp-users";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { LibraryBranchSelector } from "@/features/library/LibraryBranchSelector";

const quickLinks = [
  {
    title: "Home",
    url: "/dashboard/library",
    icon: LayoutDashboard,
  },
  {
    title: "Entry / Exit",
    url: "/dashboard/library/entry-exit",
    icon: UserRoundCheck,
  },
  {
    title: "Book Circulation",
    url: "/dashboard/library/book-circulation",
    icon: BookOpenCheck,
  },
  {
    title: "Article Entry",
    url: "/dashboard/library/article-entry",
    icon: Book,
  },
  {
    title: "Search",
    url: "/dashboard/library/search",
    icon: FileSearch,
  },
  {
    title: "Reading Lists",
    url: "/dashboard/library/reading-lists",
    icon: ClipboardList,
  },
  {
    title: "Journal Subscriptions",
    url: "/dashboard/library/journal-subscriptions",
    icon: Newspaper,
  },
  {
    title: "Digital Twin",
    url: "/dashboard/library/digital-twin",
    icon: MapPin,
  },
  {
    title: "Reports",
    url: "/dashboard/library/reports",
    icon: FileBarChart,
  },
];

const masterLinks = [
  {
    title: "Academic Archive",
    url: "/dashboard/library/academic-archives",
    icon: FolderArchive,
  },
  {
    title: "Article",
    url: "/dashboard/library/articles",
    icon: ScrollText,
  },
  {
    title: "Author",
    url: "/dashboard/library/authors",
    icon: Users,
  },
  {
    title: "Author Type",
    url: "/dashboard/library/author-types",
    icon: UserCog,
  },
  {
    title: "Binding Type",
    url: "/dashboard/library/binding-types",
    icon: ScanBarcode,
  },
  {
    title: "Borrowing Type",
    url: "/dashboard/library/borrowing-types",
    icon: BookOpenCheck,
  },
  {
    title: "Branch",
    url: "/dashboard/library/branches",
    icon: Building,
  },
  {
    title: "Circulation Policy",
    url: "/dashboard/library/circulation-policies",
    icon: Scale,
  },
  {
    title: "Class Holiday",
    url: "/dashboard/library/class-holidays",
    icon: CalendarRange,
  },
  {
    title: "Enclosure / Attachments",
    url: "/dashboard/library/enclosures",
    icon: FolderArchive,
  },
  {
    title: "Entry Mode",
    url: "/dashboard/library/entry-modes",
    icon: Rows3,
  },
  {
    title: "Evidence Locker",
    url: "/dashboard/library/evidence-locker",
    icon: ShieldCheck,
  },
  {
    title: "Holiday",
    url: "/dashboard/library/holidays",
    icon: CalendarDays,
  },
  {
    title: "Item Category",
    url: "/dashboard/library/item-categories",
    icon: BookMarked,
  },
  {
    title: "Journal Type",
    url: "/dashboard/library/journal-types",
    icon: BookText,
  },
  {
    title: "Library Document",
    url: "/dashboard/library/library-documents",
    icon: Book,
  },
  {
    title: "Patron Category",
    url: "/dashboard/library/patron-categories",
    icon: IdCard,
  },
  {
    title: "Period / Frequency",
    url: "/dashboard/library/periods",
    icon: Rows3,
  },
  {
    title: "Publications",
    url: "/dashboard/library/publications",
    icon: ScrollText,
  },
  {
    title: "Rack",
    url: "/dashboard/library/racks",
    icon: Package2,
  },
  {
    title: "Series",
    url: "/dashboard/library/series",
    icon: Workflow,
  },
  {
    title: "Shelf",
    url: "/dashboard/library/shelves",
    icon: LibraryBig,
  },
  {
    title: "Status",
    url: "/dashboard/library/statuses",
    icon: Tags,
  },
  {
    title: "Student Analytics",
    url: "/dashboard/library/student-analytics",
    icon: FileBarChart,
  },
  {
    title: "Vendor",
    url: "/dashboard/library/vendors",
    icon: Building2,
  },
  {
    title: "Zones",
    url: "/dashboard/library/zones",
    icon: MapPin,
  },
];

export default function LibraryMaster() {
  useRestrictTempUsers();
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;

  // Library-staff (sub-page restricted) accounts only see the pages they are
  // allowed to open; the Masters section is hidden entirely for them.
  const libraryStaffAllowedPaths = getLibraryStaffAllowedPaths(user?.email);
  const visibleQuickLinks = libraryStaffAllowedPaths
    ? quickLinks.filter((link) => libraryStaffAllowedPaths.includes(link.url))
    : quickLinks;
  const visibleMasterLinks = libraryStaffAllowedPaths ? [] : masterLinks;

  // No justify-between: with the Masters section hidden (restricted library
  // staff) it would push the quick links to the bottom of the panel.
  const rightBarContent = (
    <div className="flex h-full flex-col gap-4 py-3">
      <div>
        <LibraryBranchSelector />
      </div>
      <ul>
        {visibleQuickLinks.map((link) => (
          <NavItem
            key={link.url}
            href={link.url}
            icon={<link.icon className="h-6 w-5" />}
            isActive={
              link.url === "/dashboard/library"
                ? currentPath === link.url
                : currentPath === link.url || currentPath.startsWith(`${link.url}/`)
            }
          >
            {link.title}
          </NavItem>
        ))}
      </ul>

      {visibleMasterLinks.length > 0 && (
        <div>
          <h3 className="mx-4 mb-1 border-b text-lg font-bold">Masters</h3>
          <ul>
            {visibleMasterLinks.map((link) => (
              <NavItem
                key={link.url}
                href={link.url}
                icon={<link.icon className="h-6 w-5" />}
                isActive={currentPath.startsWith(link.url)}
              >
                {link.title}
              </NavItem>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <MasterLayout subLinks={[]} rightBarContent={rightBarContent}>
      <Outlet />
    </MasterLayout>
  );
}
