import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FeatureProps {
  title: string;
  description: string;
  image: string;
}

const features: FeatureProps[] = [
  {
    title: "Student Profile Management",
    description:
      "Easily manage student profiles, including personal details, contact information, and academic history.",
    image:
      "https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg",
  },
  {
    title: "Attendance Tracking",
    description:
      "Track student attendance in real-time, ensuring accurate records and generating detailed attendance reports.",
    image:
      "https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg",
  },
  {
    title: "Grade Management & Reports",
    description:
      "Efficiently manage and calculate grades across various subjects, providing insightful performance reports for students.",
    image:
      "https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg",
  },
];

const featureList: string[] = [
  "Student Profiles",
  "Attendance Tracking",
  "Grade Reports",
  "Real-time Analytics",
  "Course Management",
  "Data Security",
  "Performance Tracking",
  "Notifications",
  "Mobile Friendly",
];

export const Features = () => {
  return (
    <section id="features" className="container py-24 sm:py-32 space-y-8">
      <h2 className="text-3xl lg:text-4xl font-bold md:text-center">
        Many{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Great Features
        </span>
      </h2>

      <div className="flex flex-wrap md:justify-center gap-4 m-5">
        {featureList.map((feature: string) => (
          <div key={feature}>
            <Badge variant="secondary" className="text-sm">
              {feature}
            </Badge>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 m-5">
        {features.map(({ title, description, image }: FeatureProps) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>

            <CardContent>{description}</CardContent>

            <CardFooter>
              <img
                src={image}
                alt="Feature related to student management"
                className="w-[200px] lg:w-[300px] mx-auto"
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};
