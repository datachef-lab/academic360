"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { addAnnualIncome, type AddAnnualIncomeResult } from "./actions";
import { useToast } from "@/hooks/use-toast";
import React from 'react';
import { AnnualIncome } from "@/db/schema";

interface AnnualIncomeDialogProps {
  onSuccess: () => void;
  children?: React.ReactNode;
  annualIncome?: AnnualIncome;
}

export function AnnualIncomeDialog({ onSuccess, children, annualIncome }: AnnualIncomeDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [incomeRange, setIncomeRange] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (annualIncome) {
            setIncomeRange(annualIncome.range);
        } else {
            setIncomeRange('');
        }
    }, [annualIncome]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        
        try {
            let result: AddAnnualIncomeResult;
            
            if (annualIncome?.id) {
                // Update existing annual income
                const response = await fetch(`/api/annual-incomes?id=${annualIncome.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ range: formData.get('range') }),
                });
                const responseData = await response.json();
                result = {
                    success: !responseData.error,
                    message: responseData.error ? undefined : "Annual income range updated successfully.",
                    error: responseData.error
                };
            } else {
                // Create new annual income
                result = await addAnnualIncome(formData);
            }
          
            if (result && result.success) {
                toast({
                    title: "Success",
                    description: result.message || (annualIncome ? "Annual income range updated successfully." : "Annual income range added successfully."),
                });
                setIsOpen(false);
                setIncomeRange('');
                onSuccess();
            } else {
                toast({
                    title: "Error",
                    description: result.error || (annualIncome ? "Failed to update annual income range." : "Failed to add annual income range."),
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error handling annual income range:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button
                        className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Annual Income Range
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{annualIncome ? 'Edit Annual Income Range' : 'Add New Annual Income Range'}</DialogTitle>
                    <DialogDescription>
                        {annualIncome ? 'Update the details for the annual income range.' : 'Enter the details for the new annual income range.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="range" className="text-right">
                                Range
                            </Label>
                            <Input 
                                id="range" 
                                name="range" 
                                className="col-span-3" 
                                required 
                                value={incomeRange}
                                onChange={(e) => setIncomeRange(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {annualIncome ? 'Updating...' : 'Adding...'}
                                </>
                            ) : (
                                annualIncome ? 'Update' : 'Save changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 