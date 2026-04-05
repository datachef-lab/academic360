import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Download, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getPromotionClauses } from "@/services/promotion-logic.api";
import type { PromotionClauseDto } from "@repo/db";

export default function PromotionClausesPage() {
  const [searchText, setSearchText] = React.useState("");
  const [rows, setRows] = React.useState<PromotionClauseDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPromotionClauses();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load promotion clauses";
      toast.error(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const filtered = React.useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = r.name?.toLowerCase() ?? "";
      const desc = r.description?.toLowerCase() ?? "";
      const idStr = String(r.id ?? "");
      return name.includes(q) || desc.includes(q) || idStr.includes(q);
    });
  }, [rows, searchText]);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Promotion Clauses</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Reusable promotion clauses and linked classes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" type="button" disabled>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" type="button" disabled>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Input
              placeholder="Search by name or id…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="rounded-md border border-gray-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Clause</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead className="text-center w-28">Status</TableHead>
                  <TableHead className="text-right w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      No promotion clauses yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r, i) => (
                    <TableRow key={r.id ?? i} className="hover:bg-gray-50/80">
                      <TableCell className="text-center text-gray-600 align-top py-3">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-medium align-top py-3 max-w-[200px]">
                        <span className="text-sm leading-snug">{r.name ?? "—"}</span>
                      </TableCell>
                      <TableCell className="align-top py-3 max-w-md">
                        <span className="text-sm text-gray-700 leading-snug line-clamp-3">
                          {r.description?.trim() ? r.description : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="align-top py-3 min-w-[180px]">
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(r.classes) && r.classes.length > 0 ? (
                            r.classes.map((cm) => (
                              <Badge
                                key={cm.id ?? `${cm.classId}-${cm.promotionClauseId}`}
                                variant="outline"
                                className="text-xs font-normal border-purple-200 text-purple-800 bg-purple-50/60"
                              >
                                {cm.class?.name ?? `Class #${cm.classId}`}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-top py-3">
                        {r.isActive ? (
                          <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top py-3">
                        <div className="inline-flex gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="h-8 w-8 p-0"
                            disabled
                            aria-label="Edit clause"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            disabled
                            aria-label="Delete clause"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
