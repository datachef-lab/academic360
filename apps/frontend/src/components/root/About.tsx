export const About = () => {
  return (
    <>
      <section className="" id="about">
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="font-heading mb-4 bg-orange-100 px-4 py-2 rounded-lg md:w-64 md:mx-auto text-xs font-semibold tracking-widest text-black uppercase title-font">
                About Us
              </h2>
              <p className="font-heading mt-2 text-3xl leading-8 font-semibold tracking-tight text-gray-900 sm:text-4xl">
                Empowering Education with a 360° Student Management Experience
              </p>
              <p className="mt-4 max-w-2xl text-lg text-gray-500 lg:mx-auto">
                Our student management app offers a comprehensive solution that
                covers everything from academic performance tracking to
                communication with students and parents. We believe in making
                education more accessible, organized, and efficient.
              </p>
            </div>

            <div className="mt-10">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <img src="https://static.vecteezy.com/system/resources/previews/054/452/968/non_2x/creative-learning-progress-icon-vector.jpg" />
                    </div>
                    <p className="font-heading ml-16 text-lg leading-6 font-bold text-gray-700">
                      Comprehensive Academic Tracking
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Track students' academic performance, grades, assignments,
                    and attendance in one unified platform. Make data-driven
                    decisions to help students excel.
                  </dd>
                </div>
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <img src="https://static.vecteezy.com/system/resources/previews/000/126/375/non_2x/businessman-vector-illustration.jpg" />
                    </div>
                    <p className="font-heading ml-16 text-lg leading-6 font-bold text-gray-700">
                      Seamless Parent & Teacher Communication
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Our app provides an easy-to-use communication channel for
                    parents and teachers, ensuring everyone is on the same page
                    when it comes to student progress.
                  </dd>
                </div>
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <img src="https://static.vecteezy.com/system/resources/previews/054/453/081/non_2x/future-educator-icon-vector.jpg" />
                    </div>
                    <p className="font-heading ml-16 text-lg leading-6 font-bold text-gray-700">
                      Holistic Student Profile
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Each student has a profile containing personal details,
                    academic records, behavior logs, and extracurricular
                    activities—empowering educators to address every aspect of a
                    student’s growth.
                  </dd>
                </div>
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <img src="https://static.vecteezy.com/system/resources/previews/009/102/039/non_2x/attention-sign-or-warning-caution-exclamation-sign-danger-yellow-triangle-stock-illustration-free-vector.jpg" />
                    </div>
                    <p className="font-heading ml-16 text-lg leading-6 font-bold text-gray-700">
                      Real-time Notifications & Alerts
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Receive instant alerts about student performance, deadlines,
                    school events, and updates. Stay informed with real-time
                    notifications.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
