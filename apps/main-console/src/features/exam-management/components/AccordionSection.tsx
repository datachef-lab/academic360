import { ChevronDown, LucideIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AccordionSectionProps {
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: LucideIcon;
}

export function AccordionSection({ title, subtitle, isOpen, onToggle, children, icon: Icon }: AccordionSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
        <CollapsibleTrigger className="w-full text-left p-5 flex items-center justify-between cursor-pointer transition-colors duration-200 hover:bg-purple-100/50">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-purple-500" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-5 border-t border-purple-200">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
