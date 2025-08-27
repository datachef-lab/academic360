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
import { useToast } from "@/hooks/use-toast";
import React from 'react';

interface SportsCategory {
  id?: number;
  name: string;
  disabled?: boolean;
  createdAt?: string;
}

interface SportsCategoryDialogProps {
  onSuccess: () => void;
  children?: React.ReactNode;
  sportsCategory?: SportsCategory;
}

export function SportsCategoryDialog({ onSuccess, children, sportsCategory }: SportsCategoryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (sportsCategory) {
            setName(sportsCategory.name);
        } else {
            setName('');
        }
    }, [sportsCategory]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            let result;
            if (sportsCategory?.id) {
                // Update existing
                const response = await fetch(`/api/sports-categories?id=${sportsCategory.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name }),
                });
                const responseData = await response.json();
                result = {
                    success: !responseData.error,
                    message: responseData.error ? undefined : "Sports category updated successfully.",
                    error: responseData.error
                };
            } else {
                // Create new
                const response = await fetch('/api/sports-categories', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name }),
                });
                const responseData = await response.json();
                result = {
                    success: !responseData.error,
                    message: responseData.error ? undefined : "Sports category added successfully.",
                    error: responseData.error
                };
            }

            if (result && result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                });
                setIsOpen(false);
                setName('');
                onSuccess();
            } else {
                toast({
                    title: "Error",
                    description: result.error || (sportsCategory ? "Failed to update sports category." : "Failed to add sports category."),
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error handling sports category:", error);
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
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2">
                        <Plus className="mr-2 h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{sportsCategory ? 'Edit Sports Category' : 'Add New Sports Category'}</DialogTitle>
                    <DialogDescription>
                        {sportsCategory ? 'Update the details for the sports category.' : 'Enter the details for the new sports category.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                className="col-span-3"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {sportsCategory ? 'Updating...' : 'Adding...'}
                                </>
                            ) : (
                                sportsCategory ? 'Update' : 'Save changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 