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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [invalidUserOpen, setInvalidUserOpen] = useState(false);
  const { student } = useStudent();

  useEffect(() => {
    // Wait until auth state is resolved to avoid false negatives on refresh
    if (isLoading) return;
    if (!user) return;

    // If the authenticated user's type is not STUDENT, show dialog then logout
    const userType = user.type;
    const isStudent = userType === "STUDENT";
    if (!isStudent) {
      setInvalidUserOpen(true);
      // Auto logout shortly after showing the dialog
      const t = setTimeout(() => {
        logout();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [user, isLoading, logout]);

  const getStudentImageUrl = (uid: string) => {
    // if (!user?.payload?.academicIdentifier?.uid) return null;
    return `https://74.207.233.48:8443/hrclIRP/studentimages/Student_Image_${uid}.jpg`;
  };

  const getStudentImage = (uid: string) => {
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
          alt={`${user?.name || "Student"} profile image`}
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
          {/* Invalid user dialog */}
          <Dialog open={invalidUserOpen} onOpenChange={setInvalidUserOpen}>
            <DialogContent>
              <DialogHeader>
                <h3 className="text-lg font-semibold">Invalid User</h3>
                <p className="text-sm text-gray-600">
                  Your account does not have access to the Student Console. You will be signed out.
                </p>
              </DialogHeader>
            </DialogContent>
          </Dialog>
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
              <span className="text-sm text-gray-600">{user?.payload?.uid} </span>
              <Avatar
              // src={getStudentImage(user?.payload?.uid!)}
              // alt={user?.name || "User"}
              // className="h-10 w-10 rounded-full border border-gray-200 ring-1 ring-gray-100 bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-sm font-semibold shadow-sm hover:ring-indigo-200 transition"
              >
                <AvatarImage src={user?.payload?.uid ? getStudentImageUrl(user.payload.uid) : undefined} />
              </Avatar>
              {/* {(() => {
                const initials = (user?.name || "U")
                  .toString()
                  .split(" ")
                  .filter(Boolean)
                  .map((p) => p[0]!.toUpperCase())
                  .slice(0, 2)
                  .join("");
                return (
                  <div
                    className="h-10 w-10 rounded-full border border-gray-200 ring-1 ring-gray-100 bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-sm font-semibold shadow-sm hover:ring-indigo-200 transition"
                    title={user?.name?.toString() || "User"}
                  >
                    {initials}
                  </div>
                );
              })()} */}
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
