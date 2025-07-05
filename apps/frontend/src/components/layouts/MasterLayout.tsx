import React, { useEffect } from "react";
import { LucideProps } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SearchStudentModal } from "../globals/SearchStudentModal";
import styles from "./MaterLayout.module.css";

type MasterLayoutProps = {
  children: React.ReactNode;
  subLinks: {
    title: string;
    url: string;
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
    isModal?: boolean;
  }[];
  rightBarHeader?: React.ReactNode;
  rightBarFooter?: React.ReactNode;
  rightBarContent?: React.ReactNode;
};

export default function MasterLayout({ children, subLinks, rightBarHeader, rightBarFooter, rightBarContent }: MasterLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);

  useEffect(() => {}, [currentPath]);

  return (
    <>
      {/* Main Layout */}
      <div className={`h-full w-full flex ${styles["shared-layout"]} overflow-hidden`}>
        {/* Center */}
        <div className={`w-[80%] overflow-scroll`}>{children}</div>
        {/* Right-bar */}
        <div className="w-[20%] border-l h-full flex flex-col bg-white">
          {/* Sidebar Header */}
          <div className="border-b px-4 py-3 flex items-center justify-between bg-white shadow-sm">
            {rightBarHeader !== undefined ? (
              rightBarHeader
            ) : (
              <span className="text-base font-semibold">Quick Links</span>
            )}
          </div>
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {rightBarContent !== undefined ? (
              rightBarContent
            ) : (
              <ul className="space-y-2">
                {subLinks.map((link) => {
                  if (link.isModal) {
                    return (
                      <div
                        key={link.title}
                        onClick={() => {
                          setIsSearchModalOpen(true);
                          setIsSearchActive(true);
                        }}
                        className={cn(
                          "group flex items-center transition-all duration-100 px-4 py-3 text-sm relative cursor-pointer",
                          isSearchActive
                            ? " hover:text-purple-600 font-semibold text-purple-600 rounded-l-full shadow-lg"
                            : "",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn("h-5 w-5")}> {link.icon && <link.icon className="h-5 w-5" />} </span>
                          <span className="text-base">{link.title}</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <NavItem
                      key={link.title}
                      icon={<link.icon className="h-5 w-5" />}
                      href={link.url}
                      isActive={currentPath.endsWith(link.url)}
                    >
                      {link.title}
                    </NavItem>
                  );
                })}
              </ul>
            )}
          </div>
          {/* Sidebar Footer */}
          <div className="border-t px-4 py-2 text-xs text-gray-500 text-center bg-white shadow-sm">
            {rightBarFooter !== undefined ? (
              rightBarFooter
            ) : (
              <>&copy; {new Date().getFullYear()} Academic360. All rights reserved.</>
            )}
          </div>
        </div>
      </div>
      {/* Search Student Modal */}
      <SearchStudentModal
        open={isSearchModalOpen}
        onOpenChange={(open) => {
          setIsSearchModalOpen(open);
          if (!open) {
            setIsSearchActive(false);
          }
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
}

function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <li>
      <Link
        to={href}
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-md font-medium transition-colors",
          isActive ? "bg-purple-100 text-purple-700 shadow-sm" : "text-gray-700 hover:bg-gray-100",
        )}
      >
        <span className={cn("h-5 w-5", isActive ? "text-purple-600" : "text-gray-500")}>{icon}</span>
        <span className="text-sm">{children}</span>
      </Link>
    </li>
  );
}
