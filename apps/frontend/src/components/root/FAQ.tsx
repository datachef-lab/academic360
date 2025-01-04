import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

// FAQ list specific to Student Management System
const FAQList: FAQProps[] = [
  {
    question: "What is a Student Management System?",
    answer:
      "A Student Management System is a software platform designed to manage student data, including enrollment, attendance, grades, and reports, making it easier to track student performance and activities.",
    value: "item-1",
  },
  {
    question: "How secure is the Student Management System?",
    answer:
      "Our Student Management System uses advanced encryption and secure access protocols to ensure all student data is protected and complies with data privacy laws.",
    value: "item-2",
  },
  {
    question: "Can teachers and parents access the system?",
    answer:
      "Yes, the system allows different access roles for administrators, teachers, students, and parents, ensuring personalized access based on user needs.",
    value: "item-3",
  },
  {
    question: "Does it support online fee payments?",
    answer:
      "Absolutely! The system integrates with multiple payment gateways to facilitate secure and easy online fee payments for parents and students.",
    value: "item-4",
  },
  {
    question: "Can I track attendance and performance reports?",
    answer:
      "Yes, you can track real-time attendance and generate performance reports for individual students, classes, or the entire institution.",
    value: "item-5",
  },
];

export const FAQ = () => {
  return (
    <section
      id="faq"
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
        Frequently Asked{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Questions
        </span>
      </h2>

      <p className="text-lg text-muted-foreground text-center mb-8">
        Here are some common questions about our Student Management System.
      </p>

      {/* Accordion */}
      <Accordion type="single" collapsible className="w-full">
        {FAQList.map(({ question, answer, value }: FAQProps) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger className="text-left text-lg">
              {question}
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground">
              {answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <h3 className="font-medium mt-8 text-center">
        Still have questions?{" "}
        <a
          rel="noreferrer noopener"
          href="#"
          className="text-primary transition-all border-primary hover:border-b-2"
        >
          Contact us
        </a>
      </h3>
    </section>
  );
};
