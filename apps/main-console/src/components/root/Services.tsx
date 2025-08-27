import React from "react";
import {
  FaRegAddressCard,
  FaChalkboardTeacher,
  FaCalendarAlt,
} from "react-icons/fa";

interface Service {
  title: string;
  description: string;
  icon: JSX.Element;
  features: string[];
}

const services: Service[] = [
  {
    title: "Student Enrollment and Registration",
    description:
      "Our platform simplifies the student enrollment process, offering a seamless and automated registration system, helping administrators manage student data with ease.",
    icon: <FaRegAddressCard />,
    features: [
      "Automated Enrollment",
      "Real-Time Registration Tracking",
      "Centralized Student Data",
    ],
  },
  {
    title: "Gradebook and Academic Performance Tracking",
    description:
      "Track academic performance with real-time gradebooks, providing students, teachers, and parents with up-to-date information on progress and performance.",
    icon: <FaChalkboardTeacher />,
    features: [
      "Automated Grade Calculations",
      "Student Progress Dashboards",
      "Parent-Teacher Communication",
    ],
  },
  {
    title: "Class Scheduling and Management",
    description:
      "Our platform offers an efficient way to create, manage, and share class schedules, ensuring smooth coordination between teachers and students.",
    icon: <FaCalendarAlt />,
    features: [
      "Automatic Schedule Generation",
      "Room and Teacher Availability Tracking",
      "Student Class Enrollments",
    ],
  },
];

export const Services: React.FC = () => {
  return (
    <div
      className="px-4 py-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-20"
      id="services"
    >
      <div className="max-w-xl mb-10 md:mx-auto sm:text-center lg:max-w-2xl md:mb-12">
        <div>
          <p className="inline-block px-3 py-px mb-4 text-xs font-semibold tracking-wider text-teal-900 uppercase rounded-full bg-sky-500">
            Our Services
          </p>
        </div>
        <h2 className="max-w-lg mb-6 font-sans text-3xl font-bold leading-none tracking-tight text-gray-900 sm:text-4xl md:mx-auto">
          <span className="relative inline-block">
            <span className="relative">The</span>
          </span>
          Comprehensive Solution for Student Management
        </h2>
        <p className="text-base text-gray-700 md:text-lg">
          Our Academic 360° services offer powerful tools to simplify student
          management, improve engagement, and streamline academic processes.
          From enrollment to graduation, we cover all aspects of academic
          management.
        </p>
      </div>

      <div className="grid max-w-md gap-8 row-gap-10 sm:mx-auto lg:max-w-full lg:grid-cols-3">
        {services.map((service, index) => (
          <div key={index} className="flex flex-col sm:flex-row">
            <div className="sm:mr-4">
              <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-50">
                {service.icon}
              </div>
            </div>
            <div>
              <h6 className="mb-2 font-semibold leading-5">{service.title}:</h6>
              <p className="mb-3 text-sm text-gray-900">
                {service.description}
              </p>
              <ul className="mb-4 -ml-1 space-y-2">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    🎯
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
