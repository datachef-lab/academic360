import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MedalIcon, MapIcon, PlaneIcon, GiftIcon } from "../../components/Icons";

interface FeatureProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

const features: FeatureProps[] = [
  {
    icon: <MedalIcon />,
    title: "Student Management",
    description:
      "Easily manage student profiles, including personal information, academic records, and contact details.",
  },
  {
    icon: <MapIcon />,
    title: "Attendance Tracking",
    description:
      "Track student attendance in real-time, generate reports, and ensure no student misses out on important lessons.",
  },
  {
    icon: <PlaneIcon />,
    title: "Data Security",
    description:
      "Our system ensures the highest level of security for student data, protecting sensitive information with encryption.",
  },
  {
    icon: <GiftIcon />,
    title: "Grade Management",
    description:
      "Efficiently record, track, and manage student grades across various subjects and provide insightful reports.",
  },
];

export const HowItWorks = () => {
  return (
    <section
      id="howItWorks"
      className="container text-center py-12 sm:py-16 md:py-24 lg:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-6">
        How It{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Works
        </span>
        Step-by-Step Guide
      </h2>
      <p className="md:w-3/4 mx-auto mt-4 mb-8 text-xl text-muted-foreground">
        Learn how our Student Management System streamlines your administrative
        tasks and enhances productivity.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 m-5">
        {features.map(({ icon, title, description }: FeatureProps) => (
          <Card
            key={title}
            className="bg-muted/50 p-4 rounded-md shadow-md hover:shadow-lg transition-all duration-300"
          >
            <CardHeader className="mb-4">
              <CardTitle className="grid gap-4 place-items-center">
                {icon}
                <h3 className="text-lg font-semibold">{title}</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
