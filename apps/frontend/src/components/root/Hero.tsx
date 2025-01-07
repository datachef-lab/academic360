import { Button } from "../ui/button";
import { buttonVariants } from "../ui/button";
import { HeroCards } from "./HeroCards";

export const Hero = () => {
  return (
    <section className="container flex flex-col lg:flex-row items-center justify-center gap-10 py-16 md:py-32 px-4">
      {/* Left Section */}
      <div className="text-center lg:text-start space-y-6 max-w-xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
          <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
            academic360*
          </span>{" "}
          Student Management System
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Manage your students' data effortlessly with our comprehensive student
          management system.
        </p>

        {/* Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button className="w-full md:w-auto">Get Started</Button>

          <a
            rel="noreferrer noopener"
            href="#"
            target="_blank"
            className={`w-full md:w-auto ${buttonVariants({
              variant: "outline",
            })}`}
          >
            Explore Now
          </a>
        </div>
      </div>

      {/* Right Section (Hero Cards) */}
      <div className="w-full lg:w-auto">
        <HeroCards />
      </div>
    </section>
  );
};
