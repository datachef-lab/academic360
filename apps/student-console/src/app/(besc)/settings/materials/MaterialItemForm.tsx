import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BatchSubject } from "@/types/academics/batch-subjects";
import { DbCourseMaterial } from "@/types/academics/course-material";
import { ExternalLink, FileText, Trash2 } from "lucide-react";
import React from "react";

type MaterialItemFormProps = {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  subjects: BatchSubject[];
  currentMaterialLink: DbCourseMaterial;
  setCurrentMaterialLink: (material: DbCourseMaterial) => void;
  onSaveMaterial: () => void;
  isEditing: boolean;
  closeModal: () => void;
};

export default function MaterialItemForm({
  isEditing,
  isModalOpen,
  setIsModalOpen,
  subjects,
  currentMaterialLink,
  onSaveMaterial,
  setCurrentMaterialLink,
  closeModal,
}: MaterialItemFormProps) {
  const getSubjectName = (id: number) => {
    const subject = subjects.find((s) => s.subjectId === id);
    return subject ? subject.subjectname : "Unknown Subject";
  };

  const getSubjectType = (id: number) => {
    const subject = subjects.find((s) => s.subjectId === id);
    return subject ? subject.subjecttypename : "Unknown Type";
  };

  const getSubjectPaper = (id: number) => {
    const subject = subjects.find((s) => s.subjectId === id);
    return subject ? subject.paperName : "Unknown Paper";
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogTitle className="text-lg">
          {isEditing ? "Edit Material" : "Add Material"}
        </DialogTitle>

        {/* Subject context info */}
        <div className="bg-primary/5 -mx-6 px-6 py-3 border-y mb-5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white font-medium">
              {getSubjectName(currentMaterialLink.subject_id_fk)}
            </Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <Badge variant="secondary" className="font-normal">
              {getSubjectType(currentMaterialLink.subject_id_fk)}
            </Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs">
              {getSubjectPaper(currentMaterialLink.subject_id_fk)}
            </span>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-5">
          <div className="bg-muted/10 p-3 rounded-lg">
            <Label
              htmlFor="materialType"
              className="mb-2 block text-sm font-medium"
            >
              Material Type <span className="text-red-500">*</span>
            </Label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="typeLink"
                  name="materialType"
                  className="mr-2 h-4 w-4 accent-primary"
                  checked={currentMaterialLink.type === "link"}
                  onChange={() =>
                    setCurrentMaterialLink({
                      ...currentMaterialLink,
                      type: "link",
                      file_path: null,
                    })
                  }
                />
                <Label
                  htmlFor="typeLink"
                  className="cursor-pointer flex items-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  Link
                </Label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="typeFile"
                  name="materialType"
                  className="mr-2 h-4 w-4 accent-primary"
                  checked={currentMaterialLink.type === "file"}
                  onChange={() =>
                    setCurrentMaterialLink({
                      ...currentMaterialLink,
                      type: "file",
                      url: "",
                    })
                  }
                />
                <Label
                  htmlFor="typeFile"
                  className="cursor-pointer flex items-center gap-1.5"
                >
                  <FileText size={14} />
                  File Upload
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="title" className="mb-1.5 block text-sm font-medium">
              Material Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={currentMaterialLink.title}
              onChange={(e) =>
                setCurrentMaterialLink({
                  ...currentMaterialLink,
                  title: e.target.value,
                })
              }
              placeholder="Enter material title"
              className="border-muted-foreground/20"
            />
          </div>

          {currentMaterialLink.type === "link" ? (
            <div>
              <Label htmlFor="url" className="mb-1.5 block text-sm font-medium">
                URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="url"
                value={currentMaterialLink.url}
                onChange={(e) =>
                  setCurrentMaterialLink({
                    ...currentMaterialLink,
                    url: e.target.value,
                  })
                }
                placeholder="https://example.com/resource"
                className="border-muted-foreground/20"
              />
            </div>
          ) : (
            <div>
              <Label
                htmlFor="fileUpload"
                className="mb-1.5 block text-sm font-medium"
              >
                File Upload <span className="text-red-500">*</span>
              </Label>
              <div className="mt-1">
                <label
                  htmlFor="fileUpload"
                  className="cursor-pointer flex flex-col items-center justify-center w-full border-2 border-dashed border-primary/30 rounded-md py-6 px-4 hover:bg-primary/5 transition-all group bg-muted/5"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                    <FileText size={24} className="text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Drag and drop or click to upload
                  </span>
                  <span className="text-xs text-muted-foreground mt-1.5 max-w-[240px] text-center">
                    PDF, DOCX, PPT, XLSX files up to 10MB
                  </span>
                  <input
                    id="fileUpload"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCurrentMaterialLink({
                          ...currentMaterialLink,
                          file_path: URL.createObjectURL(e.target.files[0]),
                          title:
                            e.target.files[0].name || currentMaterialLink.title,
                        });
                      }
                    }}
                  />
                </label>
              </div>
              {currentMaterialLink.file_path && (
                <div className="mt-3 text-sm bg-primary/5 p-3 rounded-md border border-primary/20 flex items-start gap-2.5">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {currentMaterialLink.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ready to upload
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      setCurrentMaterialLink({
                        ...currentMaterialLink,
                        file_path: null,
                        title: "",
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={closeModal} size="sm">
            Cancel
          </Button>
          <Button
            onClick={onSaveMaterial}
            disabled={
              !currentMaterialLink.title ||
              (!currentMaterialLink.url && !currentMaterialLink.file_path)
            }
            size="sm"
          >
            {isEditing ? "Update" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
