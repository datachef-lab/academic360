import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CgLogIn } from "react-icons/cg"; // Import React Icon

export const Navbar: React.FC = () => {
  return (
    <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-3 rtl:space-x-reverse"
        >
          <img
            src="https://static.vecteezy.com/system/resources/previews/000/502/191/non_2x/vector-graduation-cap-icon-design.jpg"
            className="h-8"
            alt="Logo"
          />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            academic360*
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex md:space-x-8 md:order-1">
          <Link
            to="/"
            className={cn(
              "text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 font-medium",
            )}
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
          >
            About
          </Link>
          <Link
            to="/services"
            className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
          >
            Services
          </Link>
          <Link
            to="/contact"
            className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
          >
            Contact
          </Link>
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
                <Link
                  to="/"
                  className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className="text-gray-900  dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
                >
                  About
                </Link>
                <Link
                  to="/services"
                  className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
                >
                  Services
                </Link>
                <Link
                  to="/contact"
                  className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-medium"
                >
                  Contact
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
