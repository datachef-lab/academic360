"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [siteName, setSiteName] = useState("BESC Student Console");
  const [siteDescription, setSiteDescription] = useState(
    "Student Portal for BESC"
  );
  const [enableMaterialsUpload, setEnableMaterialsUpload] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={24} className="text-primary" />
        <h1 className="text-2xl font-semibold">General Settings</h1>
      </div>
      <p className="text-muted-foreground">
        Basic configuration for your portal
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Site Information</CardTitle>
            <CardDescription>Basic information about your site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Enter site name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Input
                id="siteDescription"
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                placeholder="Enter site description"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Settings</CardTitle>
            <CardDescription>Enable or disable features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableMaterialsUpload"
                checked={enableMaterialsUpload}
                onCheckedChange={(checked) =>
                  setEnableMaterialsUpload(!!checked)
                }
              />
              <Label htmlFor="enableMaterialsUpload">
                Enable Materials Upload
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableNotifications"
                checked={enableNotifications}
                onCheckedChange={(checked) => setEnableNotifications(!!checked)}
              />
              <Label htmlFor="enableNotifications">
                Enable Email Notifications
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
