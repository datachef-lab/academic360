import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, FileBarChart, FileSpreadsheet, Loader2 } from "lucide-react";
import { getAisheReport, getNaacReport, getNirfReport } from "@/services/library-reports.service";
import type { AisheReport, NaacReport, NirfReport } from "@/services/library-reports.service";

type ReportTab = "NAAC" | "NIRF" | "AISHE";

const formatValue = (v: string | number) =>
  typeof v === "number" ? new Intl.NumberFormat("en-IN").format(v) : v;

export default function LibraryReportsPage() {
  const [active, setActive] = useState<ReportTab>("NAAC");

  const [naacYear, setNaacYear] = useState("2025-26");
  const [naac, setNaac] = useState<NaacReport | null>(null);
  const [loadingNaac, setLoadingNaac] = useState(false);

  const [nirfYear, setNirfYear] = useState("2025-26");
  const [nirf, setNirf] = useState<NirfReport | null>(null);
  const [loadingNirf, setLoadingNirf] = useState(false);

  const [aisheYear, setAisheYear] = useState("2025-26");
  const [aishe, setAishe] = useState<AisheReport | null>(null);
  const [loadingAishe, setLoadingAishe] = useState(false);

  const generate = async (which: ReportTab) => {
    try {
      if (which === "NAAC") {
        if (!naacYear.trim()) return toast.error("Year is required.");
        setLoadingNaac(true);
        const res = await getNaacReport(naacYear.trim());
        setNaac(res.payload ?? null);
      } else if (which === "NIRF") {
        if (!nirfYear.trim()) return toast.error("Year is required.");
        setLoadingNirf(true);
        const res = await getNirfReport(nirfYear.trim());
        setNirf(res.payload ?? null);
      } else {
        if (!aisheYear.trim()) return toast.error("Year is required.");
        setLoadingAishe(true);
        const res = await getAisheReport(aisheYear.trim());
        setAishe(res.payload ?? null);
      }
      toast.success("Report ready.");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Report generation failed.";
      toast.error(msg);
    } finally {
      setLoadingNaac(false);
      setLoadingNirf(false);
      setLoadingAishe(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-indigo-600" />
            <CardTitle>Library Compliance Reports</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={active} onValueChange={(v) => setActive(v as ReportTab)}>
            <TabsList className="grid w-full grid-cols-3 sm:w-fit">
              <TabsTrigger value="NAAC">NAAC</TabsTrigger>
              <TabsTrigger value="NIRF">NIRF</TabsTrigger>
              <TabsTrigger value="AISHE">AISHE</TabsTrigger>
            </TabsList>

            <TabsContent value="NAAC" className="mt-4 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 sm:max-w-xs">
                  <Label>Academic year</Label>
                  <Input
                    placeholder="2025-26"
                    value={naacYear}
                    onChange={(e) => setNaacYear(e.target.value)}
                  />
                </div>
                <Button onClick={() => generate("NAAC")} disabled={loadingNaac} className="gap-1">
                  {loadingNaac ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  Generate
                </Button>
              </div>

              {naac ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Framework</p>
                        <p className="text-lg font-semibold">{naac.framework}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Criterion</p>
                        <p className="text-lg font-semibold">{naac.criterion}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(naac.metrics).map(([k, v]) => (
                        <TableRow key={k}>
                          <TableCell className="font-medium">{k}</TableCell>
                          <TableCell>{formatValue(v)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-gray-500">
                  Click Generate to compute the NAAC criterion 4.2 metrics.
                </div>
              )}
            </TabsContent>

            <TabsContent value="NIRF" className="mt-4 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 sm:max-w-xs">
                  <Label>Academic year</Label>
                  <Input
                    placeholder="2025-26"
                    value={nirfYear}
                    onChange={(e) => setNirfYear(e.target.value)}
                  />
                </div>
                <Button onClick={() => generate("NIRF")} disabled={loadingNirf} className="gap-1">
                  {loadingNirf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  Generate
                </Button>
              </div>

              {nirf ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Object.entries(nirf.libraryResources).map(([k, v]) => (
                    <Card key={k}>
                      <CardContent className="p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">{k}</p>
                        <p className="text-xl font-bold text-indigo-700">
                          {formatValue(v as number)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-gray-500">
                  Click Generate to fetch NIRF library resources for the year.
                </div>
              )}
            </TabsContent>

            <TabsContent value="AISHE" className="mt-4 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 sm:max-w-xs">
                  <Label>Academic year</Label>
                  <Input
                    placeholder="2025-26"
                    value={aisheYear}
                    onChange={(e) => setAisheYear(e.target.value)}
                  />
                </div>
                <Button onClick={() => generate("AISHE")} disabled={loadingAishe} className="gap-1">
                  {loadingAishe ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  Generate
                </Button>
              </div>

              {aishe ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                  {Object.entries(aishe.library).map(([k, v]) => (
                    <Card key={k}>
                      <CardContent className="p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">{k}</p>
                        <p className="text-xl font-bold text-purple-700">
                          {formatValue(v as number)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-gray-500">
                  Click Generate to compute AISHE library figures.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
