import { ApplicationForm, paymentMode } from "@/db/schema";
import { ReactNode, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface PaymentStepProps {
  stepNotes: React.ReactNode;
  applicationForm: ApplicationForm;
  onPaymentInfoChange: (paymentInfo: any) => void;
  onNext: () => void;
  onPrev: () => void;
  currentStep: number;
}

let paymentMethods = paymentMode.enumValues

export default function PaymentStep({
  applicationForm,
  stepNotes,
  onPaymentInfoChange,
  onNext,
  onPrev,
  currentStep
}: PaymentStepProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    paymentMode: "ONLINE" as typeof paymentMode.enumValues[number],
    transactionId: "",
    transactionDate: new Date().toISOString().split("T")[0],
    amount: 500,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!paymentInfo.paymentMode) {
      errors.paymentMode = "Payment method is required";
    }
    if (!paymentInfo.transactionId) {
      errors.transactionId = "Transaction ID is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save payment info
      onPaymentInfoChange(paymentInfo);
      
      // Show success message
      toast({
        title: "Success",
        description: "Payment information saved successfully.",
        // onClose: () => {}
      });

      // Navigate to next step
      onNext();
    } catch (error) {
      console.error("Error saving payment info:", error);
      toast({
        title: "Error",
        description: "Failed to save payment information. Please try again.",
        variant: "destructive",
        // onClose: () => {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      onPrev();
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Step 5 of 5 - Payment</h2>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg shadow p-4 text-left">
          {stepNotes}
        </div>
      </div>

      {/* Payment Form */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center mb-1">Payment Method <span className="text-red-600">*</span></Label>
          <Select
            value={paymentInfo.paymentMode}
            onValueChange={(value) => setPaymentInfo({ ...paymentInfo, paymentMode: value as typeof paymentMode.enumValues[number] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ONLINE">Online Payment</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="CHEQUE">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="flex items-center mb-1">Transaction ID <span className="text-red-600">*</span></Label>
          <Input
            value={paymentInfo.transactionId}
            onChange={(e) => setPaymentInfo({ ...paymentInfo, transactionId: e.target.value })}
            placeholder="Enter transaction ID"
          />
        </div>

        <div>
          <Label className="flex items-center mb-1">Amount</Label>
          <Input
            type="number"
            value={paymentInfo.amount}
            onChange={(e) => setPaymentInfo({ ...paymentInfo, amount: parseFloat(e.target.value) })}
            placeholder="Enter amount"
            readOnly
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end gap-4 mt-6">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isLoading}
          >
            Previous
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : "Submit Application"}
        </Button>
      </div>

      {/* Display validation errors */}
      {Object.keys(formErrors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h4>
          <ul className="list-disc list-inside text-red-700">
            {Object.entries(formErrors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
