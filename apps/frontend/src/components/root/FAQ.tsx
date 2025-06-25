export const FAQ =
  <div className="py-10">
    <div className="container">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Find answers to common questions about Academic360
        </p>
      </div>
      <div className="mx-auto mt-8 max-w-3xl space-y-4 md:mt-16">
        <div className="group">
          <div
            className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
            role="button"
            tabIndex={0}
            aria-expanded="false"
          >
            <span className="flex-1 text-base-content">
              How do I add a new student?
            </span>
            <svg
              className="flex-shrink-0 w-4 h-4 ml-auto fill-current"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                y="7"
                width="16"
                height="2"
                rx="1"
                className="transform origin-center transition duration-200 ease-out false"
              ></rect>
              <rect
                y="7"
                width="16"
                height="2"
                rx="1"
                className="group-hover:opacity-0 origin-center rotate-90 transition duration-200 ease-out false"
              ></rect>
            </svg>
          </div>
          <div
            className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
            style={{ transition: "max-height 0.3s ease-in-out 0s" }}
          >
            <div className="pb-5 leading-relaxed">
              <div className="space-y-2 leading-relaxed">
                Go to the "Students" section and click on "Add New Student". Fill
                in the required information and submit the form.
              </div>
            </div>
          </div>
        </div>
        <div className="group">
          <div
            className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
            role="button"
            tabIndex={0}
            aria-expanded="false"
          >
            <span className="flex-1 text-base-content">
              How do I generate reports?
            </span>
            <svg
              className="flex-shrink-0 w-4 h-4 ml-auto fill-current"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                y="7"
                width="16"
                height="2"
                rx="1"
                className="transform origin-center transition duration-200 ease-out false"
              ></rect>
              <rect
                y="7"
                width="16"
                height="2"
                rx="1"
                className="group-hover:opacity-0 origin-center rotate-90 transition duration-200 ease-out false"
              ></rect>
            </svg>
          </div>
          <div
            className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
            style={{ transition: "max-height 0.3s ease-in-out 0s" }}
          >
            <div className="pb-5 leading-relaxed">
              <div className="space-y-2 leading-relaxed">
                Navigate to the "Reports" section, select the desired student,
                and choose the type of report you want to generate, such as
                academic performance or attendance.
              </div>
            </div>
          </div>
        </div>
        <div className="group">
          <div
            className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
            role="button"
            tabIndex={0}
            aria-expanded="false"
          >
            <span className="flex-1 text-base-content">
              How do I manage class schedules?
            </span>
            <svg
              className="flex-shrink-0 w-4 h-4 ml-auto fill-current"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                y="7"
                width="16"
                height="2"
                rx="1"
                className="transform origin-center transition duration-200 ease-out false"
              ></rect>
              <rect
                y="7"
                width="16"
                height="2"
                rx="1"
                className="group-hover:opacity-0 origin-center rotate-90 transition duration-200 ease-out false"
              ></rect>
            </svg>
          </div>
          <div
            className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
            style={{ transition: "max-height 0.3s ease-in-out 0s" }}
          >
            <div className="pb-5 leading-relaxed">
              <div className="space-y-2 leading-relaxed">
                Access the "Schedule" section where you can view and modify class
                timings, assign teachers, and manage classroom allocations.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
