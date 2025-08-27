"use client";

import * as React from "react";
import { Toast } from "./toast";
import { useToast } from "@/hooks/use-toast";
import { ToastTitle, ToastDescription, ToastClose } from "./toast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {children}
      <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
          >
            <ToastTitle>{toast.title}</ToastTitle>
            {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
            <ToastClose onClick={() => typeof toast.id === 'number' && removeToast(toast.id)} />
          </Toast>
        ))}
      </div>
    </>
  );
} 