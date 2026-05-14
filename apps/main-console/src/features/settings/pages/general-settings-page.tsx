import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Library } from "lucide-react";
import React, { useEffect, useState } from "react";
import { updateSetting } from "@/features/settings/services/settings-service";
import { useSettings } from "../hooks/use-settings";
import { Settings } from "@/features/settings/types/settings.type";
// import { useSettings } from "@/features/settings/providers/settings-provider";

const backendBase = import.meta.env.VITE_APP_BACKEND_URL!;

function filePreviewUrl(setting: Settings): string {
  const id = setting.id!;
  const v = setting.updatedAt ? `?v=${encodeURIComponent(String(setting.updatedAt))}` : "";
  return `${backendBase}/api/v1/settings/file/${id}${v}`;
}

export default function GeneralSettingsPage() {
  const { settings, fetchSettings } = useSettings();
  const [updatedSettings, setUpdatedSettings] = useState<Record<number, string | File>>({});
  const [previewImages, setPreviewImages] = useState<Record<number, string>>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    setPreviewImages((prev) => {
      const next: Record<number, string> = { ...prev };
      settings.forEach((setting: Settings) => {
        if (setting.type !== "FILE" || setting.id == null) return;
        const draft = updatedSettings[setting.id];
        if (draft instanceof File) return;
        next[setting.id] = filePreviewUrl(setting);
      });
      return next;
    });
  }, [settings, updatedSettings]);

  const handleInputChange = (settingId: number, value: string | File) => {
    setUpdatedSettings((prev) => ({ ...prev, [settingId]: value }));
    if (value instanceof File) {
      setPreviewImages((prev) => ({ ...prev, [settingId]: URL.createObjectURL(value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatePromises = Object.entries(updatedSettings).map(([id, value]) =>
        updateSetting(Number(id), value),
      );
      await Promise.all(updatePromises);
      setUpdatedSettings({});
      await fetchSettings();
      alert("Settings updated successfully!");
    } catch (err) {
      console.error("Error updating settings:", err);
      alert("Failed to update settings.");
    }
  };

  const textValue = (item: Settings): string => {
    const draft = item.id != null ? updatedSettings[item.id] : undefined;
    if (typeof draft === "string") return draft;
    return String(item.value ?? "");
  };

  return (
    <div className="p-3 sm:p-4">
      {/* Page Header */}
      <Card>
        <CardHeader className="bg-fuchsia-800 flex flex-row items-center mb-3 justify-between rounded-md p-3 sm:p-4 sticky top-0 z-30 bg-background">
          <div className="space-y-2 sm:space-y-3 w-full h-full">
            <CardTitle className="flex items-center text-lg sm:text-xl font-semibold">
              <Library className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400" />
              General Settings
            </CardTitle>
            <div className="text-sm sm:text-base text-muted-foreground">
              Configure your college details below.
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form Section */}
      <Card className="mt-3 sm:mt-4 border-none">
        <CardContent className="pt-4 sm:pt-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {settings
              .filter((ele) => ele.variant === "GENERAL")
              .map((settingItem) => {
                // const currentValue = updatedSettings[settingItem.id!] ?? settingItem.value;
                return (
                  <div
                    key={settingItem.id!}
                    className="grid grid-cols-1 sm:grid-cols-2 items-center gap-3 sm:gap-4"
                  >
                    <Label className="text-sm sm:text-base">{settingItem.name}</Label>
                    {settingItem.type === "FILE" ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                        <Input
                          type="file"
                          accept="image/*"
                          className="w-full sm:w-auto"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleInputChange(settingItem.id!, file);
                          }}
                        />
                        {previewImages[settingItem.id!] ? (
                          <img
                            src={previewImages[settingItem.id!]}
                            alt="Preview"
                            className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-md cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
                            onClick={() => setZoomedImage(previewImages[settingItem.id!] ?? null)}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">No image</p>
                        )}
                      </div>
                    ) : (
                      <Input
                        type={
                          settingItem.type === "EMAIL"
                            ? "email"
                            : settingItem.type === "NUMBER"
                              ? "number"
                              : "text"
                        }
                        value={textValue(settingItem)}
                        onChange={(e) => handleInputChange(settingItem.id!, e.target.value)}
                        placeholder={`Enter ${settingItem.name}`}
                        className="w-full"
                      />
                    )}
                  </div>
                );
              })}

            {/* Submit Button */}
            <div className="pt-3 sm:pt-4">
              <Button type="submit" className="w-full sm:w-auto">
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Zoom Image Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl p-0">
          {zoomedImage && (
            <img
              src={zoomedImage}
              alt="Zoomed Preview"
              className="w-full h-auto object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
