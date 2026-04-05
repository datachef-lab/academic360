import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Download } from "lucide-react";
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
import { getPromotionBuilders } from "@/services/promotion-logic.api";
import type { PromotionBuilderDto } from "@repo/db";

/**
 * Default landing view for Student Promotion Logic — promotion builder list.
 * Replace or extend this table when the final UI is ready.
 */
export default function PromotionBuilderPage() {
  const [searchText, setSearchText] = React.useState("");
  const [rows, setRows] = React.useState<PromotionBuilderDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPromotionBuilders();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load promotion builders";
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
      const aff = r.affiliation?.name?.toLowerCase() ?? "";
      const tc = r.targetClass?.name?.toLowerCase() ?? "";
      const idStr = String(r.id ?? "");
      return aff.includes(q) || tc.includes(q) || idStr.includes(q);
    });
  }, [rows, searchText]);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Promotion Builder</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              A list of promotion builders and their target class rules.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" type="button" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download
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
              placeholder="Search by affiliation, target class, or id…"
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
                  <TableHead>Affiliation</TableHead>
                  <TableHead>Target class</TableHead>
                  <TableHead className="text-center">Rules</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right w-32">Actions</TableHead>
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
                      No promotion builders yet. Add flows will plug in here.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r, i) => (
                    <TableRow key={r.id ?? i} className="hover:bg-gray-50/80">
                      <TableCell className="text-center text-gray-600">{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.affiliation?.name ?? "—"}</TableCell>
                      <TableCell>{r.targetClass?.name ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        {Array.isArray(r.rules) ? r.rules.length : 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-gray-400 text-sm">—</TableCell>
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
