import { useNavigate } from "react-router-dom";
import { Book, FileText, Newspaper } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import booksIllustration from "./assets/library-concept.jpg";
import journalsIllustration from "./assets/journals-trolley.jpg";

type EntryCard = {
  title: string;
  items: string;
  description: string;
  href: string;
  icon: typeof Book;
  iconColor: string;
  illustration: string;
};

const CARDS: EntryCard[] = [
  {
    title: "Books",
    items: "Authors, copies, publisher details",
    description:
      "Catalogue and manage books — authors, copies, and publisher details. Track each accession, its copies and where they sit on the shelves.",
    href: "/dashboard/library/article-entry/books",
    icon: Book,
    iconColor: "text-indigo-600",
    illustration: booksIllustration,
  },
  {
    title: "Journal",
    items: "Titles, issues, subscriptions",
    description:
      "Catalogue and manage journals & periodicals and their issues. Record subscriptions from vendors and mark issues as they arrive.",
    href: "/dashboard/library/article-entry/journal",
    icon: Newspaper,
    iconColor: "text-violet-600",
    illustration: journalsIllustration,
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
      {/* Only two cards today — a full-width 3-column grid left them stuck
          against the left edge with a big empty gutter on the right. Cap the
          row at ~2 tiles and `mx-auto` centres it so the pair sits under the
          page header rather than hugging the sidebar. */}
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 sm:gap-6">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.href}
              onClick={() => navigate(card.href)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(card.href);
              }}
              role="button"
              tabIndex={0}
              className="group w-full cursor-pointer overflow-hidden rounded-xl border border-gray-300 bg-white transition-all duration-300 hover:border-gray-400 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <CardContent className="flex h-full flex-col p-0">
                <div className="flex items-center gap-3 border-b border-gray-100 p-4 transition-colors group-hover:bg-gray-50 sm:p-5">
                  <div className="shrink-0 rounded-lg bg-gray-100 p-2 shadow-sm">
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base font-semibold text-gray-900 transition-colors group-hover:text-gray-700 sm:text-lg">
                      {card.title}
                    </CardTitle>
                    <p className="truncate text-xs font-medium text-gray-500">{card.items}</p>
                  </div>
                </div>

                <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 sm:h-44 lg:h-56">
                  <img
                    src={card.illustration}
                    alt={`${card.title} illustration`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="text-xs leading-relaxed text-white sm:text-sm">
                      {card.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
