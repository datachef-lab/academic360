import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: string | null;
  onReconnect: () => void;
}

export function ConnectionStatus({ isConnected, isLoading, error, lastUpdate, onReconnect }: ConnectionStatusProps) {
  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Connecting...
        </Badge>
      );
    }

    if (error) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    }

    if (isConnected) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <Wifi className="h-3 w-3" />
          Connected
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <WifiOff className="h-3 w-3" />
        Disconnected
      </Badge>
    );
  };

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Connection Status:</span>
          {getStatusBadge()}
        </div>

        {lastUpdate && isConnected && (
          <div className="text-sm text-gray-600">Last update: {formatLastUpdate(lastUpdate)}</div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      {(!isConnected || error) && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          Reconnect
        </Button>
      )}
    </div>
  );
}
