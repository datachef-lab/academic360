export const Testimonials = () => {
  return (
    <div className="py-5 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center w-full p-6 mx-auto text-center xl:px-0">
        <div className="text-sm font-bold tracking-wider text-indigo-600 uppercase">
          Testimonials
        </div>
        <h2 className="max-w-2xl mt-3 text-3xl font-bold leading-snug tracking-tight text-gray-800 lg:leading-tight lg:text-4xl dark:text-white">
          What Educators and Students Are Saying About Us
        </h2>
        <p className="max-w-2xl py-4 text-lg leading-normal text-gray-500 lg:text-xl xl:text-xl dark:text-gray-300">
          Testimonials showcase how our student management app has transformed
          education. Use this section to highlight the experiences of educators,
          administrators, and students.
        </p>
      </div>
      <div className=" p-6 mx-auto mb-10 xl:px-0">
        <div className="grid gap-10 lg:grid-cols-2 xl:grid-cols-3">
          <div className="lg:col-span-2 xl:col-auto">
            <div className="flex flex-col justify-between w-full h-full px-6 py-6 bg-gray-100 dark:bg-gray-800 md:px-14 rounded-2xl md:py-14 dark:bg-trueGray-800">
              <p className="text-2xl leading-normal dark:text-gray-300">
                "The student management app has been a game-changer for our
                institution. It has simplified attendance tracking, improved
                communication between teachers and parents, and provided
                real-time insights into student performance."
              </p>
              <div className="flex items-center mt-8 space-x-3">
                <div className="flex-shrink-0 overflow-hidden rounded-full w-14 h-14">
                  <img
                    alt="Avatar"
                    src="https://images.unsplash.com/photo-1511485977113-f34c92461ad9?crop=faces&amp;cs=tinysrgb&amp;fit=crop&amp;fm=jpg&amp;ixid=MnwxfDB8MXxhbGx8fHx8fHx8fHwxNjIwMTQ5ODEx&amp;ixlib=rb-1.2.1&amp;q=80&amp;w=100&amp;h=100"
                    loading="lazy"
                  />
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-800">
                    Sarah Steiner
                  </div>
                  <div className="text-gray-600 dark:text-gray-800">
                    VP Sales at Google
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="">
            <div className="flex flex-col justify-between w-full h-full px-6 py-6 bg-gray-100 dark:bg-gray-800 md:px-14 rounded-2xl md:py-14 dark:bg-trueGray-800">
              <p className="text-2xl leading-normal dark:text-gray-300">
                "Managing student records and academic progress has never been
                easier. The app's user-friendly interface and robust features
                have streamlined our administrative tasks, allowing us to focus
                more on improving the learning experience."
              </p>
              <div className="flex items-center mt-8 space-x-3">
                <div className="flex-shrink-0 overflow-hidden rounded-full w-14 h-14">
                  <img
                    alt="Avatar"
                    src="https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&amp;ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;auto=format&amp;crop=faces&amp;fit=crop&amp;w=100&amp;h=100&amp;q=80"
                    loading="lazy"
                  />
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-800">
                    Dylan Ambrose
                  </div>
                  <div className="text-gray-600 dark:text-gray-800">
                    Lead marketer at Netflix{" "}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="">
            <div className="flex flex-col justify-between w-full h-full px-6 py-6 bg-gray-100 dark:bg-gray-800 md:px-14 rounded-2xl md:py-14 dark:bg-trueGray-800">
              <p className="text-2xl leading-normal dark:text-gray-300">
                "As a teacher, the student management app has made my life so
                much easier. I can track attendance, update grades, and
                communicate with parents seamlessly. It’s an indispensable tool
                for modern education."
              </p>
              <div className="flex items-center mt-8 space-x-3">
                <div className="flex-shrink-0 overflow-hidden rounded-full w-14 h-14">
                  <img
                    alt="Avatar"
                    src="https://images.unsplash.com/photo-1624224971170-2f84fed5eb5e?ixlib=rb-1.2.1&amp;ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;auto=format&amp;fit=crop&amp;w=100&amp;h=100&amp;crop=faces&amp;q=80"
                    loading="lazy"
                  />
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-800">
                    Gabrielle Winn
                  </div>
                  <div className="text-gray-600 dark:text-gray-800">
                    Co-founder of Acme Inc
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
