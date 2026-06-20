import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookText, Loader2, Newspaper, Search, Library } from "lucide-react";
import { librarySearch } from "@/services/library-search.service";
import { useActiveLibraryBranchId } from "@/features/library/use-library-branch";
import type { LibrarySearchHit } from "@/services/library-search.service";
import {
  STICKY_THEAD_CLASS,
  STICKY_TH_BASE,
  STICKY_TH_LEFT,
  STICKY_TH_RIGHT,
} from "@/components/library/LibraryTablePage";
import { cn } from "@/lib/utils";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";

type HitType = "ALL" | "BOOK" | "JOURNAL" | "COPY" | "ARTICLE";

const TYPE_META: Record<
  Exclude<HitType, "ALL">,
  { label: string; color: string; icon: typeof BookText }
> = {
  BOOK: { label: "Book", color: "bg-indigo-100 text-indigo-700", icon: BookText },
  JOURNAL: { label: "Journal", color: "bg-purple-100 text-purple-700", icon: Newspaper },
  COPY: { label: "Copy", color: "bg-emerald-100 text-emerald-700", icon: Library },
  ARTICLE: { label: "Article", color: "bg-amber-100 text-amber-700", icon: BookText },
};

export default function LibrarySearchPage() {
  const [activeBranchId] = useActiveLibraryBranchId();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeType, setActiveType] = useState<HitType>("ALL");
  const [hits, setHits] = useState<LibrarySearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const runSearch = useCallback(async () => {
    if (!debounced.trim()) {
      setHits([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const res = await librarySearch({
        q: debounced.trim(),
        type: activeType === "ALL" ? undefined : activeType,
        limit: 50,
        ...(activeBranchId != null ? { branchId: activeBranchId } : {}),
      });
      setHits(res.payload?.hits ?? []);
      setTotal(res.payload?.total ?? 0);
    } catch {
      toast.error("Search failed.");
    } finally {
      setLoading(false);
    }
  }, [debounced, activeType, activeBranchId]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <LibraryPageHeader
        icon={Search}
        title="Library Discovery"
        subtitle="Search the entire library catalogue across books, journals, copies, and articles."
      />
      <div className="rounded-md border bg-background p-3 sm:p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              autoFocus
              placeholder="Search books, journals, copies, articles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 pl-9 text-base"
            />
          </div>

          <Tabs value={activeType} onValueChange={(v) => setActiveType(v as HitType)}>
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="BOOK">Books</TabsTrigger>
              <TabsTrigger value="JOURNAL">Journals</TabsTrigger>
              <TabsTrigger value="COPY">Copies</TabsTrigger>
              <TabsTrigger value="ARTICLE">Articles</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex justify-center py-10 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !debounced.trim() ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Start typing to search the entire library catalogue.
            </div>
          ) : hits.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              No results for "{debounced}".
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-500">
                {total} result{total === 1 ? "" : "s"}
              </div>

              {/* Mobile cards */}
              <div className="space-y-2 sm:hidden">
                {hits.map((h) => {
                  const meta = TYPE_META[h.type];
                  const Icon = meta.icon;
                  return (
                    <div key={`${h.type}-${h.id}`} className="rounded-lg border p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <div className={`rounded-md p-1.5 ${meta.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{h.title}</p>
                          {h.subtitle ? (
                            <p className="truncate text-xs text-gray-500">{h.subtitle}</p>
                          ) : null}
                          {h.meta ? <p className="mt-1 text-xs text-gray-500">{h.meta}</p> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader className={STICKY_THEAD_CLASS}>
                    <TableRow>
                      <TableHead className={cn(STICKY_TH_LEFT, "w-24")}>Type</TableHead>
                      <TableHead className={STICKY_TH_BASE}>Title</TableHead>
                      <TableHead className={STICKY_TH_BASE}>Subtitle</TableHead>
                      <TableHead className={STICKY_TH_RIGHT}>Meta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hits.map((h) => {
                      const meta = TYPE_META[h.type];
                      return (
                        <TableRow key={`${h.type}-${h.id}`}>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{h.title}</TableCell>
                          <TableCell className="text-gray-600">{h.subtitle ?? "—"}</TableCell>
                          <TableCell className="text-gray-500">{h.meta ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
