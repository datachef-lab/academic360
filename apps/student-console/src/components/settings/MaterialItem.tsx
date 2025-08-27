import { Download, Edit, ExternalLink, Trash2 } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { DbCourseMaterial } from "@/types/academics/course-material";

type MaterialItemProps = {
  material: DbCourseMaterial;
  openEditModal: (material: DbCourseMaterial) => void;
  onDelete: (id: number | undefined) => Promise<void>;
};

export default function MaterialItem({
  material,
  openEditModal,
  onDelete,
}: MaterialItemProps) {
  return (
    <div
      key={material.id}
      className="flex items-center justify-between group px-2 py-1 hover:bg-muted/10 rounded"
    >
      <a
        href={material.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline flex items-center gap-1.5 font-medium flex-1"
      >
        {material.type === "link" ? (
          <ExternalLink size={14} />
        ) : (
          <Download size={14} />
        )}
        <span>{material.title}</span>
      </a>
      <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-primary"
          onClick={() => openEditModal(material)}
          title="Edit Material"
        >
          <Edit size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(material.id)}
          title="Delete Material"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}
