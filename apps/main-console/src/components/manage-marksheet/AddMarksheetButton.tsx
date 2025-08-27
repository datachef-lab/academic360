import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, CheckCircle, UserPlus, Keyboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { getSearchedStudentsByRollNumber } from "@/services/student";
import { useNavigate } from "react-router-dom";
import { Student } from "@/types/user/student";

export default function AddMarksheetButton() {
  const navigate = useNavigate();

  const [framework, setFramework] = useState<"CCF" | "CBCS">("CCF");
  const [rollNumber, setRollNumber] = useState("");
  const [debouncedRollNumber, setDebouncedRollNumber] = useState(""); // Store debounced value
  const [studentData, setStudentData] = useState<{ exists: boolean; student?: Student }>({ exists: false });
  const [isLoading, setIsLoading] = useState(false);

  // Debounce effect: Waits 500ms before updating debouncedRollNumber
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRollNumber(rollNumber);
    }, 500);

    return () => {
      clearTimeout(handler); // Clears timeout if user types before 500ms
    };
  }, [rollNumber]);

  useEffect(() => {
    setDebouncedRollNumber("");
    setStudentData({ exists: false });
    setRollNumber("");
  }, []);

  // Fetch student data when debouncedRollNumber changes
  useEffect(() => {
    const fetchStudent = async () => {
      if (debouncedRollNumber.trim().length === 0) {
        setStudentData({ exists: false });
        return;
      }

      setIsLoading(true);
      try {
        const response = await getSearchedStudentsByRollNumber(1, 1, debouncedRollNumber);
        if (response.payload.content.length > 0) {
          setStudentData({
            exists: true,
            student: response.payload.content[0],
          });
        } else {
          setStudentData({ exists: false });
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        setStudentData({ exists: false });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [debouncedRollNumber]);

  // Handle OTP input changes
  const handleInputChange = (value: string) => {
    const formattedValue = value.replace(/\D/g, ""); // Remove non-digit characters
    setRollNumber(formattedValue);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Format the roll number before submitting
    const formattedRollNumber = `${rollNumber.slice(0, 6)}-${rollNumber.slice(6, 8)}-${rollNumber.slice(8)}`;
    console.log(formattedRollNumber);

    navigate(`/home/manage-marksheet/${framework}/${formattedRollNumber}/new`);
  };

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className="border">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:min-w-[620px] min-h-[350px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="border-b pb-3 text-2xl font-semibold">Add Marksheet</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <form
              onSubmit={handleSubmit}
              className="mt-4 w-full space-y-8 bg-transparent max-w-none shadow-none border-none p-0"
            >
              <div className="flex w-full items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Input
                      type="radio"
                      id="CCF"
                      name="marksheet_type"
                      className="h-4 w-4"
                      checked={framework === "CCF"}
                      onChange={() => setFramework("CCF")}
                      required
                    />
                    <Label htmlFor="CCF" className="text-sm font-medium">
                      CCF
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="radio"
                      id="cbcs"
                      name="marksheet_type"
                      className="h-4 w-4"
                      checked={framework === "CBCS"}
                      onChange={() => setFramework("CBCS")}
                      required
                    />
                    <Label htmlFor="cbcs" className="text-sm font-medium">
                      CBCS
                    </Label>
                  </div>
                </div>
              </div>

              {/* Roll Number Input */}
              <div className="flex w-full flex-col justify-center">
                <p className="w-1/3 my-3">Roll Number</p>
                <InputOTP maxLength={12} value={rollNumber} onChange={handleInputChange}>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    {Array.from({ length: 2 }).map((_, index) => (
                      <InputOTPSlot key={index + 6} index={index + 6} />
                    ))}
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <InputOTPSlot key={index + 8} index={index + 8} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                {/* Student Validation Result */}
                <div className="mt-2 flex items-center gap-2 text-sm min-h-7">
                  {isLoading && <p>Checking...</p>}
                  {!isLoading && (
                    <>
                      {rollNumber.length === 0 ? (
                        <Keyboard />
                      ) : studentData.exists ? (
                        <CheckCircle className="text-green-500" />
                      ) : (
                        <UserPlus className="text-blue-500" />
                      )}
                      {rollNumber.length === 0 ? (
                        <span>Please type the roll number...</span>
                      ) : (
                        <span>{studentData.exists ? studentData.student?.name : "New Student"}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex pt-14 justify-center items-center">
                <Button disabled={isLoading || rollNumber.length < 12} className="w-full">
                  Create
                </Button>
              </div>
            </form>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
