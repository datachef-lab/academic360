import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SubjectSelectionCard() {
  const router = useRouter();

  const handleCardClick = () => {
    router.push("/dashboard/subject-selection");
  };

  return (
    <Card
      className="border shadow-lg rounded-2xl overflow-hidden bg-white cursor-pointer hover:shadow-xl transition-shadow duration-200"
      onClick={handleCardClick}
    >
      <div className="flex h-full ">
        {/* Left: Full Height Image Area */}
        <div
          className="w-1/2 bg-gradient-to-br flex items-center justify-center relative"
          style={{
            backgroundImage: "url(/illustrations/subject-selection-illustration.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>

        {/* Right: Text Content Area */}
        <div className="w-1/2 flex flex-col justify-center p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg font-semibold text-purple-800">What's Next?</CardTitle>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Subject Selection</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Choose your subjects for the upcoming semester and plan your academic journey. Build your perfect schedule
              with our intuitive subject selection tool.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
