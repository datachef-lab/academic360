import { useState, useCallback, Key } from 'react';

interface Toast {
  [x: string]: Key | null | undefined;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Toast) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, description, variant }]);

    // Auto remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toast, toasts, removeToast };
} 