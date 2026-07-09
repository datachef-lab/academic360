import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IdCard, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentAcademicYear } from "@/store/slices/academicYearSlice";

import { deleteTemplate, listTemplates } from "../api/idcard-api";
import { IdCardTemplate } from "../types";
import TemplateUpsertDialog from "../components/template-upsert-dialog";
import { IdCardPageHeader } from "../components/page-header";

export default function IdCardTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentAcademicYear = useAppSelector(selectCurrentAcademicYear);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<IdCardTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  const academicYearId = currentAcademicYear?.id;

  // Show templates across ALL academic years (no year filter).
  const query = useQuery({
    queryKey: ["idcard", "templates", { search, page }],
    queryFn: () =>
      listTemplates({
        search: search.trim() || undefined,
        page,
        limit: 20,
        includeDisabled: true,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      toast.success("Template deleted.");
      queryClient.invalidateQueries({ queryKey: ["idcard", "templates"] });
    },
    onError: () => toast.error("Could not delete template."),
  });

  return (
    <div className="p-6 space-y-4">
      <IdCardPageHeader
        icon={IdCard}
        title="ID Card Templates"
        subtitle="Front-side templates across all academic years."
        actions={
          <>
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-56"
            />
            <Button onClick={() => setCreating(true)} disabled={!academicYearId}>
              <Plus className="h-4 w-4 mr-1" /> New Template
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Preview (Front / Back)</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Canvas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!academicYearId && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-10">
                    Select an academic year to view templates.
                  </TableCell>
                </TableRow>
              )}
              {academicYearId && query.isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {academicYearId &&
                query.data?.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {row.templateImageUrl ? (
                          <img
                            src={row.templateImageUrl}
                            alt={`${row.name} front`}
                            title="Front"
                            className="h-16 w-12 object-cover rounded border"
                          />
                        ) : (
                          <div
                            className="h-16 w-12 rounded border bg-gray-50 flex items-center justify-center text-[10px] text-gray-400"
                            title="No front"
                          >
                            front
                          </div>
                        )}
                        {row.backsideImageUrl ? (
                          <img
                            src={row.backsideImageUrl}
                            alt={`${row.name} back`}
                            title="Back"
                            className="h-16 w-12 object-cover rounded border"
                          />
                        ) : (
                          <div
                            className="h-16 w-12 rounded border bg-gray-50 flex items-center justify-center text-[10px] text-gray-400"
                            title="No back uploaded"
                          >
                            back
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      {row.description && (
                        <div className="text-xs text-gray-500 line-clamp-1">{row.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{row.academicYear?.year ?? "—"}</TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {row.canvasWidthPx} × {row.canvasHeightPx}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          row.disabled ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {row.disabled ? "Disabled" : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/dashboard/tools/id-cards/templates/${row.id}/editor`)
                        }
                      >
                        Editor
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(row)}
                        className="ml-1"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 ml-1"
                        onClick={() => {
                          if (confirm("Delete this template?")) deleteMutation.mutate(row.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {academicYearId && !query.isLoading && (query.data?.rows.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-10">
                    No templates yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {query.data && query.data.total > query.data.limit && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500 self-center">
            Page {query.data.page} of {Math.ceil(query.data.total / query.data.limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page * (query.data.limit || 20) >= (query.data.total ?? 0)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {(creating || editing) && academicYearId && (
        <TemplateUpsertDialog
          open
          defaultAcademicYearId={academicYearId}
          template={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["idcard", "templates"] });
          }}
        />
      )}
    </div>
  );
}
