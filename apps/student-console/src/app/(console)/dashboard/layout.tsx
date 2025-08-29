"use client";

import SharedArea from "@/components/home/SharedArea";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { StudentProvider, useStudent } from "@/providers/student-provider";

import { House, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { student } = useStudent();

  useEffect(() => {
    if (user) {
      console.log("User loaded in layout:", user);
    }
  }, [user]);

  const getStudentImageUrl = (uid?: string) => {
    if (!user?.payload?.academicIdentifier?.uid) return null;
    return `https://74.207.233.48:8443/hrclIRP/studentimages/Student_Image_${user?.payload?.academicIdentifier?.uid}.jpg`;
  };

  const getStudentImage = (uid?: string) => {
    const imageUrl = getStudentImageUrl(uid);

    if (!imageUrl) {
      return (
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-full w-full flex items-center justify-center">
          <User className="h-14 w-14 text-white" strokeWidth={1.5} />
        </div>
      );
    }

    return (
      <>
        <Image
          src={imageUrl}
          alt={`${student?.name || "Student"} profile image`}
          className="h-full w-full object-cover"
          width={40}
          height={40}
          onError={(e) => {
            console.log("Image failed to load, showing fallback");
            // Hide the image and show fallback
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.classList.remove("hidden");
          }}
        />
        {/* Fallback avatar - hidden by default */}
        <div className="hidden bg-gradient-to-br from-blue-500 to-indigo-600 h-full w-full flex items-center justify-center">
          <User className="h-6 w-6 text-white" strokeWidth={1.5} />
        </div>
      </>
    );
  };

  // Show loading while auth is checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If no user after loading, redirect will be handled by auth provider
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Please log in to access this page.</div>
      </div>
    );
  }

  return (
    <StudentProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="h-screen py-2 pr-2 ">
          <header className="flex h-14 shrink-0 mb-3 items-center justify-between transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 rounded-lg border border-border bg-card shadow-sm px-4">
            <div className="flex items-center gap-3 ">
              <SidebarTrigger className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800" />
              <Separator orientation="vertical" />
              <Breadcrumb>
                <BreadcrumbList className="text-sm">
                  <BreadcrumbItem className="hidden md:flex">
                    <Link
                      href="/dashboard"
                      className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <House size={18} />
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:flex text-gray-400" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium text-gray-800 dark:text-gray-200">
                      {pathname === "/dashboard"
                        ? "Dashboard"
                        : pathname
                            .split("/")
                            .pop()
                            ?.split("-")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {(() => {
                  const uid = student?.academicIdentifier?.uid || undefined;
                  console.log("Current student UID:", uid);
                  console.log("Student data:", student);
                  return getStudentImage(uid);
                })()}
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 overflow-y-scroll">
            <div className="h-[calc(100vh-3.5rem)] flex-1 rounded-xl">
              <SharedArea>{children}</SharedArea>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentProvider>
  );
}
