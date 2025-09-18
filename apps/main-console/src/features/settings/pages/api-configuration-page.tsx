import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { findAllSettings } from "@/features/settings/services/settings-service";
import { Settings } from "@/features/settings/types/settings.type";

export default function ApiConfigurationPage() {
  const [formData, setFormData] = useState({
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    INTERAKT_API_KEY: "",
    INTERAKT_BASE_URL: "",
    ZEPTO_URL: "",
    ZEPTO_FROM: "",
    ZEPTO_TOKEN: "",
  });
  const [settings, setSettings] = useState<Settings[]>([]);

  useEffect(() => {
    findAllSettings().then((data) => {
      setSettings(data.payload.filter((ele: any) => ele.variant === "API_CONFIG"));
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Data:", formData);
    // TODO: Submit the form data to backend
  };

  const handleReset = () => {
    setFormData({
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      INTERAKT_API_KEY: "",
      INTERAKT_BASE_URL: "",
      ZEPTO_URL: "",
      ZEPTO_FROM: "",
      ZEPTO_TOKEN: "",
    });
  };

  return (
    <div className="w-full p-4 space-y-10">
      {/* Header Card */}
      <Card className="bg-transparent">
        <CardHeader className=" flex flex-row items-center mb-3 justify-between rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="space-y-3">
            <CardTitle className="flex items-center text-xl font-semibold">
              <KeyRound className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              API Configuration
            </CardTitle>
            <CardDescription>Configure external service credentials and URLs here.</CardDescription>
          </div>
        </CardHeader>
      </Card>
      {/* <DottedSeparator /> */}
      {/* Form Card */}
      <Card className="p-5 py-10 border-none">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settings.map((settingItem) => (
                <div key={settingItem.id} className="flex flex-col space-y-1.5">
                  <Label htmlFor={settingItem.name}>{settingItem.name}</Label>
                  <Input
                    id={settingItem.name}
                    name={settingItem.name}
                    value={settingItem.value}
                    onChange={handleChange}
                    placeholder={`Enter ${settingItem.name}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit">Save Configuration</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
