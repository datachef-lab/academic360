// import { Statistics } from "./Statistics";
// import pilot from "../assets/pilot.png";

export const About = () => {
  return (
    <section id="about" className="container py-24 sm:py-32">
      <div className="bg-muted/50 border rounded-lg py-12 m-5">
        <div className="px-6 flex flex-col-reverse md:flex-row gap-8 md:gap-12">
          <img
            src="https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg"
            alt=""
            className="w-[300px] object-contain rounded-lg"
          />
          <div className="bg-green-0 flex flex-col justify-between">
            <div className="pb-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                  About{" "}
                </span>
                Academic 360
              </h2>
              <p className="text-xl text-muted-foreground mt-4">
                Welcome to our Student Management System (SMS), a comprehensive
                platform designed to streamline and optimize the management of
                student data, academic performance, and administrative tasks.
                Our mission is to provide educational institutions with an
                efficient and user-friendly solution to manage their students,
                teachers, courses, grades, and more. At the core of our system
                is the desire to improve the overall experience for students,
                teachers, and administrators. With our SMS, you can access
                real-time data, manage course schedules, track student
                performance, and communicate effectively within the institution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
