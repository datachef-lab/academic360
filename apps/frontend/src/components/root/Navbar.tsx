import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CgLogIn } from "react-icons/cg";

import { buttonVariants } from "../ui/button";
import { Menu } from "lucide-react";
import { ModeToggle } from "../globals/ModeToggle";

interface RouteProps {
  href: string;
  label: string;
}

const routeList: RouteProps[] = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/about",
    label: "About",
  },
  {
    href: "/contact",
    label: "Contact",
  },
  {
    href: "/services",
    label: "Services",
  },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-background border-b-[1px] dark:border-b-slate-700">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-14 w-full flex justify-between items-center">
          <NavigationMenuItem className="font-bold">
            <a
              rel="noreferrer noopener"
              href="/"
              className="ml-2 text-xl flex items-center m-3"
            >
              Academic 360
            </a>
          </NavigationMenuItem>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center m-5">
            <ModeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger>
                <Menu
                  className="h-6 w-6 text-primary cursor-pointer"
                  onClick={() => setIsOpen(true)}
                />
              </SheetTrigger>

              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="font-bold text-xl">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col items-center gap-4 mt-4">
                  {routeList.map(({ href, label }) => (
                    <a
                      rel="noreferrer noopener"
                      key={label}
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className={buttonVariants({ variant: "ghost" })}
                    >
                      {label}
                    </a>
                  ))}
                  <button
                    style={{ cursor: "pointer" }}
                    className={`w-[110px] border ${buttonVariants({
                      variant: "secondary",
                    })}`}
                  >
                    <CgLogIn />
                    Login
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex gap-4 items-center">
            {routeList.map((route, i) => (
              <a
                rel="noreferrer noopener"
                href={route.href}
                key={i}
                className={`text-[17px] ${buttonVariants({ variant: "ghost" })}`}
              >
                {route.label}
              </a>
            ))}

            <button
              style={{ cursor: "pointer" }}
              className={`w-[110px] border ${buttonVariants({
                variant: "secondary",
              })}`}
            >
              <CgLogIn />
              Login
            </button>
            <ModeToggle />
          </nav>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};
