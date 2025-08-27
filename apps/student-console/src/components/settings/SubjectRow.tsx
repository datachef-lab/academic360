import React, { useState, useEffect } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BatchSubject } from "@/types/academics/batch-subjects";
import { DbCourseMaterial } from "@/types/academics/course-material";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SubjectRowProps = {
  index: number;
  subject: BatchSubject;
  openAddModal: (subjectId: number) => void;
  openEditModal: (material: DbCourseMaterial) => void;
  onDeleteMaterial: (materialId: number) => void;
};

const SubjectRow: React.FC<SubjectRowProps> = ({
  index,
  subject,
  openAddModal,
  openEditModal,
  onDeleteMaterial,
}) => {
  const [materials, setMaterials] = useState<DbCourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { accessToken } = useAuth();

  // Fetch materials for this subject
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);

        // Set up headers with auth token
        const headers: HeadersInit = {};
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        } else {
          console.log(
            `No token available for fetching materials for subject ${subject.subjectId}`
          );
        }

        const response = await fetch(
          `/api/course-materials?subjectId=${subject.subjectId}`,
          { headers }
        );

        if (!response.ok) {
          console.log(
            `Materials API response status for subject ${subject.subjectId}:`,
            response.status
          );
          throw new Error(
            `Failed to fetch materials for subject ${subject.subjectId}`
          );
        }

        const data = await response.json();
        setMaterials(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(
          `Error fetching materials for subject ${subject.subjectId}:`,
          error
        );
        setMaterials([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (subject?.subjectId && accessToken) {
      fetchMaterials();
    }
  }, [subject, subject?.subjectId, accessToken]);

  const handleDeleteClick = (materialId: number) => {
    if (deleteConfirm === materialId) {
      // User has confirmed deletion
      onDeleteMaterial(materialId);
      setDeleteConfirm(null);
    } else {
      // First click, ask for confirmation
      setDeleteConfirm(materialId);
      // Auto-reset after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const materialTypeIcon = (type: string) => {
    if (type === "link") return <LinkIcon className="h-4 w-4" />;
    if (type === "file") return <FileText className="h-4 w-4" />;
    return null;
  };

  return (
    <TableRow>
      <TableCell className="text-center font-medium">{index + 1}</TableCell>
      <TableCell className="font-medium">
        {subject.subjectname || "Unknown Subject"}
      </TableCell>
      <TableCell className="text-center">
        {subject.subjecttypename || "N/A"}
      </TableCell>
      <TableCell className="text-center">
        {subject.paperName || "N/A"}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2 justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : materials.length > 0 ? (
            materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center gap-1.5 group relative"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="flex items-center justify-center gap-1.5 px-2 py-1 h-7 cursor-pointer hover:bg-muted"
                      >
                        {materialTypeIcon(material.type)}
                        <span className="text-xs max-w-[150px] truncate">
                          {material.title}
                        </span>
                        {material.type === "link" && material.url && (
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 opacity-60 hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{material.title}</p>
                      {material.type === "link" && (
                        <p className="text-xs text-muted-foreground">
                          {material.url}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 flex gap-1 -mt-2 -mr-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-5 w-5 bg-background border shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(material);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={
                      deleteConfirm === material.id
                        ? "destructive"
                        : "secondary"
                    }
                    size="icon"
                    className="h-5 w-5 bg-background border shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(material.id!);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No materials</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => openAddModal(subject.subjectId)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Material
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default SubjectRow;
