"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export interface Department {
  readonly id?: number;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
}

const departments: Department[] = [
  { id: 1, name: "Computer Science", code: "CS", description: "Tech department", isActive: true },
  { id: 2, name: "Commerce", code: "COM", description: "Finance and Trade", isActive: false },
];

export default function DepartmentsPage() {
  const [editData, setEditData] = useState<Department | null>(null);

  return (
    <div className="p-4">
      {/* Header Card */}
      <Card className="bg-transparent">
        <CardHeader className="flex flex-row items-center mb-3 justify-between rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="space-y-3">
            <CardTitle className="flex items-center text-xl font-semibold">
              <Building2 className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Departments
            </CardTitle>
            <CardDescription>Configure external service credentials and URLs here.</CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept, index) => (
            <TableRow key={dept.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{dept.name}</TableCell>
              <TableCell>{dept.code}</TableCell>
              <TableCell>{dept.description}</TableCell>
              <TableCell>
                <Badge variant={dept.isActive ? "default" : "secondary"}>
                  {dept.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setEditData(dept)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Department</DialogTitle>
                    </DialogHeader>
                    {editData && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${editData.name}`} />
                            <AvatarFallback>{editData.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm text-muted-foreground">{editData.description}</div>
                        </div>
                        <div className="grid gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input defaultValue={editData.name} />
                          </div>
                          <div>
                            <Label>Code</Label>
                            <Input defaultValue={editData.code || ""} />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input defaultValue={editData.description || ""} />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button>Update</Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
