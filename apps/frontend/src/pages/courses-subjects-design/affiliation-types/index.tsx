import React from "react";
import { AffiliationTypeForm } from "./affiliation-type-form";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Landmark, Download, Upload, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AffiliationType } from "@/services/affiliation-type.api";

const dummyAffiliationTypes: AffiliationType[] = [
  { id: "1", name: "University Grants Commission", code: "UGC", description: "UGC affiliated", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "2", name: "All India Council for Technical Education", code: "AICTE", description: "AICTE affiliated", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const AffiliationTypesPage = () => {
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedAffiliationType, setSelectedAffiliationType] = React.useState<AffiliationType | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);

  const handleEdit = (affiliationType: AffiliationType) => {
    setSelectedAffiliationType(affiliationType);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    console.log("Delete:", id);
    toast.info("Delete functionality not implemented yet.");
  };

  const handleSubmit = () => {
    toast.success(selectedAffiliationType ? "Affiliation type updated" : "Affiliation type created");
    setIsFormOpen(false);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedAffiliationType(null);
    setIsFormOpen(true);
  };

  const handleBulkUpload = () => {
    if (!bulkFile) return;
    toast.success("Bulk upload successful (mock)");
    setIsBulkUploadOpen(false);
    setBulkFile(null);
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/affiliation-type-bulk-upload-template.xlsx';
    link.download = 'affiliation-type-bulk-upload-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAffiliationTypes = dummyAffiliationTypes.filter((type) =>
    type.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (type.code?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
    (type.description?.toLowerCase().includes(searchText.toLowerCase()) ?? false)
  );

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <Landmark className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Affiliation Types
            </CardTitle>
            <div className="text-muted-foreground">A list of all affiliation types.</div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Upload Affiliation Types</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={e => setBulkFile(e.target.files?.[0] || null)}
                  />
                  <Button onClick={handleBulkUpload} disabled={!bulkFile}>
                    Upload
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedAffiliationType ? "Edit Affiliation Type" : "Add New Affiliation Type"}</AlertDialogTitle>
                </AlertDialogHeader>
                <AffiliationTypeForm
                  initialData={selectedAffiliationType}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input placeholder="Search..." className="w-64" value={searchText} onChange={e => setSearchText(e.target.value)} />
          </div>
          <div className="relative" style={{ height: '600px' }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: 'fixed' }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: '#f3f4f6' }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: '#f3f4f6', color: '#374151' }}>#</TableHead>
                    <TableHead style={{ width: 220, background: '#f3f4f6', color: '#374151' }}>Name</TableHead>
                    <TableHead style={{ width: 120, background: '#f3f4f6', color: '#374151' }}>Code</TableHead>
                    <TableHead style={{ width: 320, background: '#f3f4f6', color: '#374151' }}>Description</TableHead>
                    <TableHead style={{ width: 120, background: '#f3f4f6', color: '#374151' }}>Status</TableHead>
                    <TableHead style={{ width: 120, background: '#f3f4f6', color: '#374151' }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliationTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No affiliation types found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredAffiliationTypes.map((type, idx) => (
                      <TableRow key={type.id} className="group">
                        <TableCell style={{ width: 60 }}>{idx + 1}</TableCell>
                        <TableCell style={{ width: 220 }}>{type.name}</TableCell>
                        <TableCell style={{ width: 120 }}>{type.code}</TableCell>
                        <TableCell style={{ width: 320 }}>{type.description}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          {type.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(type)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(type.id)}
                              className="h-5 w-5 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliationTypesPage;
