export const Cta = () => {
  return (
    <section id="cta" className="bg-muted/50 py-8 sm:py-16 my-16 sm:my-24">
      <div className="container px-4 sm:px-8 lg:grid lg:grid-cols-2 place-items-center">
        {/* Text Section */}
        <div className="lg:col-start-1 text-center lg:text-left m-5">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            Simplify
            <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
              {" "}
              Student Management{" "}
            </span>
            With a Unified Platform
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl mt-4 mb-6 sm:mb-8 lg:mb-4">
            Streamline student records, attendance tracking, performance
            monitoring, and administrative tasks all in one place.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 lg:mb-0">
            Empower teachers and administrators to focus more on education and
            less on paperwork. Track academic progress, attendance patterns, and
            student behavior effortlessly.
          </p>
        </div>

        {/* Call-to-Actions */}
        <div className="space-y-4 lg:col-start-2 w-full lg:w-auto text-center lg:text-left m-5">
          <img
            src="https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg"
            alt=""
            style={{ borderRadius: "20px" }}
          />
          <p className="text-xs sm:text-sm text-muted-foreground mt-4 lg:mt-0 text-center">
            Experience the future of education management today.
          </p>
        </div>
      </div>
    </section>
  );
};
