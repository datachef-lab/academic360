import React, { ReactNode, useEffect, useState } from "react";
import { LucideProps, PanelRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SearchStudentModal } from "../globals/SearchStudentModal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useMobile";
import styles from "./MaterLayout.module.css";

export type LinkType = {
  title: string;
  url: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  isModal?: boolean;
  nestedLinks?: LinkType[];
  status?: "completed" | "in_progress" | "not_started";
  completedAt?: string;
};

type MasterLayoutProps = {
  children: React.ReactNode;
  subLinks?: LinkType[];
  content?: ReactNode;
  rightBarHeader?: React.ReactNode;
  rightBarFooter?: React.ReactNode;
  rightBarContent?: React.ReactNode;
};

export default function MasterLayout({
  children,
  content,
  subLinks,
  rightBarHeader,
  rightBarFooter,
  rightBarContent,
}: MasterLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const isMobile = useIsMobile();

  // ✅ Condition to hide sidebar
  const isBulkUploadPage = currentPath.startsWith("/dashboard/bulk-upload");

  // Close mobile sheet when route changes
  useEffect(() => {
    if (isMobile && isMobileSheetOpen) {
      setIsMobileSheetOpen(false);
    }
  }, [currentPath, isMobile]);

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-white shadow-sm">
        {rightBarHeader !== undefined ? (
          rightBarHeader
        ) : (
          <span className="text-base font-semibold">Quick Links</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {rightBarContent !== undefined ? (
          rightBarContent
        ) : (
          <ul className="space-y-2 py-2">
            {subLinks?.map((link) => {
              if (link.isModal) {
                return (
                  <div
                    key={link.title}
                    onClick={() => {
                      setIsSearchModalOpen(true);
                      setIsSearchActive(true);
                      if (isMobile) setIsMobileSheetOpen(false);
                    }}
                    className={cn(
                      "group flex items-center px-4 py-3 text-sm cursor-pointer",
                      isSearchActive
                        ? "text-purple-600 font-semibold rounded-l-full shadow-lg"
                        : "hover:text-purple-600",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-5 w-5">
                        {link.icon && <link.icon className="h-5 w-5" />}
                      </span>
                      <span className="text-base">{link.title}</span>
                    </div>
                  </div>
                );
              }

              return (
                <React.Fragment key={link.title}>
                  <NavItem
                    icon={<link.icon className="h-5 w-5" />}
                    href={link.url}
                    isActive={currentPath.endsWith(link.url)}
                    onNavigate={() => {
                      if (isMobile) setIsMobileSheetOpen(false);
                    }}
                  >
                    {link.title}
                  </NavItem>

                  {/* Nested Links */}
                  {link.nestedLinks && (
                    <ul className="ml-6 mt-1 space-y-1 border-l-2 border-purple-200 pl-3 bg-purple-50/40 rounded-md">
                      {link.nestedLinks.map((nested) => (
                        <NavItem
                          key={nested.title}
                          icon={<nested.icon className="h-4 w-4" />}
                          href={nested.url}
                          isActive={currentPath.endsWith(nested.url)}
                          onNavigate={() => {
                            if (isMobile) setIsMobileSheetOpen(false);
                          }}
                        >
                          <span
                            className={cn(
                              "pl-2 block rounded",
                              currentPath.endsWith(nested.url)
                                ? "bg-purple-100 text-purple-700 font-semibold"
                                : "text-gray-700 hover:bg-purple-50",
                            )}
                          >
                            {nested.title}
                          </span>
                        </NavItem>
                      ))}
                    </ul>
                  )}
                </React.Fragment>
              );
            })}
          </ul>
        )}

        {content}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2 text-xs text-gray-500 text-center bg-white shadow-sm">
        {rightBarFooter !== undefined ? (
          rightBarFooter
        ) : (
          <>&copy; {new Date().getFullYear()} Academic360</>
        )}
      </div>
    </>
  );

  return (
    <>
      <div className={`h-full w-full flex ${styles["shared-layout"]} overflow-hidden`}>
        {/* Center */}
        <div className={`w-full ${isBulkUploadPage ? "md:w-full" : "md:w-[80%]"} overflow-auto`}>
          {/* Mobile Menu */}
          {!isBulkUploadPage && (
            <div className="md:hidden border-b px-4 py-2 bg-white sticky top-0 z-50 shadow-sm">
              <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-9 gap-2">
                    <PanelRight className="h-4 w-4" />
                    Quick Links
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[80%] sm:max-w-sm p-0">
                  <div className="h-full flex flex-col">
                    <SidebarContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {children}
        </div>

        {/* Right Sidebar */}
        {!isBulkUploadPage && (
          <div className="hidden md:flex md:w-[20%] border-l h-full flex-col bg-white">
            <SidebarContent />
          </div>
        )}
      </div>

      {/* Modal */}
      <SearchStudentModal
        open={isSearchModalOpen}
        onOpenChange={(open) => {
          setIsSearchModalOpen(open);
          if (!open) setIsSearchActive(false);
        }}
      />
    </>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  onNavigate?: () => void;
}

export function NavItem({ href, icon, children, isActive, onNavigate }: NavItemProps) {
  return (
    <li>
      <Link
        to={href}
        onClick={() => onNavigate?.()}
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-md font-medium transition-colors",
          isActive ? "bg-purple-100 text-purple-700 shadow-sm" : "text-gray-700 hover:bg-gray-100",
        )}
      >
        <span className={cn("h-5 w-5", isActive ? "text-purple-600" : "text-gray-500")}>
          {icon}
        </span>
        <span className="text-sm">{children}</span>
      </Link>
    </li>
  );
}
