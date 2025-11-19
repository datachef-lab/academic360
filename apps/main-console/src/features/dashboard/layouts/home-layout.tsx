import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/globals/AppSidebar";
// import { ModeToggle } from "@/components/globals/ModeToggle";
import styles from "@/styles/HomeLayout.module.css";
// import NotifcationPanel from "../globals/NotifcationPanel";
// import GlobalSearch from "../globals/GlobalSearch";
import { ThemeProvider } from "@/providers/ThemeProvider";
import {
  Home,
  Boxes,
  LayoutList,
  BadgeIndianRupee,
  Layers3,
  ClipboardList,
  Users,
  Library,
  CalendarClock,
  PartyPopper,
  LayoutDashboard,
  Megaphone,
  UserCog,
  Settings,
  Search,
  BookOpen,
  FileText,
} from "lucide-react";
import { NavUser } from "../../../components/globals/NavUser";
import { ActiveUsersAvatars } from "../../../components/globals/ActiveUsersAvatars";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSearchedStudents, StudentSearchItem } from "@/services/student";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProtectedRouteWrapper from "@/components/globals/ProtectedRouteWrapper";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

// Match sidebar route paths (without "/dashboard") to icons
const pathIconMap: Record<string, React.ElementType> = {
  dashboard: Home,
  resources: Boxes,
  "courses-subjects": LayoutList,
  "admissions-fees": BadgeIndianRupee,
  batches: Layers3,
  "exam-management": ClipboardList,
  students: Users,
  lib: Library,
  "attendance-timetable": CalendarClock,
  event: PartyPopper,
  apps: LayoutDashboard,
  "notice-management": Megaphone,
  "faculty-staff": UserCog,
  settings: Settings,
  "cu-registration": FileText,
};

// Search data
const searchData = [
  {
    title: "Dashboard",
    description: "Main dashboard overview",
    href: "/dashboard",
    icon: Home,
    category: "Navigation",
  },
  {
    title: "Academic Setup",
    description: "Configure academic year settings",
    href: "/dashboard/academic-year-setup",
    icon: LayoutList,
    category: "Academic",
  },
  {
    title: "Students",
    description: "Manage student records",
    href: "/dashboard/students",
    icon: Users,
    category: "Management",
  },
  {
    title: "Courses & Subjects",
    description: "Manage courses and subjects",
    href: "/dashboard/courses-subjects",
    icon: BookOpen,
    category: "Academic",
  },
  {
    title: "Exam Management",
    description: "Handle exam schedules and results",
    href: "/dashboard/exam-management",
    icon: ClipboardList,
    category: "Academic",
  },
  {
    title: "Settings",
    description: "Application settings",
    href: "/dashboard/settings",
    icon: Settings,
    category: "System",
  },
  {
    title: "Notice Management",
    description: "Manage notices and announcements",
    href: "/dashboard/notices",
    icon: Megaphone,
    category: "Communication",
  },
  {
    title: "Faculty & Staff",
    description: "Manage faculty and staff records",
    href: "/dashboard/faculty-staff",
    icon: UserCog,
    category: "Management",
  },
];

