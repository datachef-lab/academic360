export const Hero = () => {
  return (
    <div className="py-12 sm:py-24 w-full">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8 flex justify-center"></div>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            academic360* - Student Management App
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Introducing our innovative StudentGuard Management System, the
            ultimate solution for managing student data securely. In today's
            fast-paced educational environment, student information security and
            seamless data management are more important than ever.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="#"
              className="rounded-md bg-lime-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-lime-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600"
            >
              Get Started
            </a>
            <a
              href="#"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Learn More
              <span>→</span>
            </a>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 h-screen  py-6 sm:py-8 lg:py-12">
          <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
            <div className="mb-4 flex items-center justify-between gap-8 sm:mb-8 md:mb-12"></div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 xl:gap-8">
              <a
                href="#"
                className="group relative flex h-48 items-end overflow-hidden rounded-lg bg-gray-100 shadow-lg md:h-80"
              >
                <img
                  src="https://static.vecteezy.com/system/resources/previews/040/213/880/non_2x/planning-career-path-2d-linear-illustration-concept-lead-the-way-european-man-making-professional-plan-cartoon-character-isolated-on-white-future-ambitions-metaphor-abstract-flat-outline-vector.jpg"
                  loading="lazy"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-800 via-transparent to-transparent opacity-50"></div>
              </a>

              <a
                href="#"
                className="group relative flex h-48 items-end overflow-hidden rounded-lg bg-gray-100 shadow-lg md:col-span-2 md:h-80"
              >
                <img
                  src="https://static.vecteezy.com/system/resources/previews/013/483/149/non_2x/student-daily-activities-study-graduation-day-presentations-and-others-suitable-for-children-s-story-books-stickers-mobile-applications-games-websites-posters-t-shirts-and-printing-free-vector.jpg"
                  loading="lazy"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-800 via-transparent to-transparent opacity-50"></div>
              </a>

              <a
                href="#"
                className="group relative flex h-48 items-end overflow-hidden rounded-lg bg-gray-100 shadow-lg md:col-span-2 md:h-80"
              >
                <img
                  src="https://static.vecteezy.com/system/resources/previews/023/517/904/non_2x/online-graduation-tiny-graduates-receive-diplomas-and-communicate-via-video-in-smartphone-online-education-at-social-distancing-modern-flat-cartoon-style-illustration-on-white-background-vector.jpg"
                  loading="lazy"
                  alt="Photo by Martin Sanchez"
                  className="absolute inset-0 h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-800 via-transparent to-transparent opacity-50"></div>
              </a>

              <a
                href="#"
                className="group relative flex h-48 items-end overflow-hidden rounded-lg bg-gray-100 shadow-lg md:h-80"
              >
                <img
                  src="https://static.vecteezy.com/system/resources/previews/001/879/458/non_2x/digital-library-to-get-ideas-inspiration-and-solutions-online-learning-for-students-reading-app-online-books-education-by-blog-illustration-landing-page-card-banner-brochure-flyer-free-vector.jpg"
                  loading="lazy"
                  alt="Photo by Lorenzo Herrera"
                  className="absolute inset-0 h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-800 via-transparent to-transparent opacity-50"></div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
