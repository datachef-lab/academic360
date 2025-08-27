export const Cta = () => {
  return (
    <>
      <div className="max-w-xl mb-10 md:mx-auto sm:text-center lg:max-w-2xl md:mb-12">
        <div>
          <p className="inline-block px-3 py-px mb-4 text-xs font-semibold tracking-wider text-teal-900 uppercase rounded-full bg-sky-500">
            Call To Action
          </p>
        </div>
        <h2 className="max-w-lg mb-6 font-sans text-3xl font-bold leading-none tracking-tight text-gray-900 sm:text-4xl md:mx-auto">
          <span className="relative inline-block">
            <span className="relative">
              "Streamline Your Institution's Workflow Today!
            </span>
          </span>
        </h2>
        <p className="text-base text-gray-700 md:text-lg">
          Empower educators, engage students, and simplify administration with
          our all-in-one student management solution. Transform the way you
          handle attendance, grades, schedules, and communication – all in one
          place.
        </p>
      </div>
      <div className="px-2 py-20 w-full flex justify-center">
        <div className="bg-white lg:mx-8 lg:flex lg:max-w-5xl lg:shadow-lg rounded-lg">
          <div className="lg:w-1/2">
            <div
              className="lg:scale-110 h-80 bg-cover lg:h-full rounded-b-none border lg:rounded-lg"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97')`,
              }}
            ></div>
          </div>
          <div className="py-12 px-6 lg:px-12 max-w-xl lg:max-w-5xl lg:w-1/2 rounded-t-none border lg:rounded-lg">
            <h2 className="text-3xl text-gray-800 font-bold">
              Promoting Sustainable Lifestyle Choices
              <span className="text-indigo-600">Choices</span>
            </h2>
            <p className="mt-4 text-gray-600">
              "Simplify Education Management – Empower Learning!" Transform the
              way you manage students, courses, and academic activities with our
              powerful student management platform. Streamline. Connect.
              Succeed. Access real-time insights, enhance communication, and
              create an engaging academic environment that drives success for
              students, teachers, and administrators. Take the next step in
              education management – Get started today!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
