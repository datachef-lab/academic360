import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string;
  clearError: () => void;
  retry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, clearError, retry }) => {
  return (
    <div className="w-full p-4">
      <Alert variant="destructive" className="mb-4 border-red-300 bg-red-50">
        <AlertDescription className="text-red-700">{error}</AlertDescription>
      </Alert>
      <Button
        onClick={() => {
          clearError();
          retry();
        }}
        variant="outline"
        className="border-purple-300 text-purple-800 hover:bg-purple-100 hover:text-purple-900"
      >
        Retry
      </Button>
    </div>
  );
};

export default ErrorDisplay; 