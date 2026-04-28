import { Outlet, useLocation } from "react-router-dom";
import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import {
  Book,
  BookCopy,
  BookOpenCheck,
  BookText,
  FolderArchive,
  LayoutDashboard,
  LibraryBig,
  Newspaper,
  Package2,
  Rows3,
  ScanBarcode,
  ScrollText,
  Tags,
  UserRoundCheck,
  Workflow,
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
    title: "Series",
    url: "/dashboard/library/series",
    icon: Workflow,
  },
  {
    title: "Publications",
    url: "/dashboard/library/publications",
    icon: ScrollText,
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
    title: "Journal Type",
    url: "/dashboard/library/journal-types",
    icon: BookText,
  },
  {
    title: "Status",
    url: "/dashboard/library/statuses",
    icon: Tags,
  },
  {
    title: "Rack",
    url: "/dashboard/library/racks",
    icon: Package2,
  },
  {
    title: "Shelf",
    url: "/dashboard/library/shelves",
    icon: LibraryBig,
  },
  {
    title: "Binding Type",
    url: "/dashboard/library/binding-types",
    icon: ScanBarcode,
  },
  {
    title: "Period / Frequency",
    url: "/dashboard/library/periods",
    icon: Rows3,
  },
  {
    title: "Article",
    url: "/dashboard/library/articles",
    icon: ScrollText,
  },
  {
    title: "Library Document",
    url: "/dashboard/library/library-documents",
    icon: Book,
  },
  {
    title: "Borrowing Type",
    url: "/dashboard/library/borrowing-types",
    icon: BookOpenCheck,
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