export default function HomeLayout() {
  useRestrictTempUsers();
  const { accessToken, isReady } = useAuth();
  const location = useLocation(); // Get current route location
  const pathSegments = location.pathname.split("/").filter(Boolean); // Split the path into segments
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ uid: string; name?: string | null }>>([]);
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");

  async function fetchSuggestions(q: string) {
    try {
      const query = q.trim();
      // Prefer direct UID hit if looks like a UID
      if (/^\d{6,}$/.test(query)) {
        try {
          const token = accessToken
            ? accessToken.startsWith("Bearer ")
              ? accessToken
              : `Bearer ${accessToken}`
            : undefined;
          const resp = await fetch(`/api/students/uid/${encodeURIComponent(query)}`, {
            headers: token ? { Authorization: token } : undefined,
          });
          if (resp.ok) {
            const data = await resp.json();
            const one = data?.payload;
            if (one?.uid) {
              return [{ uid: String(one.uid), name: one?.personalDetails?.firstName ?? null }];
            }
          }
        } catch {
          // swallow
        }
      }

      const resp = await getSearchedStudents(query, 1, 5);
      const fromList = (resp?.content ?? [])
        .map((s: StudentSearchItem) => ({ uid: String(s.uid ?? s.id ?? ""), name: s.name ?? null }))
        .filter((s) => s.uid);
      if (fromList.length > 0) return fromList;
      // Final fallback already attempted if UID-like
      return [] as Array<{ uid: string; name?: string | null }>;
    } catch {
      return [] as Array<{ uid: string; name?: string | null }>;
    }
  }

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    isReady &&
    accessToken && (
      <ProtectedRouteWrapper>
        <ThemeProvider defaultTheme="light">
          <SidebarProvider className="w-screen overflow-x-hidden">
            <AppSidebar />
            <SidebarInset className="w-[100%] overflow-hidden max-h-screen">
              <header className="flex justify-between border-b py-2 h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                  {/* <SidebarTrigger className="-ml-1" /> */}
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>Academics</BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </BreadcrumbItem>

                      {/* {pathSegments.map((segment, index) => {
                    const path = `/${pathSegments.slice(0, index + 1).join("/")}`;

                    return (
                      <BreadcrumbItem key={index}>
                        <BreadcrumbLink asChild className="text-blue-500">
                          <Link to={path}>{segment.charAt(0).toUpperCase() + segment.slice(1)}</Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </BreadcrumbItem>
                    );
                  })} */}

                      {pathSegments.map((segment, index) => {
                        const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
                        const Icon = pathIconMap[segment];

                        return (
                          <BreadcrumbItem key={index}>
                            <BreadcrumbLink asChild>
                              <Link
                                to={path}
                                className="flex items-center gap-1 text-gray-700 hover:text-purple-600 transition-colors"
                              >
                                {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                                <span className="capitalize">{segment.replace(/-/g, " ")}</span>
                              </Link>
                            </BreadcrumbLink>
                            <BreadcrumbSeparator />
                          </BreadcrumbItem>
                        );
                      })}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
                <div className="flex items-center mr-2 gap-2">
                  <ActiveUsersAvatars />
                  {/* Search Button */}
                  <Button
                    variant="outline"
                    className="relative h-9 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
                    onClick={() => setOpen(true)}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline-flex">Search...</span>
                    <span className="inline-flex lg:hidden">Search</span>
                    <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </Button>

                  <div>
                    <NavUser />
                  </div>
                  {/* <NotifcationPanel /> */}
                  {/* <ModeToggle /> */}
                </div>
              </header>
              <div id={styles["shared-area"]} className="flex flex-1 flex-col gap-4 pt-0 overflow-x-hidden">
                {accessToken && <Outlet />}
              </div>
            </SidebarInset>
          </SidebarProvider>

          {/* Command Dialog for Spotlight Search */}
          <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
              placeholder="Search commands or type a student UID..."
              onValueChange={async (v) => {
                setInputValue(v);
                setSuggestions(v.length >= 2 ? await fetchSuggestions(v) : []);
              }}
            />
            <CommandList className="min-h-[160px] max-h-80 overflow-auto">
              <CommandEmpty>No results found.</CommandEmpty>
              {/\d{6,}/.test(inputValue.trim()) && (
                <CommandGroup heading="Quick action">
                  <CommandItem
                    value={`open-${inputValue.trim()}`}
                    onSelect={() => {
                      setOpen(false);
                      navigate(`/dashboard/students/${inputValue.trim()}`);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Open student UID</span>
                      <span className="text-xs text-muted-foreground">{inputValue.trim()}</span>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}
              {suggestions.length > 0 && (
                <CommandGroup heading="Students">
                  {suggestions.map((s) => (
                    <CommandItem
                      key={s.uid}
                      value={s.uid}
                      onSelect={() => {
                        setOpen(false);
                        navigate(`/dashboard/students/${s.uid}`);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={`${import.meta.env.VITE_STUDENT_PROFILE_URL}/Student_Image_${s.uid}.jpg`} />
                          <AvatarFallback className="text-[10px]">
                            {(s.name ?? s.uid ?? "?")?.toString().charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{s.uid}</span>
                        <span className="text-xs text-muted-foreground">{s.name ?? ""}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandGroup heading="Navigation">
                {searchData.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.title}
                    onSelect={() => {
                      setOpen(false);
                      navigate(item.href);
                    }}
                    className="flex items-center gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </ThemeProvider>
      </ProtectedRouteWrapper>
    )
  );
}
