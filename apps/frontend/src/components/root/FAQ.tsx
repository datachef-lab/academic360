export const FAQ = () => {
  return (
    <div className="relative isolate overflow-hidden bg-custom">
      <div className="py-24 px-8 max-w-5xl mx-auto flex flex-col md:flex-row gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="sm:text-4xl text-3xl font-extrabold text-base-content">
            Frequently Asked Questions
          </p>
        </div>
        <ul className="basis-1/2">
          <li className="group">
            <button
              className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
              aria-expanded="false"
            >
              <span className="flex-1 text-base-content">
                How do I register a new student?
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
            </button>
            <div
              className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
              style={{ transition: "max-height 0.3s ease-in-out 0s" }}
            >
              <div className="pb-5 leading-relaxed">
                <div className="space-y-2 leading-relaxed">
                  You can register a new student by navigating to the "Student
                  Registration" section, filling out the required details, and
                  clicking the "Submit" button.
                </div>
              </div>
            </div>
          </li>
          <li className="group">
            <button
              className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
              aria-expanded="false"
            >
              <span className="flex-1 text-base-content">
                How do I update student information?
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
            </button>
            <div
              className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
              style={{ transition: "max-height 0.3s ease-in-out 0s" }}
            >
              <div className="pb-5 leading-relaxed">
                <div className="space-y-2 leading-relaxed">
                  Go to the "Student List" section, search for the student, and
                  click "Edit" next to their profile. Update the necessary
                  details and save the changes.
                </div>
              </div>
            </div>
          </li>
          <li className="group">
            <button
              className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
              aria-expanded="false"
            >
              <span className="flex-1 text-base-content">
                How can I generate student reports?
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
            </button>
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
          </li>
          <li className="group">
            <button
              className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
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
            </button>
            <div
              className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
              style={{ transition: "max-height 0.3s ease-in-out 0s" }}
            >
              <div className="pb-5 leading-relaxed">
                <div className="space-y-2 leading-relaxed">
                  Use the "Schedule Management" feature to create, update, or
                  delete class schedules. Assign teachers and classrooms as
                  needed.
                </div>
              </div>
            </div>
          </li>
          <li className="group">
            <button
              className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
              aria-expanded="false"
            >
              <span className="flex-1 text-base-content">
                Can I track student attendance?
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
            </button>
            <div
              className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
              style={{ transition: "max-height 0.3s ease-in-out 0s" }}
            >
              <div className="pb-5 leading-relaxed">
                <div className="space-y-2 leading-relaxed">
                  Yes, the "Attendance Tracker" allows you to mark, edit, and
                  review attendance records for each student or class.
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};
