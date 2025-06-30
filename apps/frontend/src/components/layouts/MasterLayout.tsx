import React, { useEffect } from "react";
import { LucideProps } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

type MasterLayoutProps = {
  children: React.ReactNode;
  subLinks: {
    title: string;
    url: string;
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  }[];
};

export default function MasterLayout({ children, subLinks }: MasterLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {}, [currentPath]);

  return (
    <div className="h-full w-full flex">
      <div className="w-[80%] h-full">{children}</div>
      <div className="w-[20%] border-l h-full bg-white">
        <ul className="space-y-2">
          {subLinks.map((link) => (
            <NavItem
              key={link.title}
              icon={<link.icon className="h-5 w-5" />}
              href={link.url}
              isActive={currentPath.endsWith(link.url)}
            >
              {link.title}
            </NavItem>
          ))}
        </ul>
      </div>
    </div>
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
