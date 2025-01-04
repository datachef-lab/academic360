import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TestimonialProps {
  image: string;
  name: string;
  userName: string;
  comment: string;
}

const testimonials: TestimonialProps[] = [
  {
    image:
      "https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg",
    name: "Emma Wilson",
    userName: "@emma_wilson",
    comment:
      "This system has revolutionized how we manage student data. Attendance tracking and performance monitoring are seamless and efficient!",
  },
  {
    image:
      "https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg",
    name: "Michael Johnson",
    userName: "@michael_johnson",
    comment:
      "I love the centralized platform for assignments and performance reports. It saves time and keeps everything organized.",
  },
  {
    image:
      "https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg",
    name: "Sophia Lee",
    userName: "@sophia_lee",
    comment:
      "Our teachers are more focused now on teaching rather than paperwork. The reporting and analytics tools are a game-changer!",
  },
  {
    image:
      "https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg",
    name: "Daniel Smith",
    userName: "@daniel_smith",
    comment:
      "The system has simplified fee payments and attendance tracking. Parents love the transparency it provides!",
  },
  {
    image:
      "https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg",
    name: "Olivia Brown",
    userName: "@olivia_brown",
    comment:
      "Having all student records in one place has made administration tasks so much easier. Highly recommended for schools!",
  },
  {
    image:
      "https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg",
    name: "James Williams",
    userName: "@james_williams",
    comment:
      "This system has transformed communication between parents and teachers. Instant updates on attendance and grades make a huge difference!",
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="container py-16 sm:py-24 ">
      <h2 className="text-3xl md:text-4xl font-bold text-center">
        Why Educators and Administrators
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          {" "}
          Trust Our Platform
        </span>
      </h2>

      <p className="text-xl text-muted-foreground pt-4 pb-8 text-center">
        Hear from schools and institutions about how our Student Management
        System has improved their processes and outcomes.
      </p>

      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 m-5">
        {testimonials.map(
          ({ image, name, userName, comment }: TestimonialProps) => (
            <Card
              key={userName}
              className="max-w-md md:break-inside-avoid overflow-hidden shadow-lg"
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar>
                  <AvatarImage alt={name} src={image} />
                  <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <CardTitle className="text-lg font-semibold">
                    {name}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {userName}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="text-muted-foreground text-sm">
                {comment}
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </section>
  );
};
