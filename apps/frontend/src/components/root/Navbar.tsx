import React from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CgLogIn } from "react-icons/cg"; // Import React Icon
import { Link } from "react-router-dom";
// import {
//   SignedIn,
//   SignedOut,
//   SignInButton,
//   UserButton,
// } from "@clerk/clerk-react";

export const Navbar: React.FC = () => {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header>
      <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
        {/* <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn> */}
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          {/* Logo */}
          <Link to={"/"} className="flex items-center space-x-3 rtl:space-x-reverse">
            <img
              src="https://static.vecteezy.com/system/resources/previews/000/502/191/non_2x/vector-graduation-cap-icon-design.jpg"
              className="h-8"
              alt="Logo"
            />
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">academic360</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:space-x-8 md:order-1">
            <button
              onClick={() => scrollToSection("home")}
              className="text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 font-medium"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("services")}
              className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
            >
              Contact
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 md:order-2">
            {/* Login Button */}
            <Button
              asChild
              className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-2"
            >
              <Link to="/login">
                <CgLogIn /> Login
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-4">
                <div className="flex flex-col space-y-4">
                  <button
                    onClick={() => scrollToSection("home")}
                    className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => scrollToSection("about")}
                    className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
                  >
                    About
                  </button>
                  <button
                    onClick={() => scrollToSection("services")}
                    className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
                  >
                    Services
                  </button>
                  <button
                    onClick={() => scrollToSection("contact")}
                    className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
                  >
                    Contact
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
