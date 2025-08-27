"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SubjectSelectionForm() {
  const [open, setOpen] = useState(false);

  // example state (you’ll replace with real form handling later)
  const [minor1, setMinor1] = useState("");
  const [minor2, setMinor2] = useState("");
  const [idc1, setIdc1] = useState("");
  const [idc2, setIdc2] = useState("");
  const [idc3, setIdc3] = useState("");
  const [aec3, setAec3] = useState("");
  const [aec4, setAec4] = useState("");
  const [cvac4, setCvac4] = useState("");

  return (
    <div className="w-[66%] h-full">
      {/* Dropdowns Section */}
      <Card className="mt-6 shadow-md rounded-xl bg-white">
        <CardHeader>
          <h2 className="text-xl font-bold text-gray-800">Semester-wise Subject Selection</h2>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-6">
          {/* Minor Subjects */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Minor I (Semester I & II)</label>
            <Select onValueChange={setMinor1}>
              <SelectTrigger>
                <SelectValue placeholder="Select Minor I" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="geography">Geography</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Minor II (Semester III & IV)</label>
            <Select onValueChange={setMinor2}>
              <SelectTrigger>
                <SelectValue placeholder="Auto-assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="geography">Geography</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* IDC */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">IDC 1 (Semester I)</label>
            <Select onValueChange={setIdc1}>
              <SelectTrigger>
                <SelectValue placeholder="Select IDC 1" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="philosophy">Philosophy</SelectItem>
                <SelectItem value="sociology">Sociology</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">IDC 2 (Semester II)</label>
            <Select onValueChange={setIdc2}>
              <SelectTrigger>
                <SelectValue placeholder="Select IDC 2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economics">Economics</SelectItem>
                <SelectItem value="psychology">Psychology</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">IDC 3 (Semester III)</label>
            <Select onValueChange={setIdc3}>
              <SelectTrigger>
                <SelectValue placeholder="Select IDC 3" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="political-science">Political Science</SelectItem>
                <SelectItem value="math">Mathematics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AEC */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">AEC 3 (Semester III)</label>
            <Select onValueChange={setAec3}>
              <SelectTrigger>
                <SelectValue placeholder="Select AEC 3" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alt-english">Alternative English</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="bengali">Bengali</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">AEC 4 (Semester IV)</label>
            <Select onValueChange={setAec4}>
              <SelectTrigger>
                <SelectValue placeholder="Select AEC 4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alt-english">Alternative English</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="bengali">Bengali</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CVAC */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">CVAC 4 (Semester II)</label>
            <Select onValueChange={setCvac4}>
              <SelectTrigger>
                <SelectValue placeholder="Select CVAC 4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value-education">Value-Oriented Life Skill Education</SelectItem>
                <SelectItem value="another-option">Another Option (for B.Sc. only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 px-6 pb-6">
          <Button variant="outline">Cancel & Close</Button>
          <Button onClick={() => setOpen(true)}>Preview & Save</Button>
        </div>
      </Card>

      {/* Popup Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview Your Selections</DialogTitle>
          </DialogHeader>

          <div className="overflow-x-auto my-4">
            <table className="w-full border border-gray-200 text-sm">
              <tbody>
                <tr>
                  <td className="border p-2 font-medium">Minor I</td>
                  <td className="border p-2">{minor1 || "-"}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">Minor II</td>
                  <td className="border p-2">{minor2 || "-"}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">IDC 1</td>
                  <td className="border p-2">{idc1 || "-"}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">IDC 2</td>
                  <td className="border p-2">{idc2 || "-"}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">IDC 3</td>
                  <td className="border p-2">{idc3 || "-"}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">AEC 3</td>
                  <td className="border p-2">{aec3 || "-"}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">AEC 4</td>
                  <td className="border p-2">{aec4 || "-"}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">CVAC 4</td>
                  <td className="border p-2">{cvac4 || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Declarations */}
          <div className="space-y-3 text-sm text-gray-700">
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" /> I confirm that I have read the semester-wise subject selection
              guidelines given above.
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" /> I understand that once submitted, I will not be allowed to
              change the selected subjects in the future.
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" /> In the event of violation of subject selection rules, I will
              abide by the final decision taken by the Vice-Principal/Course Coordinator/Calcutta University.
            </label>
          </div>

          <DialogFooter className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Go Back to Edit
            </Button>
            <Button>Continue to Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
