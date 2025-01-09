import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { MagnifierIcon, WalletIcon, ChartIcon } from "../../components/Icons";

interface ServiceProps {
  title: string;
  description: string;
  icon: JSX.Element;
}

const serviceList: ServiceProps[] = [
  {
    title: "Student Profile Management",
    description:
      "Manage student profiles including personal details, academic records, and contact information to ensure all records are up-to-date and easily accessible.",
    icon: <ChartIcon />,
  },
  {
    title: "Attendance Tracking",
    description:
      "Track student attendance in real-time, monitor attendance patterns, and generate attendance reports for administrators and teachers.",
    icon: <WalletIcon />,
  },
  {
    title: "Grade and Performance Analysis",
    description:
      "Analyze student grades and performance across subjects to gain insights, track progress, and ensure academic success.",
    icon: <MagnifierIcon />,
  },
];

export const Services = () => {
  return (
    <section className="container py-16 sm:py-24 lg:py-32">
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-8 place-items-center m-5">
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
              Student-Centric{" "}
            </span>
            Services
          </h2>

          <p className="text-muted-foreground text-lg sm:text-xl mt-4 mb-8">
            Our student management system offers the following services to
            enhance educational experiences and improve administrative
            efficiency.
          </p>

          <div className="flex flex-col gap-6 sm:gap-8">
            {serviceList.map(({ icon, title, description }: ServiceProps) => (
              <Card key={title}>
                <CardHeader className="space-y-1 flex flex-col sm:flex-row justify-start items-start gap-4">
                  <div className="mt-1 bg-primary/20 p-2 rounded-2xl w-fit">
                    {icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">
                      {title}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-md mt-2">
                      {description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <div className="w-full flex justify-center mt-8 sm:mt-0">
          <img
            src="https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg"
            className="w-full sm:w-[300px] md:w-[400px] lg:w-[600px] object-contain"
            alt="Student Management System Services"
          />
        </div>
      </div>
    </section>
  );
};
