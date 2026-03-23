import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Edit, ImageIcon, ImagePlus, PlusCircle, Search, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AppModulePayload } from "../services/app-module.service";
import type { AppModuleDto } from "@repo/db/dtos/administration";
import {
  createAppModule,
  deleteAppModule,
  getAllAppModules,
  updateAppModule,
} from "../services/app-module.service";
import { LUCIDE_ICON_NAMES } from "../constants/lucide-icons";
import * as XLSX from "xlsx";

const APPLICATION_OPTIONS = [
  "MAIN_CONSOLE",
  "STUDENT_CONSOLE",
  "STUDENT_CONSOLE_MOBILE",
  "EXAM_ATTENDANCE_APP",
  "ID_CARD_GENERATOR",
  "EVENT_GATEKEEPER",
] as const;

const APPLICATION_BADGE_COLORS: Record<string, string> = {
  MAIN_CONSOLE: "bg-purple-100 text-purple-800 border-purple-200",
  STUDENT_CONSOLE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  STUDENT_CONSOLE_MOBILE: "bg-teal-100 text-teal-800 border-teal-200",
  EXAM_ATTENDANCE_APP: "bg-amber-100 text-amber-800 border-amber-200",
  ID_CARD_GENERATOR: "bg-indigo-100 text-indigo-800 border-indigo-200",
  EVENT_GATEKEEPER: "bg-pink-100 text-pink-800 border-pink-200",
};

const MODULE_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "base", label: "Base modules" },
  { value: "sub", label: "Sub-modules" },
] as const;

function getAppModuleImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath || typeof imagePath !== "string") return null;
  const p = imagePath.trim();
  if (!p || p === "{}") return null;
  const base = (import.meta.env.VITE_APP_BACKEND_URL || "").replace(/\/$/, "");
  // Canonical format: app-module-images/{id}/cover.ext
  if (p.startsWith("app-module-images/")) {
    return `${base}/${p}`;
  }
  // Legacy: public/app-module-images/... or paths with app-module-images
  if (p.includes("app-module-images")) {
    const normalized = p.replace(/^public[/\\]/, "").replace(/\\/g, "/");
    return `${base}/${normalized}`;
  }
  // Legacy: app-modules/{id}/cover.ext or ../../a360-assets/app-modules/...
  if (p.includes("app-modules/")) {
    const normalized = p.replace(/^(\.\.\/)+/, "").replace(/\\/g, "/");
    return `${base}/app-module-images/${normalized.split("app-modules/").pop() ?? normalized}`;
  }
  // Numeric ID format: settings file reference (e.g. "4" -> /api/v1/settings/file/4)
  if (/^\d+$/.test(p)) {
    return `${base}/api/v1/settings/file/${p}`;
  }
  return null;
}

const ICON_TYPE_OPTIONS = ["emoji", "lucide", "url"] as const;

function toSentenceCase(str: string): string {
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ICON_TYPE_DEFAULTS = {
  emoji: "📋",
  lucide: "LayoutDashboard",
  url: "",
  __none__: "",
} as const;

function ModuleNameCell({
  item,
  onImageClick,
}: {
  item: AppModuleDto;
  onImageClick?: (_url: string | null, _name: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const imgUrl = getAppModuleImageUrl(item.image);
  const showImg = imgUrl && !imgError;
  const IconComp =
    item.iconType === "lucide" && item.iconValue && item.iconValue in LucideIcons
      ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
          item.iconValue
        ]
      : null;
  const defaultPlaceholder = (
    <div className="w-full h-full flex items-center justify-center bg-muted/50 border border-dashed border-muted-foreground/20">
      {IconComp ? (
        <IconComp className="w-5 h-5 text-muted-foreground" />
      ) : item.iconType === "emoji" && item.iconValue ? (
        <span className="text-base">{item.iconValue}</span>
      ) : (
        <ImageIcon className="w-5 h-5 text-muted-foreground" />
      )}
    </div>
  );
  const handleImageClick = () => {
    if (onImageClick) onImageClick(showImg ? (imgUrl ?? null) : null, item.name);
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        role={onImageClick ? "button" : undefined}
        tabIndex={onImageClick ? 0 : undefined}
        onClick={onImageClick ? handleImageClick : undefined}
        onKeyDown={(e) => onImageClick && e.key === "Enter" && handleImageClick()}
        className={`w-8 h-8 rounded overflow-hidden bg-muted shrink-0 flex items-center justify-center ${onImageClick ? "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-shadow" : ""}`}
      >
        {showImg ? (
          <img
            src={imgUrl!}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          defaultPlaceholder
        )}
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {showImg && IconComp && <IconComp className="w-4 h-4 shrink-0 text-muted-foreground" />}
        <span className="font-medium truncate">{item.name}</span>
      </div>
    </div>
  );
}

function RequiredLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-red-500">*</span>
    </Label>
  );
}

const appModuleSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((v) => v.trim()),
  application: z.string().min(1, "Application is required"),
  parentAppModuleId: z
    .union([z.number(), z.string(), z.null()])
    .transform((v) => (v === "" || v === "__none__" ? null : v ? Number(v) : null)),
  description: z
    .string()
    .min(1, "Description is required")
    .transform((v) => v.trim()),
  iconType: z
    .string()
    .optional()
    .transform((v) => (v && v !== "__none__" ? v : null)),
  iconValue: z
    .string()
    .optional()
    .transform((v) => v?.trim() || null),
  componentKey: z
    .string()
    .min(1, "Component key is required")
    .transform((v) => v.trim()),
  routePath: z
    .string()
    .min(1, "Route path is required")
    .transform((v) => v.trim()),
  moduleUrl: z
    .string()
    .min(1, "Module URL is required")
    .transform((v) => v.trim()),
  isDynamic: z.boolean().default(false),
  isLayout: z.boolean().default(false),
  isProtected: z.boolean().default(false),
  isMasterModule: z.boolean().default(false),
  isReadOnly: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type AppModuleFormValues = z.infer<typeof appModuleSchema>;

interface AppModuleFormProps {
  dialogTitle: string;
  isEditMode: boolean;
  initialData: AppModuleDto | null;
  parentModules: AppModuleDto[];
  onSubmit: (_payload: AppModulePayload, _imageFile?: File) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function AppModuleForm({
  dialogTitle,
  isEditMode,
  initialData,
  parentModules,
  onSubmit,
  onCancel,
  isSubmitting,
}: AppModuleFormProps) {
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [coverImageError, setCoverImageError] = useState(false);
  const [lucideSearch, setLucideSearch] = useState("");
  const [lucidePickerOpen, setLucidePickerOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parentId = initialData?.parentAppModule?.id ?? null;

  const existingImageUrl = useMemo(
    () => getAppModuleImageUrl(initialData?.image),
    [initialData?.image],
  );

  const displayImageUrl = imagePreviewUrl ?? existingImageUrl;

  useEffect(() => {
    setCoverImageError(false);
  }, [displayImageUrl]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleImageSelect = (file: File | null) => {
    if (!file) {
      setImageFile(undefined);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setImageFile(file);
  };

  const handleLeftPanelClick = () => fileInputRef.current?.click();
  const handleLeftPanelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleImageSelect(e.dataTransfer.files?.[0] ?? null);
  };
  const handleLeftPanelDragOver = (e: React.DragEvent) => e.preventDefault();

  const filteredLucideIcons = useMemo(() => {
    const q = lucideSearch.toLowerCase().trim();
    if (!q) return LUCIDE_ICON_NAMES.slice(0, 200);
    return LUCIDE_ICON_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 200);
  }, [lucideSearch]);

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppModuleFormValues>({
    resolver: zodResolver(appModuleSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      application: initialData?.application ?? "MAIN_CONSOLE",
      parentAppModuleId: parentId,
      description: initialData?.description ?? "",
      iconType: initialData?.iconType ?? null,
      iconValue: initialData?.iconValue ?? "",
      componentKey: initialData?.componentKey ?? "",
      routePath: initialData?.routePath ?? "",
      moduleUrl: initialData?.moduleUrl ?? "",
      isDynamic: initialData?.isDynamic ?? false,
      isLayout: initialData?.isLayout ?? false,
      isProtected: initialData?.isProtected ?? false,
      isMasterModule: initialData?.isMasterModule ?? false,
      isReadOnly: initialData?.isReadOnly ?? false,
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    const pid = initialData?.parentAppModule?.id ?? null;
    reset({
      name: initialData?.name ?? "",
      application: initialData?.application ?? "MAIN_CONSOLE",
      parentAppModuleId: pid,
      description: initialData?.description ?? "",
      iconType: initialData?.iconType ?? null,
      iconValue: initialData?.iconValue ?? "",
      componentKey: initialData?.componentKey ?? "",
      routePath: initialData?.routePath ?? "",
      moduleUrl: initialData?.moduleUrl ?? "",
      isDynamic: initialData?.isDynamic ?? false,
      isLayout: initialData?.isLayout ?? false,
      isProtected: initialData?.isProtected ?? false,
      isMasterModule: initialData?.isMasterModule ?? false,
      isReadOnly: initialData?.isReadOnly ?? false,
      isActive: initialData?.isActive ?? true,
    });
    setImageFile(undefined);
    setCoverImageError(false);
    setLucideSearch("");
    setLucidePickerOpen(false);
    setEmojiPickerOpen(false);
  }, [initialData, reset]);

  const submit = async (values: AppModuleFormValues) => {
    const payload: AppModulePayload = {
      name: values.name,
      application: values.application,
      parentAppModuleId: values.parentAppModuleId,
      description: values.description,
      iconType: values.iconType,
      iconValue: values.iconValue,
      componentKey: values.componentKey,
      routePath: values.routePath,
      moduleUrl: values.moduleUrl,
      isDynamic: values.isDynamic,
      isLayout: values.isLayout,
      isProtected: values.isProtected,
      isMasterModule: values.isMasterModule,
      isReadOnly: values.isReadOnly,
      isActive: values.isActive,
    };
    await onSubmit(payload, imageFile);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col h-[82vh]">
      <div className="flex flex-1 min-h-0 gap-0">
        {/* Left panel: cover image - full height */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleLeftPanelClick}
          onDrop={handleLeftPanelDrop}
          onDragOver={handleLeftPanelDragOver}
          className="relative w-[240px] shrink-0 border-r bg-muted/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden self-stretch min-h-0"
          onKeyDown={(e) => e.key === "Enter" && handleLeftPanelClick()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleImageSelect(file ?? null);
              e.target.value = "";
            }}
          />
          {displayImageUrl && !coverImageError ? (
            <img
              key={displayImageUrl}
              src={displayImageUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full min-h-full min-w-full object-cover object-center bg-muted/20 block"
              onError={() => setCoverImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center text-muted-foreground text-sm">
              <ImagePlus className="h-10 w-10" />
              <span>Click to upload</span>
              <span className="text-xs">or drag & drop</span>
            </div>
          )}
        </div>

        {/* Right: form - title, scrollable content, fixed footer */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="shrink-0 px-4 pt-4 pb-3 border-b-2 border-slate-200 bg-slate-50/80 flex items-center gap-2">
            {isEditMode ? (
              <Edit className="h-5 w-5 shrink-0" />
            ) : (
              <PlusCircle className="h-5 w-5 shrink-0" />
            )}
            <AlertDialogTitle className="text-lg font-semibold">{dialogTitle}</AlertDialogTitle>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 pr-2">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="mb-4 w-full sm:w-auto">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="parameters">Parameters</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="name">Name</RequiredLabel>
                    <Input id="name" {...register("name")} />
                    {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="application">Application</RequiredLabel>
                    <Controller
                      name="application"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select application" />
                          </SelectTrigger>
                          <SelectContent>
                            {APPLICATION_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {toSentenceCase(opt)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="parentAppModuleId">Add it under module?</Label>
                    <Controller
                      name="parentAppModuleId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value != null ? String(field.value) : "__none__"}
                          onValueChange={(v) => field.onChange(v === "__none__" ? null : Number(v))}
                          disabled={watch("isReadOnly")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="None (top-level)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None (top-level)</SelectItem>
                            {parentModules.map((m) => (
                              <SelectItem key={m.id!} value={String(m.id!)}>
                                {m.name} ({m.componentKey})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <RequiredLabel htmlFor="description">Description</RequiredLabel>
                    <Textarea
                      id="description"
                      className="min-h-[60px] resize-y"
                      {...register("description")}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iconType">Icon Type</Label>
                    <Controller
                      name="iconType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? "__none__"}
                          onValueChange={(v) => {
                            const newType = v === "__none__" ? null : v;
                            field.onChange(newType);
                            const defaultVal =
                              ICON_TYPE_DEFAULTS[v as keyof typeof ICON_TYPE_DEFAULTS] ?? "";
                            setValue("iconValue", defaultVal);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {ICON_TYPE_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {(watch("iconType") ?? null) != null && watch("iconType") !== "__none__" ? (
                    <div className="space-y-2">
                      <Label htmlFor="iconValue">Icon Value</Label>
                      <Controller
                        name="iconValue"
                        control={control}
                        render={({ field }) => {
                          const iconType = watch("iconType") ?? null;
                          if (iconType === "lucide") {
                            return (
                              <Popover open={lucidePickerOpen} onOpenChange={setLucidePickerOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start font-normal h-9"
                                  >
                                    {field.value ? (
                                      <span className="flex items-center gap-2">
                                        {((): React.ReactNode => {
                                          const IconComp = (
                                            LucideIcons as unknown as Record<
                                              string,
                                              React.ComponentType<{ className?: string }>
                                            >
                                          )[field.value ?? ""];
                                          return IconComp ? (
                                            <IconComp className="h-4 w-4 shrink-0" />
                                          ) : null;
                                        })()}
                                        {field.value}
                                      </span>
                                    ) : (
                                      "Select Lucide icon..."
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[320px] p-0" align="start">
                                  <div className="p-2 border-b">
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        placeholder="Search icons..."
                                        value={lucideSearch}
                                        onChange={(e) => setLucideSearch(e.target.value)}
                                        className="pl-8"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-[280px] overflow-y-auto p-2 grid grid-cols-6 gap-1">
                                    {filteredLucideIcons.map((name) => {
                                      const IconComp = (
                                        LucideIcons as unknown as Record<
                                          string,
                                          React.ComponentType<{ className?: string }>
                                        >
                                      )[name];
                                      return (
                                        <button
                                          key={name}
                                          type="button"
                                          onClick={() => {
                                            field.onChange(name);
                                            setLucidePickerOpen(false);
                                          }}
                                          className={`p-2 rounded hover:bg-muted flex items-center justify-center ${field.value === name ? "bg-muted ring-1 ring-primary" : ""}`}
                                          title={name}
                                        >
                                          {IconComp ? (
                                            <IconComp className="h-4 w-4" />
                                          ) : (
                                            <span className="text-xs truncate">
                                              {name.slice(0, 2)}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            );
                          }
                          if (iconType === "emoji") {
                            return (
                              <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start font-normal h-9 text-lg"
                                  >
                                    {field.value || "Select emoji..."}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-0" align="start">
                                  <EmojiPicker
                                    onEmojiClick={(emojiData: EmojiClickData) => {
                                      field.onChange(emojiData.emoji);
                                      setEmojiPickerOpen(false);
                                    }}
                                    width={320}
                                    height={360}
                                  />
                                </PopoverContent>
                              </Popover>
                            );
                          }
                          return (
                            <Input
                              id="iconValue"
                              placeholder={
                                iconType === "url" ? "e.g. https://..." : "e.g. LayoutDashboard"
                              }
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          );
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </TabsContent>
              <TabsContent value="parameters" className="mt-0">
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="w-[140px] font-medium">Parameter</TableHead>
                          <TableHead className="font-medium">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium align-top pt-3">
                            Component Key
                          </TableCell>
                          <TableCell className="pt-2">
                            <Controller
                              name="componentKey"
                              control={control}
                              render={({ field }) => (
                                <span className="text-foreground">{field.value || "—"}</span>
                              )}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium align-top pt-3">Route Path</TableCell>
                          <TableCell className="pt-2">
                            <Controller
                              name="routePath"
                              control={control}
                              render={({ field }) => (
                                <span className="text-foreground">{field.value || "—"}</span>
                              )}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium align-top pt-3">Module URL</TableCell>
                          <TableCell className="pt-2">
                            <Controller
                              name="moduleUrl"
                              control={control}
                              render={({ field }) => (
                                <span className="text-foreground">{field.value || "—"}</span>
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </table>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {(
                      [
                        "isActive",
                        "isLayout",
                        "isProtected",
                        "isDynamic",
                        "isMasterModule",
                        "isReadOnly",
                      ] as const
                    ).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <Controller
                          name={key}
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              id={key}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={key !== "isActive"}
                              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            />
                          )}
                        />
                        <Label htmlFor={key} className="font-normal text-sm">
                          {key
                            .replace(/^is/, "")
                            .replace(/([A-Z])/g, " $1")
                            .trim()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="shrink-0 flex justify-end gap-2 px-4 py-3 border-t-2 border-slate-200 bg-slate-50/80">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function AppModulePage() {
  const [items, setItems] = useState<AppModuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [moduleTypeFilter, setModuleTypeFilter] = useState<"all" | "base" | "sub">("all");
  const [baseModuleFilter, setBaseModuleFilter] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selected, setSelected] = useState<AppModuleDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppModuleDto | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllAppModules();
      const payload = Array.isArray(response.payload) ? response.payload : [];
      setItems(payload);
      setError(null);
    } catch (err) {
      console.error(err);
      setItems([]);
      setError("Failed to load app modules");
      toast.error("Failed to load app modules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const parentModules = useMemo(() => items.filter((m) => !m.parentAppModule), [items]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (moduleTypeFilter === "base") {
      list = list.filter((m) => !m.parentAppModule);
    } else if (moduleTypeFilter === "sub") {
      list = list.filter((m) => m.parentAppModule != null);
      if (baseModuleFilter != null) {
        list = list.filter((m) => m.parentAppModule?.id === baseModuleFilter);
      }
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(s) ||
          item.description?.toLowerCase().includes(s) ||
          item.componentKey?.toLowerCase().includes(s) ||
          item.routePath?.toLowerCase().includes(s) ||
          item.application?.toLowerCase().includes(s),
      );
    }
    return list;
  }, [items, search, moduleTypeFilter, baseModuleFilter]);

  const onSave = async (payload: AppModulePayload, imageFile?: File) => {
    setIsSubmitting(true);
    try {
      if (selected?.id) {
        await updateAppModule(selected.id, payload, imageFile);
        toast.success("App module updated");
      } else {
        await createAppModule(payload, imageFile);
        toast.success("App module created");
      }
      setIsDialogOpen(false);
      setSelected(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Save failed", { description: "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      await deleteAppModule(deleteTarget.id);
      toast.success("App module deleted");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed", { description: "Please try again." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImagePreview = (url: string | null, name: string) => {
    if (url) setImagePreview({ url, name });
  };

  const handleDownload = () => {
    const rows = filteredItems.map((item) => ({
      id: item.id,
      name: item.name,
      application: item.application,
      description: item.description ?? "",
      parent: item.parentAppModule?.name ?? "—",
      isActive: item.isActive ? "Active" : "Inactive",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AppModules");
    XLSX.writeFile(workbook, "app_modules.xlsx");
  };

  return (
    <div className="p-2 sm:p-4 flex flex-col gap-4 min-h-[calc(100vh-140px)] overflow-x-hidden">
      <Card className="border-none">
        <CardHeader className="flex flex-col gap-4 border rounded-md p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 shrink-0 text-black" />
                <span className="text-lg font-semibold">App Module Management</span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Manage application modules, routes, and navigation hierarchy.
              </div>
            </div>

            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
              <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent className="w-[95vw] sm:w-full max-w-6xl h-[85vh] overflow-hidden p-0 gap-0">
                  <AppModuleForm
                    dialogTitle={selected ? "Edit App Module" : "Add New App Module"}
                    isEditMode={!!selected}
                    initialData={selected}
                    parentModules={parentModules}
                    onSubmit={onSave}
                    onCancel={() => setIsDialogOpen(false)}
                    isSubmitting={isSubmitting}
                  />
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <Dialog open={!!imagePreview} onOpenChange={(open) => !open && setImagePreview(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>{imagePreview?.name ?? "Image"}</DialogTitle>
            </DialogHeader>
            <div className="p-4 flex items-center justify-center bg-muted/30 min-h-[300px]">
              {imagePreview?.url && (
                <img
                  src={imagePreview.url}
                  alt={imagePreview.name}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        <CardContent className="px-0 overflow-x-hidden">
          <div className="bg-background p-2 sm:p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-0 flex-wrap">
            <Input
              placeholder="Search by name, description, component key, route..."
              className="w-full sm:w-64 flex-shrink-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={moduleTypeFilter}
              onValueChange={(v: "all" | "base" | "sub") => {
                setModuleTypeFilter(v);
                if (v !== "sub") setBaseModuleFilter(null);
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px] flex-shrink-0">
                <SelectValue placeholder="Module type" />
              </SelectTrigger>
              <SelectContent>
                {MODULE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {moduleTypeFilter === "sub" && (
              <Select
                value={baseModuleFilter != null ? String(baseModuleFilter) : "__all__"}
                onValueChange={(v) => setBaseModuleFilter(v === "__all__" ? null : Number(v))}
              >
                <SelectTrigger className="w-full sm:w-[180px] flex-shrink-0">
                  <SelectValue placeholder="Base module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All base modules</SelectItem>
                  {parentModules.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              className="flex items-center gap-2 flex-shrink-0"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>

          {/* Mobile: card layout */}
          <div className="md:hidden space-y-2 p-2 sm:p-4 overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Loading...
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No app modules found.</div>
            ) : (
              filteredItems.map((item, idx) => (
                <Card key={item.id ?? idx} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <ModuleNameCell item={item} onImageClick={handleImagePreview} />
                        <Badge
                          variant="outline"
                          className={`flex-shrink-0 text-xs ${
                            APPLICATION_BADGE_COLORS[item.application] ??
                            "bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          {toSentenceCase(item.application)}
                        </Badge>
                        <Badge
                          variant={item.isActive ? "default" : "secondary"}
                          className={
                            item.isActive
                              ? "bg-green-500 text-white hover:bg-green-600 flex-shrink-0"
                              : "flex-shrink-0"
                          }
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 break-words whitespace-normal">
                        {item.description ?? "—"}
                      </p>
                      {moduleTypeFilter === "sub" && item.parentAppModule && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {item.parentAppModule.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelected(item);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Dialog
                        open={deleteTarget?.id === item.id}
                        onOpenChange={(open) => setDeleteTarget(open ? item : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw]">
                          <DialogHeader>
                            <DialogTitle>Delete app module?</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground">
                            This will permanently remove <strong>{item.name}</strong>.
                          </p>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setDeleteTarget(null)}
                              disabled={isDeleting}
                            >
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
                              {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto h-full overflow-x-hidden">
              <table
                className="w-full caption-bottom text-sm border rounded-md"
                style={{ tableLayout: "fixed" }}
              >
                <TableHeader>
                  <TableRow className="sticky top-0 z-30 bg-[#f3f4f6] [&>th]:border-b hover:bg-[#f3f4f6]">
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 50 }}
                    >
                      #
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 130 }}
                    >
                      Application
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 200 }}
                    >
                      Name
                    </TableHead>
                    {moduleTypeFilter === "sub" && (
                      <TableHead
                        className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                        style={{ width: 140 }}
                      >
                        Sub module name
                      </TableHead>
                    )}
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 220 }}
                    >
                      Description
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 100 }}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 90 }}
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={moduleTypeFilter === "sub" ? 7 : 6}
                        className="text-center"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={moduleTypeFilter === "sub" ? 7 : 6}
                        className="text-center text-red-500"
                      >
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={moduleTypeFilter === "sub" ? 7 : 6}
                        className="text-center"
                      >
                        No app modules found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <TableRow key={item.id ?? idx}>
                        <TableCell style={{ width: 50 }}>{idx + 1}.</TableCell>
                        <TableCell style={{ width: 130 }}>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${
                              APPLICATION_BADGE_COLORS[item.application] ??
                              "bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                          >
                            {toSentenceCase(item.application)}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ width: 200 }}>
                          <ModuleNameCell item={item} onImageClick={handleImagePreview} />
                        </TableCell>
                        {moduleTypeFilter === "sub" && (
                          <TableCell style={{ width: 140 }} className="text-sm">
                            {item.parentAppModule?.name ?? "—"}
                          </TableCell>
                        )}
                        <TableCell
                          style={{ width: 220, maxWidth: 280 }}
                          className="text-xs text-muted-foreground break-words whitespace-normal align-top"
                        >
                          {item.description ?? "—"}
                        </TableCell>
                        <TableCell style={{ width: 100 }}>
                          {item.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 90 }}>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setSelected(item);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Dialog
                              open={deleteTarget?.id === item.id}
                              onOpenChange={(open) => setDeleteTarget(open ? item : null)}
                            >
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="h-6 w-6 p-0">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Delete app module?</DialogTitle>
                                </DialogHeader>
                                <p className="text-sm text-muted-foreground">
                                  This will permanently remove <strong>{item.name}</strong>.
                                </p>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={isDeleting}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={onDelete}
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
