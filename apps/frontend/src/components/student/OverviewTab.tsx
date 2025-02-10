import { StudentAttendance } from "./StudentAttendance";
import { Card, CardContent, CardFooter, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function OverviewTab() {
  return (
    <div className="my-5">
      <div className="flex gap-4 h-[250px]">
        <div className="w-1/3 h-full">
          <StudentAttendance />
        </div>
        <Card className="w-1/3 flex flex-col items-center p-6 shadow-md border border-muted rounded-lg">
          <CardTitle className="text-2xl font-semibold text-primary mb-2">Fees Payment</CardTitle>
          <CardContent className="w-full">
            <div className="border-b pb-3 mb-3 w-full">
              <ul className="space-y-2">
                <li className="flex justify-between text-sm">
                  <p>Total:</p>
                  <p className="font-medium text-success">&#8377; 8,00,000</p>
                </li>
                <li className="flex justify-between text-sm">
                  <p>Paid:</p>
                  <p className="font-medium text-success">&#8377; 6,00,000</p>
                </li>
                <li className="flex justify-between text-sm">
                  <p>Balance:</p>
                  <p className="font-medium text-danger">&#8377; 2,00,000</p>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <p>Installments:</p>
                <p className="font-medium">5</p>
              </div>
              <div className="flex justify-between text-sm">
                <p>Last Payment:</p>
                <p className="font-medium">January 23, 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="w-1/3 flex flex-col items-center p-6 shadow-md border border-muted rounded-lg">
          <CardTitle className="text-2xl font-semibold text-primary mb-2">Overall Performance</CardTitle>
          <CardContent className="w-full flex flex-col items-center h-full justify-center">
            <h1 className="font-semibold text-5xl">65%</h1>
            <p className="my-1">Very Good!</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-center">
              This represents the average percentage marks obtained throughout the semesters.
            </p>
          </CardFooter>
        </Card>
      </div>
      <div className="my-8 border-b">
        <ul className="flex flex-col gap-4">
          {/* <li className="space-y-2">
        <div className="flex items-center gap-2">
          <p>Stream:</p>
          <div className="flex gap-2 items-center">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Streams</SelectLabel>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="BCOM">BCOM</SelectItem>
                  <SelectItem value="BSC">BSC</SelectItem>
                  <SelectItem value="BBA">BBA</SelectItem>
                  <SelectItem value="M.A">M.A</SelectItem>
                  <SelectItem value="M.COM">M.COM</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Badge>UNDER_GRADUATE</Badge>
      </li>
      <li className="space-y-2">
        <div className="flex items-center gap-2">
          <p>Stream:</p>
          <div className="flex gap-2 items-center">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Streams</SelectLabel>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="BCOM">BCOM</SelectItem>
                  <SelectItem value="BSC">BSC</SelectItem>
                  <SelectItem value="BBA">BBA</SelectItem>
                  <SelectItem value="M.A">M.A</SelectItem>
                  <SelectItem value="M.COM">M.COM</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Badge>UNDER_GRADUATE</Badge>
      </li> */}
          <li className="flex items-center gap-2">
            <p className="w-1/5">Name</p>
            <Input type="text" />
          </li>
          <li className="flex items-center gap-2">
            <p className="w-1/5">Email:</p>
            <Input type="email" />
          </li>
          <li className="flex items-center gap-2">
            <p className="w-1/5">Phone:</p>
            <Input type="text" />
          </li>
          <li className="flex items-center gap-2">
            <p className="w-1/5">Whatsapp No:</p>
            <Input type="text" />
          </li>
        </ul>
        <Button className="my-8">Save</Button>
      </div>
      <p>Last Passed Year: 2025</p>
    </div>
  );
}
