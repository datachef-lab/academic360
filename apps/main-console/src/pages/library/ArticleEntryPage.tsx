import { useNavigate } from "react-router-dom";
import { Book, Newspaper, ChevronRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";

const CARDS: {
  title: string;
  description: string;
  url: string;
  icon: typeof Book;
  accent: string;
}[] = [
  {
    title: "Books",
    description: "Catalogue and manage books — authors, copies, and publisher details.",
    url: "/dashboard/library/article-entry/books",
    icon: Book,
    accent: "bg-indigo-100 text-indigo-700",
  },
  {
    title: "Journal",
    description: "Catalogue and manage journals & periodicals and their issues.",
    url: "/dashboard/library/article-entry/journal",
    icon: Newspaper,
    accent: "bg-purple-100 text-purple-700",
  },
];

export default function ArticleEntryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <LibraryPageHeader
        icon={FileText}
        title="Article Entry"
        subtitle="Choose what you want to catalogue."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.url}
              role="button"
              tabIndex={0}
              onClick={() => navigate(card.url)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(card.url);
              }}
              className="group cursor-pointer p-5 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-3 ${card.accent}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
