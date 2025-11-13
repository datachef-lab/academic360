import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Library } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { findAllSettings, updateSetting } from "@/features/settings/services/settings-service";
import { useSettings } from "../hooks/use-settings";
import { Settings } from "@/features/settings/types/settings.type";
// import { useSettings } from "@/features/settings/providers/settings-provider";

export default function GeneralSettingsPage() {
  const { settings, setSettings } = useSettings();
  const [updatedSettings, setUpdatedSettings] = useState<Record<number, string | File>>({});
  const [previewImages, setPreviewImages] = useState<Record<number, string>>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Initialize preview images from existing settings (only once when settings are loaded)
    if (settings.length > 0 && !initializedRef.current) {
      const filePreviews: Record<number, string> = {};
      settings.forEach((setting: Settings) => {
        if (setting.type === "FILE") {
          filePreviews[setting.id!] = `${import.meta.env.VITE_APP_BACKEND_URL!}/api/v1/settings/file/${setting.id}`;
        }
      });
      setPreviewImages(filePreviews);
      initializedRef.current = true;
    }
  }, [settings]);

  const handleInputChange = (settingId: number, value: string | File) => {
    setUpdatedSettings((prev) => ({ ...prev, [settingId]: value }));
    if (value instanceof File) {
      setPreviewImages((prev) => ({ ...prev, [settingId]: URL.createObjectURL(value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatePromises = Object.entries(updatedSettings).map(([id, value]) => updateSetting(Number(id), value));
      await Promise.all(updatePromises);
      alert("Settings updated successfully!");
      setUpdatedSettings({});
      //   window.location.reload(); // Refresh to load saved values
    } catch (err) {
      console.error("Error updating settings:", err);
      alert("Failed to update settings.");
    } finally {
      findAllSettings().then((data) => {
        const payload = data.payload || [];
        setSettings(payload);

        const filePreviews: Record<number, string> = {};
        payload.forEach((setting: Settings) => {
          if (setting.type === "FILE") {
            filePreviews[setting.id!] = `${import.meta.env.VITE_APP_BACKEND_URL!}/api/v1/settings/file/${setting.id}`;
          }
        });
        setPreviewImages(filePreviews);
      });
    }
  };

  return (
    <div className="p-4">
      {/* Page Header */}
      <Card>
        <CardHeader className="bg-fuchsia-800 flex flex-row items-center mb-3 justify-between rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="space-y-3 w-full h-full">
            <CardTitle className="flex items-center text-xl font-semibold">
              <Library className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              General Settings
            </CardTitle>
            <div className="text-muted-foreground">Configure your college details below.</div>
          </div>
        </CardHeader>
      </Card>

      {/* Form Section */}
      <Card className="mt-4 border-none">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {settings
              .filter((ele) => ele.variant === "GENERAL")
              .map((settingItem) => {
                // const currentValue = updatedSettings[settingItem.id!] ?? settingItem.value;
                return (
                  <div key={settingItem.id!} className="grid grid-cols-2 items-center gap-4">
                    <Label>{settingItem.name}</Label>
                    {settingItem.type === "FILE" ? (
                      <div className="flex items-center gap-6">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleInputChange(settingItem.id!, file);
                          }}
                        />
                        {previewImages[settingItem.id!] ? (
                          <img
                            src={previewImages[settingItem.id!]}
                            alt="Preview"
                            className="h-20 w-20 object-contain rounded-md cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setZoomedImage(previewImages[settingItem.id!] ?? null)}
                          />
                        ) : (
                          <p>No image</p>
                        )}
                      </div>
                    ) : (
                      <Input
                        type="text"
                        defaultValue={String(settingItem.value)}
                        onChange={(e) => handleInputChange(settingItem.id!, e.target.value)}
                        placeholder={`Enter ${settingItem.name}`}
                      />
                    )}
                  </div>
                );
              })}

            {/* Submit Button */}
            <div className="pt-4">
              <Button type="submit">Save Settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Zoom Image Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-3xl p-0">
          {zoomedImage && (
            <img src={zoomedImage} alt="Zoomed Preview" className="w-full h-auto object-contain rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
