import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Library } from "lucide-react";
import React, { useState } from "react";

export default function GeneralSettingsPage() {
  const [collegeName, setCollegeName] = useState("");
  const [collegeAbbr, setCollegeAbbr] = useState("");
  const [collegeLogo, setCollegeLogo] = useState<File | null>(null);
  const [loginImage, setLoginImage] = useState<File | null>(null);

  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [previewLoginImage, setPreviewLoginImage] = useState<string | null>(null);

  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleFileChange = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (url: string | null) => void,
  ) => {
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("collegeName", collegeName);
    formData.append("collegeAbbreviation", collegeAbbr);
    if (collegeLogo) formData.append("collegeLogo", collegeLogo);
    if (loginImage) formData.append("loginImage", loginImage);
    // TODO: Send formData to backend
    console.log("Form Submitted");
  };

  return (
    <div className="p-4">
      {/* Page Header */}
      <Card className="">
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
            {/* College Name */}
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="collegeName">College Name</Label>
              <Input
                id="collegeName"
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                required
                placeholder="Enter the college name"
              />
            </div>

            {/* College Abbreviation */}
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="collegeAbbr">College Abbreviation</Label>
              <Input
                id="collegeAbbr"
                type="text"
                value={collegeAbbr}
                placeholder="Enter the college abbreviation"
                onChange={(e) => setCollegeAbbr(e.target.value)}
                required
              />
            </div>

            {/* College Logo */}
            <div className="grid grid-cols-2 items-center gap-4 min-h-[80px]">
              <div>
                <Input
                  id="collegeLogo"
                  type="file"
                  accept="image/*"
                  className="w-1/2"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setCollegeLogo, setPreviewLogo)}
                />
                <p className="text-xs py-2">College Logo Image</p>
              </div>
              <div className="flex items-center gap-6">
                {previewLogo ? (
                  <img
                    src={previewLogo}
                    alt="College Logo Preview"
                    className="h-20 w-20 object-contain rounded-md cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setZoomedImage(previewLogo)}
                  />
                ) : (
                  <p>No preview image to show!</p>
                )}
              </div>
            </div>

            {/* Login Screen Image */}
            <div className="grid grid-cols-2 items-center gap-4 min-h-[80px]">
              <div>
                <Input
                  id="loginImage"
                  type="file"
                  accept="image/*"
                  className="w-1/2"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setLoginImage, setPreviewLoginImage)}
                />
                <p className="text-xs py-2">Login Screen Image</p>
              </div>
              <div className="flex items-center gap-6">
                {previewLoginImage ? (
                  <img
                    src={previewLoginImage}
                    alt="Login Screen Preview"
                    className="h-20 w-20 object-contain rounded-md cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setZoomedImage(previewLoginImage)}
                  />
                ) : (
                  <p>No preview image to show!</p>
                )}
              </div>
            </div>

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
