import { Outlet, useLocation } from "react-router-dom";
import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import {
  Workflow,
  ScrollText,
  FolderArchive,
  Rows3,
  BookText,
  Tags,
  Package2,
  LibraryBig,
  ScanBarcode,
  Book,
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
  Tag,
  UserPen,
  FileText,
  Building2,
  Newspaper,
  LayoutDashboard,
  UserRoundCheck,
  Clock3,
  BookCopy,
} from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

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
    title: "Books",
    url: "/dashboard/library/books",
    icon: Book,
  },
  {
    title: "Copy Details",
    url: "/dashboard/library/copy-details",
    icon: BookCopy,
  },
  {
    title: "Journal",
    url: "/dashboard/library/journal",
    icon: Newspaper,
  },
];

const masterLinks = [
  {
    title: "Article",
    url: "/dashboard/library/articles",
    icon: Newspaper,
  },
  {
    title: "Author",
    url: "/dashboard/library/authors",
    icon: UserPen,
  },
  {
    title: "Author Detail",
    url: "/dashboard/library/author-details",
    icon: FileText,
  },
  {
    title: "Author Type",
    url: "/dashboard/library/author-types",
    icon: Tag,
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
    title: "Holiday",
    url: "/dashboard/library/holidays",
    icon: CalendarDays,
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
    title: "Period / Frequency",
    url: "/dashboard/library/periods",
    icon: Clock3,
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
    title: "Vendor",
    url: "/dashboard/library/vendors",
    icon: Building2,
  },
];

export default function LibraryMaster() {
  useRestrictTempUsers();
  const location = useLocation();
  const currentPath = location.pathname;

  const rightBarContent = (
    <div className="flex h-full flex-col justify-between gap-4 py-3">
      <ul>
        {quickLinks.map((link) => (
          <NavItem
            key={link.url}
            href={link.url}
            icon={<link.icon className="h-6 w-5" />}
            isActive={currentPath === link.url}
          >
            {link.title}
          </NavItem>
        ))}
      </ul>

      <div>
        <h3 className="mx-4 mb-1 border-b text-lg font-bold">Masters</h3>
        <ul>
          {masterLinks.map((link) => (
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
    </div>
  );

  return (
    <MasterLayout subLinks={[]} rightBarContent={rightBarContent}>
      <Outlet />
    </MasterLayout>
  );
}
