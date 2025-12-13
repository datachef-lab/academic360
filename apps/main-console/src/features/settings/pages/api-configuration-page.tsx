import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useSettings } from "@/features/settings/hooks/use-settings";
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
  const { settings } = useSettings();

  // Filter API config settings from context (no need to fetch again)
  const apiConfigSettings = useMemo(() => settings.filter((ele: Settings) => ele.variant === "API_CONFIG"), [settings]);

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
    <div className="w-full p-3 sm:p-4 space-y-6 sm:space-y-10">
      {/* Header Card */}
      <Card className="bg-transparent">
        <CardHeader className="flex flex-row items-center mb-3 justify-between rounded-md p-3 sm:p-4 sticky top-0 z-30 bg-background">
          <div className="space-y-2 sm:space-y-3 flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl font-semibold">
              <KeyRound className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400" />
              API Configuration
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Configure external service credentials and URLs here.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
      {/* <DottedSeparator /> */}
      {/* Form Card */}
      <Card className="p-3 sm:p-5 py-6 sm:py-10 border-none">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {apiConfigSettings.map((settingItem) => (
                <div key={settingItem.id} className="flex flex-col space-y-1.5">
                  <Label htmlFor={settingItem.name} className="text-sm sm:text-base">
                    {settingItem.name}
                  </Label>
                  <Input
                    id={settingItem.name}
                    name={settingItem.name}
                    value={settingItem.value}
                    onChange={handleChange}
                    placeholder={`Enter ${settingItem.name}`}
                    className="text-sm sm:text-base"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-3 sm:pt-4">
              <Button type="button" variant="outline" onClick={handleReset} className="w-full sm:w-auto">
                Reset
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Save Configuration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
