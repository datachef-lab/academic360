import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookText, Loader2, Newspaper, Search, Library, Info } from "lucide-react";
import { librarySearch, getOpacCopies } from "@/services/library-search.service";
import { useActiveLibraryBranchId } from "@/features/library/use-library-branch";
import type { LibrarySearchHit, OpacCopyRow } from "@/services/library-search.service";
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

const fmtDate = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const statusClass = (status: string | null): string => {
  if (status === "Available") return "bg-emerald-100 text-emerald-700";
  if (status === "Issued") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
};

export default function LibrarySearchPage() {
  const [activeBranchId] = useActiveLibraryBranchId();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeType, setActiveType] = useState<HitType>("ALL");
  const [hits, setHits] = useState<LibrarySearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<LibrarySearchHit | null>(null);
  const [copies, setCopies] = useState<OpacCopyRow[]>([]);
  const [copiesLoading, setCopiesLoading] = useState(false);

  useEffect(() => {
    if (!selected || selected.type === "ARTICLE") {
      setCopies([]);
      return;
    }
    let cancelled = false;
    setCopiesLoading(true);
    getOpacCopies({ type: selected.type, id: selected.id })
      .then((rows) => {
        if (!cancelled) setCopies(rows);
      })
      .catch(() => {
        if (!cancelled) setCopies([]);
      })
      .finally(() => {
        if (!cancelled) setCopiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

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
                    <button
                      key={`${h.type}-${h.id}`}
                      onClick={() => setSelected(h)}
                      className="w-full rounded-lg border p-3 text-left shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <div className={`rounded-md p-1.5 ${meta.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{h.title}</p>
                          {h.author ? (
                            <p className="truncate text-xs text-gray-500">{h.author}</p>
                          ) : null}
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            {h.publisher ? <span>{h.publisher}</span> : null}
                            {h.status ? (
                              <span
                                className={`rounded-full px-2 py-0.5 font-medium ${statusClass(h.status)}`}
                              >
                                {h.status}
                              </span>
                            ) : null}
                            {h.status === "Issued" && h.nextAvailableDate ? (
                              <span>Next: {fmtDate(h.nextAvailableDate)}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto sm:block">
                <Table>
                  <TableHeader className={STICKY_THEAD_CLASS}>
                    <TableRow>
                      <TableHead className={cn(STICKY_TH_LEFT, "w-12")}>Sr no.</TableHead>
                      <TableHead className={cn(STICKY_TH_BASE, "w-24")}>Type</TableHead>
                      <TableHead className={STICKY_TH_BASE}>Title</TableHead>
                      <TableHead className={STICKY_TH_BASE}>Author</TableHead>
                      <TableHead className={STICKY_TH_BASE}>Edition</TableHead>
                      <TableHead className={STICKY_TH_BASE}>Language</TableHead>
                      <TableHead className={cn(STICKY_TH_RIGHT, "w-24 text-right")}>
                        Details
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hits.map((h, idx) => {
                      const meta = TYPE_META[h.type];
                      return (
                        <TableRow key={`${h.type}-${h.id}`}>
                          <TableCell className="text-gray-500">{idx + 1}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{h.title}</TableCell>
                          <TableCell className="text-gray-600">{h.author ?? "—"}</TableCell>
                          <TableCell className="text-gray-600">{h.edition ?? "—"}</TableCell>
                          <TableCell className="text-gray-600">{h.language ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => setSelected(h)}>
                              <Info className="mr-1 h-3.5 w-3.5" />
                              Details
                            </Button>
                          </TableCell>
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

      <Dialog open={selected != null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[88vh] w-[min(97vw,1100px)] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-6">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              {/* Article details */}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                {(
                  [
                    ["Type", TYPE_META[selected.type].label],
                    ["Author", selected.author],
                    ["Publisher", selected.publisher],
                    ["Edition", selected.edition],
                    ["ISBN / ISSN", selected.meta],
                    ["Subtitle", selected.subtitle],
                  ] as [string, string | null][]
                ).map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="truncate font-medium text-gray-800">{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>

              {/* Copy details (holdings) */}
              {selected.type !== "ARTICLE" ? (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Copy details</h4>
                    <span className="text-xs text-gray-500">
                      {copiesLoading
                        ? "Loading…"
                        : `${copies.length} ${copies.length === 1 ? "copy" : "copies"} · ${
                            copies.filter((c) => !c.availableDate).length
                          } available`}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-10">Sr no.</TableHead>
                          <TableHead>Acc. no</TableHead>
                          <TableHead>Old acc. no</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Avail. date</TableHead>
                          <TableHead>Demand</TableHead>
                          <TableHead>Copy type</TableHead>
                          <TableHead>Binding</TableHead>
                          <TableHead>Rack</TableHead>
                          <TableHead>Shelf</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {copiesLoading ? (
                          <TableRow>
                            <TableCell colSpan={10} className="py-6 text-center text-gray-500">
                              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                              Loading copies…
                            </TableCell>
                          </TableRow>
                        ) : copies.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="py-6 text-center text-gray-500">
                              No copies found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          copies.map((c, idx) => (
                            <TableRow key={c.id}>
                              <TableCell className="text-gray-500">{idx + 1}</TableCell>
                              <TableCell className="font-medium">{c.accessNumber ?? "—"}</TableCell>
                              <TableCell className="text-gray-600">
                                {c.oldAccessNumber ?? "—"}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                    c.availableDate
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-emerald-100 text-emerald-700"
                                  }`}
                                >
                                  {c.status ?? (c.availableDate ? "Issued" : "On shelf")}
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {c.availableDate ? fmtDate(c.availableDate) : "—"}
                              </TableCell>
                              <TableCell className="text-gray-600">No</TableCell>
                              <TableCell className="text-gray-600">{c.copyType ?? "—"}</TableCell>
                              <TableCell className="text-gray-600">{c.binding ?? "—"}</TableCell>
                              <TableCell className="text-gray-600">{c.rack ?? "—"}</TableCell>
                              <TableCell className="text-gray-600">{c.shelf ?? "—"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
