import { TabPanel } from "../components/TabPanel";
import { Button } from "@/components/ui/button";
import { Download, FileBarChart, Users, IndianRupee, CreditCard } from "lucide-react";

const REPORTS = [
  { title: "Promotion-wise MIS", desc: "By program · class · session", icon: IndianRupee },
  { title: "Defaulter list", desc: "Unpaid mappings", icon: Users },
  { title: "Payment register", desc: "Linked payments", icon: CreditCard },
  { title: "Challan register", desc: "Generation status", icon: FileBarChart },
];

export function ReportsTab() {
  return (
    <TabPanel tab="reports">
      <div className="grid gap-2 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <article key={r.title} className="rounded-lg border border-slate-300 bg-white p-3">
            <div className="flex gap-2">
              <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
                <r.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold">{r.title}</h3>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-2 h-8 w-full text-xs">
              <Download className="mr-1 h-3 w-3" />
              Generate
            </Button>
          </article>
        ))}
      </div>
    </TabPanel>
  );
}
